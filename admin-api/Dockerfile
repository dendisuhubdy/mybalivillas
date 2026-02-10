# =============================================================================
# MyBaliVilla.com - Admin API Dockerfile
# Multi-stage build for the Rust/Axum Admin API service
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Builder - Compile the Rust binary
# ---------------------------------------------------------------------------
FROM rust:1.82-slim-bookworm AS builder

# Install system dependencies required for building
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace-level Cargo files first for better layer caching
COPY Cargo.toml Cargo.lock ./

# Copy all workspace member directories
COPY api/ api/
COPY admin-api/ admin-api/
COPY shared/ shared/

# Build the Admin API binary in release mode
RUN cargo build --release --bin admin-api

# ---------------------------------------------------------------------------
# Stage 2: Runtime - Minimal image with only the compiled binary
# ---------------------------------------------------------------------------
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=builder /app/target/release/admin-api ./admin-api

EXPOSE 8081

CMD ["./admin-api"]
