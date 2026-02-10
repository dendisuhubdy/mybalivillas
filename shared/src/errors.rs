use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde_json::json;
use std::fmt;

/// Application-wide error type.
#[derive(Debug, Clone)]
pub enum AppError {
    /// Resource not found (404).
    NotFound(String),
    /// Authentication / authorisation failure (401).
    Unauthorized(String),
    /// Client sent bad data (400).
    BadRequest(String),
    /// Internal server error (500).
    Internal(String),
    /// Resource conflict, e.g. duplicate email (409).
    Conflict(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::NotFound(msg) => write!(f, "Not found: {msg}"),
            AppError::Unauthorized(msg) => write!(f, "Unauthorized: {msg}"),
            AppError::BadRequest(msg) => write!(f, "Bad request: {msg}"),
            AppError::Internal(msg) => write!(f, "Internal error: {msg}"),
            AppError::Conflict(msg) => write!(f, "Conflict: {msg}"),
        }
    }
}

impl std::error::Error for AppError {}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg.clone()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, msg.clone()),
        };

        let body = axum::Json(json!({
            "error": {
                "status": status.as_u16(),
                "message": message,
            }
        }));

        (status, body).into_response()
    }
}

/// Convenience conversion from `sqlx::Error`.
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => AppError::NotFound("Record not found".to_string()),
            _ => AppError::Internal(format!("Database error: {err}")),
        }
    }
}

/// Convenience conversion from `serde_json::Error`.
impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::BadRequest(format!("JSON error: {err}"))
    }
}
