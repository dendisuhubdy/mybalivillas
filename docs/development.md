# Development Guide

This guide covers setting up a local development environment, project conventions, and workflows for contributing to MyBaliVilla.com.

---

## Table of Contents

1. [Setting Up the Development Environment](#setting-up-the-development-environment)
2. [Rust Backend Development](#rust-backend-development)
3. [Frontend Development](#frontend-development)
4. [Admin Panel Development](#admin-panel-development)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Code Style and Conventions](#code-style-and-conventions)
7. [Git Workflow](#git-workflow)

---

## Setting Up the Development Environment

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Docker](https://docs.docker.com/get-docker/) | 20.10+ | Container runtime |
| [Docker Compose](https://docs.docker.com/compose/) | v2+ | Multi-container orchestration |
| [Rust](https://rustup.rs/) | 1.75+ (stable) | Backend development |
| [Node.js](https://nodejs.org/) | 20+ | Frontend development |
| [npm](https://www.npmjs.com/) | 10+ | Node.js package manager |

### Option 1: Full Docker Development

The simplest way to run everything:

```bash
git clone https://github.com/your-org/mybalivilla.com.git
cd mybalivilla.com
docker compose up --build
```

This starts all services with hot-reloading disabled. To make changes, rebuild the affected service:

```bash
docker compose up --build api        # Rebuild and restart just the API
docker compose up --build frontend   # Rebuild and restart just the frontend
```

### Option 2: Hybrid Development (Recommended)

Run infrastructure in Docker, develop services natively for faster iteration:

```bash
# Start only PostgreSQL and Redis in Docker
docker compose up postgres redis

# Run backend services natively (in separate terminals)
cd api && cargo run
cd admin-api && cargo run

# Run frontend services natively (in separate terminals)
cd frontend && npm install && npm run dev
cd admin-panel && npm install && npm run dev
```

This approach gives you:
- Instant recompilation for Rust services (via `cargo run`)
- Hot module replacement for Next.js frontends
- Docker-managed database and cache

---

## Rust Backend Development

### Project Structure

The Rust workspace contains three crates:

```
Cargo.toml                   # Workspace root
|
|-- shared/                  # Shared library crate
|   +-- src/
|       |-- lib.rs           # Module exports
|       |-- models.rs        # Domain models and enums
|       |-- db.rs            # Database pool creation + migrations
|       |-- auth.rs          # JWT (jsonwebtoken) + Argon2 password hashing
|       +-- errors.rs        # AppError type with Axum IntoResponse
|
|-- api/                     # Public API binary crate
|   +-- src/
|       |-- main.rs          # Entry point, server startup
|       |-- routes/          # Route definitions (auth, properties, users)
|       |-- handlers/        # Request handler functions
|       |-- middleware/       # Auth middleware (JWT extraction)
|       +-- models/          # API-specific DTOs (requests, responses)
|
+-- admin-api/               # Admin API binary crate
    +-- src/
        |-- main.rs          # Entry point, server startup
        |-- routes/          # Route definitions (auth, properties, users, inquiries, dashboard)
        |-- handlers/        # Request handler functions
        |-- middleware/       # Admin auth middleware
        +-- models/          # Admin-specific DTOs (CRUD, dashboard stats)
```

### Key Dependencies

| Crate | Version | Purpose |
|-------|---------|---------|
| `axum` | 0.8 | Web framework |
| `tokio` | 1 | Async runtime |
| `sqlx` | 0.8 | Async PostgreSQL driver with compile-time query checking |
| `serde` / `serde_json` | 1 | Serialization/deserialization |
| `jsonwebtoken` | 9 | JWT creation and verification |
| `argon2` | 0.5 | Password hashing |
| `validator` | 0.19 | Input validation with derive macros |
| `uuid` | 1 | UUID generation and parsing |
| `chrono` | 0.4 | Date and time handling |
| `rust_decimal` | 1 | Precise decimal arithmetic for prices |
| `tower-http` | 0.6 | CORS and tracing middleware |
| `tracing` | 0.1 | Structured logging |

### Adding a New Endpoint

Follow these steps to add a new endpoint to the public API (the process is identical for the admin API):

1. **Define the request/response types** in `api/src/models/mod.rs`:

   ```rust
   #[derive(Debug, Deserialize, Validate)]
   pub struct MyNewRequest {
       #[validate(length(min = 1, message = "Field is required"))]
       pub name: String,
   }

   #[derive(Debug, Serialize)]
   pub struct MyNewResponse {
       pub id: Uuid,
       pub name: String,
   }
   ```

2. **Create the handler function** in the appropriate file under `api/src/handlers/`:

   ```rust
   /// POST /api/v1/things
   pub async fn create_thing(
       State(state): State<Arc<AppState>>,
       RequireAuth(claims): RequireAuth,   // if auth is required
       Json(payload): Json<MyNewRequest>,
   ) -> Result<Json<ApiResponse<MyNewResponse>>, AppError> {
       payload
           .validate()
           .map_err(|e| AppError::BadRequest(format!("Validation error: {e}")))?;

       // Database operation...
       let result = sqlx::query_as::<_, MyNewResponse>(
           "INSERT INTO things (id, name) VALUES ($1, $2) RETURNING *"
       )
       .bind(Uuid::new_v4())
       .bind(&payload.name)
       .fetch_one(&state.pool)
       .await?;

       Ok(Json(ApiResponse::success(result)))
   }
   ```

3. **Register the route** in the appropriate file under `api/src/routes/`:

   ```rust
   use axum::routing::post;

   pub fn routes() -> Router<Arc<AppState>> {
       Router::new()
           .route("/", post(handlers::things::create_thing))
   }
   ```

4. **Nest the route group** in `api/src/routes/mod.rs`:

   ```rust
   .nest("/things", things::routes())
   ```

### Database Migrations

Migrations are stored in the `migrations/` directory at the workspace root and run automatically on service startup via `sqlx::migrate!("../migrations")` in `shared/src/db.rs`.

#### Creating a New Migration

```bash
# Install sqlx-cli if not already installed
cargo install sqlx-cli --no-default-features --features postgres

# Create a new migration
sqlx migrate add create_my_table
```

This creates a file in `migrations/` with a timestamp prefix. Edit it with your SQL:

```sql
-- migrations/20240625120000_create_my_table.sql

CREATE TABLE my_table (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_my_table_name ON my_table(name);
```

Migrations run automatically the next time an API service starts. To run them manually:

```bash
export DATABASE_URL=postgres://mybalivilla:localdevpassword@localhost:5432/mybalivilla
sqlx migrate run
```

#### Reverting a Migration

SQLx does not support down migrations by default. To revert, create a new migration that undoes the changes:

```bash
sqlx migrate add revert_my_table
```

```sql
DROP TABLE IF EXISTS my_table;
```

### Running Tests

```bash
# Run all workspace tests
cargo test

# Run tests for a specific crate
cargo test -p shared
cargo test -p api
cargo test -p admin-api

# Run tests with output
cargo test -- --nocapture

# Run a specific test
cargo test test_password_hash_and_verify
```

The shared crate includes unit tests for JWT and password hashing:

```bash
cargo test -p shared
```

### Building for Release

```bash
cargo build --release
```

The optimized binaries are output to `target/release/api` and `target/release/admin-api`.

---

## Frontend Development

### Project Structure

```
frontend/
|-- src/
|   |-- app/                 # Next.js App Router
|   |   |-- layout.tsx       # Root layout (HTML, fonts, global providers)
|   |   |-- globals.css      # Global styles (Tailwind directives)
|   |   +-- page.tsx         # Homepage
|   +-- lib/
|       |-- api.ts           # API client (fetch wrapper)
|       |-- types.ts         # TypeScript type definitions
|       +-- utils.ts         # Utility functions
|
|-- public/                  # Static assets
|-- package.json
|-- tsconfig.json
|-- tailwind.config.ts       # Tailwind CSS configuration
|-- next.config.js           # Next.js configuration
+-- Dockerfile
```

### Running the Frontend

```bash
cd frontend
npm install
npm run dev      # Starts dev server on http://localhost:3000
```

### Adding New Pages

Next.js 14 uses the App Router. To add a new page, create a directory under `src/app/`:

```
src/app/
+-- properties/
    |-- page.tsx             # /properties
    +-- [slug]/
        +-- page.tsx         # /properties/:slug
```

Example page component:

```tsx
// src/app/properties/page.tsx
import { getProperties } from '@/lib/api';

export default async function PropertiesPage() {
  const data = await getProperties();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Properties</h1>
      {/* Render property cards */}
    </div>
  );
}
```

### Adding New Components

Place reusable components in `src/components/`:

```tsx
// src/components/PropertyCard.tsx
interface PropertyCardProps {
  title: string;
  price: string;
  area: string;
  thumbnail: string | null;
}

export default function PropertyCard({ title, price, area, thumbnail }: PropertyCardProps) {
  return (
    <div className="rounded-lg shadow-md overflow-hidden bg-white">
      {thumbnail && (
        <img src={thumbnail} alt={title} className="w-full h-48 object-cover" />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-gray-600">{area}</p>
        <p className="text-blue-600 font-bold">{price}</p>
      </div>
    </div>
  );
}
```

### API Integration

The API client is in `src/lib/api.ts`. It wraps `fetch` calls to the public API:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getProperties(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API_URL}/properties${query}`);
  const json = await res.json();
  return json.data;
}

export async function getProperty(slug: string) {
  const res = await fetch(`${API_URL}/properties/${slug}`);
  const json = await res.json();
  return json.data;
}
```

### Styling with Tailwind CSS

The project uses Tailwind CSS 3.4. Configuration is in `tailwind.config.ts`.

Key conventions:
- Use utility classes directly in JSX
- Extract repeated patterns into components, not CSS classes
- Use `clsx` for conditional class names:

  ```tsx
  import clsx from 'clsx';

  <button className={clsx(
    'px-4 py-2 rounded font-medium',
    isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
  )}>
    {label}
  </button>
  ```

### Building for Production

```bash
npm run build    # Creates optimized production build
npm run start    # Starts production server
```

### Linting

```bash
npm run lint     # Run ESLint
```

---

## Admin Panel Development

### Project Structure

```
admin-panel/
|-- src/
|   |-- app/                 # Next.js App Router (admin pages)
|   |-- components/          # Reusable admin UI components
|   |   |-- Sidebar.tsx      # Navigation sidebar
|   |   |-- StatsCard.tsx    # Dashboard statistics card
|   |   |-- DataTable.tsx    # Generic data table with sorting
|   |   |-- Modal.tsx        # Modal dialog component
|   |   +-- Pagination.tsx   # Pagination controls
|   +-- lib/
|       |-- api.ts           # Admin API client
|       |-- types.ts         # TypeScript type definitions
|       +-- utils.ts         # Utility functions
|
|-- package.json
+-- Dockerfile
```

### Running the Admin Panel

```bash
cd admin-panel
npm install
npm run dev      # Starts dev server on http://localhost:3001
```

### API Client

The admin panel uses a similar API client in `src/lib/api.ts`, but targets the admin API:

```typescript
const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL;

export async function adminFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${ADMIN_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  return res.json();
}
```

### Using Admin Components

The admin panel includes several reusable components:

- **`Sidebar`** -- Navigation sidebar with menu items for Properties, Users, Inquiries, Dashboard.
- **`StatsCard`** -- Displays a single statistic with label, value, and optional icon.
- **`DataTable`** -- Generic table component with column definitions and row data.
- **`Modal`** -- Dialog component for create/edit forms and confirmations.
- **`Pagination`** -- Page navigation controls with previous/next and page numbers.

---

## Environment Variables Reference

### Backend (.env or exported)

| Variable | Default (dev) | Description |
|----------|---------------|-------------|
| `DATABASE_URL` | `postgres://mybalivilla:localdevpassword@localhost:5432/mybalivilla` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `JWT_SECRET` | `dev-jwt-secret-change-in-production` | JWT signing secret |
| `RUST_LOG` | `info` | Log level filter |
| `CORS_ORIGINS` | `*` | Allowed CORS origins (comma-separated) |

### Frontend (`frontend/.env.local`)

| Variable | Default (dev) | Description |
|----------|---------------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api/v1` | Public API base URL |

### Admin Panel (`admin-panel/.env.local`)

| Variable | Default (dev) | Description |
|----------|---------------|-------------|
| `NEXT_PUBLIC_ADMIN_API_URL` | `http://localhost:8081/api/admin` | Admin API base URL |

### AI Image Generation

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | (none) | Google Gemini API key for image generation |

#### Generating Property Images

```bash
export GEMINI_API_KEY=your-api-key
python3 scripts/generate_images.py
```

This generates 20 property images to `frontend/public/images/properties/`. Images that already exist (>1KB) are skipped.

#### Generating Area Images

```bash
export GEMINI_API_KEY=your-api-key
python3 scripts/generate_area_images.py
```

This generates 8 area images (Seminyak, Canggu, Ubud, etc.) to `frontend/public/images/areas/`. Both scripts use the Gemini Nano Banana Pro model with a 3-second rate limit between requests.

---

## Code Style and Conventions

### Rust

- **Edition:** 2021
- **Formatting:** Use `cargo fmt` before committing. The project follows default `rustfmt` settings.
- **Linting:** Run `cargo clippy` and address all warnings.
- **Error handling:** Use the `AppError` enum from the shared crate. Convert external errors with `From` implementations or `.map_err()`.
- **Naming:**
  - Types: `PascalCase` (e.g., `PropertyResponse`, `CreateUserRequest`)
  - Functions: `snake_case` (e.g., `list_properties`, `create_token`)
  - Constants: `SCREAMING_SNAKE_CASE`
- **Handler pattern:** Each handler is an `async fn` that takes Axum extractors and returns `Result<Json<ApiResponse<T>>, AppError>`.
- **Validation:** Use the `validator` crate with `#[derive(Validate)]` on request DTOs. Validate in handlers before database operations.
- **Database queries:** Use `sqlx::query_as` with raw SQL. Dynamic queries use sequential `.bind()` calls.
- **Documentation:** Add `///` doc comments to all public functions and types.

### TypeScript / React

- **Framework:** Next.js 14 with App Router (React Server Components by default).
- **Formatting:** Follow ESLint rules from `eslint-config-next`.
- **Naming:**
  - Components: `PascalCase` files and exports (e.g., `PropertyCard.tsx`)
  - Utilities: `camelCase` functions and files (e.g., `formatPrice()`)
  - Types: `PascalCase` interfaces (e.g., `Property`, `UserResponse`)
- **Styling:** Tailwind CSS utility classes. No custom CSS unless absolutely necessary.
- **State management:** React built-in state (`useState`, `useReducer`) and server-side data fetching.
- **Notifications:** Use `react-hot-toast` for user-facing messages.
- **Icons:** Use `@heroicons/react` for all icons.

### General

- **Commits:** Clear, concise commit messages. Use present tense ("Add property filter" not "Added property filter").
- **File organization:** Keep related code together. One handler per resource, one route file per resource.
- **No dead code:** Remove unused imports, variables, and functions before committing.
- **Environment variables:** Never hardcode secrets. Always use environment variables.

---

## Git Workflow

### Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code. All merges require review. |
| `develop` | Integration branch for features. |
| `feature/<name>` | New features (e.g., `feature/property-map-view`). |
| `fix/<name>` | Bug fixes (e.g., `fix/inquiry-validation`). |
| `chore/<name>` | Non-functional changes (e.g., `chore/update-dependencies`). |

### Workflow

1. **Create a branch from `develop`:**

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```

2. **Make changes and commit:**

   ```bash
   # Check for issues
   cargo fmt
   cargo clippy
   cargo test
   cd frontend && npm run lint

   # Commit
   git add -A
   git commit -m "Add property map view with Leaflet integration"
   ```

3. **Push and create a pull request:**

   ```bash
   git push origin feature/my-feature
   ```

   Open a pull request targeting `develop` on GitHub.

4. **Code review:** At least one approval is required before merging.

5. **Merge:** Use squash merge to keep the history clean.

### Pre-Commit Checklist

Before opening a PR, verify:

- [ ] `cargo fmt` -- code is formatted
- [ ] `cargo clippy` -- no warnings
- [ ] `cargo test` -- all tests pass
- [ ] `npm run lint` (frontend and admin-panel) -- no lint errors
- [ ] `docker compose up --build` -- everything starts cleanly
- [ ] New endpoints are documented in `docs/api.md`
- [ ] Database changes include migration files
- [ ] Environment variable changes are documented
- [ ] No secrets or credentials in committed code
