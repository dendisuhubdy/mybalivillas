use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

/// Create a PostgreSQL connection pool.
///
/// `database_url` should be a full Postgres connection string, e.g.
/// `postgres://user:pass@localhost:5432/mybalivilla`.
pub async fn create_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await?;

    Ok(pool)
}
