use axum::extract::{Path, Query, State};
use axum::Json;
use shared::errors::AppError;
use std::sync::Arc;
use uuid::Uuid;
use validator::Validate;

use crate::middleware::auth::OptionalAuth;
use crate::models::{
    ApiResponse, AreaCount, CreateInquiryRequest, PropertyFilters, PropertyListResponse,
    PropertyResponse,
};
use crate::AppState;

/// GET /api/v1/properties
pub async fn list_properties(
    State(state): State<Arc<AppState>>,
    Query(filters): Query<PropertyFilters>,
) -> Result<Json<ApiResponse<PropertyListResponse>>, AppError> {
    let page = filters.page.unwrap_or(1).max(1);
    let per_page = filters.per_page.unwrap_or(12).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let mut conditions: Vec<String> = vec!["p.is_active = true".to_string()];
    let mut bind_idx: usize = 0;

    #[derive(Default)]
    struct BindValues {
        property_type: Option<String>,
        listing_type: Option<String>,
        min_price: Option<f64>,
        max_price: Option<f64>,
        bedrooms: Option<i32>,
        bathrooms: Option<i32>,
        area: Option<String>,
        search: Option<String>,
    }

    let mut binds = BindValues::default();

    if let Some(ref pt) = filters.property_type {
        bind_idx += 1;
        conditions.push(format!("p.property_type::text = ${bind_idx}"));
        binds.property_type = Some(pt.clone());
    }

    if let Some(ref lt) = filters.listing_type {
        bind_idx += 1;
        conditions.push(format!("p.listing_type::text = ${bind_idx}"));
        binds.listing_type = Some(lt.clone());
    }

    if let Some(min) = filters.min_price {
        bind_idx += 1;
        conditions.push(format!("p.price >= ${bind_idx}"));
        binds.min_price = Some(min);
    }

    if let Some(max) = filters.max_price {
        bind_idx += 1;
        conditions.push(format!("p.price <= ${bind_idx}"));
        binds.max_price = Some(max);
    }

    if let Some(beds) = filters.bedrooms {
        bind_idx += 1;
        conditions.push(format!("p.bedrooms >= ${bind_idx}"));
        binds.bedrooms = Some(beds);
    }

    if let Some(baths) = filters.bathrooms {
        bind_idx += 1;
        conditions.push(format!("p.bathrooms >= ${bind_idx}"));
        binds.bathrooms = Some(baths);
    }

    if let Some(ref a) = filters.area {
        bind_idx += 1;
        conditions.push(format!("p.area ILIKE ${bind_idx}"));
        binds.area = Some(format!("%{a}%"));
    }

    if let Some(ref s) = filters.search {
        bind_idx += 1;
        let param = bind_idx;
        bind_idx += 1;
        conditions.push(format!(
            "(p.title ILIKE ${param} OR p.description ILIKE ${bind_idx} OR p.area ILIKE ${param})"
        ));
        binds.search = Some(format!("%{s}%"));
    }

    let where_clause = conditions.join(" AND ");

    let order_clause = match filters.sort_by.as_deref() {
        Some("price_asc") => "p.price ASC",
        Some("price_desc") => "p.price DESC",
        Some("oldest") => "p.created_at ASC",
        Some("views") => "p.view_count DESC",
        _ => "p.created_at DESC",
    };

    let count_sql = format!("SELECT COUNT(*) as count FROM properties p WHERE {where_clause}");

    let offset_param = bind_idx + 1;
    let limit_param = bind_idx + 2;
    let data_sql = format!(
        r#"SELECT p.*
           FROM properties p
           WHERE {where_clause}
           ORDER BY {order_clause}
           OFFSET ${offset_param} LIMIT ${limit_param}"#
    );

    // Execute count query
    let mut count_query = sqlx::query_scalar::<_, i64>(&count_sql);

    if let Some(ref v) = binds.property_type { count_query = count_query.bind(v); }
    if let Some(ref v) = binds.listing_type { count_query = count_query.bind(v); }
    if let Some(v) = binds.min_price { count_query = count_query.bind(v); }
    if let Some(v) = binds.max_price { count_query = count_query.bind(v); }
    if let Some(v) = binds.bedrooms { count_query = count_query.bind(v); }
    if let Some(v) = binds.bathrooms { count_query = count_query.bind(v); }
    if let Some(ref v) = binds.area { count_query = count_query.bind(v); }
    if let Some(ref v) = binds.search {
        count_query = count_query.bind(v);
        count_query = count_query.bind(v);
    }

    let total: i64 = count_query.fetch_one(&state.pool).await?;

    // Execute data query
    let mut data_query = sqlx::query_as::<_, PropertyResponse>(&data_sql);

    if let Some(ref v) = binds.property_type { data_query = data_query.bind(v); }
    if let Some(ref v) = binds.listing_type { data_query = data_query.bind(v); }
    if let Some(v) = binds.min_price { data_query = data_query.bind(v); }
    if let Some(v) = binds.max_price { data_query = data_query.bind(v); }
    if let Some(v) = binds.bedrooms { data_query = data_query.bind(v); }
    if let Some(v) = binds.bathrooms { data_query = data_query.bind(v); }
    if let Some(ref v) = binds.area { data_query = data_query.bind(v); }
    if let Some(ref v) = binds.search {
        data_query = data_query.bind(v);
        data_query = data_query.bind(v);
    }

    data_query = data_query.bind(offset).bind(per_page);

    let items: Vec<PropertyResponse> = data_query.fetch_all(&state.pool).await?;

    let total_pages = if total == 0 { 0 } else { (total + per_page - 1) / per_page };

    Ok(Json(ApiResponse::success(PropertyListResponse {
        items, total, page, per_page, total_pages,
    })))
}

/// GET /api/v1/properties/featured
pub async fn get_featured(
    State(state): State<Arc<AppState>>,
) -> Result<Json<ApiResponse<Vec<PropertyResponse>>>, AppError> {
    let properties: Vec<PropertyResponse> = sqlx::query_as(
        r#"SELECT * FROM properties
           WHERE is_featured = true AND is_active = true
           ORDER BY created_at DESC
           LIMIT 6"#,
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(ApiResponse::success(properties)))
}

/// GET /api/v1/properties/areas
pub async fn get_areas(
    State(state): State<Arc<AppState>>,
) -> Result<Json<ApiResponse<Vec<AreaCount>>>, AppError> {
    let areas: Vec<AreaCount> = sqlx::query_as(
        r#"SELECT area, COUNT(*)::bigint as count
           FROM properties
           WHERE is_active = true
           GROUP BY area
           ORDER BY count DESC"#,
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(ApiResponse::success(areas)))
}

/// GET /api/v1/properties/:slug
pub async fn get_property(
    State(state): State<Arc<AppState>>,
    Path(slug): Path<String>,
) -> Result<Json<ApiResponse<PropertyResponse>>, AppError> {
    let property: PropertyResponse = sqlx::query_as(
        r#"UPDATE properties
           SET view_count = view_count + 1
           WHERE slug = $1 AND is_active = true
           RETURNING *"#,
    )
    .bind(&slug)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Property with slug '{slug}' not found")))?;

    Ok(Json(ApiResponse::success(property)))
}

/// POST /api/v1/properties/:id/inquire
pub async fn create_inquiry(
    State(state): State<Arc<AppState>>,
    OptionalAuth(claims): OptionalAuth,
    Path(property_id): Path<Uuid>,
    Json(payload): Json<CreateInquiryRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
    payload
        .validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {e}")))?;

    let exists: Option<(Uuid,)> = sqlx::query_as(
        "SELECT id FROM properties WHERE id = $1 AND is_active = true",
    )
    .bind(property_id)
    .fetch_optional(&state.pool)
    .await?;

    if exists.is_none() {
        return Err(AppError::NotFound("Property not found".to_string()));
    }

    let user_id: Option<Uuid> = claims
        .as_ref()
        .and_then(|c| c.sub.parse::<Uuid>().ok());

    let inquiry_id = Uuid::new_v4();

    sqlx::query(
        r#"INSERT INTO inquiries (id, property_id, user_id, name, email, phone, message, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'new', NOW())"#,
    )
    .bind(inquiry_id)
    .bind(property_id)
    .bind(user_id)
    .bind(&payload.name)
    .bind(&payload.email)
    .bind(&payload.phone)
    .bind(&payload.message)
    .execute(&state.pool)
    .await?;

    Ok(Json(ApiResponse::success(serde_json::json!({
        "id": inquiry_id,
        "message": "Inquiry submitted successfully"
    }))))
}
