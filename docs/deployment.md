# Deployment Guide

This guide covers deploying MyBaliVilla.com in both local development and production environments.

---

## Table of Contents

1. [Local Development with Docker Compose](#local-development-with-docker-compose)
2. [Production Deployment on DigitalOcean](#production-deployment-on-digitalocean)
3. [Environment Variables Reference](#environment-variables-reference)
4. [SSL Setup with Let's Encrypt](#ssl-setup-with-lets-encrypt)
5. [Monitoring and Logs](#monitoring-and-logs)
6. [Backup Strategy](#backup-strategy)
7. [Scaling Considerations](#scaling-considerations)
8. [Troubleshooting](#troubleshooting)

---

## Local Development with Docker Compose

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 20.10 or later
- [Docker Compose](https://docs.docker.com/compose/install/) v2 or later
- At least 4 GB of available RAM (Rust compilation is memory-intensive)

### Step-by-Step

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-org/mybalivilla.com.git
   cd mybalivilla.com
   ```

2. **Start all services:**

   ```bash
   docker compose up --build
   ```

   This starts the following containers:
   - `mybalivilla-postgres` -- PostgreSQL 16 on port 5432
   - `mybalivilla-redis` -- Redis 7 on port 6379
   - `mybalivilla-api` -- Public API on port 8080
   - `mybalivilla-admin-api` -- Admin API on port 8081
   - `mybalivilla-frontend` -- Frontend on port 3000
   - `mybalivilla-admin-panel` -- Admin Panel on port 3001

3. **Wait for services to be healthy.** Docker Compose will wait for PostgreSQL and Redis health checks to pass before starting the API services. Database migrations run automatically on API startup.

4. **Access the application:**

   | Service | URL |
   |---------|-----|
   | Frontend | http://localhost:3000 |
   | Admin Panel | http://localhost:3001 |
   | Public API | http://localhost:8080/api/v1 |
   | Admin API | http://localhost:8081/api/admin |

5. **Default admin credentials:**

   ```
   Email:    admin@mybalivilla.com
   Password: admin123
   ```

6. **Stop all services:**

   ```bash
   docker compose down
   ```

   To also remove volumes (database data):

   ```bash
   docker compose down -v
   ```

### Local Environment Variables

The `docker-compose.yml` file includes default development values. No `.env` file is required for local development. The following values are baked in:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgres://mybalivilla:localdevpassword@postgres:5432/mybalivilla` |
| `REDIS_URL` | `redis://redis:6379` |
| `JWT_SECRET` | `dev-jwt-secret-change-in-production` |
| `RUST_LOG` | `info` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api/v1` |
| `NEXT_PUBLIC_ADMIN_API_URL` | `http://localhost:8081/api/admin` |

---

## Production Deployment on DigitalOcean

### VPS Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 2 GB | 4 GB |
| CPU | 1 vCPU | 2 vCPU |
| Disk | 25 GB SSD | 50 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### Step 1: Initial VPS Setup

SSH into your VPS and run the initial setup:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to the docker group
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Install additional utilities
sudo apt install -y git ufw fail2ban

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Enable fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

Log out and log back in for the Docker group change to take effect.

If there is a `setup-vps.sh` script in `infrastructure/scripts/`, you can run it instead:

```bash
chmod +x infrastructure/scripts/setup-vps.sh
./infrastructure/scripts/setup-vps.sh
```

### Step 2: Clone the Repository

```bash
git clone https://github.com/your-org/mybalivilla.com.git
cd mybalivilla.com
```

### Step 3: Create Production Environment File

Create a `.env.prod` file in the project root:

```bash
# Database
POSTGRES_DB=mybalivilla
POSTGRES_USER=mybalivilla
POSTGRES_PASSWORD=<GENERATE_A_STRONG_PASSWORD>

# Redis
REDIS_PASSWORD=<GENERATE_A_STRONG_PASSWORD>

# JWT
JWT_SECRET=<GENERATE_A_64_CHAR_RANDOM_STRING>

# Logging
RUST_LOG=info

# CORS
CORS_ORIGINS=https://mybalivilla.com,https://admin.mybalivilla.com

# Frontend URLs
NEXT_PUBLIC_API_URL=https://mybalivilla.com/api/v1
NEXT_PUBLIC_ADMIN_API_URL=https://admin.mybalivilla.com/api/admin
```

Generate secure passwords:

```bash
# Generate random passwords
openssl rand -base64 32    # for POSTGRES_PASSWORD
openssl rand -base64 32    # for REDIS_PASSWORD
openssl rand -base64 48    # for JWT_SECRET
```

**Important:** Never commit `.env.prod` to version control. Add it to `.gitignore`.

### Step 4: Domain Configuration

Point your domain DNS records to your VPS IP address:

| Type | Name | Value |
|------|------|-------|
| A | `mybalivilla.com` | `<VPS_IP>` |
| A | `admin.mybalivilla.com` | `<VPS_IP>` |
| CNAME | `www.mybalivilla.com` | `mybalivilla.com` |

Wait for DNS propagation (typically 5--30 minutes, can take up to 48 hours).

### Step 5: Deploy

```bash
# Build and start all production services
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

If there is a deployment script in `infrastructure/scripts/`:

```bash
chmod +x infrastructure/scripts/deploy-digitalocean.sh
./infrastructure/scripts/deploy-digitalocean.sh
```

### Step 6: Verify Deployment

```bash
# Check that all containers are running
docker compose -f docker-compose.prod.yml ps

# Check logs for errors
docker compose -f docker-compose.prod.yml logs --tail=50

# Test the API
curl -s http://localhost:8080/api/v1/properties/featured | head -c 200

# Test via Nginx
curl -s https://mybalivilla.com/api/v1/properties/featured | head -c 200
```

---

## SSL Setup with Let's Encrypt

The production `docker-compose.prod.yml` includes a Certbot service for automated SSL certificate management.

### Initial Certificate Issuance

1. Ensure Nginx is running with the HTTP challenge path configured:

   ```bash
   docker compose -f docker-compose.prod.yml up -d nginx
   ```

2. Request certificates:

   ```bash
   docker compose -f docker-compose.prod.yml run --rm certbot certonly \
     --webroot \
     --webroot-path=/var/www/certbot \
     -d mybalivilla.com \
     -d www.mybalivilla.com \
     -d admin.mybalivilla.com \
     --email admin@mybalivilla.com \
     --agree-tos \
     --no-eff-email
   ```

3. Reload Nginx to pick up the new certificates:

   ```bash
   docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
   ```

### Automatic Renewal

The Certbot container in the production compose file runs a renewal check every 12 hours. To enable it:

```bash
docker compose -f docker-compose.prod.yml --profile ssl up -d certbot
```

### Manual Renewal

```bash
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## Environment Variables Reference

### Backend Services (API and Admin API)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | -- | PostgreSQL connection string |
| `REDIS_URL` | Yes | -- | Redis connection string |
| `JWT_SECRET` | Yes | -- | Secret key for signing JWTs |
| `RUST_LOG` | No | `info` | Log level (`trace`, `debug`, `info`, `warn`, `error`) |
| `CORS_ORIGINS` | No | `*` | Comma-separated list of allowed CORS origins |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Full URL to the public API (e.g., `https://mybalivilla.com/api/v1`) |

### Admin Panel

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_ADMIN_API_URL` | Yes | Full URL to the admin API (e.g., `https://admin.mybalivilla.com/api/admin`) |

### PostgreSQL

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_DB` | Yes | Database name |
| `POSTGRES_USER` | Yes | Database user |
| `POSTGRES_PASSWORD` | Yes | Database password |

### Redis

| Variable | Required | Description |
|----------|----------|-------------|
| `REDIS_PASSWORD` | Yes (prod) | Redis password (not used in local dev) |

---

## Monitoring and Logs

### Viewing Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f admin-api
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f postgres

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 api
```

### Container Resource Usage

```bash
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
```

### Health Checks

```bash
# PostgreSQL
docker exec mybalivilla-postgres pg_isready -U mybalivilla

# Redis
docker exec mybalivilla-redis redis-cli -a <password> ping

# API (via curl)
curl -sf http://localhost:8080/api/v1/properties/featured > /dev/null && echo "OK" || echo "FAIL"
```

### Log Rotation

Production containers use JSON file logging with rotation configured:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "5"
```

This limits each container to 5 log files of 10 MB each (50 MB maximum per container).

### Setting Up External Monitoring (Optional)

For production monitoring, consider:

- **Uptime monitoring:** UptimeRobot, Pingdom, or BetterUptime
- **Application metrics:** Prometheus + Grafana
- **Error tracking:** Sentry
- **Log aggregation:** Grafana Loki or the ELK stack

---

## Backup Strategy

### Database Backups

#### Manual Backup

```bash
# Create a compressed backup
docker exec mybalivilla-postgres pg_dump -U mybalivilla mybalivilla | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

#### Automated Daily Backups

Create a cron job on the host:

```bash
crontab -e
```

Add the following line for daily backups at 2:00 AM:

```
0 2 * * * docker exec mybalivilla-postgres pg_dump -U mybalivilla mybalivilla | gzip > /opt/backups/mybalivilla_$(date +\%Y\%m\%d).sql.gz && find /opt/backups -name "mybalivilla_*.sql.gz" -mtime +30 -delete
```

This keeps backups for 30 days and automatically deletes older ones.

#### Restore from Backup

```bash
# Stop API services first
docker compose -f docker-compose.prod.yml stop api admin-api

# Restore
gunzip < backup_20240625_020000.sql.gz | docker exec -i mybalivilla-postgres psql -U mybalivilla mybalivilla

# Restart API services
docker compose -f docker-compose.prod.yml start api admin-api
```

### Off-Site Backup

Copy backups to an off-site location using `rsync`, `rclone`, or DigitalOcean Spaces:

```bash
# Using rclone to DigitalOcean Spaces
rclone copy /opt/backups/ do-spaces:mybalivilla-backups/
```

### Docker Volume Backup

```bash
# Backup the entire PostgreSQL data volume
docker run --rm -v mybalivilla_postgres_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/postgres_volume_$(date +%Y%m%d).tar.gz /data
```

---

## Scaling Considerations

### Vertical Scaling

The simplest approach is upgrading the VPS:

| Load Level | Recommended VPS |
|------------|-----------------|
| Low (< 1K daily users) | 2 GB / 1 vCPU |
| Medium (1K--10K daily users) | 4 GB / 2 vCPU |
| High (10K--50K daily users) | 8 GB / 4 vCPU |

### Horizontal Scaling

For higher traffic, consider:

1. **Separate database server:** Move PostgreSQL to a managed database (DigitalOcean Managed Databases) for automatic backups, scaling, and high availability.

2. **Managed Redis:** Move Redis to a managed service (DigitalOcean Managed Redis or Amazon ElastiCache).

3. **Multiple API instances:** Run multiple API containers behind Nginx using round-robin load balancing:

   ```nginx
   upstream api_backend {
       server api-1:8080;
       server api-2:8080;
       server api-3:8080;
   }
   ```

4. **CDN for static assets:** Use Cloudflare or DigitalOcean CDN for images and Next.js static files.

5. **Read replicas:** Add PostgreSQL read replicas for read-heavy traffic.

### Performance Optimization

- Enable Redis caching for frequently accessed data (featured properties, area counts).
- Add database indexes for common query patterns (already defined in migrations).
- Use `EXPLAIN ANALYZE` to identify slow queries.
- Enable Nginx response caching for public API endpoints with short TTL.
- Compress API responses with gzip/brotli at the Nginx level.

---

## Troubleshooting

### Common Issues

#### Containers fail to start

**Symptom:** API containers exit immediately after starting.

**Diagnosis:**
```bash
docker compose -f docker-compose.prod.yml logs api
```

**Common causes:**
- PostgreSQL is not ready yet. Check that the health check is passing.
- Invalid `DATABASE_URL`. Verify the connection string format.
- Missing environment variables. Ensure `.env.prod` is present and complete.

**Fix:**
```bash
# Restart with dependency ordering
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

---

#### Database connection refused

**Symptom:** `Database error: connection refused` in API logs.

**Diagnosis:**
```bash
docker exec mybalivilla-postgres pg_isready -U mybalivilla
docker compose -f docker-compose.prod.yml logs postgres
```

**Common causes:**
- PostgreSQL container is not running or still initializing.
- Incorrect credentials in `DATABASE_URL`.

**Fix:**
```bash
# Check PostgreSQL is running
docker compose -f docker-compose.prod.yml ps postgres

# Restart PostgreSQL
docker compose -f docker-compose.prod.yml restart postgres
```

---

#### Port already in use

**Symptom:** `Bind for 0.0.0.0:8080 failed: port is already allocated`.

**Fix:**
```bash
# Find what is using the port
sudo lsof -i :8080

# Stop the conflicting process or change the port mapping in docker-compose
```

---

#### Out of memory during Rust compilation

**Symptom:** Docker build fails during `cargo build` with OOM errors.

**Fix:** Ensure the VPS has at least 2 GB of RAM. Alternatively, build on a larger machine and push the images to a registry:

```bash
# Build on local machine
docker compose -f docker-compose.prod.yml build

# Push to registry
docker tag mybalivilla-api registry.example.com/mybalivilla-api:latest
docker push registry.example.com/mybalivilla-api:latest
```

---

#### SSL certificate not renewing

**Symptom:** Browser shows certificate expired warning.

**Diagnosis:**
```bash
docker compose -f docker-compose.prod.yml logs certbot
```

**Fix:**
```bash
# Manual renewal
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

#### Migration errors on startup

**Symptom:** API fails to start with `Migration error` in logs.

**Diagnosis:**
```bash
docker compose -f docker-compose.prod.yml logs api | grep -i migration
```

**Common causes:**
- Schema conflict from manual database changes.
- Corrupted migration state.

**Fix:**
```bash
# Connect to the database and check migration status
docker exec -it mybalivilla-postgres psql -U mybalivilla mybalivilla -c "SELECT * FROM _sqlx_migrations;"
```

---

### Useful Diagnostic Commands

```bash
# Check disk space
df -h

# Check memory usage
free -m

# Check running containers
docker ps

# Check container resource usage
docker stats

# Interactive shell in a container
docker exec -it mybalivilla-api /bin/sh
docker exec -it mybalivilla-postgres psql -U mybalivilla mybalivilla

# Check Nginx configuration
docker exec mybalivilla-nginx nginx -t

# Force rebuild a single service
docker compose -f docker-compose.prod.yml up -d --build --force-recreate api
```
