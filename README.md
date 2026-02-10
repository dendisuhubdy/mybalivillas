# MyBaliVilla.com

**Find Your Dream Property in Bali**

MyBaliVilla.com is a full-stack real estate property finder platform for Bali, Indonesia. It provides a public-facing property search website and a comprehensive admin dashboard for property management, built with a Rust backend and Next.js frontend.

<!-- ![MyBaliVilla.com Screenshot](docs/screenshots/homepage.png) -->

---

## Tech Stack

### Backend
![Rust](https://img.shields.io/badge/Rust-000000?style=flat&logo=rust&logoColor=white)
![Axum](https://img.shields.io/badge/Axum-0.8-orange)
![SQLx](https://img.shields.io/badge/SQLx-0.8-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)

### Frontend
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)

### Infrastructure
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white)
![DigitalOcean](https://img.shields.io/badge/DigitalOcean-0080FF?logo=digitalocean&logoColor=white)

---

## Features

- **Property Search with Advanced Filters** -- filter by type, listing type, price range, bedrooms, bathrooms, area, and free-text search
- **Multiple Listing Types** -- Buy (Sale), Long-term Rent, Short-term Rent
- **Property Types** -- Villa, House, Apartment, Land, Commercial
- **User Registration and Authentication** -- JWT-based auth with Argon2 password hashing
- **Save / Favorite Properties** -- authenticated users can bookmark properties
- **Property Inquiries** -- submit inquiries on any active listing
- **Admin Dashboard with Analytics** -- total properties, users, inquiries, views, breakdowns by type and area
- **Full Property CRUD Management** -- create, update, delete, toggle featured status
- **User and Agent Management** -- create users, assign roles, toggle active status
- **Inquiry Management** -- view, filter, and update inquiry statuses
- **Responsive Design** -- mobile-first with Tailwind CSS
- **SEO Optimized** -- server-rendered pages with Next.js 14

---

## Architecture

```
                         +-------------------+
                         |      Nginx        |
                         |  (reverse proxy)  |
                         |   :80 / :443      |
                         +---------+---------+
                                   |
                 +-----------------+-----------------+
                 |                 |                 |
        +--------v------+ +------v--------+ +------v--------+
        |   Frontend    | | Admin Panel   | |               |
        |  Next.js 14   | | Next.js 14    | |  Static/CDN   |
        |   :3000       | |   :3001       | |  (images)     |
        +--------+------+ +------+--------+ +---------------+
                 |                |
        +--------v------+ +------v--------+
        |   Public API  | |  Admin API    |
        |  Rust / Axum  | | Rust / Axum   |
        |   :8080       | |   :8081       |
        +--------+------+ +------+--------+
                 |                |
                 +-------+--------+
                         |
               +---------v----------+
               |    Shared Library  |
               | (models, auth, db) |
               +---------+----------+
                         |
              +----------+----------+
              |                     |
     +--------v------+    +--------v------+
     | PostgreSQL 16 |    |   Redis 7     |
     |   :5432       |    |   :6379       |
     +---------------+    +---------------+
```

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2+)

### Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-org/mybalivilla.com.git
   cd mybalivilla.com
   ```

2. **Start all services:**

   ```bash
   docker compose up --build
   ```

   Or use the local deployment script (if available):

   ```bash
   ./infrastructure/scripts/deploy-local.sh
   ```

3. **Access the application:**

   | Service       | URL                          |
   |---------------|------------------------------|
   | Frontend      | http://localhost:3000         |
   | Admin Panel   | http://localhost:3001         |
   | Public API    | http://localhost:8080/api/v1  |
   | Admin API     | http://localhost:8081/api/admin |

4. **Default admin credentials:**

   ```
   Email:    admin@mybalivilla.com
   Password: admin123
   ```

---

## Development Setup

### Rust Backend

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Run the public API
cd api && cargo run

# Run the admin API
cd admin-api && cargo run
```

Environment variables for backend services:

```bash
DATABASE_URL=postgres://mybalivilla:localdevpassword@localhost:5432/mybalivilla
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-jwt-secret-change-in-production
RUST_LOG=info
```

### Frontend

```bash
# Install Node.js 20+ (recommended: use nvm)
nvm install 20

# Public frontend
cd frontend
npm install
npm run dev    # starts on :3000

# Admin panel
cd admin-panel
npm install
npm run dev    # starts on :3001
```

### Database

Start PostgreSQL and Redis via Docker Compose (even if running backends natively):

```bash
docker compose up postgres redis
```

Migrations run automatically when the Rust services start (via `sqlx::migrate!`).

---

## Deployment

See [docs/deployment.md](docs/deployment.md) for full production deployment instructions including:

- DigitalOcean VPS setup
- Domain and SSL configuration with Let's Encrypt
- Environment variable reference
- Monitoring, logging, and backup strategies

---

## API Documentation

See [docs/api.md](docs/api.md) for the complete API reference with request/response examples for all endpoints.

---

## Project Structure

```
mybalivilla.com/
|-- api/                          # Public API service (Rust/Axum, port 8080)
|   |-- src/
|   |   |-- handlers/             # Request handlers (auth, properties, users)
|   |   |-- middleware/            # Auth middleware (JWT extraction)
|   |   |-- models/               # API-specific DTOs and response types
|   |   |-- routes/               # Route definitions
|   |   +-- main.rs               # Entry point
|   |-- Cargo.toml
|   +-- Dockerfile
|
|-- admin-api/                    # Admin API service (Rust/Axum, port 8081)
|   |-- src/
|   |   |-- handlers/             # Handlers (auth, properties, users, inquiries, dashboard)
|   |   |-- middleware/            # Admin auth middleware
|   |   |-- models/               # Admin DTOs (CRUD requests, dashboard stats)
|   |   |-- routes/               # Route definitions
|   |   +-- main.rs               # Entry point
|   |-- Cargo.toml
|   +-- Dockerfile
|
|-- shared/                       # Shared Rust library
|   +-- src/
|       |-- models.rs             # Domain models (Property, User, Inquiry, enums)
|       |-- db.rs                 # Database pool creation and migrations
|       |-- auth.rs               # JWT and Argon2 password utilities
|       |-- errors.rs             # AppError type with Axum response mapping
|       +-- lib.rs                # Module re-exports
|
|-- frontend/                     # Public website (Next.js 14, port 3000)
|   |-- src/
|   |   |-- app/                  # Next.js App Router pages and layouts
|   |   +-- lib/                  # API client, types, utilities
|   |-- package.json
|   +-- Dockerfile
|
|-- admin-panel/                  # Admin dashboard (Next.js 14, port 3001)
|   |-- src/
|   |   |-- components/           # Reusable UI components (Sidebar, DataTable, etc.)
|   |   +-- lib/                  # API client, types, utilities
|   |-- package.json
|   +-- Dockerfile
|
|-- migrations/                   # PostgreSQL migration files (run by SQLx)
|
|-- infrastructure/
|   |-- docker/                   # Docker-related configuration
|   |-- nginx/                    # Nginx reverse proxy config and Dockerfile
|   +-- scripts/                  # Deployment and setup scripts
|
|-- docker-compose.yml            # Local development compose
|-- docker-compose.prod.yml       # Production compose
|-- Cargo.toml                    # Rust workspace definition
|-- Cargo.lock
+-- docs/                         # Project documentation
    |-- architecture.md
    |-- api.md
    |-- deployment.md
    +-- development.md
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System architecture, database schema, auth flow |
| [API Reference](docs/api.md) | Complete API documentation with examples |
| [Deployment](docs/deployment.md) | Production deployment guide |
| [Development](docs/development.md) | Developer setup and workflow guide |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

Please ensure:
- All Rust code compiles without warnings (`cargo clippy`)
- Frontend code passes linting (`npm run lint`)
- New endpoints include documentation updates
- Database changes include migration files

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
