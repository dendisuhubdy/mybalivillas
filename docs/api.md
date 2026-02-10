# API Reference

Complete API documentation for MyBaliVilla.com. The platform exposes two separate API services:

- **Public API** -- port `8080`, base path `/api/v1`
- **Admin API** -- port `8081`, base path `/api/admin`

---

## Table of Contents

1. [General Information](#general-information)
2. [Public API](#public-api)
   - [Authentication](#authentication)
   - [Properties](#properties)
   - [Users](#users-requires-auth)
3. [Admin API](#admin-api)
   - [Admin Authentication](#admin-authentication)
   - [Dashboard](#dashboard)
   - [Admin Properties](#admin-properties)
   - [Admin Users](#admin-users)
   - [Admin Inquiries](#admin-inquiries)
4. [Error Responses](#error-responses)
5. [Enum Reference](#enum-reference)

---

## General Information

### Base URLs

| Environment | Public API | Admin API |
|-------------|-----------|-----------|
| Local Dev | `http://localhost:8080/api/v1` | `http://localhost:8081/api/admin` |
| Production | `https://mybalivilla.com/api/v1` | `https://admin.mybalivilla.com/api/admin` |

### Authentication

All authenticated endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens are JWTs signed with HS256. They expire 24 hours after creation.

### Response Wrapper

All successful responses follow this structure:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses follow this structure:

```json
{
  "error": {
    "status": 400,
    "message": "Description of what went wrong"
  }
}
```

---

## Public API

Base path: `/api/v1`

### Authentication

#### POST /api/v1/auth/register

Register a new user account and receive a JWT.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Minimum 8 characters |
| `full_name` | string | Yes | Minimum 1 character |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImV4cCI6MTcwMDAwMDAwMH0.abc123",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "full_name": "John Doe",
      "phone": null,
      "avatar": null,
      "role": "User"
    }
  }
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | Validation error (invalid email, password too short, etc.) |
| 409 | A user with this email already exists |

---

#### POST /api/v1/auth/login

Authenticate with email and password.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "full_name": "John Doe",
      "phone": "+62812345678",
      "avatar": null,
      "role": "User"
    }
  }
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 401 | Invalid email or password |
| 401 | Account is not active |

---

### Properties

#### GET /api/v1/properties

List properties with dynamic filtering, search, sorting, and pagination. Only active properties are returned.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `property_type` | string | -- | Filter: `villa`, `house`, `apartment`, `land`, `commercial` |
| `listing_type` | string | -- | Filter: `sale`, `long_term_rent`, `short_term_rent` |
| `min_price` | number | -- | Minimum price |
| `max_price` | number | -- | Maximum price |
| `bedrooms` | integer | -- | Minimum bedrooms |
| `bathrooms` | integer | -- | Minimum bathrooms |
| `area` | string | -- | Area filter (case-insensitive partial match) |
| `search` | string | -- | Free-text search across title, description, and area |
| `sort_by` | string | `newest` | Sort order: `price_asc`, `price_desc`, `newest`, `oldest`, `views` |
| `page` | integer | 1 | Page number (minimum 1) |
| `per_page` | integer | 12 | Items per page (1--100) |

**Example Request:**

```
GET /api/v1/properties?property_type=villa&area=canggu&min_price=100000&sort_by=price_asc&page=1&per_page=12
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "title": "Stunning 3BR Villa in Canggu",
        "slug": "stunning-3br-villa-in-canggu",
        "description": "A beautiful modern villa with rice field views...",
        "property_type": "Villa",
        "listing_type": "Sale",
        "price": "350000.00",
        "price_currency": "USD",
        "price_period": null,
        "bedrooms": 3,
        "bathrooms": 3,
        "land_size": 400.0,
        "building_size": 250.0,
        "location": "Canggu, Bali",
        "area": "Canggu",
        "latitude": -8.6478,
        "longitude": 115.1385,
        "address": "Jl. Pantai Berawa No. 42",
        "features": ["Pool", "Garden", "Garage", "Air Conditioning"],
        "images": [
          "https://example.com/images/villa1-1.jpg",
          "https://example.com/images/villa1-2.jpg"
        ],
        "thumbnail": "https://example.com/images/villa1-thumb.jpg",
        "is_featured": true,
        "views_count": 142,
        "owner_id": "550e8400-e29b-41d4-a716-446655440000",
        "agent_id": "661f9500-f30c-52e5-b827-557766550001",
        "created_at": "2024-06-15T10:30:00Z",
        "updated_at": "2024-06-20T14:00:00Z"
      }
    ],
    "total": 45,
    "page": 1,
    "per_page": 12,
    "total_pages": 4
  }
}
```

---

#### GET /api/v1/properties/featured

Return up to 6 featured, active properties.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Luxury Beachfront Villa",
      "slug": "luxury-beachfront-villa",
      "description": "...",
      "property_type": "Villa",
      "listing_type": "Sale",
      "price": "1200000.00",
      "price_currency": "USD",
      "price_period": null,
      "bedrooms": 5,
      "bathrooms": 5,
      "land_size": 800.0,
      "building_size": 500.0,
      "location": "Seminyak, Bali",
      "area": "Seminyak",
      "latitude": -8.6912,
      "longitude": 115.1553,
      "address": null,
      "features": ["Pool", "Beach Access", "Staff Quarters"],
      "images": ["https://example.com/images/featured1.jpg"],
      "thumbnail": "https://example.com/images/featured1-thumb.jpg",
      "is_featured": true,
      "views_count": 523,
      "owner_id": "550e8400-e29b-41d4-a716-446655440000",
      "agent_id": null,
      "created_at": "2024-05-01T08:00:00Z",
      "updated_at": "2024-06-10T12:00:00Z"
    }
  ]
}
```

---

#### GET /api/v1/properties/areas

Return distinct areas with their property counts (active properties only).

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    { "area": "Canggu", "count": 45 },
    { "area": "Seminyak", "count": 38 },
    { "area": "Ubud", "count": 32 },
    { "area": "Uluwatu", "count": 18 },
    { "area": "Sanur", "count": 12 },
    { "area": "Jimbaran", "count": 8 }
  ]
}
```

---

#### GET /api/v1/properties/:slug

Return a single property by its URL slug. Also increments the property's view counter.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | string | URL-friendly property slug |

**Example Request:**

```
GET /api/v1/properties/stunning-3br-villa-in-canggu
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Stunning 3BR Villa in Canggu",
    "slug": "stunning-3br-villa-in-canggu",
    "description": "A beautiful modern villa with rice field views, featuring an infinity pool and open-air living spaces. Located in the heart of Canggu, just 10 minutes from the beach.",
    "property_type": "Villa",
    "listing_type": "Sale",
    "price": "350000.00",
    "price_currency": "USD",
    "price_period": null,
    "bedrooms": 3,
    "bathrooms": 3,
    "land_size": 400.0,
    "building_size": 250.0,
    "location": "Canggu, Bali",
    "area": "Canggu",
    "latitude": -8.6478,
    "longitude": 115.1385,
    "address": "Jl. Pantai Berawa No. 42",
    "features": ["Pool", "Garden", "Garage", "Air Conditioning", "Furnished"],
    "images": [
      "https://example.com/images/villa1-1.jpg",
      "https://example.com/images/villa1-2.jpg",
      "https://example.com/images/villa1-3.jpg"
    ],
    "thumbnail": "https://example.com/images/villa1-thumb.jpg",
    "is_featured": true,
    "views_count": 143,
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "agent_id": "661f9500-f30c-52e5-b827-557766550001",
    "created_at": "2024-06-15T10:30:00Z",
    "updated_at": "2024-06-20T14:00:00Z"
  }
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 404 | Property with the given slug not found or is inactive |

---

#### POST /api/v1/properties

Create a new property listing. Requires authentication. Agents and admins get their listings auto-activated; regular users' listings require admin review.

**Headers:** `Authorization: Bearer <token>` (required)

**Request Body:**

```json
{
  "title": "Luxury Villa in Seminyak",
  "description": "Beautiful 4-bedroom villa...",
  "property_type": "villa",
  "listing_type": "sale_freehold",
  "price": 850000,
  "currency": "USD",
  "bedrooms": 4,
  "bathrooms": 4,
  "land_size_sqm": 600,
  "building_size_sqm": 450,
  "area": "Seminyak",
  "address": "Jl. Kayu Aya",
  "features": ["Private Pool", "Garden"],
  "images": [],
  "thumbnail_url": "https://example.com/image.jpg"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Property title (min 1 char) |
| `description` | string | No | Property description |
| `property_type` | string | Yes | See [Listing Types](#listing-types) |
| `listing_type` | string | Yes | See [Listing Types](#listing-types) |
| `price` | decimal | Yes | Property price |
| `currency` | string | No | Currency code (default: `USD`) |
| `price_period` | string | No | See [Price Periods](#price-periods) |
| `bedrooms` | integer | No | Number of bedrooms |
| `bathrooms` | integer | No | Number of bathrooms |
| `land_size_sqm` | decimal | No | Land area in sqm |
| `building_size_sqm` | decimal | No | Building area in sqm |
| `area` | string | Yes | Location area (min 1 char) |
| `address` | string | No | Street address |
| `year_built` | integer | No | Year of construction |
| `features` | JSON array | No | List of features |
| `images` | JSON array | No | Image objects |
| `thumbnail_url` | string | No | Main image URL |

**Response (200 OK):** Returns the created property object.

**Behavior:**
- `owner_id` is set automatically from the JWT token
- `is_featured` is always `false`
- `is_active` is `true` for agents/admins, `false` for regular users (pending admin review)
- `slug` is auto-generated: `{slugified-title}-{uuid-prefix}`

---

#### POST /api/v1/properties/:id/inquire

Submit an inquiry for a specific property. Authentication is optional -- if the user is logged in, their user ID is attached to the inquiry.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Property ID |

**Request Body:**

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+62812345678",
  "message": "I am interested in this villa. Is it still available? I would like to schedule a viewing."
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | Minimum 1 character |
| `email` | string | Yes | Valid email format |
| `phone` | string | No | -- |
| `message` | string | Yes | Minimum 1 character |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "message": "Inquiry submitted successfully"
  }
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | Validation error (missing name, invalid email, etc.) |
| 404 | Property not found or is inactive |

---

### Users (Requires Auth)

All endpoints in this section require a valid JWT in the `Authorization: Bearer <token>` header.

#### GET /api/v1/users/me

Return the authenticated user's profile.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "full_name": "John Doe",
    "phone": "+62812345678",
    "avatar": "https://example.com/avatars/john.jpg",
    "role": "User"
  }
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid token |
| 404 | User not found or inactive |

---

#### PUT /api/v1/users/me

Update the authenticated user's profile. Only include fields you want to change.

**Request Body:**

```json
{
  "full_name": "John D. Smith",
  "phone": "+62898765432",
  "avatar": "https://example.com/avatars/john-new.jpg"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `full_name` | string | No | Minimum 1 character if provided |
| `phone` | string | No | -- |
| `avatar` | string | No | -- |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "full_name": "John D. Smith",
    "phone": "+62898765432",
    "avatar": "https://example.com/avatars/john-new.jpg",
    "role": "User"
  }
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | No fields to update / validation error |
| 401 | Missing or invalid token |
| 404 | User not found |

---

#### GET /api/v1/users/me/saved

Return all saved (bookmarked) properties for the authenticated user.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Stunning 3BR Villa in Canggu",
      "slug": "stunning-3br-villa-in-canggu",
      "description": "...",
      "property_type": "Villa",
      "listing_type": "Sale",
      "price": "350000.00",
      "price_currency": "USD",
      "price_period": null,
      "bedrooms": 3,
      "bathrooms": 3,
      "land_size": 400.0,
      "building_size": 250.0,
      "location": "Canggu, Bali",
      "area": "Canggu",
      "latitude": -8.6478,
      "longitude": 115.1385,
      "address": null,
      "features": ["Pool", "Garden"],
      "images": ["https://example.com/images/villa1-1.jpg"],
      "thumbnail": "https://example.com/images/villa1-thumb.jpg",
      "is_featured": true,
      "views_count": 142,
      "owner_id": "550e8400-e29b-41d4-a716-446655440000",
      "agent_id": null,
      "created_at": "2024-06-15T10:30:00Z",
      "updated_at": "2024-06-20T14:00:00Z"
    }
  ]
}
```

---

#### POST /api/v1/users/me/saved/:property_id

Save (bookmark) a property. If the property is already saved, the request succeeds without error (idempotent via `ON CONFLICT DO NOTHING`).

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `property_id` | UUID | Property ID to save |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Property saved"
  }
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid token |
| 404 | Property not found or inactive |

---

#### DELETE /api/v1/users/me/saved/:property_id

Remove a saved (bookmarked) property.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `property_id` | UUID | Property ID to unsave |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Property unsaved"
  }
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid token |
| 404 | Saved property not found |

---

## Admin API

Base path: `/api/admin`

All admin endpoints require a valid JWT with `role = "Admin"` in the `Authorization: Bearer <token>` header.

### Admin Authentication

#### POST /api/admin/auth/login

Authenticate an admin user. Only users with the `Admin` role can log in through this endpoint.

**Request Body:**

```json
{
  "email": "admin@mybalivilla.com",
  "password": "admin123"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Minimum 6 characters |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "110e8400-e29b-41d4-a716-446655440000",
      "email": "admin@mybalivilla.com",
      "full_name": "System Admin",
      "phone": null,
      "avatar": null,
      "role": "Admin",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | Validation error |
| 401 | Invalid credentials |
| 401 | User is not an admin |
| 401 | Account is deactivated |

---

### Dashboard

#### GET /api/admin/dashboard/stats

Return aggregate statistics for the admin dashboard.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "total_properties": 156,
    "active_properties": 142,
    "total_users": 1250,
    "total_inquiries": 387,
    "new_inquiries": 23,
    "total_views": 45230,
    "properties_by_type": [
      { "property_type": "Villa", "count": 68 },
      { "property_type": "House", "count": 34 },
      { "property_type": "Apartment", "count": 25 },
      { "property_type": "Land", "count": 18 },
      { "property_type": "Commercial", "count": 11 }
    ],
    "properties_by_area": [
      { "area": "Canggu", "count": 45 },
      { "area": "Seminyak", "count": 38 },
      { "area": "Ubud", "count": 32 },
      { "area": "Uluwatu", "count": 18 },
      { "area": "Sanur", "count": 12 }
    ],
    "recent_inquiries": [
      {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "message": "I am interested in this villa...",
        "status": "New",
        "property_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "created_at": "2024-06-25T09:15:00Z"
      }
    ],
    "recent_properties": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "title": "Stunning 3BR Villa in Canggu",
        "slug": "stunning-3br-villa-in-canggu",
        "property_type": "Villa",
        "listing_type": "Sale",
        "price": "350000.00",
        "area": "Canggu",
        "is_active": true,
        "created_at": "2024-06-15T10:30:00Z"
      }
    ]
  }
}
```

---

### Admin Properties

#### GET /api/admin/properties

List all properties with filtering and pagination (including inactive properties).

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `property_type` | string | -- | Filter: `Villa`, `House`, `Apartment`, `Land`, `Commercial` |
| `listing_type` | string | -- | Filter: `Sale`, `LongTermRent`, `ShortTermRent` |
| `area` | string | -- | Area filter |
| `is_featured` | boolean | -- | Filter by featured status |
| `is_active` | boolean | -- | Filter by active status |
| `search` | string | -- | Free-text search |
| `page` | integer | 1 | Page number |
| `per_page` | integer | 20 | Items per page (max 100) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "title": "Stunning 3BR Villa in Canggu",
        "slug": "stunning-3br-villa-in-canggu",
        "property_type": "Villa",
        "listing_type": "Sale",
        "price": "350000.00",
        "area": "Canggu",
        "is_active": true,
        "created_at": "2024-06-15T10:30:00Z"
      }
    ],
    "total": 156,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
  }
}
```

---

#### GET /api/admin/properties/:id

Get a single property by its UUID (includes all fields).

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Property ID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Stunning 3BR Villa in Canggu",
    "slug": "stunning-3br-villa-in-canggu",
    "description": "A beautiful modern villa...",
    "property_type": "Villa",
    "listing_type": "Sale",
    "price": "350000.00",
    "price_currency": "USD",
    "price_period": null,
    "bedrooms": 3,
    "bathrooms": 3,
    "land_size": 400.0,
    "building_size": 250.0,
    "location": "Canggu, Bali",
    "area": "Canggu",
    "latitude": -8.6478,
    "longitude": 115.1385,
    "address": "Jl. Pantai Berawa No. 42",
    "features": ["Pool", "Garden", "Garage"],
    "images": ["https://example.com/images/villa1-1.jpg"],
    "thumbnail": "https://example.com/images/villa1-thumb.jpg",
    "is_featured": true,
    "is_active": true,
    "views_count": 142,
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "agent_id": null,
    "created_at": "2024-06-15T10:30:00Z",
    "updated_at": "2024-06-20T14:00:00Z"
  }
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 404 | Property not found |

---

#### POST /api/admin/properties

Create a new property. A URL slug is automatically generated from the title.

**Request Body:**

```json
{
  "title": "Modern 2BR Villa with Pool in Ubud",
  "description": "A newly built modern villa surrounded by lush tropical gardens in the heart of Ubud. Features a private pool, open-air bathroom, and fully equipped kitchen.",
  "property_type": "Villa",
  "listing_type": "Sale",
  "price": "250000.00",
  "price_currency": "USD",
  "price_period": null,
  "bedrooms": 2,
  "bathrooms": 2,
  "land_size": 300.0,
  "building_size": 180.0,
  "location": "Ubud, Bali",
  "area": "Ubud",
  "latitude": -8.5069,
  "longitude": 115.2625,
  "address": "Jl. Raya Ubud No. 15",
  "features": ["Pool", "Garden", "Furnished", "Air Conditioning"],
  "images": [
    "https://example.com/images/ubud-villa-1.jpg",
    "https://example.com/images/ubud-villa-2.jpg"
  ],
  "thumbnail": "https://example.com/images/ubud-villa-thumb.jpg",
  "is_featured": false,
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "agent_id": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Property title (min 1 char) |
| `description` | string | Yes | Full description (min 1 char) |
| `property_type` | string | Yes | `Villa`, `House`, `Apartment`, `Land`, `Commercial` |
| `listing_type` | string | Yes | `Sale`, `LongTermRent`, `ShortTermRent` |
| `price` | decimal | Yes | Listing price |
| `price_currency` | string | No | Currency code (default: `USD`) |
| `price_period` | string | No | `PerNight`, `PerWeek`, `PerMonth`, `PerYear` |
| `bedrooms` | integer | No | Number of bedrooms |
| `bathrooms` | integer | No | Number of bathrooms |
| `land_size` | number | No | Land size in sqm |
| `building_size` | number | No | Building size in sqm |
| `location` | string | Yes | Location name (min 1 char) |
| `area` | string | Yes | Area/region (min 1 char) |
| `latitude` | number | No | GPS latitude |
| `longitude` | number | No | GPS longitude |
| `address` | string | No | Full street address |
| `features` | JSON array | No | List of feature strings |
| `images` | JSON array | No | List of image URLs |
| `thumbnail` | string | No | Thumbnail image URL |
| `is_featured` | boolean | No | Featured flag (default: false) |
| `owner_id` | UUID | Yes | Property owner user ID |
| `agent_id` | UUID | No | Assigned agent user ID |

**Response (200 OK):**

Returns the full property object (same structure as GET /api/admin/properties/:id).

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | Validation error |
| 401 | Not authenticated / not admin |

---

#### PUT /api/admin/properties/:id

Update an existing property. Only include fields you want to change.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Property ID |

**Request Body:**

```json
{
  "price": "275000.00",
  "is_featured": true,
  "bedrooms": 3
}
```

All fields from the create request are accepted but none are required. Only provided fields are updated.

**Response (200 OK):**

Returns the full updated property object.

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | Validation error |
| 401 | Not authenticated / not admin |
| 404 | Property not found |

---

#### DELETE /api/admin/properties/:id

Delete a property permanently.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Property ID |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Property deleted successfully"
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 401 | Not authenticated / not admin |
| 404 | Property not found |

---

#### PUT /api/admin/properties/:id/toggle-featured

Toggle the `is_featured` flag of a property.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Property ID |

**Response (200 OK):**

Returns the full updated property object with the new `is_featured` value.

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 401 | Not authenticated / not admin |
| 404 | Property not found |

---

### Admin Users

#### GET /api/admin/users

List all users with pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `per_page` | integer | 20 | Items per page (max 100) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "john@example.com",
        "full_name": "John Doe",
        "phone": "+62812345678",
        "avatar": null,
        "role": "User",
        "is_active": true,
        "created_at": "2024-03-15T10:30:00Z",
        "updated_at": "2024-06-20T14:00:00Z"
      }
    ],
    "total": 1250,
    "page": 1,
    "per_page": 20,
    "total_pages": 63
  }
}
```

---

#### GET /api/admin/users/:id

Get a single user by UUID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User ID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "full_name": "John Doe",
    "phone": "+62812345678",
    "avatar": null,
    "role": "User",
    "is_active": true,
    "created_at": "2024-03-15T10:30:00Z",
    "updated_at": "2024-06-20T14:00:00Z"
  }
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 404 | User not found |

---

#### POST /api/admin/users

Create a new user with a specified role.

**Request Body:**

```json
{
  "email": "agent@mybalivilla.com",
  "password": "securepass123",
  "full_name": "Property Agent",
  "phone": "+62812345678",
  "avatar": null,
  "role": "Agent"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Minimum 6 characters |
| `full_name` | string | Yes | Minimum 1 character |
| `phone` | string | No | -- |
| `avatar` | string | No | -- |
| `role` | string | Yes | `Admin`, `Agent`, `User` |

**Response (200 OK):**

Returns the full user object (same structure as GET /api/admin/users/:id).

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | Validation error |
| 409 | Email already exists |

---

#### PUT /api/admin/users/:id

Update an existing user. Only include fields you want to change.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User ID |

**Request Body:**

```json
{
  "full_name": "Updated Name",
  "role": "Agent",
  "phone": "+62898765432"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | No | Valid email format |
| `password` | string | No | New password (will be hashed) |
| `full_name` | string | No | Min 1 character |
| `phone` | string | No | -- |
| `avatar` | string | No | -- |
| `role` | string | No | `Admin`, `Agent`, `User` |

**Response (200 OK):**

Returns the full updated user object.

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | Validation error |
| 404 | User not found |

---

#### PUT /api/admin/users/:id/toggle-active

Toggle the `is_active` flag of a user account.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User ID |

**Response (200 OK):**

Returns the full updated user object with the new `is_active` value.

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 404 | User not found |

---

### Admin Inquiries

#### GET /api/admin/inquiries

List all inquiries with optional status filtering and pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | -- | Filter: `New`, `Read`, `Replied`, `Closed` |
| `page` | integer | 1 | Page number |
| `per_page` | integer | 20 | Items per page (max 100) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "property_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "+62812345678",
        "message": "I am interested in this villa. Is it still available?",
        "status": "New",
        "created_at": "2024-06-25T09:15:00Z"
      }
    ],
    "total": 387,
    "page": 1,
    "per_page": 20,
    "total_pages": 20
  }
}
```

---

#### GET /api/admin/inquiries/:id

Get a single inquiry by UUID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Inquiry ID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "property_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+62812345678",
    "message": "I am interested in this villa. Is it still available? I would like to schedule a viewing next week.",
    "status": "New",
    "created_at": "2024-06-25T09:15:00Z"
  }
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 404 | Inquiry not found |

---

#### PUT /api/admin/inquiries/:id/status

Update the status of an inquiry.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Inquiry ID |

**Request Body:**

```json
{
  "status": "Replied"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | `New`, `Read`, `Replied`, `Closed` |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Inquiry status updated"
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | Invalid status value |
| 404 | Inquiry not found |

---

## Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "status": 404,
    "message": "Property with slug 'nonexistent-villa' not found"
  }
}
```

### Error Status Codes

| Status Code | Name | Description |
|-------------|------|-------------|
| 400 | Bad Request | Invalid input data, validation failure, or malformed JSON |
| 401 | Unauthorized | Missing token, invalid token, expired token, or insufficient role |
| 404 | Not Found | Requested resource does not exist |
| 409 | Conflict | Resource conflict (e.g., duplicate email) |
| 500 | Internal Server Error | Unexpected server error (database failure, etc.) |

---

## Enum Reference

### Property Types

| Value | Description |
|-------|-------------|
| `Villa` | Standalone villa |
| `House` | Residential house |
| `Apartment` | Apartment unit |
| `Land` | Undeveloped land |
| `Commercial` | Commercial property |

### Listing Types

| Value | Description |
|-------|-------------|
| `sale_freehold` | Full ownership sale (freehold) |
| `sale_leasehold` | Leasehold sale |
| `short_term_rent` | Short-term rental (nightly/weekly/monthly) |
| `long_term_rent` | Long-term rental (monthly/yearly) |

### Price Periods

| Value | Description |
|-------|-------------|
| `PerNight` | Nightly rate |
| `PerWeek` | Weekly rate |
| `PerMonth` | Monthly rate |
| `PerYear` | Yearly rate |

### User Roles

| Value | Description |
|-------|-------------|
| `Admin` | Full administrative access |
| `Agent` | Property agent |
| `User` | Regular registered user |

### Inquiry Statuses

| Value | Description |
|-------|-------------|
| `New` | Newly submitted, unread |
| `Read` | Read by admin/agent |
| `Replied` | Response has been sent |
| `Closed` | Inquiry is resolved/closed |
