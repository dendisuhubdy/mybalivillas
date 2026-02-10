use axum::extract::State;
use axum::Json;
use shared::auth::{create_token, verify_password};
use shared::errors::AppError;
use std::sync::Arc;
use validator::Validate;

use crate::models::{AdminLoginRequest, ApiResponse, AuthResponse, UserResponse};
use crate::AppState;

/// POST /api/admin/auth/login
///
/// Authenticate an admin user. Only users with the `Admin` role are
/// permitted to log in through this endpoint.
pub async fn admin_login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<AdminLoginRequest>,
) -> Result<Json<ApiResponse<AuthResponse>>, AppError> {
    payload
        .validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {e}")))?;

    // Look up the user by email.
    let user = sqlx::query_as::<_, UserResponse>(
        r#"
        SELECT id, email, full_name, phone, avatar_url, role, is_active, created_at, updated_at
        FROM users
        WHERE email = $1
        "#,
    )
    .bind(&payload.email)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::Unauthorized("Invalid credentials".to_string()))?;

    // We also need the password hash (not in UserResponse for security).
    let row = sqlx::query_scalar::<_, String>(
        "SELECT password_hash FROM users WHERE email = $1",
    )
    .bind(&payload.email)
    .fetch_one(&state.pool)
    .await?;

    // Verify password.
    let valid = verify_password(&payload.password, &row)?;
    if !valid {
        return Err(AppError::Unauthorized("Invalid credentials".to_string()));
    }

    // Check that the user is an admin.
    if user.role != shared::models::UserRole::Admin {
        return Err(AppError::Unauthorized(
            "Only admin users can access this portal".to_string(),
        ));
    }

    // Check that the account is active.
    if !user.is_active {
        return Err(AppError::Unauthorized(
            "Account is deactivated".to_string(),
        ));
    }

    // Create JWT.
    let token = create_token(user.id, &user.email, &user.role, &state.jwt_secret)?;

    Ok(Json(ApiResponse::success(AuthResponse { token, user })))
}
