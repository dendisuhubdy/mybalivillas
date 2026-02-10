use axum::{
    extract::{FromRequestParts, Request},
    http::request::Parts,
    middleware::Next,
    response::Response,
};
use shared::auth::{verify_token, Claims};
use shared::errors::AppError;
use std::sync::Arc;

use crate::AppState;

/// Extractor that verifies the caller is an authenticated admin.
///
/// Usage:
/// ```ignore
/// async fn handler(RequireAdmin(claims): RequireAdmin) { ... }
/// ```
#[derive(Debug, Clone)]
pub struct RequireAdmin(pub Claims);

impl FromRequestParts<Arc<AppState>> for RequireAdmin {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &Arc<AppState>,
    ) -> Result<Self, Self::Rejection> {
        // Extract the Authorization header.
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .ok_or_else(|| {
                AppError::Unauthorized("Missing Authorization header".to_string())
            })?;

        // Expect "Bearer <token>".
        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or_else(|| {
                AppError::Unauthorized("Invalid Authorization header format".to_string())
            })?;

        // Verify the token.
        let claims = verify_token(token, &state.jwt_secret)?;

        // Ensure the caller has an Admin role.
        if claims.role != "admin" && claims.role != "Admin" {
            return Err(AppError::Unauthorized(
                "Admin access required".to_string(),
            ));
        }

        Ok(RequireAdmin(claims))
    }
}

/// Middleware function for admin-only routes (alternative to the extractor).
pub async fn require_admin_middleware(
    req: Request,
    next: Next,
) -> Result<Response, AppError> {
    let (mut parts, body) = req.into_parts();

    let state = parts
        .extensions
        .get::<Arc<AppState>>()
        .cloned()
        .ok_or_else(|| AppError::Internal("Missing app state".to_string()))?;

    let auth_header = parts
        .headers
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| {
            AppError::Unauthorized("Missing Authorization header".to_string())
        })?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| {
            AppError::Unauthorized("Invalid Authorization header format".to_string())
        })?;

    let claims = verify_token(token, &state.jwt_secret)?;

    if claims.role != "admin" && claims.role != "Admin" {
        return Err(AppError::Unauthorized(
            "Admin access required".to_string(),
        ));
    }

    parts.extensions.insert(claims);

    let req = Request::from_parts(parts, body);
    Ok(next.run(req).await)
}
