use axum::extract::{Path, Query, State};
use axum::Json;
use shared::errors::AppError;
use std::sync::Arc;
use uuid::Uuid;
use validator::Validate;

use crate::middleware::auth::RequireAuth;
use crate::models::{ApiResponse, BookingFilters, BookingResponse, CreateBookingRequest};
use crate::AppState;

/// POST /api/v1/bookings
pub async fn create_booking(
    State(state): State<Arc<AppState>>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<CreateBookingRequest>,
) -> Result<Json<ApiResponse<BookingResponse>>, AppError> {
    payload
        .validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {e}")))?;

    let guest_id: Uuid = claims
        .sub
        .parse()
        .map_err(|_| AppError::Internal("Invalid user ID".to_string()))?;

    // Verify property exists and is active
    let property: Option<(Uuid, rust_decimal::Decimal, String)> = sqlx::query_as(
        "SELECT id, price, currency FROM properties WHERE id = $1 AND is_active = true",
    )
    .bind(payload.property_id)
    .fetch_optional(&state.pool)
    .await?;

    let (_, base_price, currency) =
        property.ok_or_else(|| AppError::NotFound("Property not found".to_string()))?;

    // Check for overlapping bookings
    let overlap: Option<(Uuid,)> = sqlx::query_as(
        r#"SELECT id FROM bookings
           WHERE property_id = $1
           AND status NOT IN ('cancelled', 'refunded')
           AND check_in < $3 AND check_out > $2"#,
    )
    .bind(payload.property_id)
    .bind(payload.check_in)
    .bind(payload.check_out)
    .fetch_optional(&state.pool)
    .await?;

    if overlap.is_some() {
        return Err(AppError::BadRequest(
            "Property is not available for these dates".to_string(),
        ));
    }

    // Check blocked dates
    let blocked: Option<(Uuid,)> = sqlx::query_as(
        r#"SELECT id FROM blocked_dates
           WHERE property_id = $1
           AND start_date < $3 AND end_date > $2"#,
    )
    .bind(payload.property_id)
    .bind(payload.check_in)
    .bind(payload.check_out)
    .fetch_optional(&state.pool)
    .await?;

    if blocked.is_some() {
        return Err(AppError::BadRequest(
            "Property is blocked for these dates".to_string(),
        ));
    }

    let days = (payload.check_out - payload.check_in).num_days();
    let duration_count = match payload.duration_type {
        shared::models::RentalDurationType::Nightly => days as i32,
        shared::models::RentalDurationType::Weekly => (days / 7).max(1) as i32,
        shared::models::RentalDurationType::Monthly => (days / 30).max(1) as i32,
        shared::models::RentalDurationType::Yearly => (days / 365).max(1) as i32,
    };

    let total_price = base_price * rust_decimal::Decimal::from(duration_count);

    let id = Uuid::new_v4();
    let booking: BookingResponse = sqlx::query_as(
        r#"INSERT INTO bookings (
            id, property_id, guest_id, check_in, check_out, num_guests,
            special_requests, base_price, total_price, currency,
            duration_type, duration_count, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
        RETURNING *"#,
    )
    .bind(id)
    .bind(payload.property_id)
    .bind(guest_id)
    .bind(payload.check_in)
    .bind(payload.check_out)
    .bind(payload.num_guests)
    .bind(&payload.special_requests)
    .bind(base_price)
    .bind(total_price)
    .bind(&currency)
    .bind(&payload.duration_type)
    .bind(duration_count)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(ApiResponse::success(booking)))
}

/// GET /api/v1/bookings
pub async fn list_my_bookings(
    State(state): State<Arc<AppState>>,
    RequireAuth(claims): RequireAuth,
    Query(filters): Query<BookingFilters>,
) -> Result<Json<ApiResponse<Vec<BookingResponse>>>, AppError> {
    let guest_id: Uuid = claims
        .sub
        .parse()
        .map_err(|_| AppError::Internal("Invalid user ID".to_string()))?;

    let page = filters.page.unwrap_or(1).max(1);
    let per_page = filters.per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let bookings: Vec<BookingResponse> = if let Some(ref status) = filters.status {
        sqlx::query_as(
            r#"SELECT * FROM bookings
               WHERE guest_id = $1 AND status::text = $2
               ORDER BY created_at DESC
               OFFSET $3 LIMIT $4"#,
        )
        .bind(guest_id)
        .bind(status)
        .bind(offset)
        .bind(per_page)
        .fetch_all(&state.pool)
        .await?
    } else {
        sqlx::query_as(
            r#"SELECT * FROM bookings
               WHERE guest_id = $1
               ORDER BY created_at DESC
               OFFSET $2 LIMIT $3"#,
        )
        .bind(guest_id)
        .bind(offset)
        .bind(per_page)
        .fetch_all(&state.pool)
        .await?
    };

    Ok(Json(ApiResponse::success(bookings)))
}

/// GET /api/v1/bookings/:id
pub async fn get_booking(
    State(state): State<Arc<AppState>>,
    RequireAuth(claims): RequireAuth,
    Path(booking_id): Path<Uuid>,
) -> Result<Json<ApiResponse<BookingResponse>>, AppError> {
    let guest_id: Uuid = claims
        .sub
        .parse()
        .map_err(|_| AppError::Internal("Invalid user ID".to_string()))?;

    let booking: BookingResponse =
        sqlx::query_as("SELECT * FROM bookings WHERE id = $1 AND guest_id = $2")
            .bind(booking_id)
            .bind(guest_id)
            .fetch_optional(&state.pool)
            .await?
            .ok_or_else(|| AppError::NotFound("Booking not found".to_string()))?;

    Ok(Json(ApiResponse::success(booking)))
}

/// PUT /api/v1/bookings/:id/cancel
pub async fn cancel_booking(
    State(state): State<Arc<AppState>>,
    RequireAuth(claims): RequireAuth,
    Path(booking_id): Path<Uuid>,
) -> Result<Json<ApiResponse<BookingResponse>>, AppError> {
    let guest_id: Uuid = claims
        .sub
        .parse()
        .map_err(|_| AppError::Internal("Invalid user ID".to_string()))?;

    let booking: BookingResponse = sqlx::query_as(
        r#"UPDATE bookings
           SET status = 'cancelled', cancelled_at = NOW()
           WHERE id = $1 AND guest_id = $2 AND status IN ('pending', 'confirmed')
           RETURNING *"#,
    )
    .bind(booking_id)
    .bind(guest_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::BadRequest("Cannot cancel this booking".to_string()))?;

    Ok(Json(ApiResponse::success(booking)))
}
