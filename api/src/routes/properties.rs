use axum::routing::{get, post};
use axum::Router;
use std::sync::Arc;

use crate::handlers::{amenities, availability, properties, reviews};
use crate::AppState;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route(
            "/",
            get(properties::list_properties).post(properties::create_property),
        )
        .route("/featured", get(properties::get_featured))
        .route("/areas", get(properties::get_areas))
        .route("/amenities", get(amenities::list_amenities))
        .route("/reviews", post(reviews::create_review))
        .route("/{slug}", get(properties::get_property))
        .route("/{id}/inquire", post(properties::create_inquiry))
        .route("/{slug}/reviews", get(reviews::get_property_reviews))
        .route("/{slug}/amenities", get(amenities::get_property_amenities))
        .route("/{slug}/availability", get(availability::get_availability))
        .route("/{slug}/rules", get(availability::get_property_rules))
        .route("/{slug}/pricing", get(availability::get_property_pricing))
}
