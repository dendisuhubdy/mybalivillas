use axum::extract::{Path, Query, State};
use axum::Json;
use shared::errors::AppError;
use shared::models::Inquiry;
use std::sync::Arc;
use uuid::Uuid;

use crate::middleware::RequireAdmin;
use crate::models::{
    ApiResponse, InquiryFilterParams, PaginatedResponse, UpdateInquiryStatusRequest,
};
use crate::AppState;

/// GET /api/admin/inquiries
///
/// List all inquiries with pagination and optional status filter.
pub async fn list_inquiries(
    RequireAdmin(_claims): RequireAdmin,
    State(state): State<Arc<AppState>>,
    Query(params): Query<InquiryFilterParams>,
) -> Result<Json<ApiResponse<PaginatedResponse<Inquiry>>>, AppError> {
    let pagination = params.pagination();
    let limit = pagination.limit();
    let offset = pagination.offset();

    let status_str = params.status.as_ref().map(|s| {
        serde_json::to_value(s)
            .ok()
            .and_then(|v| v.as_str().map(String::from))
            .unwrap_or_default()
    });

    let inquiries = sqlx::query_as::<_, Inquiry>(
        r#"
        SELECT *
        FROM inquiries
        WHERE ($1::text IS NULL OR status::text = $1)
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        "#,
    )
    .bind(&status_str)
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.pool)
    .await?;

    let total = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)
        FROM inquiries
        WHERE ($1::text IS NULL OR status::text = $1)
        "#,
    )
    .bind(&status_str)
    .fetch_one(&state.pool)
    .await?;

    let total_pages = (total as f64 / limit as f64).ceil() as i64;

    Ok(Json(ApiResponse::success(PaginatedResponse {
        items: inquiries,
        total,
        page: pagination.current_page(),
        per_page: limit,
        total_pages,
    })))
}

/// GET /api/admin/inquiries/:id
///
/// Get a single inquiry by ID.
pub async fn get_inquiry(
    RequireAdmin(_claims): RequireAdmin,
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<Inquiry>>, AppError> {
    let inquiry = sqlx::query_as::<_, Inquiry>(
        "SELECT * FROM inquiries WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Inquiry {id} not found")))?;

    Ok(Json(ApiResponse::success(inquiry)))
}

/// PUT /api/admin/inquiries/:id/status
///
/// Update the status of an inquiry (e.g., New -> Read -> Replied -> Closed).
pub async fn update_inquiry_status(
    RequireAdmin(_claims): RequireAdmin,
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateInquiryStatusRequest>,
) -> Result<Json<ApiResponse<Inquiry>>, AppError> {
    let inquiry = sqlx::query_as::<_, Inquiry>(
        r#"
        UPDATE inquiries
        SET status = $2
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(&payload.status)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Inquiry {id} not found")))?;

    Ok(Json(ApiResponse::success(inquiry)))
}
