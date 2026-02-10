use axum::extract::{Path, State};
use axum::Json;
use shared::errors::AppError;
use shared::models::User;
use std::sync::Arc;
use uuid::Uuid;
use validator::Validate;

use crate::middleware::auth::RequireAuth;
use crate::models::{ApiResponse, PropertyResponse, UpdateProfileRequest, UserResponse};
use crate::AppState;

/// GET /api/v1/users/me
///
/// Return the authenticated user's profile.
pub async fn get_profile(
    State(state): State<Arc<AppState>>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<ApiResponse<UserResponse>>, AppError> {
    let user_id: Uuid = claims
        .sub
        .parse()
        .map_err(|_| AppError::Internal("Invalid user ID in token".to_string()))?;

    let user: User = sqlx::query_as("SELECT * FROM users WHERE id = $1 AND is_active = true")
        .bind(user_id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    Ok(Json(ApiResponse::success(UserResponse::from(user))))
}

/// PUT /api/v1/users/me
///
/// Update the authenticated user's profile (name, phone, avatar).
pub async fn update_profile(
    State(state): State<Arc<AppState>>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<UpdateProfileRequest>,
) -> Result<Json<ApiResponse<UserResponse>>, AppError> {
    payload
        .validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {e}")))?;

    let user_id: Uuid = claims
        .sub
        .parse()
        .map_err(|_| AppError::Internal("Invalid user ID in token".to_string()))?;

    // Build a dynamic update to only touch fields that were provided.
    let mut set_clauses: Vec<String> = Vec::new();
    let mut bind_idx: usize = 1; // $1 is reserved for user_id in WHERE

    #[derive(Default)]
    struct Binds {
        full_name: Option<String>,
        phone: Option<String>,
        avatar_url: Option<String>,
    }

    let mut binds = Binds::default();

    if let Some(ref name) = payload.full_name {
        bind_idx += 1;
        set_clauses.push(format!("full_name = ${bind_idx}"));
        binds.full_name = Some(name.clone());
    }

    if let Some(ref phone) = payload.phone {
        bind_idx += 1;
        set_clauses.push(format!("phone = ${bind_idx}"));
        binds.phone = Some(phone.clone());
    }

    if let Some(ref avatar_url) = payload.avatar_url {
        bind_idx += 1;
        set_clauses.push(format!("avatar_url = ${bind_idx}"));
        binds.avatar_url = Some(avatar_url.clone());
    }

    if set_clauses.is_empty() {
        return Err(AppError::BadRequest("No fields to update".to_string()));
    }

    set_clauses.push("updated_at = NOW()".to_string());

    let sql = format!(
        "UPDATE users SET {} WHERE id = $1 AND is_active = true RETURNING *",
        set_clauses.join(", ")
    );

    let mut query = sqlx::query_as::<_, User>(&sql).bind(user_id);

    if let Some(ref v) = binds.full_name {
        query = query.bind(v);
    }
    if let Some(ref v) = binds.phone {
        query = query.bind(v);
    }
    if let Some(ref v) = binds.avatar_url {
        query = query.bind(v);
    }

    let user: User = query
        .fetch_optional(&state.pool)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    Ok(Json(ApiResponse::success(UserResponse::from(user))))
}

/// GET /api/v1/users/me/saved
///
/// Return the authenticated user's saved (bookmarked) properties.
pub async fn get_saved(
    State(state): State<Arc<AppState>>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<ApiResponse<Vec<PropertyResponse>>>, AppError> {
    let user_id: Uuid = claims
        .sub
        .parse()
        .map_err(|_| AppError::Internal("Invalid user ID in token".to_string()))?;

    let properties: Vec<PropertyResponse> = sqlx::query_as(
        r#"SELECT p.*
           FROM properties p
           INNER JOIN saved_properties sp ON sp.property_id = p.id
           WHERE sp.user_id = $1 AND p.is_active = true
           ORDER BY sp.created_at DESC"#,
    )
    .bind(user_id)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(ApiResponse::success(properties)))
}

/// POST /api/v1/users/me/saved/:property_id
///
/// Save (bookmark) a property for the authenticated user.
pub async fn save_property(
    State(state): State<Arc<AppState>>,
    RequireAuth(claims): RequireAuth,
    Path(property_id): Path<Uuid>,
) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
    let user_id: Uuid = claims
        .sub
        .parse()
        .map_err(|_| AppError::Internal("Invalid user ID in token".to_string()))?;

    // Check the property exists
    let exists: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM properties WHERE id = $1 AND is_active = true")
            .bind(property_id)
            .fetch_optional(&state.pool)
            .await?;

    if exists.is_none() {
        return Err(AppError::NotFound("Property not found".to_string()));
    }

    // Upsert: INSERT ... ON CONFLICT DO NOTHING
    sqlx::query(
        r#"INSERT INTO saved_properties (id, user_id, property_id, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id, property_id) DO NOTHING"#,
    )
    .bind(Uuid::new_v4())
    .bind(user_id)
    .bind(property_id)
    .execute(&state.pool)
    .await?;

    Ok(Json(ApiResponse::success(serde_json::json!({
        "message": "Property saved"
    }))))
}

/// DELETE /api/v1/users/me/saved/:property_id
///
/// Remove a saved (bookmarked) property for the authenticated user.
pub async fn unsave_property(
    State(state): State<Arc<AppState>>,
    RequireAuth(claims): RequireAuth,
    Path(property_id): Path<Uuid>,
) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
    let user_id: Uuid = claims
        .sub
        .parse()
        .map_err(|_| AppError::Internal("Invalid user ID in token".to_string()))?;

    let result =
        sqlx::query("DELETE FROM saved_properties WHERE user_id = $1 AND property_id = $2")
            .bind(user_id)
            .bind(property_id)
            .execute(&state.pool)
            .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Saved property not found".to_string()));
    }

    Ok(Json(ApiResponse::success(serde_json::json!({
        "message": "Property unsaved"
    }))))
}
