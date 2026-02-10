mod handlers;
mod middleware;
mod models;
mod routes;

use axum::Router;
use sqlx::PgPool;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

/// Shared application state available to all handlers.
#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub jwt_secret: String,
}

#[tokio::main]
async fn main() {
    // Load .env file (silently ignore if missing).
    dotenvy::dotenv().ok();

    // Initialise structured logging.
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "admin_api=debug,tower_http=debug".into()),
        )
        .init();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let jwt_secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");

    let pool = shared::db::create_pool(&database_url)
        .await
        .expect("Failed to create database pool");

    let state = Arc::new(AppState { pool, jwt_secret });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .nest("/api/admin", routes::admin_routes(state.clone()))
        .layer(TraceLayer::new_for_http())
        .layer(cors);

    let bind_addr = std::env::var("ADMIN_BIND_ADDR").unwrap_or_else(|_| "0.0.0.0:8081".to_string());

    tracing::info!("Admin API listening on {bind_addr}");

    let listener = tokio::net::TcpListener::bind(&bind_addr)
        .await
        .expect("Failed to bind address");

    axum::serve(listener, app).await.expect("Server error");
}
