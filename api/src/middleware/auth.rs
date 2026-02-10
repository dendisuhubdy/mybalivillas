use axum::{
    extract::{FromRequestParts, Request},
    http::{header::AUTHORIZATION, request::Parts},
    middleware::Next,
    response::Response,
};
use shared::auth::{verify_token, Claims};
use shared::errors::AppError;
use std::sync::Arc;

use crate::AppState;

/// Middleware that extracts a Bearer token from the Authorization header,
/// verifies it, and injects the resulting `Claims` into request extensions.
///
/// If no Authorization header is present, the request proceeds without claims.
/// If the header is present but invalid, a 401 is returned.
pub async fn auth_middleware(
    state: axum::extract::State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    if let Some(auth_header) = request.headers().get(AUTHORIZATION) {
        let auth_str = auth_header
            .to_str()
            .map_err(|_| AppError::Unauthorized("Invalid authorization header".to_string()))?;

        if let Some(token) = auth_str.strip_prefix("Bearer ") {
            let claims = verify_token(token, &state.jwt_secret)?;
            request.extensions_mut().insert(claims);
        }
    }

    Ok(next.run(request).await)
}

/// Extractor that requires a valid JWT. Returns 401 if the user is not
/// authenticated.
#[derive(Debug, Clone)]
pub struct RequireAuth(pub Claims);

impl<S: Send + Sync> FromRequestParts<S> for RequireAuth {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<Claims>()
            .cloned()
            .map(RequireAuth)
            .ok_or_else(|| AppError::Unauthorized("Authentication required".to_string()))
    }
}

/// Extractor that optionally extracts JWT claims. Returns `None` if the user
/// is not authenticated (no 401 error).
#[derive(Debug, Clone)]
pub struct OptionalAuth(pub Option<Claims>);

impl<S: Send + Sync> FromRequestParts<S> for OptionalAuth {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        Ok(OptionalAuth(parts.extensions.get::<Claims>().cloned()))
    }
}
