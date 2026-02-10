use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use shared::models::{InquiryStatus, ListingType, PricePeriod, PropertyType, UserRole};
use uuid::Uuid;
use validator::Validate;

// ---------------------------------------------------------------------------
// Generic API response wrapper
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

impl<T: Serialize> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: None,
        }
    }

    pub fn message(msg: impl Into<String>) -> Self {
        Self {
            success: true,
            data: None,
            message: Some(msg.into()),
        }
    }
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

impl PaginationParams {
    pub fn offset(&self) -> i64 {
        (self.current_page() - 1) * self.limit()
    }

    pub fn limit(&self) -> i64 {
        self.per_page.unwrap_or(20).min(100).max(1)
    }

    pub fn current_page(&self) -> i64 {
        self.page.unwrap_or(1).max(1)
    }
}

#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T: Serialize> {
    pub items: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub total_pages: i64,
}

// ---------------------------------------------------------------------------
// Auth DTOs
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize, Validate)]
pub struct AdminLoginRequest {
    #[validate(email(message = "Invalid email address"))]
    pub email: String,
    #[validate(length(min = 6, message = "Password must be at least 6 characters"))]
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserResponse,
}

// ---------------------------------------------------------------------------
// User DTOs
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub full_name: String,
    pub phone: Option<String>,
    pub avatar_url: Option<String>,
    pub role: UserRole,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(email(message = "Invalid email address"))]
    pub email: String,
    #[validate(length(min = 6, message = "Password must be at least 6 characters"))]
    pub password: String,
    #[validate(length(min = 1, message = "Full name is required"))]
    pub full_name: String,
    pub phone: Option<String>,
    pub avatar_url: Option<String>,
    pub role: UserRole,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateUserRequest {
    #[validate(email(message = "Invalid email address"))]
    pub email: Option<String>,
    pub password: Option<String>,
    #[validate(length(min = 1, message = "Full name cannot be empty"))]
    pub full_name: Option<String>,
    pub phone: Option<String>,
    pub avatar_url: Option<String>,
    pub role: Option<UserRole>,
}

// ---------------------------------------------------------------------------
// Property DTOs
// ---------------------------------------------------------------------------

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
    pub is_featured: Option<bool>,
    pub owner_id: Uuid,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePropertyRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub property_type: Option<PropertyType>,
    pub listing_type: Option<ListingType>,
    pub price: Option<Decimal>,
    pub currency: Option<String>,
    pub price_period: Option<PricePeriod>,
    pub bedrooms: Option<i32>,
    pub bathrooms: Option<i32>,
    pub land_size_sqm: Option<Decimal>,
    pub building_size_sqm: Option<Decimal>,
    pub area: Option<String>,
    pub address: Option<String>,
    pub latitude: Option<Decimal>,
    pub longitude: Option<Decimal>,
    pub year_built: Option<i32>,
    pub features: Option<serde_json::Value>,
    pub images: Option<serde_json::Value>,
    pub thumbnail_url: Option<String>,
    pub is_featured: Option<bool>,
    pub owner_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct PropertyFilterParams {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub property_type: Option<PropertyType>,
    pub listing_type: Option<ListingType>,
    pub area: Option<String>,
    pub is_featured: Option<bool>,
    pub is_active: Option<bool>,
    pub search: Option<String>,
}

impl PropertyFilterParams {
    pub fn pagination(&self) -> PaginationParams {
        PaginationParams {
            page: self.page,
            per_page: self.per_page,
        }
    }
}

// ---------------------------------------------------------------------------
// Inquiry DTOs
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct UpdateInquiryStatusRequest {
    pub status: InquiryStatus,
}

#[derive(Debug, Deserialize)]
pub struct InquiryFilterParams {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub status: Option<InquiryStatus>,
}

impl InquiryFilterParams {
    pub fn pagination(&self) -> PaginationParams {
        PaginationParams {
            page: self.page,
            per_page: self.per_page,
        }
    }
}

// ---------------------------------------------------------------------------
// Dashboard DTOs
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub total_properties: i64,
    pub active_properties: i64,
    pub total_users: i64,
    pub total_inquiries: i64,
    pub new_inquiries: i64,
    pub total_views: i64,
    pub properties_by_type: Vec<TypeCount>,
    pub properties_by_area: Vec<AreaCount>,
    pub recent_inquiries: Vec<RecentInquiry>,
    pub recent_properties: Vec<RecentProperty>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TypeCount {
    pub property_type: PropertyType,
    pub count: i64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AreaCount {
    pub area: String,
    pub count: i64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct RecentInquiry {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub message: String,
    pub status: InquiryStatus,
    pub property_id: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct RecentProperty {
    pub id: Uuid,
    pub title: String,
    pub slug: String,
    pub property_type: PropertyType,
    pub listing_type: ListingType,
    pub price: Decimal,
    pub area: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

// Re-export slugify from shared crate
pub use shared::utils::slugify;
