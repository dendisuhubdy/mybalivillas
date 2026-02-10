-- =============================================================================
-- MyBaliVilla.com - Initial Database Migration
-- Creates all core tables, types, indexes, and default admin user
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search on property titles

-- ---------------------------------------------------------------------------
-- Custom ENUM types
-- ---------------------------------------------------------------------------

-- Property type classification
CREATE TYPE property_type AS ENUM (
    'villa',
    'house',
    'apartment',
    'land',
    'commercial'
);

-- How the property is listed
CREATE TYPE listing_type AS ENUM (
    'sale',
    'long_term_rent',
    'short_term_rent'
);

-- Price period for rental properties
CREATE TYPE price_period AS ENUM (
    'per_night',
    'per_week',
    'per_month',
    'per_year'
);

-- User roles for access control
CREATE TYPE user_role AS ENUM (
    'admin',
    'agent',
    'user'
);

-- Inquiry lifecycle status
CREATE TYPE inquiry_status AS ENUM (
    'new',
    'read',
    'replied',
    'closed'
);

-- ---------------------------------------------------------------------------
-- Users table
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'user',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT users_email_unique UNIQUE (email)
);

-- Indexes for users
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_is_active ON users (is_active);
CREATE INDEX idx_users_created_at ON users (created_at DESC);

-- ---------------------------------------------------------------------------
-- Properties table
-- ---------------------------------------------------------------------------
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL,
    description TEXT,
    property_type property_type NOT NULL,
    listing_type listing_type NOT NULL,

    -- Pricing
    price DECIMAL(15, 2) NOT NULL,
    price_period price_period,           -- NULL for sale listings
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',

    -- Location
    area VARCHAR(255) NOT NULL,          -- e.g., Seminyak, Canggu, Ubud
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Property details
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    land_size_sqm DECIMAL(10, 2),        -- Land area in square meters
    building_size_sqm DECIMAL(10, 2),    -- Building area in square meters
    year_built INTEGER,

    -- Features (stored as JSON array for flexibility)
    features JSONB DEFAULT '[]'::jsonb,

    -- Images (stored as JSON array of URLs)
    images JSONB DEFAULT '[]'::jsonb,
    thumbnail_url TEXT,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    view_count INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT properties_slug_unique UNIQUE (slug),
    CONSTRAINT properties_price_positive CHECK (price >= 0),
    CONSTRAINT properties_bedrooms_positive CHECK (bedrooms >= 0),
    CONSTRAINT properties_bathrooms_positive CHECK (bathrooms >= 0),

    -- Foreign keys
    CONSTRAINT fk_properties_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for properties - covering common query patterns
CREATE INDEX idx_properties_owner_id ON properties (owner_id);
CREATE INDEX idx_properties_property_type ON properties (property_type);
CREATE INDEX idx_properties_listing_type ON properties (listing_type);
CREATE INDEX idx_properties_area ON properties (area);
CREATE INDEX idx_properties_is_active ON properties (is_active);
CREATE INDEX idx_properties_is_featured ON properties (is_featured);
CREATE INDEX idx_properties_price ON properties (price);
CREATE INDEX idx_properties_created_at ON properties (created_at DESC);
CREATE INDEX idx_properties_slug ON properties (slug);

-- Composite indexes for common filtered queries
CREATE INDEX idx_properties_active_type ON properties (is_active, property_type);
CREATE INDEX idx_properties_active_listing ON properties (is_active, listing_type);
CREATE INDEX idx_properties_active_area ON properties (is_active, area);
CREATE INDEX idx_properties_active_featured ON properties (is_active, is_featured) WHERE is_featured = true;

-- Full-text search index on title
CREATE INDEX idx_properties_title_trgm ON properties USING gin (title gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Inquiries table
-- ---------------------------------------------------------------------------
CREATE TABLE inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL,
    user_id UUID,                        -- NULL for anonymous inquiries
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    message TEXT NOT NULL,
    status inquiry_status NOT NULL DEFAULT 'new',
    notes TEXT,                           -- Internal notes from admin/agent
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign keys
    CONSTRAINT fk_inquiries_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    CONSTRAINT fk_inquiries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for inquiries
CREATE INDEX idx_inquiries_property_id ON inquiries (property_id);
CREATE INDEX idx_inquiries_user_id ON inquiries (user_id);
CREATE INDEX idx_inquiries_status ON inquiries (status);
CREATE INDEX idx_inquiries_email ON inquiries (email);
CREATE INDEX idx_inquiries_created_at ON inquiries (created_at DESC);

-- Composite index for dashboard: new inquiries first
CREATE INDEX idx_inquiries_status_created ON inquiries (status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Saved properties (user favorites/bookmarks)
-- ---------------------------------------------------------------------------
CREATE TABLE saved_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    property_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints: each user can save a property only once
    CONSTRAINT saved_properties_unique UNIQUE (user_id, property_id),

    -- Foreign keys
    CONSTRAINT fk_saved_properties_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_properties_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Indexes for saved properties
CREATE INDEX idx_saved_properties_user_id ON saved_properties (user_id);
CREATE INDEX idx_saved_properties_property_id ON saved_properties (property_id);

-- ---------------------------------------------------------------------------
-- Updated_at trigger function
-- Automatically updates the updated_at column on row modification
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with updated_at
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_inquiries_updated_at
    BEFORE UPDATE ON inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Default admin user
-- Email: admin@mybalivilla.com
-- Password: admin123
-- Password hash generated with Argon2id
-- IMPORTANT: Change this password immediately in production!
-- ---------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active, email_verified)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@mybalivilla.com',
    '$argon2id$v=19$m=19456,t=2,p=1$dG9wc2VjcmV0c2FsdA$YhHqGIY/MnFc2L2HS5KhOqO2+GLkMfbUMqOZrcHi4H4',
    'Admin User',
    '+62-812-0000-0000',
    'admin',
    true,
    true
);
