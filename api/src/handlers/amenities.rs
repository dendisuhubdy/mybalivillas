use axum::extract::{Path, State};
use axum::Json;
use shared::errors::AppError;
use std::sync::Arc;

use crate::models::{AmenityResponse, ApiResponse};
use crate::AppState;

/// GET /api/v1/properties/amenities
pub async fn list_amenities(
    State(state): State<Arc<AppState>>,
) -> Result<Json<ApiResponse<Vec<AmenityResponse>>>, AppError> {
    let amenities: Vec<AmenityResponse> = sqlx::query_as(
        "SELECT id, slug, name, icon, category FROM amenities ORDER BY sort_order ASC",
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(ApiResponse::success(amenities)))
}

/// GET /api/v1/properties/:slug/amenities
pub async fn get_property_amenities(
    State(state): State<Arc<AppState>>,
    Path(slug): Path<String>,
) -> Result<Json<ApiResponse<Vec<AmenityResponse>>>, AppError> {
    let amenities: Vec<AmenityResponse> = sqlx::query_as(
        r#"SELECT a.id, a.slug, a.name, a.icon, a.category
           FROM amenities a
           JOIN property_amenities pa ON pa.amenity_id = a.id
           JOIN properties p ON p.id = pa.property_id
           WHERE p.slug = $1
           ORDER BY a.sort_order ASC"#,
    )
    .bind(&slug)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(ApiResponse::success(amenities)))
}
