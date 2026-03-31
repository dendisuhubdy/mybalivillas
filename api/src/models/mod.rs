use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use shared::models::{ListingType, PricePeriod, PropertyType, UserRole};
use uuid::Uuid;
use validator::Validate;

// ── Generic API Response Wrapper ─────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T: Serialize> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

impl<T: Serialize> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    #[allow(dead_code)]
    pub fn error(message: impl Into<String>) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message.into()),
        }
    }
}

// ── Auth DTOs ────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(email(message = "Invalid email address"))]
    pub email: String,
    #[validate(length(min = 8, message = "Password must be at least 8 characters"))]
    pub password: String,
    #[validate(length(min = 1, message = "Full name is required"))]
    pub full_name: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct GoogleLoginRequest {
    pub credential: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub full_name: String,
    pub phone: Option<String>,
    pub avatar_url: Option<String>,
    pub role: UserRole,
    pub created_at: DateTime<Utc>,
}

impl From<shared::models::User> for UserResponse {
    fn from(u: shared::models::User) -> Self {
        Self {
            id: u.id,
            email: u.email,
            full_name: u.full_name,
            phone: u.phone,
            avatar_url: u.avatar_url,
            role: u.role,
            created_at: u.created_at,
        }
    }
}

// ── Property DTOs ────────────────────────────────────────────────────────

#[derive(Debug, Serialize)]
pub struct PropertyListResponse {
    pub items: Vec<PropertyResponse>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub total_pages: i64,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct PropertyResponse {
    pub id: Uuid,
    pub owner_id: Uuid,
    pub title: String,
    pub slug: String,
    pub description: Option<String>,
    pub property_type: PropertyType,
    pub listing_type: ListingType,
    pub price: Decimal,
    pub price_period: Option<PricePeriod>,
    pub currency: String,
    pub area: String,
    pub address: Option<String>,
    pub latitude: Option<Decimal>,
    pub longitude: Option<Decimal>,
    pub bedrooms: Option<i32>,
    pub bathrooms: Option<i32>,
    pub land_size_sqm: Option<Decimal>,
    pub building_size_sqm: Option<Decimal>,
    pub year_built: Option<i32>,
    pub features: serde_json::Value,
    pub images: serde_json::Value,
    pub thumbnail_url: Option<String>,
    pub is_active: bool,
    pub is_featured: bool,
    pub view_count: i32,
    pub avg_rating: Option<Decimal>,
    pub review_count: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct PropertyFilters {
    pub property_type: Option<String>,
    pub listing_type: Option<String>,
    pub min_price: Option<f64>,
    pub max_price: Option<f64>,
    pub bedrooms: Option<i32>,
    pub bathrooms: Option<i32>,
    pub area: Option<String>,
    pub search: Option<String>,
    pub sort_by: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

// ── Create Property DTO ──────────────────────────────────────────────────

#[derive(Debug, Deserialize, Validate)]
pub struct CreatePropertyRequest {
    #[validate(length(min = 1, message = "Title is required"))]
    pub title: String,
    pub description: Option<String>,
    pub property_type: PropertyType,
    pub listing_type: ListingType,
    pub price: Decimal,
    pub currency: Option<String>,
    pub price_period: Option<PricePeriod>,
    pub bedrooms: Option<i32>,
    pub bathrooms: Option<i32>,
    pub land_size_sqm: Option<Decimal>,
    pub building_size_sqm: Option<Decimal>,
    #[validate(length(min = 1, message = "Area is required"))]
    pub area: String,
    pub address: Option<String>,
    pub latitude: Option<Decimal>,
    pub longitude: Option<Decimal>,
    pub year_built: Option<i32>,
    pub features: Option<serde_json::Value>,
    pub images: Option<serde_json::Value>,
    pub thumbnail_url: Option<String>,
}

// ── Inquiry DTOs ─────────────────────────────────────────────────────────

#[derive(Debug, Deserialize, Validate)]
pub struct CreateInquiryRequest {
    #[validate(length(min = 1, message = "Name is required"))]
    pub name: String,
    #[validate(email(message = "Invalid email address"))]
    pub email: String,
    pub phone: Option<String>,
    #[validate(length(min = 1, message = "Message is required"))]
    pub message: String,
}

// ── Area DTOs ────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AreaCount {
    pub area: String,
    pub count: i64,
}

// ── User Profile DTOs ────────────────────────────────────────────────────

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateProfileRequest {
    #[validate(length(min = 1, message = "Full name cannot be empty"))]
    pub full_name: Option<String>,
    pub phone: Option<String>,
    pub avatar_url: Option<String>,
}

// ── Amenity DTOs ────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct AmenityResponse {
    pub id: Uuid,
    pub slug: String,
    pub name: String,
    pub icon: String,
    pub category: String,
}

// ── Booking DTOs ────────────────────────────────────────────────────────

#[derive(Debug, Deserialize, Validate)]
pub struct CreateBookingRequest {
    pub property_id: Uuid,
    pub check_in: chrono::NaiveDate,
    pub check_out: chrono::NaiveDate,
    #[validate(range(min = 1, message = "At least 1 guest required"))]
    pub num_guests: i32,
    pub special_requests: Option<String>,
    pub duration_type: shared::models::RentalDurationType,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct BookingResponse {
    pub id: Uuid,
    pub property_id: Uuid,
    pub guest_id: Uuid,
    pub check_in: chrono::NaiveDate,
    pub check_out: chrono::NaiveDate,
    pub num_guests: i32,
    pub special_requests: Option<String>,
    pub base_price: Decimal,
    pub cleaning_fee: Option<Decimal>,
    pub service_fee: Option<Decimal>,
    pub total_price: Decimal,
    pub currency: String,
    pub duration_type: shared::models::RentalDurationType,
    pub duration_count: i32,
    pub status: shared::models::BookingStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct BookingFilters {
    pub status: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

// ── Review DTOs ─────────────────────────────────────────────────────────

#[derive(Debug, Deserialize, Validate)]
pub struct CreateReviewRequest {
    pub property_id: Uuid,
    pub booking_id: Option<Uuid>,
    #[validate(range(min = 1, max = 5, message = "Rating must be 1-5"))]
    pub overall_rating: i16,
    pub cleanliness_rating: Option<i16>,
    pub location_rating: Option<i16>,
    pub value_rating: Option<i16>,
    pub communication_rating: Option<i16>,
    pub title: Option<String>,
    #[validate(length(min = 1, message = "Review comment is required"))]
    pub comment: String,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ReviewResponse {
    pub id: Uuid,
    pub property_id: Uuid,
    pub user_id: Uuid,
    pub overall_rating: i16,
    pub cleanliness_rating: Option<i16>,
    pub location_rating: Option<i16>,
    pub value_rating: Option<i16>,
    pub communication_rating: Option<i16>,
    pub title: Option<String>,
    pub comment: String,
    pub owner_response: Option<String>,
    pub is_approved: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ReviewWithUser {
    pub id: Uuid,
    pub property_id: Uuid,
    pub user_id: Uuid,
    pub user_name: String,
    pub user_avatar: Option<String>,
    pub overall_rating: i16,
    pub cleanliness_rating: Option<i16>,
    pub location_rating: Option<i16>,
    pub value_rating: Option<i16>,
    pub communication_rating: Option<i16>,
    pub title: Option<String>,
    pub comment: String,
    pub owner_response: Option<String>,
    pub created_at: DateTime<Utc>,
}

// ── Property Rules DTOs ─────────────────────────────────────────────────

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct PropertyRulesResponse {
    pub id: Uuid,
    pub property_id: Uuid,
    pub check_in_time: Option<chrono::NaiveTime>,
    pub check_out_time: Option<chrono::NaiveTime>,
    pub max_guests: Option<i32>,
    pub pets_allowed: Option<bool>,
    pub smoking_allowed: Option<bool>,
    pub parties_allowed: Option<bool>,
    pub quiet_hours_start: Option<chrono::NaiveTime>,
    pub quiet_hours_end: Option<chrono::NaiveTime>,
    pub custom_rules: Option<String>,
    pub cancellation_policy: shared::models::CancellationPolicyType,
    pub cancellation_details: Option<String>,
}

// ── Pricing Tier DTOs ───────────────────────────────────────────────────

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct PricingTierResponse {
    pub id: Uuid,
    pub property_id: Uuid,
    pub duration_type: shared::models::RentalDurationType,
    pub price: Decimal,
    pub currency: String,
    pub min_duration: Option<i32>,
    pub max_duration: Option<i32>,
    pub cleaning_fee: Option<Decimal>,
    pub service_fee_percent: Option<Decimal>,
    pub is_active: bool,
}

// ── Availability DTOs ───────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct AvailabilityQuery {
    pub start_date: chrono::NaiveDate,
    pub end_date: chrono::NaiveDate,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct BlockedDateRange {
    pub start_date: chrono::NaiveDate,
    pub end_date: chrono::NaiveDate,
}
