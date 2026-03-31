use axum::routing::{get, post, put};
use axum::Router;
use std::sync::Arc;

use crate::handlers::bookings;
use crate::AppState;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", post(bookings::create_booking))
        .route("/", get(bookings::list_my_bookings))
        .route("/{id}", get(bookings::get_booking))
        .route("/{id}/cancel", put(bookings::cancel_booking))
}
