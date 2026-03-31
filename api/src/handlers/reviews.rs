use axum::extract::{Path, State};
use axum::Json;
use shared::errors::AppError;
use std::sync::Arc;
use uuid::Uuid;
use validator::Validate;

use crate::middleware::auth::RequireAuth;
use crate::models::{ApiResponse, CreateReviewRequest, ReviewResponse, ReviewWithUser};
use crate::AppState;

/// POST /api/v1/properties/reviews
pub async fn create_review(
    State(state): State<Arc<AppState>>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<CreateReviewRequest>,
) -> Result<Json<ApiResponse<ReviewResponse>>, AppError> {
    payload
        .validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {e}")))?;

    let user_id: Uuid = claims
        .sub
        .parse()
        .map_err(|_| AppError::Internal("Invalid user ID".to_string()))?;

    // Verify property exists
    let exists: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM properties WHERE id = $1 AND is_active = true")
            .bind(payload.property_id)
            .fetch_optional(&state.pool)
            .await?;

    if exists.is_none() {
        return Err(AppError::NotFound("Property not found".to_string()));
    }

    let id = Uuid::new_v4();
    let review: ReviewResponse = sqlx::query_as(
        r#"INSERT INTO reviews (
            id, property_id, booking_id, user_id, overall_rating,
            cleanliness_rating, location_rating, value_rating, communication_rating,
            title, comment, is_approved
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false)
        RETURNING *"#,
    )
    .bind(id)
    .bind(payload.property_id)
    .bind(payload.booking_id)
    .bind(user_id)
    .bind(payload.overall_rating)
    .bind(payload.cleanliness_rating)
    .bind(payload.location_rating)
    .bind(payload.value_rating)
    .bind(payload.communication_rating)
    .bind(&payload.title)
    .bind(&payload.comment)
    .fetch_one(&state.pool)
    .await?;

    // Update property avg_rating and review_count
    sqlx::query(
        r#"UPDATE properties SET
            avg_rating = (SELECT AVG(overall_rating) FROM reviews WHERE property_id = $1 AND is_approved = true),
            review_count = (SELECT COUNT(*) FROM reviews WHERE property_id = $1 AND is_approved = true)
           WHERE id = $1"#,
    )
    .bind(payload.property_id)
    .execute(&state.pool)
    .await?;

    Ok(Json(ApiResponse::success(review)))
}

/// GET /api/v1/properties/:slug/reviews
pub async fn get_property_reviews(
    State(state): State<Arc<AppState>>,
    Path(slug): Path<String>,
) -> Result<Json<ApiResponse<Vec<ReviewWithUser>>>, AppError> {
    let reviews: Vec<ReviewWithUser> = sqlx::query_as(
        r#"SELECT r.id, r.property_id, r.user_id, u.full_name as user_name,
                  u.avatar_url as user_avatar, r.overall_rating, r.cleanliness_rating,
                  r.location_rating, r.value_rating, r.communication_rating,
                  r.title, r.comment, r.owner_response, r.created_at
           FROM reviews r
           JOIN users u ON u.id = r.user_id
           JOIN properties p ON p.id = r.property_id
           WHERE p.slug = $1 AND r.is_approved = true
           ORDER BY r.created_at DESC"#,
    )
    .bind(&slug)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(ApiResponse::success(reviews)))
}
