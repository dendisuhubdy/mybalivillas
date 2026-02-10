use axum::routing::{delete, get, post, put};
use axum::Router;
use std::sync::Arc;

use crate::handlers::users;
use crate::AppState;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/me", get(users::get_profile))
        .route("/me", put(users::update_profile))
        .route("/me/saved", get(users::get_saved))
        .route("/me/saved/{property_id}", post(users::save_property))
        .route("/me/saved/{property_id}", delete(users::unsave_property))
}
