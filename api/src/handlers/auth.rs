use axum::extract::State;
use axum::Json;
use shared::auth::{create_token, hash_password, verify_password};
use shared::errors::AppError;
use shared::models::User;
use std::sync::Arc;
use uuid::Uuid;
use validator::Validate;

use crate::models::{ApiResponse, CreateUserRequest, LoginRequest, LoginResponse, UserResponse};
use crate::AppState;

/// POST /api/v1/auth/register
///
/// Create a new user account and return a JWT.
pub async fn register(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<ApiResponse<LoginResponse>>, AppError> {
    // Validate input
    payload
        .validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {e}")))?;

    // Check email uniqueness
    let existing: Option<User> = sqlx::query_as("SELECT * FROM users WHERE email = $1")
        .bind(&payload.email)
        .fetch_optional(&state.pool)
        .await?;

    if existing.is_some() {
        return Err(AppError::Conflict(
            "A user with this email already exists".to_string(),
        ));
    }

    // Hash password
    let password_hash = hash_password(&payload.password)?;

    // Insert user
    let user: User = sqlx::query_as(
        r#"
        INSERT INTO users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'user', true, NOW(), NOW())
        RETURNING *
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(&payload.email)
    .bind(&password_hash)
    .bind(&payload.full_name)
    .fetch_one(&state.pool)
    .await?;

    // Create JWT
    let token = create_token(user.id, &user.email, &user.role, &state.jwt_secret)?;

    let response = LoginResponse {
        token,
        user: UserResponse::from(user),
    };

    Ok(Json(ApiResponse::success(response)))
}

/// POST /api/v1/auth/login
///
/// Authenticate with email and password, return a JWT.
pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<ApiResponse<LoginResponse>>, AppError> {
    // Find user by email
    let user: User = sqlx::query_as("SELECT * FROM users WHERE email = $1 AND is_active = true")
        .bind(&payload.email)
        .fetch_optional(&state.pool)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid email or password".to_string()))?;

    // Verify password
    let valid = verify_password(&payload.password, &user.password_hash)?;
    if !valid {
        return Err(AppError::Unauthorized(
            "Invalid email or password".to_string(),
        ));
    }

    // Create JWT
    let token = create_token(user.id, &user.email, &user.role, &state.jwt_secret)?;

    let response = LoginResponse {
        token,
        user: UserResponse::from(user),
    };

    Ok(Json(ApiResponse::success(response)))
}
