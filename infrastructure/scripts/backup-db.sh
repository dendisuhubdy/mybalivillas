#!/usr/bin/env bash
# =============================================================================
# MyBaliVilla.com - Database Backup Script
#
# Creates a compressed backup of the PostgreSQL database.
# Can optionally upload to DigitalOcean Spaces for offsite storage.
#
# Usage:
#   ./infrastructure/scripts/backup-db.sh                    # Local backup only
#   ./infrastructure/scripts/backup-db.sh --upload            # Backup + upload to Spaces
#   ./infrastructure/scripts/backup-db.sh --upload --prune    # Backup + upload + prune old
#
# Cron example (daily at 2 AM):
#   0 2 * * * /opt/mybalivilla/infrastructure/scripts/backup-db.sh --upload --prune >> /var/log/mybalivilla-backup.log 2>&1
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Backup settings
BACKUP_DIR="${PROJECT_ROOT}/backups"
BACKUP_RETENTION=7  # Number of local backups to keep
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="mybalivilla_backup_${TIMESTAMP}.sql.gz"

# Database settings (override with environment variables)
DB_CONTAINER="${DB_CONTAINER:-mybalivilla-postgres}"
DB_NAME="${POSTGRES_DB:-mybalivilla}"
DB_USER="${POSTGRES_USER:-mybalivilla}"

# DigitalOcean Spaces settings (for --upload option)
DO_SPACES_BUCKET="${DO_SPACES_BUCKET:-mybalivilla-backups}"
DO_SPACES_REGION="${DO_SPACES_REGION:-sgp1}"
DO_SPACES_PATH="${DO_SPACES_PATH:-database-backups}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${RED}[ERROR]${NC} $1"; }

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
UPLOAD=false
PRUNE=false

for arg in "$@"; do
    case $arg in
        --upload)
            UPLOAD=true
            ;;
        --prune)
            PRUNE=true
            ;;
        --help|-h)
            echo "Usage: $0 [--upload] [--prune]"
            echo ""
            echo "Options:"
            echo "  --upload    Upload backup to DigitalOcean Spaces"
            echo "  --prune     Remove old backups (keep last ${BACKUP_RETENTION})"
            echo "  --help      Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  DB_CONTAINER        Docker container name (default: mybalivilla-postgres)"
            echo "  POSTGRES_DB         Database name (default: mybalivilla)"
            echo "  POSTGRES_USER       Database user (default: mybalivilla)"
            echo "  DO_SPACES_BUCKET    DigitalOcean Spaces bucket name"
            echo "  DO_SPACES_REGION    Spaces region (default: sgp1)"
            echo "  DO_SPACES_PATH      Path prefix in bucket (default: database-backups)"
            exit 0
            ;;
        *)
            log_error "Unknown option: $arg"
            exit 1
            ;;
    esac
done

# ---------------------------------------------------------------------------
# Create backup directory
# ---------------------------------------------------------------------------
mkdir -p "${BACKUP_DIR}"

# ---------------------------------------------------------------------------
# Step 1: Create database backup
# ---------------------------------------------------------------------------
log_info "Starting database backup..."
log_info "Container: ${DB_CONTAINER}, Database: ${DB_NAME}, User: ${DB_USER}"

# Check if the container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    log_error "Container '${DB_CONTAINER}' is not running"
    log_info "Running containers:"
    docker ps --format '  {{.Names}} ({{.Status}})'
    exit 1
fi

# Perform pg_dump and compress with gzip
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

docker exec "${DB_CONTAINER}" pg_dump \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --no-owner \
    --no-privileges \
    --verbose \
    2>/dev/null | gzip > "${BACKUP_PATH}"

# Verify the backup file was created and is not empty
if [[ ! -s "${BACKUP_PATH}" ]]; then
    log_error "Backup file is empty or was not created"
    rm -f "${BACKUP_PATH}"
    exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
log_success "Backup created: ${BACKUP_PATH} (${BACKUP_SIZE})"

# ---------------------------------------------------------------------------
# Step 2: Upload to DigitalOcean Spaces (optional)
# ---------------------------------------------------------------------------
if [[ "$UPLOAD" == "true" ]]; then
    log_info "Uploading backup to DigitalOcean Spaces..."

    # Check if s3cmd or aws cli is available
    if command -v s3cmd &> /dev/null; then
        s3cmd put "${BACKUP_PATH}" \
            "s3://${DO_SPACES_BUCKET}/${DO_SPACES_PATH}/${BACKUP_FILENAME}" \
            --host="${DO_SPACES_REGION}.digitaloceanspaces.com" \
            --host-bucket="%(bucket)s.${DO_SPACES_REGION}.digitaloceanspaces.com"
        log_success "Backup uploaded to Spaces: s3://${DO_SPACES_BUCKET}/${DO_SPACES_PATH}/${BACKUP_FILENAME}"
    elif command -v aws &> /dev/null; then
        aws s3 cp "${BACKUP_PATH}" \
            "s3://${DO_SPACES_BUCKET}/${DO_SPACES_PATH}/${BACKUP_FILENAME}" \
            --endpoint-url "https://${DO_SPACES_REGION}.digitaloceanspaces.com"
        log_success "Backup uploaded to Spaces: s3://${DO_SPACES_BUCKET}/${DO_SPACES_PATH}/${BACKUP_FILENAME}"
    else
        log_warn "Neither s3cmd nor aws CLI found. Skipping upload."
        log_warn "Install s3cmd: apt-get install s3cmd"
        log_warn "Or install AWS CLI: pip install awscli"
    fi
fi

# ---------------------------------------------------------------------------
# Step 3: Prune old local backups (keep last N)
# ---------------------------------------------------------------------------
if [[ "$PRUNE" == "true" ]]; then
    log_info "Pruning old backups (keeping last ${BACKUP_RETENTION})..."

    # Count existing backups
    BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/mybalivilla_backup_*.sql.gz 2>/dev/null | wc -l)

    if [[ ${BACKUP_COUNT} -gt ${BACKUP_RETENTION} ]]; then
        # Remove oldest backups, keeping the most recent ones
        REMOVE_COUNT=$((BACKUP_COUNT - BACKUP_RETENTION))
        ls -1t "${BACKUP_DIR}"/mybalivilla_backup_*.sql.gz | tail -n "${REMOVE_COUNT}" | while read -r old_backup; do
            rm -f "${old_backup}"
            log_info "Removed old backup: $(basename "${old_backup}")"
        done
        log_success "Pruned ${REMOVE_COUNT} old backup(s)"
    else
        log_info "No backups to prune (${BACKUP_COUNT} <= ${BACKUP_RETENTION})"
    fi
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
log_success "Backup complete!"
log_info "File: ${BACKUP_PATH}"
log_info "Size: ${BACKUP_SIZE}"

# List all current backups
TOTAL_BACKUPS=$(ls -1 "${BACKUP_DIR}"/mybalivilla_backup_*.sql.gz 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)
log_info "Total backups: ${TOTAL_BACKUPS} (${TOTAL_SIZE} total)"
