# Architecture

This document describes the system architecture of MyBaliVilla.com, including service interactions, database schema, authentication flow, and request routing.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Service Architecture Diagram](#service-architecture-diagram)
3. [Service Descriptions](#service-descriptions)
4. [Database Schema](#database-schema)
5. [Authentication Flow](#authentication-flow)
6. [Request Flow](#request-flow)
7. [Data Flow Diagrams](#data-flow-diagrams)

---

## System Overview

MyBaliVilla.com follows a multi-service architecture with clear separation between the public-facing API and the admin API. Both backend services share a common Rust library for models, database access, authentication, and error handling. Two independent Next.js applications serve the public website and admin dashboard, respectively.

All services are containerized with Docker and orchestrated via Docker Compose. In production, Nginx acts as the single entry point, terminating TLS and reverse-proxying requests to the appropriate service.

---

## Service Architecture Diagram

```
                              Internet
                                 |
                                 v
                    +----------------------------+
                    |          Nginx             |
                    |   (reverse proxy + TLS)    |
                    |     ports 80 / 443         |
                    +------+------+------+-------+
                           |      |      |
            +--------------+  +---+  +---+-----------+
            |                 |      |                |
   +--------v-------+ +------v------v--+ +-----------v----------+
   |    Frontend     | |    Public API   | |     Admin Panel      |
   |   Next.js 14    | |  Rust / Axum   | |     Next.js 14       |
   |   port 3000     | |  port 8080     | |     port 3001        |
   |                 | |                 | |                      |
   | - Property      | | - /api/v1/auth | | - Property CRUD      |
   |   search & list | | - /api/v1/     | | - User management    |
   | - Detail pages  | |   properties   | | - Inquiry management |
   | - User auth     | | - /api/v1/     | | - Dashboard stats    |
   | - Saved props   | |   users        | |                      |
   +--------+--------+ +-------+--------+ +----------+-----------+
            |                   |                     |
            |                   |          +----------v-----------+
            |                   |          |      Admin API       |
            |                   |          |    Rust / Axum       |
            |                   |          |    port 8081         |
            |                   |          |                      |
            |                   |          | - /api/admin/auth    |
            |                   |          | - /api/admin/        |
            |                   |          |   properties         |
            |                   |          | - /api/admin/users   |
            |                   |          | - /api/admin/        |
            |                   |          |   inquiries          |
            |                   |          | - /api/admin/        |
            |                   |          |   dashboard          |
            |                   |          +----------+-----------+
            |                   |                     |
            |                   +----------+----------+
            |                              |
            |                   +----------v----------+
            |                   |   Shared Library    |
            |                   |  (shared crate)     |
            |                   |                     |
            |                   | - models.rs         |
            |                   | - db.rs             |
            |                   | - auth.rs           |
            |                   | - errors.rs         |
            |                   +----------+----------+
            |                              |
            |               +--------------+--------------+
            |               |                             |
            |      +--------v--------+           +--------v--------+
            |      |  PostgreSQL 16  |           |    Redis 7      |
            |      |   port 5432     |           |   port 6379     |
            |      |                 |           |                 |
            |      | - properties    |           | - Response      |
            |      | - users         |           |   caching       |
            |      | - inquiries     |           | - Session       |
            |      | - saved_props   |           |   storage       |
            |      +-----------------+           +-----------------+
            |
            +-- (calls Public API via NEXT_PUBLIC_API_URL)
```

---

## Service Descriptions

| Service | Technology | Port | Purpose |
|---------|-----------|------|---------|
| **Public API** | Rust, Axum 0.8, SQLx 0.8 | 8080 | Serves the public REST API for property search, user authentication, user profiles, saved properties, and inquiry submission. |
| **Admin API** | Rust, Axum 0.8, SQLx 0.8 | 8081 | Serves the admin REST API for property CRUD, user management, inquiry management, and dashboard statistics. Requires admin-level JWT. |
| **Shared Library** | Rust crate | N/A | Contains domain models (`Property`, `User`, `Inquiry`, `SavedProperty`), enum types, database pool initialization with auto-migration, JWT/Argon2 auth utilities, and a unified `AppError` type. |
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS | 3000 | Public-facing website with property search, listing pages, detail pages, user registration/login, and saved properties. |
| **Admin Panel** | Next.js 14, React 18, TypeScript, Tailwind CSS | 3001 | Admin dashboard with analytics overview, property management, user management, and inquiry management. |
| **PostgreSQL** | PostgreSQL 16 (Alpine) | 5432 | Primary relational database storing all application data. |
| **Redis** | Redis 7 (Alpine) | 6379 | Caching layer and session storage. |
| **Nginx** | Nginx (Alpine) | 80, 443 | Reverse proxy handling TLS termination, routing, and static asset serving in production. |

---

## Database Schema

### Entity Relationship Diagram

```
+--------------------+       +--------------------+       +--------------------+
|      users         |       |    properties      |       |     inquiries      |
+--------------------+       +--------------------+       +--------------------+
| id          (PK)   |<------| owner_id     (FK)  |   +-->| id          (PK)   |
| email       (UQ)   |   +---| agent_id     (FK)  |   |   | property_id (FK)---+-->properties.id
| password_hash      |   |   | id          (PK)   |   |   | user_id     (FK)---+-->users.id
| full_name          |   |   | title              |   |   | name               |
| phone              |   |   | slug        (UQ)   |   |   | email              |
| avatar             |   |   | description        |   |   | phone              |
| role               |   |   | property_type      |   |   | message            |
| is_active          |   |   | listing_type       |   |   | status             |
| created_at         |   |   | price              |   |   | created_at         |
| updated_at         |   |   | price_currency     |   |   +--------------------+
+--------------------+   |   | price_period       |
         |               |   | bedrooms           |
         |               |   | bathrooms          |
         |               |   | land_size          |
         |               |   | building_size      |
         +               |   | location           |
+--------------------+   |   | area               |
| saved_properties   |   |   | latitude           |
+--------------------+   |   | longitude          |
| id          (PK)   |   |   | address            |
| user_id     (FK)---+-->|   | features    (JSON) |
| property_id (FK)---+--->   | images      (JSON) |
| created_at         |       | thumbnail          |
+--------------------+       | is_featured        |
  UQ(user_id,                | is_active          |
     property_id)            | views_count        |
                             | created_at         |
                             | updated_at         |
                             +--------------------+
```

### Tables

#### `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY | Unique identifier |
| `email` | `VARCHAR` | UNIQUE, NOT NULL | Login email |
| `password_hash` | `VARCHAR` | NOT NULL | Argon2id hash |
| `full_name` | `VARCHAR` | NOT NULL | Display name |
| `phone` | `VARCHAR` | NULLABLE | Contact phone |
| `avatar` | `VARCHAR` | NULLABLE | Avatar URL |
| `role` | `user_role` | NOT NULL | `admin`, `agent`, or `user` |
| `is_active` | `BOOLEAN` | NOT NULL, DEFAULT true | Account status |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Last update timestamp |

#### `properties`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY | Unique identifier |
| `title` | `VARCHAR` | NOT NULL | Property title |
| `slug` | `VARCHAR` | UNIQUE, NOT NULL | URL-friendly slug |
| `description` | `TEXT` | NOT NULL | Full description |
| `property_type` | `property_type` | NOT NULL | `villa`, `house`, `apartment`, `land`, `commercial` |
| `listing_type` | `listing_type` | NOT NULL | `sale`, `long_term_rent`, `short_term_rent` |
| `price` | `DECIMAL` | NOT NULL | Listing price |
| `price_currency` | `VARCHAR` | NOT NULL | Currency code (e.g., `USD`, `IDR`) |
| `price_period` | `price_period` | NULLABLE | `per_night`, `per_week`, `per_month`, `per_year` |
| `bedrooms` | `INTEGER` | NULLABLE | Number of bedrooms |
| `bathrooms` | `INTEGER` | NULLABLE | Number of bathrooms |
| `land_size` | `DOUBLE` | NULLABLE | Land size in sqm |
| `building_size` | `DOUBLE` | NULLABLE | Building size in sqm |
| `location` | `VARCHAR` | NOT NULL | Location name |
| `area` | `VARCHAR` | NOT NULL | Area/region (e.g., Seminyak, Canggu) |
| `latitude` | `DOUBLE` | NULLABLE | GPS latitude |
| `longitude` | `DOUBLE` | NULLABLE | GPS longitude |
| `address` | `VARCHAR` | NULLABLE | Full street address |
| `features` | `JSONB` | NOT NULL | Array of feature strings |
| `images` | `JSONB` | NOT NULL | Array of image URLs |
| `thumbnail` | `VARCHAR` | NULLABLE | Thumbnail image URL |
| `is_featured` | `BOOLEAN` | NOT NULL, DEFAULT false | Featured flag |
| `is_active` | `BOOLEAN` | NOT NULL, DEFAULT true | Active/published flag |
| `views_count` | `INTEGER` | NOT NULL, DEFAULT 0 | View counter |
| `owner_id` | `UUID` | FK -> users.id | Property owner |
| `agent_id` | `UUID` | NULLABLE, FK -> users.id | Assigned agent |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Last update timestamp |

#### `inquiries`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY | Unique identifier |
| `property_id` | `UUID` | FK -> properties.id | Property being inquired about |
| `user_id` | `UUID` | NULLABLE, FK -> users.id | Logged-in user (if any) |
| `name` | `VARCHAR` | NOT NULL | Contact name |
| `email` | `VARCHAR` | NOT NULL | Contact email |
| `phone` | `VARCHAR` | NULLABLE | Contact phone |
| `message` | `TEXT` | NOT NULL | Inquiry message |
| `status` | `inquiry_status` | NOT NULL, DEFAULT 'new' | `new`, `read`, `replied`, `closed` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Submission timestamp |

#### `saved_properties`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY | Unique identifier |
| `user_id` | `UUID` | FK -> users.id | User who saved the property |
| `property_id` | `UUID` | FK -> properties.id | Saved property |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Saved timestamp |

**Unique constraint:** `(user_id, property_id)` -- a user can save a property only once.

### Custom PostgreSQL Enum Types

| Enum | Values |
|------|--------|
| `property_type` | `villa`, `house`, `apartment`, `land`, `commercial` |
| `listing_type` | `sale`, `long_term_rent`, `short_term_rent` |
| `price_period` | `per_night`, `per_week`, `per_month`, `per_year` |
| `user_role` | `admin`, `agent`, `user` |
| `inquiry_status` | `new`, `read`, `replied`, `closed` |

### Key Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| `users` | Unique | `email` | Fast lookup by email, enforce uniqueness |
| `properties` | Unique | `slug` | Fast lookup by slug, enforce uniqueness |
| `properties` | B-tree | `property_type` | Filter by property type |
| `properties` | B-tree | `listing_type` | Filter by listing type |
| `properties` | B-tree | `area` | Filter by area |
| `properties` | B-tree | `is_active, is_featured` | Featured property queries |
| `properties` | B-tree | `price` | Price range queries |
| `properties` | B-tree | `created_at` | Sort by newest |
| `saved_properties` | Unique | `(user_id, property_id)` | Prevent duplicate saves |
| `inquiries` | B-tree | `property_id` | List inquiries for a property |
| `inquiries` | B-tree | `status` | Filter by inquiry status |

---

## Authentication Flow

Authentication uses JSON Web Tokens (JWT) with Argon2id password hashing.

### Registration Flow

```
Client                   Public API              PostgreSQL
  |                          |                       |
  |  POST /api/v1/auth/     |                       |
  |       register           |                       |
  |  {email, password,       |                       |
  |   full_name}             |                       |
  |------------------------->|                       |
  |                          |  Check email unique   |
  |                          |---------------------->|
  |                          |<----------------------|
  |                          |                       |
  |                          |  Hash password        |
  |                          |  (Argon2id)           |
  |                          |                       |
  |                          |  INSERT user          |
  |                          |---------------------->|
  |                          |<----------------------|
  |                          |                       |
  |                          |  Create JWT           |
  |                          |  (24h expiry)         |
  |                          |                       |
  |  {token, user}           |                       |
  |<-------------------------|                       |
```

### Login Flow

```
Client                   Public API              PostgreSQL
  |                          |                       |
  |  POST /api/v1/auth/     |                       |
  |       login              |                       |
  |  {email, password}       |                       |
  |------------------------->|                       |
  |                          |  SELECT user by email |
  |                          |---------------------->|
  |                          |<----------------------|
  |                          |                       |
  |                          |  Verify password      |
  |                          |  (Argon2id)           |
  |                          |                       |
  |                          |  Create JWT           |
  |                          |  (24h expiry)         |
  |                          |                       |
  |  {token, user}           |                       |
  |<-------------------------|                       |
```

### JWT Structure

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "user",
  "exp": 1700000000
}
```

| Claim | Description |
|-------|-------------|
| `sub` | User UUID |
| `email` | User email address |
| `role` | User role (`admin`, `agent`, `user`) |
| `exp` | Expiration timestamp (24 hours from creation) |

### Auth Middleware Behavior

The public API uses a layered auth middleware that:

1. **Extracts** the `Authorization: Bearer <token>` header if present.
2. **Verifies** the JWT signature and expiration.
3. **Injects** the `Claims` struct into request extensions.
4. **Does not reject** unauthenticated requests at this layer -- individual handlers use extractors.

Two extractors are available to handlers:

| Extractor | Behavior |
|-----------|----------|
| `RequireAuth(claims)` | Returns 401 if no valid JWT is present. Used for profile, saved properties. |
| `OptionalAuth(claims)` | Returns `None` if no JWT. Used for inquiries (to optionally link the logged-in user). |

The admin API applies the same pattern but all handlers require `RequireAuth` with an additional check that `role == Admin`.

---

## Request Flow

### Production Request Flow (through Nginx)

```
Browser Request
      |
      v
+------------------+
|     Nginx        |
| (TLS termination)|
+--------+---------+
         |
         |  Match by hostname / path:
         |
         |  mybalivilla.com/*             --> frontend:3000
         |  mybalivilla.com/api/v1/*      --> api:8080
         |  admin.mybalivilla.com/*       --> admin-panel:3001
         |  admin.mybalivilla.com/api/*   --> admin-api:8081
         |
         +-------> Upstream Service
                         |
                         v
                  +------+------+
                  | PostgreSQL  |
                  | Redis       |
                  +-------------+
```

### Local Development Request Flow

In local development, services are accessed directly on their respective ports without Nginx:

```
Browser / curl
      |
      +--- http://localhost:3000        --> Frontend (Next.js)
      +--- http://localhost:3001        --> Admin Panel (Next.js)
      +--- http://localhost:8080/api/v1 --> Public API (Rust/Axum)
      +--- http://localhost:8081/api/admin --> Admin API (Rust/Axum)
```

---

## Data Flow Diagrams

### Property Search Flow

```
User (Browser)             Frontend (Next.js)         Public API (Axum)         PostgreSQL
     |                          |                          |                       |
     | Search "villa canggu"    |                          |                       |
     |------------------------->|                          |                       |
     |                          | GET /api/v1/properties   |                       |
     |                          | ?search=villa+canggu     |                       |
     |                          | &property_type=villa     |                       |
     |                          | &page=1&per_page=12      |                       |
     |                          |------------------------->|                       |
     |                          |                          | Build dynamic SQL     |
     |                          |                          | with WHERE clauses    |
     |                          |                          |                       |
     |                          |                          | COUNT(*) query        |
     |                          |                          |---------------------->|
     |                          |                          |<----------------------|
     |                          |                          |                       |
     |                          |                          | SELECT with OFFSET/   |
     |                          |                          | LIMIT                 |
     |                          |                          |---------------------->|
     |                          |                          |<----------------------|
     |                          |                          |                       |
     |                          | {items, total, page,     |                       |
     |                          |  per_page, total_pages}  |                       |
     |                          |<-------------------------|                       |
     |                          |                          |                       |
     | Rendered property grid   |                          |                       |
     |<-------------------------|                          |                       |
```

### Inquiry Submission Flow

```
User (Browser)       Frontend        Public API         PostgreSQL
     |                  |                |                   |
     | Fill inquiry     |                |                   |
     | form             |                |                   |
     |----------------->|                |                   |
     |                  | POST /api/v1/  |                   |
     |                  | properties/    |                   |
     |                  | {id}/inquire   |                   |
     |                  | {name, email,  |                   |
     |                  |  phone, msg}   |                   |
     |                  |--------------->|                   |
     |                  |                | Validate input    |
     |                  |                |                   |
     |                  |                | Verify property   |
     |                  |                | exists & active   |
     |                  |                |------------------>|
     |                  |                |<------------------|
     |                  |                |                   |
     |                  |                | Extract optional  |
     |                  |                | user_id from JWT  |
     |                  |                |                   |
     |                  |                | INSERT inquiry    |
     |                  |                |------------------>|
     |                  |                |<------------------|
     |                  |                |                   |
     |                  | {id, message:  |                   |
     |                  | "Submitted"}   |                   |
     |                  |<---------------|                   |
     |                  |                |                   |
     | Success toast    |                |                   |
     |<-----------------|                |                   |
```

### Admin Property Management Flow

```
Admin (Browser)      Admin Panel      Admin API         PostgreSQL
     |                  |                |                   |
     | Login            |                |                   |
     |----------------->| POST /api/     |                   |
     |                  | admin/auth/    |                   |
     |                  | login          |                   |
     |                  |--------------->|                   |
     |                  |                | Verify creds      |
     |                  |                | Check role=admin  |
     |                  |                |------------------>|
     |                  |                |<------------------|
     |                  | {token, user}  |                   |
     |                  |<---------------|                   |
     | Store token      |                |                   |
     |<-----------------|                |                   |
     |                  |                |                   |
     | Create property  |                |                   |
     |----------------->| POST /api/     |                   |
     |                  | admin/         |                   |
     |                  | properties     |                   |
     |                  | Authorization: |                   |
     |                  | Bearer <token> |                   |
     |                  |--------------->|                   |
     |                  |                | Verify JWT        |
     |                  |                | Validate input    |
     |                  |                | Generate slug     |
     |                  |                |                   |
     |                  |                | INSERT property   |
     |                  |                |------------------>|
     |                  |                |<------------------|
     |                  | {property}     |                   |
     |                  |<---------------|                   |
     | Success          |                |                   |
     |<-----------------|                |                   |
```
