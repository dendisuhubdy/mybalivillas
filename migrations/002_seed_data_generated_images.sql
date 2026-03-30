-- =============================================================================
-- Generated Villa Images - Update Script
-- Updates property images with AI-generated images from Gemini
-- Run after 002_seed_data.sql to replace Unsplash URLs with local images
-- =============================================================================

-- Property 1: luxury-beachfront-villa-seminyak
UPDATE properties SET
    images = '["/images/properties/luxury-beachfront-villa-seminyak-1.png", "/images/properties/luxury-beachfront-villa-seminyak-2.png", "/images/properties/luxury-beachfront-villa-seminyak-3.png", "/images/properties/luxury-beachfront-villa-seminyak-4.png"]'::jsonb,
    thumbnail_url = '/images/properties/luxury-beachfront-villa-seminyak-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000001';

-- Property 2: modern-tropical-villa-canggu
UPDATE properties SET
    images = '["/images/properties/modern-tropical-villa-canggu-1.png", "/images/properties/modern-tropical-villa-canggu-2.png", "/images/properties/modern-tropical-villa-canggu-3.png"]'::jsonb,
    thumbnail_url = '/images/properties/modern-tropical-villa-canggu-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000002';

-- Property 3: traditional-balinese-compound-ubud
UPDATE properties SET
    images = '["/images/properties/traditional-balinese-compound-ubud-1.png", "/images/properties/traditional-balinese-compound-ubud-2.png", "/images/properties/traditional-balinese-compound-ubud-3.png"]'::jsonb,
    thumbnail_url = '/images/properties/traditional-balinese-compound-ubud-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000003';

-- Property 4: clifftop-villa-uluwatu
UPDATE properties SET
    images = '["/images/properties/clifftop-villa-uluwatu-1.png", "/images/properties/clifftop-villa-uluwatu-2.png", "/images/properties/clifftop-villa-uluwatu-3.png"]'::jsonb,
    thumbnail_url = '/images/properties/clifftop-villa-uluwatu-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000004';

-- Property 5: charming-beach-house-sanur
UPDATE properties SET
    images = '["/images/properties/charming-beach-house-sanur-1.png", "/images/properties/charming-beach-house-sanur-2.png"]'::jsonb,
    thumbnail_url = '/images/properties/charming-beach-house-sanur-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000005';

-- Property 6: premium-penthouse-nusa-dua
UPDATE properties SET
    images = '["/images/properties/premium-penthouse-nusa-dua-1.png", "/images/properties/premium-penthouse-nusa-dua-2.png"]'::jsonb,
    thumbnail_url = '/images/properties/premium-penthouse-nusa-dua-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000006';

-- Property 7: prime-investment-land-canggu
UPDATE properties SET
    images = '["/images/properties/prime-investment-land-canggu-1.png", "/images/properties/prime-investment-land-canggu-2.png"]'::jsonb,
    thumbnail_url = '/images/properties/prime-investment-land-canggu-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000007';

-- Property 8: prime-commercial-space-seminyak
UPDATE properties SET
    images = '["/images/properties/prime-commercial-space-seminyak-1.png", "/images/properties/prime-commercial-space-seminyak-2.png"]'::jsonb,
    thumbnail_url = '/images/properties/prime-commercial-space-seminyak-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000008';

-- Property 9: luxury-pool-villa-jimbaran
UPDATE properties SET
    images = '["/images/properties/luxury-pool-villa-jimbaran-1.png", "/images/properties/luxury-pool-villa-jimbaran-2.png", "/images/properties/luxury-pool-villa-jimbaran-3.png"]'::jsonb,
    thumbnail_url = '/images/properties/luxury-pool-villa-jimbaran-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000009';

-- Property 10: stylish-pool-villa-seminyak
UPDATE properties SET
    images = '["/images/properties/stylish-pool-villa-seminyak-1.png", "/images/properties/stylish-pool-villa-seminyak-2.png"]'::jsonb,
    thumbnail_url = '/images/properties/stylish-pool-villa-seminyak-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000010';

-- Property 11: cozy-jungle-retreat-ubud
UPDATE properties SET
    images = '["/images/properties/cozy-jungle-retreat-ubud-1.png", "/images/properties/cozy-jungle-retreat-ubud-2.png"]'::jsonb,
    thumbnail_url = '/images/properties/cozy-jungle-retreat-ubud-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000011';

-- Property 12: beachfront-apartment-sanur
UPDATE properties SET
    images = '["/images/properties/beachfront-apartment-sanur-1.png", "/images/properties/beachfront-apartment-sanur-2.png"]'::jsonb,
    thumbnail_url = '/images/properties/beachfront-apartment-sanur-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000012';

-- Property 13: spacious-family-villa-canggu
UPDATE properties SET
    images = '["/images/properties/spacious-family-villa-canggu-1.png", "/images/properties/spacious-family-villa-canggu-2.png", "/images/properties/spacious-family-villa-canggu-3.png"]'::jsonb,
    thumbnail_url = '/images/properties/spacious-family-villa-canggu-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000013';

-- Property 14: minimalist-studio-ubud
UPDATE properties SET
    images = '["/images/properties/minimalist-studio-ubud-1.png", "/images/properties/minimalist-studio-ubud-2.png"]'::jsonb,
    thumbnail_url = '/images/properties/minimalist-studio-ubud-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000014';

-- Property 15: modern-townhouse-seminyak
UPDATE properties SET
    images = '["/images/properties/modern-townhouse-seminyak-1.png", "/images/properties/modern-townhouse-seminyak-2.png"]'::jsonb,
    thumbnail_url = '/images/properties/modern-townhouse-seminyak-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000015';

-- Property 16: grand-oceanfront-estate-uluwatu
UPDATE properties SET
    images = '["/images/properties/grand-oceanfront-estate-uluwatu-1.png", "/images/properties/grand-oceanfront-estate-uluwatu-2.png", "/images/properties/grand-oceanfront-estate-uluwatu-3.png"]'::jsonb,
    thumbnail_url = '/images/properties/grand-oceanfront-estate-uluwatu-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000016';

-- Property 17: eco-bamboo-house-ubud
UPDATE properties SET
    images = '["/images/properties/eco-bamboo-house-ubud-1.png", "/images/properties/eco-bamboo-house-ubud-2.png"]'::jsonb,
    thumbnail_url = '/images/properties/eco-bamboo-house-ubud-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000017';

-- Property 18: luxury-resort-penthouse-nusa-dua
UPDATE properties SET
    images = '["/images/properties/luxury-resort-penthouse-nusa-dua-1.png", "/images/properties/luxury-resort-penthouse-nusa-dua-2.png"]'::jsonb,
    thumbnail_url = '/images/properties/luxury-resort-penthouse-nusa-dua-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000018';

-- Property 19: surfers-paradise-uluwatu
UPDATE properties SET
    images = '["/images/properties/surfers-paradise-uluwatu-1.png", "/images/properties/surfers-paradise-uluwatu-2.png"]'::jsonb,
    thumbnail_url = '/images/properties/surfers-paradise-uluwatu-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000019';

-- Property 20: hillside-land-jimbaran
UPDATE properties SET
    images = '["/images/properties/hillside-land-jimbaran-1.png", "/images/properties/hillside-land-jimbaran-2.png"]'::jsonb,
    thumbnail_url = '/images/properties/hillside-land-jimbaran-1.png'
WHERE id = 'b1000000-0000-0000-0000-000000000020';
