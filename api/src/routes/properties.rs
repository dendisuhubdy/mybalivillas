use axum::routing::{get, post};
use axum::Router;
use std::sync::Arc;

use crate::handlers::properties;
use crate::AppState;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route(
            "/",
            get(properties::list_properties).post(properties::create_property),
        )
        .route("/featured", get(properties::get_featured))
        .route("/areas", get(properties::get_areas))
        .route("/{slug}", get(properties::get_property))
        .route("/{id}/inquire", post(properties::create_inquiry))
}
