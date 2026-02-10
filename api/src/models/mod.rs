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
