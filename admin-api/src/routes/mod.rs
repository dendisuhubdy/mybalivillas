pub mod auth;
pub mod dashboard;
pub mod inquiries;
pub mod properties;
pub mod users;

use axum::Router;
use std::sync::Arc;

use crate::AppState;

/// Build the full admin router tree.
pub fn admin_routes(state: Arc<AppState>) -> Router {
    Router::new()
        .nest("/auth", auth::routes(state.clone()))
        .nest("/properties", properties::routes(state.clone()))
        .nest("/users", users::routes(state.clone()))
        .nest("/inquiries", inquiries::routes(state.clone()))
        .nest("/dashboard", dashboard::routes(state.clone()))
}
