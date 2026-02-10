#!/usr/bin/env bash
# =============================================================================
# MyBaliVilla.com - DigitalOcean VPS Deployment Script
#
# Deploys the application to a DigitalOcean VPS via SSH.
# Assumes the VPS has been set up with setup-vps.sh first.
#
# Usage:
#   ./infrastructure/scripts/deploy-digitalocean.sh <VPS_IP> [OPTIONS]
#
# Options:
#   --ssl                Set up Let's Encrypt SSL with certbot
#   --domain <domain>    Domain name for SSL (default: mybalivilla.com)
#   --branch <branch>    Git branch to deploy (default: main)
#   --repo <url>         Git repository URL
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Defaults
DOMAIN="mybalivilla.com"
BRANCH="main"
REPO_URL="git@github.com:yourusername/mybalivilla.com.git"
APP_DIR="/opt/mybalivilla"
APP_USER="mybalivilla"
SETUP_SSL=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---------------------------------------------------------------------------
# Parse command-line arguments
# ---------------------------------------------------------------------------
if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <VPS_IP> [--ssl] [--domain <domain>] [--branch <branch>] [--repo <url>]"
    echo ""
    echo "Arguments:"
    echo "  VPS_IP              IP address of the DigitalOcean VPS"
    echo ""
    echo "Options:"
    echo "  --ssl               Set up Let's Encrypt SSL certificates"
    echo "  --domain <domain>   Domain name (default: mybalivilla.com)"
    echo "  --branch <branch>   Git branch to deploy (default: main)"
    echo "  --repo <url>        Git repository URL"
    exit 1
fi

VPS_IP="$1"
shift

while [[ $# -gt 0 ]]; do
    case "$1" in
        --ssl)
            SETUP_SSL=true
            shift
            ;;
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --branch)
            BRANCH="$2"
            shift 2
            ;;
        --repo)
            REPO_URL="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# ---------------------------------------------------------------------------
# Verify SSH connectivity
# ---------------------------------------------------------------------------
log_info "Verifying SSH connection to ${VPS_IP}..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "root@${VPS_IP}" "echo 'SSH connection successful'" 2>/dev/null; then
    log_error "Cannot connect to ${VPS_IP} via SSH. Check your SSH key and VPS status."
    exit 1
fi
log_success "SSH connection established"

# ---------------------------------------------------------------------------
# Install Docker and Docker Compose on VPS if not present
# ---------------------------------------------------------------------------
log_info "Checking Docker installation on VPS..."
ssh "root@${VPS_IP}" bash << 'INSTALL_DOCKER'
set -euo pipefail

if ! command -v docker &> /dev/null; then
    echo "[INFO] Installing Docker..."
    apt-get update
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo "[OK] Docker installed successfully"
else
    echo "[OK] Docker is already installed: $(docker --version)"
fi

# Verify Docker Compose plugin
if docker compose version &> /dev/null; then
    echo "[OK] Docker Compose is available: $(docker compose version)"
else
    echo "[ERROR] Docker Compose plugin not found"
    exit 1
fi
INSTALL_DOCKER
log_success "Docker is ready on VPS"

# ---------------------------------------------------------------------------
# Create application directory and clone/pull repository
# ---------------------------------------------------------------------------
log_info "Setting up application on VPS..."
ssh "root@${VPS_IP}" bash << SETUP_APP
set -euo pipefail

# Create app user if not exists
if ! id "${APP_USER}" &>/dev/null; then
    useradd -m -s /bin/bash "${APP_USER}"
    usermod -aG docker "${APP_USER}"
    echo "[OK] Created user: ${APP_USER}"
fi

# Create app directory
mkdir -p "${APP_DIR}"

# Clone or pull repository
if [[ -d "${APP_DIR}/.git" ]]; then
    echo "[INFO] Pulling latest changes..."
    cd "${APP_DIR}"
    git fetch origin
    git checkout "${BRANCH}"
    git pull origin "${BRANCH}"
    echo "[OK] Repository updated"
else
    echo "[INFO] Cloning repository..."
    git clone -b "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
    echo "[OK] Repository cloned"
fi

chown -R ${APP_USER}:${APP_USER} "${APP_DIR}"
SETUP_APP
log_success "Application code is ready"

# ---------------------------------------------------------------------------
# Create production environment file
# ---------------------------------------------------------------------------
log_info "Setting up environment variables..."

# Check if .env.prod already exists on the VPS
ENV_EXISTS=$(ssh "root@${VPS_IP}" "test -f ${APP_DIR}/.env.prod && echo 'yes' || echo 'no'")

if [[ "$ENV_EXISTS" == "no" ]]; then
    log_warn "No .env.prod found on VPS. Creating from template..."

    # Check if we have a local .env.prod to upload
    if [[ -f "${PROJECT_ROOT}/.env.prod" ]]; then
        log_info "Uploading local .env.prod..."
        scp "${PROJECT_ROOT}/.env.prod" "root@${VPS_IP}:${APP_DIR}/.env.prod"
    else
        log_warn "Creating .env.prod from template. You MUST edit it with real values!"
        ssh "root@${VPS_IP}" bash << ENV_SETUP
cat > "${APP_DIR}/.env.prod" << 'ENVFILE'
# =============================================================================
# MyBaliVilla.com - Production Environment Variables
# IMPORTANT: Replace ALL placeholder values before deploying!
# =============================================================================

# PostgreSQL
POSTGRES_DB=mybalivilla
POSTGRES_USER=mybalivilla
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Redis
REDIS_PASSWORD=$(openssl rand -base64 32)

# JWT
JWT_SECRET=$(openssl rand -base64 64)

# Logging
RUST_LOG=info

# CORS
CORS_ORIGINS=https://${DOMAIN}

# Frontend URLs
NEXT_PUBLIC_API_URL=https://${DOMAIN}/api/v1
NEXT_PUBLIC_ADMIN_API_URL=https://${DOMAIN}/api/admin

# Domain
DOMAIN=${DOMAIN}
ENVFILE
chmod 600 "${APP_DIR}/.env.prod"
ENV_SETUP
        log_success "Generated .env.prod with random secrets"
    fi
else
    log_success ".env.prod already exists on VPS"
fi

# ---------------------------------------------------------------------------
# Set up UFW firewall
# ---------------------------------------------------------------------------
log_info "Configuring firewall..."
ssh "root@${VPS_IP}" bash << 'FIREWALL'
set -euo pipefail

if command -v ufw &> /dev/null; then
    # Reset and configure UFW
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing

    # Allow SSH
    ufw allow 22/tcp comment "SSH"

    # Allow HTTP and HTTPS
    ufw allow 80/tcp comment "HTTP"
    ufw allow 443/tcp comment "HTTPS"

    # Enable firewall
    ufw --force enable
    echo "[OK] Firewall configured: SSH (22), HTTP (80), HTTPS (443)"
else
    echo "[WARN] UFW not installed. Consider installing it for firewall management."
fi
FIREWALL
log_success "Firewall configured"

# ---------------------------------------------------------------------------
# Deploy application
# ---------------------------------------------------------------------------
log_info "Deploying application..."
ssh "root@${VPS_IP}" bash << DEPLOY
set -euo pipefail

cd "${APP_DIR}"

# Pull/build images and start services
echo "[INFO] Building and starting services..."
docker compose -f docker-compose.prod.yml --env-file .env.prod pull postgres redis 2>/dev/null || true
docker compose -f docker-compose.prod.yml --env-file .env.prod build
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

echo "[INFO] Waiting for services to start..."
sleep 10

# Show service status
docker compose -f docker-compose.prod.yml ps

echo "[OK] Application deployed successfully"
DEPLOY
log_success "Application is running"

# ---------------------------------------------------------------------------
# Set up Let's Encrypt SSL (optional)
# ---------------------------------------------------------------------------
if [[ "$SETUP_SSL" == "true" ]]; then
    log_info "Setting up Let's Encrypt SSL for ${DOMAIN}..."
    ssh "root@${VPS_IP}" bash << SSL_SETUP
set -euo pipefail

cd "${APP_DIR}"

# Install certbot if needed
if ! command -v certbot &> /dev/null; then
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Stop nginx temporarily to get initial certificate
docker compose -f docker-compose.prod.yml stop nginx

# Obtain certificate using standalone mode
certbot certonly --standalone \
    -d ${DOMAIN} \
    -d www.${DOMAIN} \
    --non-interactive \
    --agree-tos \
    --email admin@${DOMAIN} \
    --no-eff-email

# Copy certificates to Docker volume
docker compose -f docker-compose.prod.yml --profile ssl up -d certbot

# Restart nginx with SSL
docker compose -f docker-compose.prod.yml up -d nginx

echo "[OK] SSL certificates obtained and configured"
echo "[INFO] Remember to uncomment the SSL configuration in nginx.conf"

# Set up auto-renewal cron job
(crontab -l 2>/dev/null; echo "0 0 * * * certbot renew --quiet && docker compose -f ${APP_DIR}/docker-compose.prod.yml restart nginx") | crontab -
echo "[OK] Auto-renewal cron job configured"
SSL_SETUP
    log_success "SSL setup complete"
fi

# ---------------------------------------------------------------------------
# Deployment summary
# ---------------------------------------------------------------------------
echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo -e "  VPS IP:        ${BLUE}${VPS_IP}${NC}"
echo -e "  Domain:        ${BLUE}${DOMAIN}${NC}"
echo -e "  App Directory: ${BLUE}${APP_DIR}${NC}"
echo ""

if [[ "$SETUP_SSL" == "true" ]]; then
    echo -e "  Website:       ${BLUE}https://${DOMAIN}${NC}"
    echo -e "  Admin:         ${BLUE}https://${DOMAIN}/admin${NC}"
else
    echo -e "  Website:       ${BLUE}http://${VPS_IP}${NC}"
    echo -e "  Admin:         ${BLUE}http://${VPS_IP}/admin${NC}"
fi

echo ""
echo -e "  Useful commands (SSH into VPS first):"
echo -e "    ${YELLOW}cd ${APP_DIR}${NC}"
echo -e "    ${YELLOW}docker compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "    ${YELLOW}docker compose -f docker-compose.prod.yml ps${NC}"
echo -e "    ${YELLOW}docker compose -f docker-compose.prod.yml restart${NC}"
echo ""
