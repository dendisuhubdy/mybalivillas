use axum::{
    routing::{get, put},
    Router,
};
use std::sync::Arc;

use crate::handlers;
use crate::AppState;

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/", get(handlers::properties::list_properties).post(handlers::properties::create_property))
        .route(
            "/{id}",
            get(handlers::properties::get_property)
                .put(handlers::properties::update_property)
                .delete(handlers::properties::delete_property),
        )
        .route(
            "/{id}/toggle-featured",
            put(handlers::properties::toggle_featured),
        )
        .with_state(state)
}
