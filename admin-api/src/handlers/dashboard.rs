use axum::extract::State;
use axum::Json;
use shared::errors::AppError;
use std::sync::Arc;

use crate::middleware::RequireAdmin;
use crate::models::{
    ApiResponse, AreaCount, DashboardStats, RecentInquiry, RecentProperty, TypeCount,
};
use crate::AppState;

/// GET /api/admin/dashboard/stats
///
/// Aggregate statistics for the admin dashboard.
pub async fn get_stats(
    RequireAdmin(_claims): RequireAdmin,
    State(state): State<Arc<AppState>>,
) -> Result<Json<ApiResponse<DashboardStats>>, AppError> {
    // Total properties.
    let total_properties = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM properties")
        .fetch_one(&state.pool)
        .await?;

    // Active properties.
    let active_properties =
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM properties WHERE is_active = true")
            .fetch_one(&state.pool)
            .await?;

    // Total users.
    let total_users = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users")
        .fetch_one(&state.pool)
        .await?;

    // Total inquiries.
    let total_inquiries = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM inquiries")
        .fetch_one(&state.pool)
        .await?;

    // New inquiries in the last 7 days.
    let new_inquiries = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM inquiries WHERE created_at >= NOW() - INTERVAL '7 days'",
    )
    .fetch_one(&state.pool)
    .await?;

    // Total views across all properties.
    let total_views =
        sqlx::query_scalar::<_, i64>("SELECT COALESCE(SUM(view_count::bigint), 0) FROM properties")
            .fetch_one(&state.pool)
            .await?;

    // Properties grouped by type.
    let properties_by_type = sqlx::query_as::<_, TypeCount>(
        r#"
        SELECT property_type, COUNT(*) AS count
        FROM properties
        GROUP BY property_type
        ORDER BY count DESC
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    // Properties grouped by area.
    let properties_by_area = sqlx::query_as::<_, AreaCount>(
        r#"
        SELECT area, COUNT(*) AS count
        FROM properties
        GROUP BY area
        ORDER BY count DESC
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    // 5 most recent inquiries.
    let recent_inquiries = sqlx::query_as::<_, RecentInquiry>(
        r#"
        SELECT id, name, email, message, status, property_id, created_at
        FROM inquiries
        ORDER BY created_at DESC
        LIMIT 5
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    // 5 most recently created properties.
    let recent_properties = sqlx::query_as::<_, RecentProperty>(
        r#"
        SELECT id, title, slug, property_type, listing_type, price, area, is_active, created_at
        FROM properties
        ORDER BY created_at DESC
        LIMIT 5
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    let stats = DashboardStats {
        total_properties,
        active_properties,
        total_users,
        total_inquiries,
        new_inquiries,
        total_views,
        properties_by_type,
        properties_by_area,
        recent_inquiries,
        recent_properties,
    };

    Ok(Json(ApiResponse::success(stats)))
}
