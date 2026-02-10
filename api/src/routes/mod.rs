pub mod auth;
pub mod properties;
pub mod users;

use axum::middleware;
use axum::Router;
use std::sync::Arc;

use crate::middleware::auth::auth_middleware;
use crate::AppState;

/// Build the full application router with all route groups nested under
/// `/api/v1`.
pub fn create_router(state: Arc<AppState>) -> Router {
    Router::new()
        .nest(
            "/api/v1",
            Router::new()
                .nest("/auth", auth::routes())
                .nest("/properties", properties::routes())
                .nest("/users", users::routes()),
        )
        .layer(middleware::from_fn_with_state(
            state.clone(),
            auth_middleware,
        ))
        .with_state(state)
}
