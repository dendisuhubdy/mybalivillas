use axum::{
    routing::{get, put},
    Router,
};
use std::sync::Arc;

use crate::handlers;
use crate::AppState;

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/", get(handlers::users::list_users).post(handlers::users::create_user))
        .route(
            "/{id}",
            get(handlers::users::get_user).put(handlers::users::update_user),
        )
        .route("/{id}/toggle-active", put(handlers::users::toggle_active))
        .with_state(state)
}
