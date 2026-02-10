use axum::{routing::get, Router};
use std::sync::Arc;

use crate::handlers;
use crate::AppState;

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/stats", get(handlers::dashboard::get_stats))
        .with_state(state)
}
