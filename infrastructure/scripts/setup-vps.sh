#!/usr/bin/env bash
# =============================================================================
# MyBaliVilla.com - Initial VPS Setup Script
#
# Run this script on a fresh DigitalOcean Ubuntu 22.04+ VPS to prepare it
# for hosting the MyBaliVilla application.
#
# Usage:
#   ssh root@<VPS_IP> 'bash -s' < infrastructure/scripts/setup-vps.sh
#   # Or copy to VPS and run directly:
#   scp infrastructure/scripts/setup-vps.sh root@<VPS_IP>:/root/
#   ssh root@<VPS_IP> 'bash /root/setup-vps.sh'
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
APP_USER="mybalivilla"
APP_DIR="/opt/mybalivilla"
SWAP_SIZE="2G"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo ""
echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  MyBaliVilla.com - VPS Initial Setup${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# ---------------------------------------------------------------------------
# Step 1: Update system packages
# ---------------------------------------------------------------------------
log_info "Updating system packages..."
apt-get update
apt-get upgrade -y
apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    htop \
    ufw \
    gnupg \
    ca-certificates \
    lsb-release \
    software-properties-common
log_success "System packages updated"

# ---------------------------------------------------------------------------
# Step 2: Install Docker
# ---------------------------------------------------------------------------
log_info "Installing Docker..."

if command -v docker &> /dev/null; then
    log_warn "Docker is already installed: $(docker --version)"
else
    # Add Docker official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Set up Docker repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
        tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine and Compose plugin
    apt-get update
    apt-get install -y \
        docker-ce \
        docker-ce-cli \
        containerd.io \
        docker-buildx-plugin \
        docker-compose-plugin

    # Enable and start Docker
    systemctl enable docker
    systemctl start docker

    log_success "Docker installed: $(docker --version)"
    log_success "Docker Compose installed: $(docker compose version)"
fi

# ---------------------------------------------------------------------------
# Step 3: Create application user
# ---------------------------------------------------------------------------
log_info "Creating application user: ${APP_USER}..."

if id "${APP_USER}" &>/dev/null; then
    log_warn "User ${APP_USER} already exists"
else
    useradd -m -s /bin/bash "${APP_USER}"
    log_success "User ${APP_USER} created"
fi

# Add user to docker group so they can run Docker commands
usermod -aG docker "${APP_USER}"
log_success "User ${APP_USER} added to docker group"

# ---------------------------------------------------------------------------
# Step 4: Create project directory
# ---------------------------------------------------------------------------
log_info "Creating project directory: ${APP_DIR}..."
mkdir -p "${APP_DIR}"
chown "${APP_USER}:${APP_USER}" "${APP_DIR}"
log_success "Project directory created"

# ---------------------------------------------------------------------------
# Step 5: Set up firewall (UFW)
# ---------------------------------------------------------------------------
log_info "Configuring UFW firewall..."

# Reset to defaults
ufw --force reset

# Set default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (critical - must be before enabling)
ufw allow 22/tcp comment "SSH"

# Allow HTTP and HTTPS
ufw allow 80/tcp comment "HTTP"
ufw allow 443/tcp comment "HTTPS"

# Enable firewall
ufw --force enable

log_success "Firewall enabled with rules: SSH (22), HTTP (80), HTTPS (443)"
ufw status verbose

# ---------------------------------------------------------------------------
# Step 6: Set up swap space
# ---------------------------------------------------------------------------
log_info "Setting up ${SWAP_SIZE} swap space..."

if swapon --show | grep -q "/swapfile"; then
    log_warn "Swap is already configured"
else
    # Create swap file
    fallocate -l "${SWAP_SIZE}" /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile

    # Make swap permanent
    if ! grep -q "/swapfile" /etc/fstab; then
        echo "/swapfile none swap sw 0 0" >> /etc/fstab
    fi

    # Configure swappiness (low value = less swapping, better for servers)
    sysctl vm.swappiness=10
    if ! grep -q "vm.swappiness" /etc/sysctl.conf; then
        echo "vm.swappiness=10" >> /etc/sysctl.conf
    fi

    # Configure cache pressure
    sysctl vm.vfs_cache_pressure=50
    if ! grep -q "vm.vfs_cache_pressure" /etc/sysctl.conf; then
        echo "vm.vfs_cache_pressure=50" >> /etc/sysctl.conf
    fi

    log_success "${SWAP_SIZE} swap space configured"
fi

# ---------------------------------------------------------------------------
# Step 7: Install and configure fail2ban
# ---------------------------------------------------------------------------
log_info "Installing fail2ban..."

apt-get install -y fail2ban

# Create fail2ban local configuration
cat > /etc/fail2ban/jail.local << 'FAIL2BAN'
[DEFAULT]
# Ban for 1 hour
bantime = 3600
# Find failures in the last 10 minutes
findtime = 600
# Allow 5 retries before ban
maxretry = 5
# Use systemd backend
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200
FAIL2BAN

# Enable and start fail2ban
systemctl enable fail2ban
systemctl restart fail2ban

log_success "fail2ban installed and configured"

# ---------------------------------------------------------------------------
# Step 8: Configure system limits and security
# ---------------------------------------------------------------------------
log_info "Configuring system limits..."

# Increase file descriptor limits for Docker
cat > /etc/security/limits.d/docker.conf << 'LIMITS'
* soft nofile 65536
* hard nofile 65536
root soft nofile 65536
root hard nofile 65536
LIMITS

# Disable root password login (SSH key only)
# Only if authorized_keys exist to prevent lockout
if [[ -f /root/.ssh/authorized_keys ]] && [[ -s /root/.ssh/authorized_keys ]]; then
    sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
    sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
    systemctl restart sshd
    log_success "SSH hardened: root login with password disabled"
else
    log_warn "No SSH authorized_keys found. Skipping SSH hardening to prevent lockout."
    log_warn "Add your SSH key and run: sed -i 's/PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config"
fi

# ---------------------------------------------------------------------------
# Step 9: Set up automatic security updates
# ---------------------------------------------------------------------------
log_info "Setting up unattended security upgrades..."
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
log_success "Automatic security updates configured"

# ---------------------------------------------------------------------------
# Step 10: Clean up
# ---------------------------------------------------------------------------
log_info "Cleaning up..."
apt-get autoremove -y
apt-get autoclean -y
log_success "Cleanup complete"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  VPS Setup Complete!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo -e "  App User:      ${BLUE}${APP_USER}${NC}"
echo -e "  App Directory: ${BLUE}${APP_DIR}${NC}"
echo -e "  Swap:          ${BLUE}${SWAP_SIZE}${NC}"
echo -e "  Firewall:      ${BLUE}SSH (22), HTTP (80), HTTPS (443)${NC}"
echo -e "  fail2ban:      ${BLUE}Active (SSH protection)${NC}"
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo -e "  1. Clone your repo to ${APP_DIR}"
echo -e "  2. Copy .env.example to .env.prod and configure"
echo -e "  3. Run deploy-digitalocean.sh to deploy"
echo ""
echo -e "  ${YELLOW}Or run the deploy script from your local machine:${NC}"
echo -e "  ./infrastructure/scripts/deploy-digitalocean.sh <VPS_IP>"
echo ""
