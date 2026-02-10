use axum::extract::{Path, Query, State};
use axum::Json;
use shared::auth::hash_password;
use shared::errors::AppError;
use std::sync::Arc;
use uuid::Uuid;
use validator::Validate;

use crate::middleware::RequireAdmin;
use crate::models::{
    ApiResponse, CreateUserRequest, PaginatedResponse, PaginationParams, UpdateUserRequest,
    UserResponse,
};
use crate::AppState;

/// GET /api/admin/users
///
/// List all users with pagination.
pub async fn list_users(
    RequireAdmin(_claims): RequireAdmin,
    State(state): State<Arc<AppState>>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<ApiResponse<PaginatedResponse<UserResponse>>>, AppError> {
    let limit = params.limit();
    let offset = params.offset();

    let users = sqlx::query_as::<_, UserResponse>(
        r#"
        SELECT id, email, full_name, phone, avatar_url, role, is_active, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        "#,
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.pool)
    .await?;

    let total = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users")
        .fetch_one(&state.pool)
        .await?;

    let total_pages = (total as f64 / limit as f64).ceil() as i64;

    Ok(Json(ApiResponse::success(PaginatedResponse {
        items: users,
        total,
        page: params.current_page(),
        per_page: limit,
        total_pages,
    })))
}

/// GET /api/admin/users/:id
///
/// Get a single user by ID.
pub async fn get_user(
    RequireAdmin(_claims): RequireAdmin,
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<UserResponse>>, AppError> {
    let user = sqlx::query_as::<_, UserResponse>(
        r#"
        SELECT id, email, full_name, phone, avatar_url, role, is_active, created_at, updated_at
        FROM users
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("User {id} not found")))?;

    Ok(Json(ApiResponse::success(user)))
}

/// POST /api/admin/users
///
/// Create a new user. The password is hashed before storage.
pub async fn create_user(
    RequireAdmin(_claims): RequireAdmin,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<ApiResponse<UserResponse>>, AppError> {
    payload
        .validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {e}")))?;

    // Check for duplicate email.
    let exists =
        sqlx::query_scalar::<_, bool>("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)")
            .bind(&payload.email)
            .fetch_one(&state.pool)
            .await?;

    if exists {
        return Err(AppError::Conflict(format!(
            "A user with email '{}' already exists",
            payload.email
        )));
    }

    let id = Uuid::new_v4();
    let password_hash = hash_password(&payload.password)?;
    let now = chrono::Utc::now();

    let user = sqlx::query_as::<_, UserResponse>(
        r#"
        INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, role, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $8)
        RETURNING id, email, full_name, phone, avatar_url, role, is_active, created_at, updated_at
        "#,
    )
    .bind(id)
    .bind(&payload.email)
    .bind(&password_hash)
    .bind(&payload.full_name)
    .bind(&payload.phone)
    .bind(&payload.avatar_url)
    .bind(&payload.role)
    .bind(now)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(ApiResponse::success(user)))
}

/// PUT /api/admin/users/:id
///
/// Update an existing user. Only provided (non-null) fields are changed.
pub async fn update_user(
    RequireAdmin(_claims): RequireAdmin,
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateUserRequest>,
) -> Result<Json<ApiResponse<UserResponse>>, AppError> {
    payload
        .validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {e}")))?;

    // Fetch existing user to merge with partial update.
    let existing = sqlx::query_as::<_, UserResponse>(
        r#"
        SELECT id, email, full_name, phone, avatar_url, role, is_active, created_at, updated_at
        FROM users
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("User {id} not found")))?;

    // If email is changing, check for duplicates.
    if let Some(ref new_email) = payload.email {
        if *new_email != existing.email {
            let exists = sqlx::query_scalar::<_, bool>(
                "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND id != $2)",
            )
            .bind(new_email)
            .bind(id)
            .fetch_one(&state.pool)
            .await?;

            if exists {
                return Err(AppError::Conflict(format!(
                    "A user with email '{new_email}' already exists"
                )));
            }
        }
    }

    // Hash password if provided.
    let password_update = if let Some(ref pw) = payload.password {
        Some(hash_password(pw)?)
    } else {
        None
    };

    let now = chrono::Utc::now();

    // Build the update. If a new password was supplied, also update password_hash.
    let user = if let Some(ref pw_hash) = password_update {
        sqlx::query_as::<_, UserResponse>(
            r#"
            UPDATE users
            SET
                email = $2,
                password_hash = $3,
                full_name = $4,
                phone = $5,
                avatar_url = $6,
                role = $7,
                updated_at = $8
            WHERE id = $1
            RETURNING id, email, full_name, phone, avatar_url, role, is_active, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(payload.email.unwrap_or(existing.email))
        .bind(pw_hash)
        .bind(payload.full_name.unwrap_or(existing.full_name))
        .bind(payload.phone.or(existing.phone))
        .bind(payload.avatar_url.or(existing.avatar_url))
        .bind(payload.role.unwrap_or(existing.role))
        .bind(now)
        .fetch_one(&state.pool)
        .await?
    } else {
        sqlx::query_as::<_, UserResponse>(
            r#"
            UPDATE users
            SET
                email = $2,
                full_name = $3,
                phone = $4,
                avatar_url = $5,
                role = $6,
                updated_at = $7
            WHERE id = $1
            RETURNING id, email, full_name, phone, avatar_url, role, is_active, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(payload.email.unwrap_or(existing.email))
        .bind(payload.full_name.unwrap_or(existing.full_name))
        .bind(payload.phone.or(existing.phone))
        .bind(payload.avatar_url.or(existing.avatar_url))
        .bind(payload.role.unwrap_or(existing.role))
        .bind(now)
        .fetch_one(&state.pool)
        .await?
    };

    Ok(Json(ApiResponse::success(user)))
}

/// PUT /api/admin/users/:id/toggle-active
///
/// Toggle the `is_active` flag on a user.
pub async fn toggle_active(
    RequireAdmin(_claims): RequireAdmin,
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<UserResponse>>, AppError> {
    let user = sqlx::query_as::<_, UserResponse>(
        r#"
        UPDATE users
        SET is_active = NOT is_active, updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, full_name, phone, avatar_url, role, is_active, created_at, updated_at
        "#,
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("User {id} not found")))?;

    Ok(Json(ApiResponse::success(user)))
}
