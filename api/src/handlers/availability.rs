use axum::extract::{Path, Query, State};
use axum::Json;
use shared::errors::AppError;
use std::sync::Arc;

use crate::models::{
    ApiResponse, AvailabilityQuery, BlockedDateRange, PricingTierResponse, PropertyRulesResponse,
};
use crate::AppState;

/// GET /api/v1/properties/:slug/availability
pub async fn get_availability(
    State(state): State<Arc<AppState>>,
    Path(slug): Path<String>,
    Query(query): Query<AvailabilityQuery>,
) -> Result<Json<ApiResponse<Vec<BlockedDateRange>>>, AppError> {
    // Get property ID from slug
    let property: Option<(uuid::Uuid,)> = sqlx::query_as(
        "SELECT id FROM properties WHERE slug = $1 AND is_active = true",
    )
    .bind(&slug)
    .fetch_optional(&state.pool)
    .await?;

    let (property_id,) =
        property.ok_or_else(|| AppError::NotFound("Property not found".to_string()))?;

    // Get blocked dates (from owner) and booked dates
    let mut blocked: Vec<BlockedDateRange> = sqlx::query_as(
        r#"SELECT start_date, end_date FROM blocked_dates
           WHERE property_id = $1
           AND start_date <= $3 AND end_date >= $2"#,
    )
    .bind(property_id)
    .bind(query.start_date)
    .bind(query.end_date)
    .fetch_all(&state.pool)
    .await?;

    // Also include confirmed bookings as blocked
    let booked: Vec<BlockedDateRange> = sqlx::query_as(
        r#"SELECT check_in as start_date, check_out as end_date FROM bookings
           WHERE property_id = $1
           AND status NOT IN ('cancelled', 'refunded')
           AND check_in <= $3 AND check_out >= $2"#,
    )
    .bind(property_id)
    .bind(query.start_date)
    .bind(query.end_date)
    .fetch_all(&state.pool)
    .await?;

    blocked.extend(booked);

    Ok(Json(ApiResponse::success(blocked)))
}

/// GET /api/v1/properties/:slug/rules
pub async fn get_property_rules(
    State(state): State<Arc<AppState>>,
    Path(slug): Path<String>,
) -> Result<Json<ApiResponse<Option<PropertyRulesResponse>>>, AppError> {
    let rules: Option<PropertyRulesResponse> = sqlx::query_as(
        r#"SELECT pr.* FROM property_rules pr
           JOIN properties p ON p.id = pr.property_id
           WHERE p.slug = $1"#,
    )
    .bind(&slug)
    .fetch_optional(&state.pool)
    .await?;

    Ok(Json(ApiResponse::success(rules)))
}

/// GET /api/v1/properties/:slug/pricing
pub async fn get_property_pricing(
    State(state): State<Arc<AppState>>,
    Path(slug): Path<String>,
) -> Result<Json<ApiResponse<Vec<PricingTierResponse>>>, AppError> {
    let tiers: Vec<PricingTierResponse> = sqlx::query_as(
        r#"SELECT pt.* FROM pricing_tiers pt
           JOIN properties p ON p.id = pt.property_id
           WHERE p.slug = $1 AND pt.is_active = true
           ORDER BY pt.duration_type"#,
    )
    .bind(&slug)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(ApiResponse::success(tiers)))
}
