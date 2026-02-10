use axum::{routing::post, Router};
use std::sync::Arc;

use crate::handlers;
use crate::AppState;

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/login", post(handlers::auth::admin_login))
        .with_state(state)
}
