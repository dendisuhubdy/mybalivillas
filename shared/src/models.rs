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
    pub password_hash: Option<String>,
    pub full_name: String,
    pub phone: Option<String>,
    pub role: UserRole,
    pub avatar_url: Option<String>,
    pub is_active: bool,
    pub email_verified: bool,
    pub google_id: Option<String>,
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

// ---------------------------------------------------------------------------
// Enums (migration 004)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "booking_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum BookingStatus {
    Pending,
    Confirmed,
    CheckedIn,
    CheckedOut,
    Cancelled,
    Refunded,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "cancellation_policy_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum CancellationPolicyType {
    Flexible,
    Moderate,
    Strict,
    NonRefundable,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "rental_duration_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum RentalDurationType {
    Nightly,
    Weekly,
    Monthly,
    Yearly,
}

// ---------------------------------------------------------------------------
// Amenity
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Amenity {
    pub id: Uuid,
    pub slug: String,
    pub name: String,
    pub icon: String,
    pub category: String,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
}

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Review {
    pub id: Uuid,
    pub property_id: Uuid,
    pub booking_id: Option<Uuid>,
    pub user_id: Uuid,
    pub overall_rating: i16,
    pub cleanliness_rating: Option<i16>,
    pub location_rating: Option<i16>,
    pub value_rating: Option<i16>,
    pub communication_rating: Option<i16>,
    pub title: Option<String>,
    pub comment: String,
    pub owner_response: Option<String>,
    pub owner_responded_at: Option<DateTime<Utc>>,
    pub is_approved: bool,
    pub is_flagged: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Booking {
    pub id: Uuid,
    pub property_id: Uuid,
    pub guest_id: Uuid,
    pub pricing_tier_id: Option<Uuid>,
    pub check_in: chrono::NaiveDate,
    pub check_out: chrono::NaiveDate,
    pub num_guests: i32,
    pub special_requests: Option<String>,
    pub base_price: Decimal,
    pub cleaning_fee: Option<Decimal>,
    pub service_fee: Option<Decimal>,
    pub total_price: Decimal,
    pub currency: String,
    pub duration_type: RentalDurationType,
    pub duration_count: i32,
    pub status: BookingStatus,
    pub cancelled_at: Option<DateTime<Utc>>,
    pub cancellation_reason: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
