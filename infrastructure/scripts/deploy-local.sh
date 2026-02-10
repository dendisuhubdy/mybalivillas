#!/usr/bin/env bash
# =============================================================================
# MyBaliVilla.com - Local Deployment Script
# Builds and starts all services for local development
#
# Usage:
#   ./infrastructure/scripts/deploy-local.sh           # Start all services
#   ./infrastructure/scripts/deploy-local.sh --seed     # Start and seed database
#   ./infrastructure/scripts/deploy-local.sh --rebuild   # Force rebuild all images
#   ./infrastructure/scripts/deploy-local.sh --down      # Stop all services
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ---------------------------------------------------------------------------
# Check prerequisites
# ---------------------------------------------------------------------------
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker Desktop: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    log_success "Docker is installed: $(docker --version)"

    # Check Docker Compose (v2 plugin)
    if docker compose version &> /dev/null; then
        log_success "Docker Compose is available: $(docker compose version)"
    elif command -v docker-compose &> /dev/null; then
        log_warn "Using legacy docker-compose. Consider upgrading to Docker Compose V2."
    else
        log_error "Docker Compose is not installed. Please install it: https://docs.docker.com/compose/install/"
        exit 1
    fi

    # Check if Docker daemon is running
    if ! docker info &> /dev/null 2>&1; then
        log_error "Docker daemon is not running. Please start Docker Desktop."
        exit 1
    fi
    log_success "Docker daemon is running"
}

# ---------------------------------------------------------------------------
# Stop all services
# ---------------------------------------------------------------------------
stop_services() {
    log_info "Stopping all MyBaliVilla services..."
    cd "${PROJECT_ROOT}"
    docker compose -f "${COMPOSE_FILE}" down --remove-orphans
    log_success "All services stopped"
}

# ---------------------------------------------------------------------------
# Build images
# ---------------------------------------------------------------------------
build_images() {
    local rebuild_flag=""
    if [[ "${FORCE_REBUILD:-false}" == "true" ]]; then
        rebuild_flag="--no-cache"
    fi

    log_info "Building Docker images..."
    cd "${PROJECT_ROOT}"
    docker compose -f "${COMPOSE_FILE}" build ${rebuild_flag}
    log_success "All images built successfully"
}

# ---------------------------------------------------------------------------
# Start services
# ---------------------------------------------------------------------------
start_services() {
    log_info "Starting all services..."
    cd "${PROJECT_ROOT}"
    docker compose -f "${COMPOSE_FILE}" up -d
    log_success "All services started"
}

# ---------------------------------------------------------------------------
# Wait for services to be healthy
# ---------------------------------------------------------------------------
wait_for_services() {
    log_info "Waiting for services to be healthy..."

    # Wait for PostgreSQL
    local retries=30
    while [[ $retries -gt 0 ]]; do
        if docker compose -f "${COMPOSE_FILE}" exec -T postgres pg_isready -U mybalivilla &> /dev/null; then
            log_success "PostgreSQL is ready"
            break
        fi
        retries=$((retries - 1))
        sleep 2
    done

    if [[ $retries -eq 0 ]]; then
        log_error "PostgreSQL failed to start"
        exit 1
    fi

    # Wait for Redis
    retries=15
    while [[ $retries -gt 0 ]]; do
        if docker compose -f "${COMPOSE_FILE}" exec -T redis redis-cli ping &> /dev/null; then
            log_success "Redis is ready"
            break
        fi
        retries=$((retries - 1))
        sleep 2
    done

    if [[ $retries -eq 0 ]]; then
        log_error "Redis failed to start"
        exit 1
    fi

    # Give API services a moment to start
    log_info "Waiting for API services to initialize..."
    sleep 5
}

# ---------------------------------------------------------------------------
# Seed database with sample data
# ---------------------------------------------------------------------------
seed_database() {
    log_info "Seeding database with sample data..."
    cd "${PROJECT_ROOT}"

    if [[ -f "${PROJECT_ROOT}/migrations/002_seed_data.sql" ]]; then
        docker compose -f "${COMPOSE_FILE}" exec -T postgres \
            psql -U mybalivilla -d mybalivilla -f /docker-entrypoint-initdb.d/002_seed_data.sql
        log_success "Database seeded with sample data"
    else
        log_warn "Seed file not found: migrations/002_seed_data.sql"
    fi
}

# ---------------------------------------------------------------------------
# Print access URLs
# ---------------------------------------------------------------------------
print_urls() {
    echo ""
    echo -e "${GREEN}=============================================${NC}"
    echo -e "${GREEN}  MyBaliVilla.com - Local Development${NC}"
    echo -e "${GREEN}=============================================${NC}"
    echo ""
    echo -e "  Frontend:      ${BLUE}http://localhost:3000${NC}"
    echo -e "  Admin Panel:   ${BLUE}http://localhost:3001${NC}"
    echo -e "  Public API:    ${BLUE}http://localhost:8080${NC}"
    echo -e "  Admin API:     ${BLUE}http://localhost:8081${NC}"
    echo -e "  PostgreSQL:    ${BLUE}localhost:5432${NC}"
    echo -e "  Redis:         ${BLUE}localhost:6379${NC}"
    echo ""
    echo -e "  Default Admin: ${YELLOW}admin@mybalivilla.com / admin123${NC}"
    echo ""
    echo -e "  Stop services: ${YELLOW}docker compose down${NC}"
    echo -e "  View logs:     ${YELLOW}docker compose logs -f [service]${NC}"
    echo ""
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
    local seed=false
    local down=false

    # Parse arguments
    for arg in "$@"; do
        case $arg in
            --seed)
                seed=true
                ;;
            --rebuild)
                export FORCE_REBUILD=true
                ;;
            --down)
                down=true
                ;;
            --help|-h)
                echo "Usage: $0 [--seed] [--rebuild] [--down]"
                echo ""
                echo "Options:"
                echo "  --seed      Seed the database with sample property data"
                echo "  --rebuild   Force rebuild all Docker images (no cache)"
                echo "  --down      Stop all services and exit"
                echo "  --help      Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $arg"
                echo "Run '$0 --help' for usage information"
                exit 1
                ;;
        esac
    done

    echo ""
    echo -e "${BLUE}MyBaliVilla.com - Local Deployment${NC}"
    echo ""

    check_prerequisites

    if [[ "$down" == "true" ]]; then
        stop_services
        exit 0
    fi

    build_images
    start_services
    wait_for_services

    if [[ "$seed" == "true" ]]; then
        seed_database
    fi

    print_urls
}

main "$@"
