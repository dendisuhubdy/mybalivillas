mod handlers;
mod middleware;
mod models;
mod routes;

use sqlx::PgPool;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

/// Shared application state available to all handlers via `State<Arc<AppState>>`.
pub struct AppState {
    pub pool: PgPool,
    pub jwt_secret: String,
}

#[tokio::main]
async fn main() {
    // Load .env file (silently ignore if missing -- e.g. in production where
    // env vars are injected by the orchestrator).
    dotenvy::dotenv().ok();

    // Initialise structured logging via tracing.
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "api=debug,tower_http=debug,sqlx=warn".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Read required configuration from the environment.
    let database_url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let jwt_secret =
        std::env::var("JWT_SECRET").unwrap_or_else(|_| "dev-secret-change-me".to_string());

    // Create the database connection pool.
    let pool = shared::db::create_pool(&database_url)
        .await
        .expect("Failed to create database pool");

    tracing::info!("Database connection pool created");

    // Build shared application state.
    let state = Arc::new(AppState { pool, jwt_secret });

    // CORS: allow all origins during development.
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Assemble the full router.
    let app = routes::create_router(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    // Bind and serve.
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080")
        .await
        .expect("Failed to bind to 0.0.0.0:8080");

    tracing::info!("MyBaliVilla API listening on 0.0.0.0:8080");

    axum::serve(listener, app)
        .await
        .expect("Server error");
}
