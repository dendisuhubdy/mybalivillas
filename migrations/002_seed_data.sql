-- =============================================================================
-- MyBaliVilla.com - Seed Data Migration
-- Inserts sample Bali properties for development and demonstration
--
-- All properties are owned by the default admin user from 001_initial.sql
-- Uses realistic Bali locations, prices, and property features
-- =============================================================================

-- Fixed admin user ID (must match 001_initial.sql)
-- Owner: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11

-- ---------------------------------------------------------------------------
-- 1. Luxury Beachfront Villa - Seminyak (Sale)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000001',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Luxury Beachfront Villa with Infinity Pool in Seminyak',
    'luxury-beachfront-villa-seminyak',
    'Stunning 4-bedroom beachfront villa located in the heart of Seminyak. This property features an infinity pool overlooking the ocean, a spacious open-plan living area, a fully equipped gourmet kitchen, and lush tropical gardens. Perfect for those seeking the ultimate Bali lifestyle with direct beach access and proximity to world-class restaurants and boutiques.',
    'villa', 'sale_freehold', 1850000.00, NULL, 'USD',
    'Seminyak', 'Jl. Kayu Aya, Seminyak, Bali',
    -8.6840, 115.1560,
    4, 4, 800.00, 550.00, 2019,
    '["infinity_pool", "beachfront", "ocean_view", "furnished", "garden", "parking", "security", "air_conditioning", "open_plan_living", "gourmet_kitchen"]'::jsonb,
    '["https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
    true, true
);

-- ---------------------------------------------------------------------------
-- 2. Modern Tropical Villa - Canggu (Sale)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000002',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Modern Tropical Villa with Rice Field Views in Canggu',
    'modern-tropical-villa-canggu',
    'A beautifully designed modern tropical villa nestled in the trendy Canggu area with breathtaking rice field views. Features 3 bedrooms with ensuite bathrooms, a private pool, rooftop terrace, and a contemporary Balinese design that blends indoor and outdoor living. Walking distance to Echo Beach and popular cafes.',
    'villa', 'sale_freehold', 650000.00, NULL, 'USD',
    'Canggu', 'Jl. Batu Mejan, Canggu, Bali',
    -8.6478, 115.1285,
    3, 3, 400.00, 280.00, 2021,
    '["private_pool", "rice_field_view", "furnished", "rooftop_terrace", "garden", "parking", "air_conditioning", "modern_design"]'::jsonb,
    '["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800", "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800", "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    true, true
);

-- ---------------------------------------------------------------------------
-- 3. Traditional Balinese Compound - Ubud (Sale)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000003',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Traditional Balinese Compound with Jungle Views in Ubud',
    'traditional-balinese-compound-ubud',
    'An authentic Balinese compound set among the lush jungles of Ubud. This unique property features 5 bedrooms across multiple pavilions, a yoga shala, natural stone pool, outdoor bath, and stunning views of the Ayung River valley. Ideal as a boutique retreat or luxury family home, surrounded by nature yet minutes from Ubud center.',
    'villa', 'sale_freehold', 980000.00, NULL, 'USD',
    'Ubud', 'Jl. Raya Sayan, Ubud, Bali',
    -8.5069, 115.2450,
    5, 5, 1200.00, 650.00, 2017,
    '["pool", "jungle_view", "river_view", "yoga_shala", "furnished", "garden", "parking", "traditional_design", "outdoor_bath", "staff_quarters"]'::jsonb,
    '["https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800", "https://images.unsplash.com/photo-1604999333679-b86d54738315?w=800", "https://images.unsplash.com/photo-1570213489059-0aac6626cade?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    true, true
);

-- ---------------------------------------------------------------------------
-- 4. Clifftop Villa - Uluwatu (Sale)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000004',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Spectacular Clifftop Villa with Panoramic Ocean Views in Uluwatu',
    'clifftop-villa-panoramic-ocean-uluwatu',
    'Perched on the dramatic cliffs of Uluwatu, this extraordinary 6-bedroom villa offers 180-degree panoramic views of the Indian Ocean. Features include a 20-meter infinity pool, home cinema, wine cellar, professional kitchen, and direct cliff stairway access. The epitome of luxury Bali living.',
    'villa', 'sale_freehold', 2000000.00, NULL, 'USD',
    'Uluwatu', 'Jl. Pantai Suluban, Uluwatu, Bali',
    -8.8175, 115.0862,
    6, 7, 1500.00, 900.00, 2020,
    '["infinity_pool", "ocean_view", "clifftop", "furnished", "home_cinema", "wine_cellar", "parking", "security", "air_conditioning", "staff_quarters", "gym"]'::jsonb,
    '["https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800", "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", "https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800',
    true, true
);

-- ---------------------------------------------------------------------------
-- 5. Beach House - Sanur (Sale)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000005',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Charming Beach House with Tropical Garden in Sanur',
    'charming-beach-house-sanur',
    'A delightful 3-bedroom beach house in the peaceful Sanur area, known for its calm waters and family-friendly atmosphere. This property features a beautiful tropical garden, covered terrace, private pool, and is just steps from the famous Sanur boardwalk. Perfect for families or retirees.',
    'house', 'sale_freehold', 420000.00, NULL, 'USD',
    'Sanur', 'Jl. Danau Tamblingan, Sanur, Bali',
    -8.6916, 115.2620,
    3, 2, 350.00, 200.00, 2015,
    '["pool", "garden", "furnished", "near_beach", "parking", "air_conditioning", "covered_terrace"]'::jsonb,
    '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    true, false
);

-- ---------------------------------------------------------------------------
-- 6. Nusa Dua Luxury Apartment (Sale)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000006',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Premium Penthouse Apartment with Ocean Views in Nusa Dua',
    'premium-penthouse-nusa-dua',
    'Luxurious 2-bedroom penthouse apartment in an exclusive Nusa Dua resort complex. Enjoy panoramic ocean views from the spacious balcony, access to world-class resort facilities including pools, spa, and restaurants. Fully furnished with high-end finishes and hotel-standard service available.',
    'apartment', 'sale_freehold', 380000.00, NULL, 'USD',
    'Nusa Dua', 'Kawasan BTDC, Nusa Dua, Bali',
    -8.8021, 115.2278,
    2, 2, NULL, 120.00, 2022,
    '["ocean_view", "furnished", "pool_access", "spa_access", "gym", "security", "air_conditioning", "balcony", "resort_facilities"]'::jsonb,
    '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    true, false
);

-- ---------------------------------------------------------------------------
-- 7. Investment Land - Canggu (Sale)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000007',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Prime Investment Land in Canggu with Rice Field Views',
    'prime-investment-land-canggu',
    'Excellent investment opportunity - 1,000 sqm of freehold land in the rapidly developing Canggu area. Features stunning rice field views, road access, and is zoned for residential development. Located near popular beaches, restaurants, and the upcoming Canggu cultural center. Ideal for building villas or a boutique hotel.',
    'land', 'sale_freehold', 350000.00, NULL, 'USD',
    'Canggu', 'Jl. Pantai Berawa, Canggu, Bali',
    -8.6550, 115.1350,
    0, 0, 1000.00, NULL, NULL,
    '["rice_field_view", "road_access", "freehold", "investment_opportunity"]'::jsonb,
    '["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800", "https://images.unsplash.com/photo-1559827291-bac2de60c079?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
    true, false
);

-- ---------------------------------------------------------------------------
-- 8. Commercial Space - Seminyak (Sale)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000008',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Prime Commercial Space on Seminyak Main Street',
    'prime-commercial-space-seminyak',
    'High-visibility commercial space on the bustling Jl. Kayu Aya (Eat Street) in Seminyak. 200 sqm of retail or restaurant space with high foot traffic, street frontage, and full commercial permits. Currently configured as a restaurant with kitchen equipment included. Excellent ROI potential.',
    'commercial', 'sale_freehold', 550000.00, NULL, 'USD',
    'Seminyak', 'Jl. Kayu Aya No. 42, Seminyak, Bali',
    -8.6860, 115.1565,
    0, 2, 250.00, 200.00, 2018,
    '["street_frontage", "high_traffic", "commercial_permit", "kitchen_equipped", "parking", "air_conditioning"]'::jsonb,
    '["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800", "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    true, false
);

-- ---------------------------------------------------------------------------
-- 9. Luxury Villa - Jimbaran (Short-Term Rental)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000009',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Luxury Pool Villa with Bay Views in Jimbaran',
    'luxury-pool-villa-jimbaran-rental',
    'Experience the best of Jimbaran in this stunning 3-bedroom pool villa with panoramic views of Jimbaran Bay. Perfect for holiday stays, this fully serviced villa includes a private chef, daily housekeeping, and airport transfer. Enjoy spectacular sunsets from the infinity pool or the seafood restaurants on the beach below.',
    'villa', 'short_term_rent', 350.00, 'per_night', 'USD',
    'Jimbaran', 'Jl. Bukit Permai, Jimbaran, Bali',
    -8.7680, 115.1620,
    3, 3, 600.00, 350.00, 2020,
    '["infinity_pool", "ocean_view", "bay_view", "furnished", "private_chef", "daily_housekeeping", "airport_transfer", "garden", "parking", "security", "air_conditioning", "wifi"]'::jsonb,
    '["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800", "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
    true, true
);

-- ---------------------------------------------------------------------------
-- 10. Private Pool Villa - Seminyak (Short-Term Rental)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000010',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Stylish Private Pool Villa in the Heart of Seminyak',
    'stylish-pool-villa-seminyak-rental',
    'A stylishly designed 2-bedroom villa perfectly located in central Seminyak. Features a private pool, outdoor shower, modern kitchen, and designer furnishings throughout. Walking distance to KuDeTa beach club, Potato Head, and the best dining in Bali. Ideal for couples or small groups seeking a chic base.',
    'villa', 'short_term_rent', 180.00, 'per_night', 'USD',
    'Seminyak', 'Jl. Petitenget, Seminyak, Bali',
    -8.6780, 115.1545,
    2, 2, 250.00, 180.00, 2021,
    '["private_pool", "furnished", "modern_design", "outdoor_shower", "garden", "parking", "air_conditioning", "wifi", "smart_tv"]'::jsonb,
    '["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    true, false
);

-- ---------------------------------------------------------------------------
-- 11. Budget-Friendly Villa - Ubud (Short-Term Rental)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000011',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Cozy Jungle Retreat with Pool in Ubud',
    'cozy-jungle-retreat-ubud-rental',
    'Escape to this cozy 1-bedroom jungle retreat in the peaceful outskirts of Ubud. Wake up to birdsong and lush greenery, enjoy your morning coffee by the plunge pool, and spend your days exploring Ubud art galleries and rice terraces. Simple, serene, and affordable Bali living at its finest.',
    'villa', 'short_term_rent', 65.00, 'per_night', 'USD',
    'Ubud', 'Jl. Raya Tegallalang, Ubud, Bali',
    -8.4268, 115.2790,
    1, 1, 200.00, 80.00, 2019,
    '["plunge_pool", "jungle_view", "furnished", "garden", "wifi", "air_conditioning", "breakfast_included"]'::jsonb,
    '["https://images.unsplash.com/photo-1570213489059-0aac6626cade?w=800", "https://images.unsplash.com/photo-1604999333679-b86d54738315?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1570213489059-0aac6626cade?w=800',
    true, false
);

-- ---------------------------------------------------------------------------
-- 12. Beachfront Apartment - Sanur (Short-Term Rental)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000012',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Modern Beachfront Apartment with Sunrise Views in Sanur',
    'beachfront-apartment-sanur-rental',
    'Wake up to spectacular sunrises over the ocean in this modern 2-bedroom beachfront apartment in Sanur. Features a large balcony, fully equipped kitchen, and access to a shared pool and gym. The Sanur boardwalk is right at your doorstep, with endless dining and water sports options nearby.',
    'apartment', 'short_term_rent', 95.00, 'per_night', 'USD',
    'Sanur', 'Jl. Pantai Sindhu, Sanur, Bali',
    -8.6870, 115.2640,
    2, 1, NULL, 85.00, 2020,
    '["ocean_view", "beachfront", "furnished", "balcony", "pool_access", "gym", "wifi", "air_conditioning", "kitchen"]'::jsonb,
    '["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800", "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    true, false
);

-- ---------------------------------------------------------------------------
-- 13. Family Villa - Canggu (Long-Term Rental)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000013',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Spacious Family Villa with Pool in Berawa, Canggu',
    'spacious-family-villa-berawa-canggu',
    'Perfect for families relocating to Bali - this spacious 4-bedroom villa in the popular Berawa area of Canggu offers everything you need. Large pool, enclosed garden safe for kids, modern kitchen, living room, study, and garage. Close to international schools, supermarkets, and Berawa Beach. Available for yearly lease.',
    'villa', 'long_term_rent', 3500.00, 'per_month', 'USD',
    'Canggu', 'Jl. Pantai Berawa, Canggu, Bali',
    -8.6520, 115.1380,
    4, 3, 500.00, 350.00, 2020,
    '["private_pool", "furnished", "garden", "parking", "garage", "security", "air_conditioning", "wifi", "kid_friendly", "near_schools"]'::jsonb,
    '["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    true, true
);

-- ---------------------------------------------------------------------------
-- 14. Minimalist Studio - Ubud (Long-Term Rental)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000014',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Minimalist Studio with Rice Terrace Views in Ubud',
    'minimalist-studio-rice-terrace-ubud',
    'A beautifully designed minimalist studio apartment overlooking Ubud rice terraces. Perfect for digital nomads or solo travelers seeking long-term accommodation. Features high-speed fiber internet, a comfortable workspace, kitchenette, and a small private balcony with jaw-dropping views. Coworking spaces and cafes are within walking distance.',
    'apartment', 'long_term_rent', 800.00, 'per_month', 'USD',
    'Ubud', 'Jl. Raya Penestanan, Ubud, Bali',
    -8.5020, 115.2410,
    1, 1, NULL, 45.00, 2022,
    '["rice_field_view", "furnished", "wifi", "workspace", "air_conditioning", "kitchenette", "balcony"]'::jsonb,
    '["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800", "https://images.unsplash.com/photo-1559827291-bac2de60c079?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    true, false
);

-- ---------------------------------------------------------------------------
-- 15. Townhouse - Seminyak (Long-Term Rental)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000015',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Modern 3-Bedroom Townhouse in Seminyak',
    'modern-townhouse-seminyak-longterm',
    'A sleek, modern 3-bedroom townhouse in a quiet Seminyak compound. Features include a shared pool, rooftop area, open-plan living, and contemporary finishes throughout. Within walking distance to Seminyak beach, restaurants, and nightlife. Great for professionals or small families seeking quality long-term accommodation.',
    'house', 'long_term_rent', 2200.00, 'per_month', 'USD',
    'Seminyak', 'Jl. Drupadi, Seminyak, Bali',
    -8.6900, 115.1620,
    3, 2, 150.00, 180.00, 2021,
    '["pool_access", "furnished", "rooftop", "modern_design", "parking", "air_conditioning", "wifi", "near_beach"]'::jsonb,
    '["https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800", "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
    true, false
);

-- ---------------------------------------------------------------------------
-- 16. Grand Estate - Uluwatu (Sale)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000016',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Grand Oceanfront Estate with Private Beach Access in Uluwatu',
    'grand-oceanfront-estate-uluwatu',
    'An extraordinary oceanfront estate spread across 2,500 sqm of clifftop land in Uluwatu. This 8-bedroom property features multiple living pavilions, two infinity pools, a private gym, home theater, professional kitchen, extensive staff quarters, and private beach access via a cliff elevator. A once-in-a-generation opportunity.',
    'villa', 'sale_freehold', 1950000.00, NULL, 'USD',
    'Uluwatu', 'Jl. Labuan Sait, Uluwatu, Bali',
    -8.8150, 115.0880,
    8, 9, 2500.00, 1400.00, 2018,
    '["infinity_pool", "ocean_view", "clifftop", "private_beach", "furnished", "home_cinema", "gym", "wine_cellar", "staff_quarters", "security", "air_conditioning", "elevator", "helipad"]'::jsonb,
    '["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800", "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800", "https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    true, true
);

-- ---------------------------------------------------------------------------
-- 17. Eco-Friendly Bamboo House - Ubud (Short-Term Rental)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000017',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Unique Eco-Friendly Bamboo House in the Heart of Ubud',
    'eco-bamboo-house-ubud',
    'Stay in an architectural masterpiece - a stunning bamboo house inspired by the Green School philosophy, nestled in the Ubud jungle. This unique 2-bedroom property is built entirely from sustainable bamboo, features open-air living spaces, a natural spring-fed pool, organic garden, and breathtaking jungle canopy views.',
    'house', 'short_term_rent', 120.00, 'per_night', 'USD',
    'Ubud', 'Jl. Raya Sibang, Ubud, Bali',
    -8.5100, 115.2500,
    2, 2, 400.00, 150.00, 2021,
    '["eco_friendly", "jungle_view", "pool", "furnished", "organic_garden", "open_air", "unique_architecture", "wifi", "breakfast_included"]'::jsonb,
    '["https://images.unsplash.com/photo-1604999333679-b86d54738315?w=800", "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1604999333679-b86d54738315?w=800',
    true, false
);

-- ---------------------------------------------------------------------------
-- 18. Penthouse - Nusa Dua (Long-Term Rental)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000018',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Luxury Resort Penthouse with Full Amenities in Nusa Dua',
    'luxury-resort-penthouse-nusa-dua-longterm',
    'Live in resort luxury year-round with this expansive 3-bedroom penthouse in Nusa Dua premier resort complex. Enjoy concierge service, multiple pool access, private beach, spa, tennis courts, and fine dining without leaving home. Fully furnished to international standards with stunning ocean views from every room.',
    'apartment', 'long_term_rent', 4800.00, 'per_month', 'USD',
    'Nusa Dua', 'Kawasan Pariwisata, Nusa Dua, Bali',
    -8.8030, 115.2290,
    3, 3, NULL, 200.00, 2022,
    '["ocean_view", "furnished", "pool_access", "private_beach", "spa_access", "gym", "tennis", "concierge", "security", "air_conditioning", "balcony", "resort_facilities"]'::jsonb,
    '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800", "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    true, false
);

-- ---------------------------------------------------------------------------
-- 19. Surfer's Paradise - Uluwatu (Short-Term Rental)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000019',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Surfer''s Paradise Villa near Padang Padang Beach',
    'surfers-paradise-villa-uluwatu',
    'The ultimate surf villa just 5 minutes from Padang Padang and Uluwatu surf breaks. This laid-back 3-bedroom villa features a pool, surf rack storage, outdoor BBQ area, and a rooftop deck perfect for watching the sunset. Great for groups of friends or surf retreats. Board rental and surf lessons can be arranged.',
    'villa', 'short_term_rent', 150.00, 'per_night', 'USD',
    'Uluwatu', 'Jl. Pantai Padang Padang, Uluwatu, Bali',
    -8.8120, 115.0950,
    3, 2, 300.00, 200.00, 2020,
    '["pool", "furnished", "rooftop_terrace", "bbq", "surf_storage", "near_beach", "parking", "wifi", "air_conditioning"]'::jsonb,
    '["https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=800", "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=800',
    true, false
);

-- ---------------------------------------------------------------------------
-- 20. Developer's Land Plot - Jimbaran (Sale)
-- ---------------------------------------------------------------------------
INSERT INTO properties (id, owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, latitude, longitude, bedrooms, bathrooms, land_size_sqm, building_size_sqm, year_built, features, images, thumbnail_url, is_active, is_featured)
VALUES (
    'b1000000-0000-0000-0000-000000000020',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Hillside Land with Panoramic Bay Views in Jimbaran',
    'hillside-land-bay-views-jimbaran',
    'Premium hillside land parcel of 2,000 sqm with unobstructed panoramic views of Jimbaran Bay and the airport runway (great for plane spotters!). Zoned for residential development, this plot has existing road access, water, and electricity connections. Perfect for developing a luxury villa compound or boutique resort.',
    'land', 'sale_freehold', 480000.00, NULL, 'USD',
    'Jimbaran', 'Jl. Goa Gong, Jimbaran, Bali',
    -8.7750, 115.1680,
    0, 0, 2000.00, NULL, NULL,
    '["bay_view", "ocean_view", "road_access", "utilities_connected", "freehold", "hillside"]'::jsonb,
    '["https://images.unsplash.com/photo-1559827291-bac2de60c079?w=800", "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"]'::jsonb,
    'https://images.unsplash.com/photo-1559827291-bac2de60c079?w=800',
    true, false
);

-- ---------------------------------------------------------------------------
-- Sample inquiries for testing
-- ---------------------------------------------------------------------------
INSERT INTO inquiries (property_id, name, email, phone, message, status)
VALUES
    ('b1000000-0000-0000-0000-000000000001', 'John Smith', 'john.smith@email.com', '+1-555-0101', 'I am very interested in this beachfront villa. Could you provide more details about the ownership structure and any ongoing maintenance costs? I am planning to visit Bali next month.', 'new'),
    ('b1000000-0000-0000-0000-000000000002', 'Sarah Johnson', 'sarah.j@email.com', '+44-20-7946-0958', 'Beautiful villa! Is the price negotiable? Also, what are the terms for foreign ownership in this area?', 'read'),
    ('b1000000-0000-0000-0000-000000000009', 'Michael Chen', 'mchen@email.com', '+65-9123-4567', 'We would like to book this villa for 2 weeks in December. Is it available? We are a family of 4 with 2 children.', 'replied'),
    ('b1000000-0000-0000-0000-000000000013', 'Emma Wilson', 'emma.w@email.com', '+61-4-1234-5678', 'Looking for a 1-year lease starting March. Is this property still available? We have a small dog - are pets allowed?', 'new'),
    ('b1000000-0000-0000-0000-000000000007', 'Robert Kim', 'rkim.invest@email.com', '+82-10-1234-5678', 'I am interested in the land investment opportunity. Could you send me the land certificate details and zoning information? What is the process for foreign land ownership?', 'new');
