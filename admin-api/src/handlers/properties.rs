use axum::extract::{Path, Query, State};
use axum::Json;
use shared::errors::AppError;
use shared::models::Property;
use std::sync::Arc;
use uuid::Uuid;
use validator::Validate;

use crate::middleware::RequireAdmin;
use crate::models::{
    slugify, ApiResponse, CreatePropertyRequest, PaginatedResponse, PropertyFilterParams,
    UpdatePropertyRequest,
};
use crate::AppState;

/// GET /api/admin/properties
pub async fn list_properties(
    RequireAdmin(_claims): RequireAdmin,
    State(state): State<Arc<AppState>>,
    Query(params): Query<PropertyFilterParams>,
) -> Result<Json<ApiResponse<PaginatedResponse<Property>>>, AppError> {
    let pagination = params.pagination();
    let limit = pagination.limit();
    let offset = pagination.offset();

    let search_pattern = params.search.as_ref().map(|s| format!("%{s}%"));

    let rows = sqlx::query_as::<_, Property>(
        r#"
        SELECT *
        FROM properties
        WHERE
            ($1::text IS NULL OR property_type::text = $1)
            AND ($2::text IS NULL OR listing_type::text = $2)
            AND ($3::text IS NULL OR area ILIKE $3)
            AND ($4::bool IS NULL OR is_featured = $4)
            AND ($5::bool IS NULL OR is_active = $5)
            AND ($6::text IS NULL OR title ILIKE $6 OR description ILIKE $6)
        ORDER BY created_at DESC
        LIMIT $7 OFFSET $8
        "#,
    )
    .bind(params.property_type.as_ref().map(|t| {
        serde_json::to_value(t)
            .ok()
            .and_then(|v| v.as_str().map(String::from))
            .unwrap_or_default()
    }))
    .bind(params.listing_type.as_ref().map(|t| {
        serde_json::to_value(t)
            .ok()
            .and_then(|v| v.as_str().map(String::from))
            .unwrap_or_default()
    }))
    .bind(params.area.as_ref().map(|a| format!("%{a}%")))
    .bind(params.is_featured)
    .bind(params.is_active)
    .bind(&search_pattern)
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.pool)
    .await?;

    let total = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)
        FROM properties
        WHERE
            ($1::text IS NULL OR property_type::text = $1)
            AND ($2::text IS NULL OR listing_type::text = $2)
            AND ($3::text IS NULL OR area ILIKE $3)
            AND ($4::bool IS NULL OR is_featured = $4)
            AND ($5::bool IS NULL OR is_active = $5)
            AND ($6::text IS NULL OR title ILIKE $6 OR description ILIKE $6)
        "#,
    )
    .bind(params.property_type.as_ref().map(|t| {
        serde_json::to_value(t)
            .ok()
            .and_then(|v| v.as_str().map(String::from))
            .unwrap_or_default()
    }))
    .bind(params.listing_type.as_ref().map(|t| {
        serde_json::to_value(t)
            .ok()
            .and_then(|v| v.as_str().map(String::from))
            .unwrap_or_default()
    }))
    .bind(params.area.as_ref().map(|a| format!("%{a}%")))
    .bind(params.is_featured)
    .bind(params.is_active)
    .bind(&search_pattern)
    .fetch_one(&state.pool)
    .await?;

    let total_pages = (total as f64 / limit as f64).ceil() as i64;

    Ok(Json(ApiResponse::success(PaginatedResponse {
        items: rows,
        total,
        page: pagination.current_page(),
        per_page: limit,
        total_pages,
    })))
}

/// GET /api/admin/properties/:id
pub async fn get_property(
    RequireAdmin(_claims): RequireAdmin,
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<Property>>, AppError> {
    let property = sqlx::query_as::<_, Property>("SELECT * FROM properties WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Property {id} not found")))?;

    Ok(Json(ApiResponse::success(property)))
}

/// POST /api/admin/properties
pub async fn create_property(
    RequireAdmin(_claims): RequireAdmin,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreatePropertyRequest>,
) -> Result<Json<ApiResponse<Property>>, AppError> {
    payload
        .validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {e}")))?;

    let id = Uuid::new_v4();
    let slug = format!("{}-{}", slugify(&payload.title), &id.to_string()[..8]);
    let features = payload.features.unwrap_or(serde_json::json!([]));
    let images = payload.images.unwrap_or(serde_json::json!([]));
    let currency = payload.currency.unwrap_or_else(|| "USD".to_string());
    let is_featured = payload.is_featured.unwrap_or(false);

    let property = sqlx::query_as::<_, Property>(
        r#"
        INSERT INTO properties (
            id, owner_id, title, slug, description, property_type, listing_type,
            price, price_period, currency, area, address, latitude, longitude,
            bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built,
            features, images, thumbnail_url, is_featured, is_active, view_count
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19,
            $20, $21, $22, $23, true, 0
        )
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(payload.owner_id)
    .bind(&payload.title)
    .bind(&slug)
    .bind(&payload.description)
    .bind(&payload.property_type)
    .bind(&payload.listing_type)
    .bind(payload.price)
    .bind(&payload.price_period)
    .bind(&currency)
    .bind(&payload.area)
    .bind(&payload.address)
    .bind(payload.latitude)
    .bind(payload.longitude)
    .bind(payload.bedrooms)
    .bind(payload.bathrooms)
    .bind(payload.land_size_sqm)
    .bind(payload.building_size_sqm)
    .bind(payload.year_built)
    .bind(&features)
    .bind(&images)
    .bind(&payload.thumbnail_url)
    .bind(is_featured)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(ApiResponse::success(property)))
}

/// PUT /api/admin/properties/:id
pub async fn update_property(
    RequireAdmin(_claims): RequireAdmin,
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdatePropertyRequest>,
) -> Result<Json<ApiResponse<Property>>, AppError> {
    let existing = sqlx::query_as::<_, Property>("SELECT * FROM properties WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Property {id} not found")))?;

    let title_changed = payload.title.is_some();
    let title = payload.title.unwrap_or(existing.title);
    let new_slug = if title_changed {
        format!("{}-{}", slugify(&title), &id.to_string()[..8])
    } else {
        existing.slug
    };

    let property = sqlx::query_as::<_, Property>(
        r#"
        UPDATE properties
        SET
            title = $2, slug = $3, description = $4, property_type = $5,
            listing_type = $6, price = $7, price_period = $8, currency = $9,
            area = $10, address = $11, latitude = $12, longitude = $13,
            bedrooms = $14, bathrooms = $15, land_size_sqm = $16,
            building_size_sqm = $17, year_built = $18, features = $19,
            images = $20, thumbnail_url = $21, is_featured = $22,
            owner_id = $23, updated_at = NOW()
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(&title)
    .bind(&new_slug)
    .bind(payload.description.or(existing.description))
    .bind(payload.property_type.unwrap_or(existing.property_type))
    .bind(payload.listing_type.unwrap_or(existing.listing_type))
    .bind(payload.price.unwrap_or(existing.price))
    .bind(payload.price_period.or(existing.price_period))
    .bind(payload.currency.unwrap_or(existing.currency))
    .bind(payload.area.unwrap_or(existing.area))
    .bind(payload.address.or(existing.address))
    .bind(payload.latitude.or(existing.latitude))
    .bind(payload.longitude.or(existing.longitude))
    .bind(payload.bedrooms.or(existing.bedrooms))
    .bind(payload.bathrooms.or(existing.bathrooms))
    .bind(payload.land_size_sqm.or(existing.land_size_sqm))
    .bind(payload.building_size_sqm.or(existing.building_size_sqm))
    .bind(payload.year_built.or(existing.year_built))
    .bind(payload.features.unwrap_or(existing.features))
    .bind(payload.images.unwrap_or(existing.images))
    .bind(payload.thumbnail_url.or(existing.thumbnail_url))
    .bind(payload.is_featured.unwrap_or(existing.is_featured))
    .bind(payload.owner_id.unwrap_or(existing.owner_id))
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(ApiResponse::success(property)))
}

/// DELETE /api/admin/properties/:id
pub async fn delete_property(
    RequireAdmin(_claims): RequireAdmin,
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<Property>>, AppError> {
    let property = sqlx::query_as::<_, Property>(
        "UPDATE properties SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Property {id} not found")))?;

    Ok(Json(ApiResponse::success(property)))
}

/// PUT /api/admin/properties/:id/toggle-featured
pub async fn toggle_featured(
    RequireAdmin(_claims): RequireAdmin,
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<Property>>, AppError> {
    let property = sqlx::query_as::<_, Property>(
        "UPDATE properties SET is_featured = NOT is_featured, updated_at = NOW() WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Property {id} not found")))?;

    Ok(Json(ApiResponse::success(property)))
}
