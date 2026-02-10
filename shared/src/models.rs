use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "property_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum PropertyType {
    Villa,
    House,
    Apartment,
    Land,
    Commercial,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "listing_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum ListingType {
    SaleFreehold,
    SaleLeasehold,
    ShortTermRent,
    LongTermRent,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "price_period", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum PricePeriod {
    PerNight,
    PerWeek,
    PerMonth,
    PerYear,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "user_role", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum UserRole {
    Admin,
    Agent,
    User,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "inquiry_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum InquiryStatus {
    New,
    Read,
    Replied,
    Closed,
}

// ---------------------------------------------------------------------------
// Property
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Property {
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

impl Property {
    /// Deserialize the `features` JSON column into a `Vec<String>`.
    pub fn features_list(&self) -> Vec<String> {
        serde_json::from_value(self.features.clone()).unwrap_or_default()
    }

    /// Deserialize the `images` JSON column into a `Vec<String>`.
    pub fn images_list(&self) -> Vec<String> {
        serde_json::from_value(self.images.clone()).unwrap_or_default()
    }
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub full_name: String,
    pub phone: Option<String>,
    pub role: UserRole,
    pub avatar_url: Option<String>,
    pub is_active: bool,
    pub email_verified: bool,
    pub last_login_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ---------------------------------------------------------------------------
// Inquiry
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Inquiry {
    pub id: Uuid,
    pub property_id: Uuid,
    pub user_id: Option<Uuid>,
    pub name: String,
    pub email: String,
    pub phone: Option<String>,
    pub message: String,
    pub status: InquiryStatus,
    pub created_at: DateTime<Utc>,
}

// ---------------------------------------------------------------------------
// SavedProperty
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SavedProperty {
    pub id: Uuid,
    pub user_id: Uuid,
    pub property_id: Uuid,
    pub created_at: DateTime<Utc>,
}
