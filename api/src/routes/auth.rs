use axum::routing::post;
use axum::Router;
use std::sync::Arc;

use crate::handlers::auth;
use crate::AppState;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/register", post(auth::register))
        .route("/login", post(auth::login))
}
