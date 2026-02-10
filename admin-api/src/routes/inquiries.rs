use axum::{
    routing::{get, put},
    Router,
};
use std::sync::Arc;

use crate::handlers;
use crate::AppState;

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/", get(handlers::inquiries::list_inquiries))
        .route("/{id}", get(handlers::inquiries::get_inquiry))
        .route(
            "/{id}/status",
            put(handlers::inquiries::update_inquiry_status),
        )
        .with_state(state)
}
