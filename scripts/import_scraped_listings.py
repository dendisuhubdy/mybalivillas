#!/usr/bin/env python3
"""
Import scraped villa listings into the mybali.villas production database.

Reads scraped_listings.json and villa_bali_listings.json, deduplicates,
maps fields to the properties table schema, and inserts into postgres.

Usage (on VPS):
    python3 import_scraped_listings.py \
        --db "postgresql://mybalivilla:PASSWORD@localhost:5432/mybalivilla" \
        --data-dir /opt/mybalivilla/scraped_data \
        --uploads-dir /app/uploads

Or via docker exec:
    docker exec mybalivilla-postgres psql -U mybalivilla -d mybalivilla < import.sql
"""

import json
import os
import re
import sys
import uuid
import argparse
from pathlib import Path


ADMIN_OWNER_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

# Valid enum values
VALID_PROPERTY_TYPES = {"villa", "house", "apartment", "land", "commercial"}
VALID_LISTING_TYPES = {"sale", "long_term_rent", "short_term_rent", "sale_freehold", "sale_leasehold"}
VALID_PRICE_PERIODS = {"per_night", "per_week", "per_month", "per_year", None}


def slugify(text: str) -> str:
    """Convert text to a URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    text = text.strip('-')
    return text[:490]  # leave room for dedup suffix


def escape_sql(value):
    """Escape a string for SQL insertion."""
    if value is None:
        return "NULL"
    s = str(value).replace("'", "''").replace("\\", "\\\\")
    return f"'{s}'"


def map_local_image_to_upload(local_path: str, base_url: str = "https://mybali.villas") -> str:
    """Map a local image path to an absolute /uploads/ URL."""
    filename = os.path.basename(local_path)
    return f"{base_url}/uploads/{filename}"


def load_and_merge(data_dir: str):
    """Load both JSON files and deduplicate by title (prefer villa_bali for overlaps)."""
    scraped_file = os.path.join(data_dir, "scraped_listings.json")
    villa_bali_file = os.path.join(data_dir, "villa_bali_listings.json")

    listings = []
    seen_titles = set()

    # Load villa_bali_listings first (has lat/lon, local images)
    if os.path.exists(villa_bali_file):
        with open(villa_bali_file) as f:
            villa_bali = json.load(f)
        print(f"Loaded {len(villa_bali)} entries from villa_bali_listings.json")
        for entry in villa_bali:
            title_key = entry.get("title", "").lower().strip()
            if title_key and title_key not in seen_titles:
                seen_titles.add(title_key)
                entry["_source_file"] = "villa_bali"
                listings.append(entry)

    # Load scraped_listings (skip duplicates)
    if os.path.exists(scraped_file):
        with open(scraped_file) as f:
            scraped = json.load(f)
        print(f"Loaded {len(scraped)} entries from scraped_listings.json")
        skipped = 0
        for entry in scraped:
            title_key = entry.get("title", "").lower().strip()
            if title_key and title_key not in seen_titles:
                seen_titles.add(title_key)
                entry["_source_file"] = "scraped"
                listings.append(entry)
            else:
                skipped += 1
        print(f"Skipped {skipped} duplicates from scraped_listings.json")

    print(f"Total unique listings to import: {len(listings)}")
    return listings


def listing_to_sql(listing: dict, slug: str) -> str:
    """Convert a listing dict to a SQL INSERT statement."""
    prop_type = listing.get("property_type", "villa")
    if prop_type not in VALID_PROPERTY_TYPES:
        prop_type = "villa"

    list_type = listing.get("listing_type", "sale")
    if list_type not in VALID_LISTING_TYPES:
        list_type = "sale"

    price = listing.get("price", 0)
    if price is None:
        price = 0

    currency = listing.get("currency", "USD")
    if currency not in ("USD", "IDR", "EUR", "AUD"):
        currency = "USD"

    price_period = listing.get("price_period")
    if price_period not in VALID_PRICE_PERIODS:
        price_period = None

    # Build image URLs
    images = []
    if listing.get("_source_file") == "villa_bali" and listing.get("local_images"):
        # Use uploaded local images
        for img_path in listing["local_images"]:
            images.append(map_local_image_to_upload(img_path))
    elif listing.get("image_urls"):
        images = listing["image_urls"]

    thumbnail = images[0] if images else None

    features = listing.get("features", [])
    # Deduplicate features
    seen = set()
    unique_features = []
    for f in features:
        fl = f.lower().strip()
        if fl not in seen:
            seen.add(fl)
            unique_features.append(f)

    area = listing.get("area", "Bali")
    bedrooms = listing.get("bedrooms", 0) or 0
    bathrooms = listing.get("bathrooms", 0) or 0
    lat = listing.get("latitude")
    lng = listing.get("longitude")
    land_size = listing.get("land_size_sqm")
    building_size = listing.get("building_size_sqm")
    description = listing.get("description", "")
    title = listing.get("title", "")

    prop_id = str(uuid.uuid4())

    images_json = json.dumps(images).replace("'", "''")
    features_json = json.dumps(unique_features).replace("'", "''")

    sql = f"""INSERT INTO properties (
    id, owner_id, title, slug, description, property_type, listing_type,
    price, price_period, currency, area, latitude, longitude,
    bedrooms, bathrooms, land_size_sqm, building_size_sqm,
    features, images, thumbnail_url, is_active, is_featured
) VALUES (
    '{prop_id}',
    '{ADMIN_OWNER_ID}',
    {escape_sql(title)},
    {escape_sql(slug)},
    {escape_sql(description)},
    '{prop_type}',
    '{list_type}',
    {price},
    {escape_sql(price_period) if price_period else 'NULL'},
    '{currency}',
    {escape_sql(area)},
    {lat if lat is not None else 'NULL'},
    {lng if lng is not None else 'NULL'},
    {bedrooms},
    {bathrooms},
    {land_size if land_size is not None else 'NULL'},
    {building_size if building_size is not None else 'NULL'},
    '{features_json}'::jsonb,
    '{images_json}'::jsonb,
    {escape_sql(thumbnail)},
    true,
    false
) ON CONFLICT (slug) DO NOTHING;"""

    return sql


def generate_sql(data_dir: str, output_file: str):
    """Generate a SQL file with all INSERT statements."""
    listings = load_and_merge(data_dir)

    slug_counts = {}
    sql_statements = []

    sql_statements.append("-- Import scraped villa listings")
    sql_statements.append(f"-- Generated: {len(listings)} listings")
    sql_statements.append("BEGIN;")
    sql_statements.append("")

    for listing in listings:
        title = listing.get("title", "Untitled Villa")
        base_slug = slugify(title)
        if not base_slug:
            base_slug = "villa"

        # Ensure unique slug
        if base_slug in slug_counts:
            slug_counts[base_slug] += 1
            slug = f"{base_slug}-{slug_counts[base_slug]}"
        else:
            slug_counts[base_slug] = 0
            slug = base_slug

        sql = listing_to_sql(listing, slug)
        sql_statements.append(sql)
        sql_statements.append("")

    sql_statements.append("COMMIT;")

    with open(output_file, "w") as f:
        f.write("\n".join(sql_statements))

    print(f"Generated SQL file: {output_file}")
    print(f"Total INSERT statements: {len(listings)}")


def main():
    parser = argparse.ArgumentParser(description="Import scraped listings into mybali.villas DB")
    parser.add_argument("--data-dir", default="scraped_data",
                        help="Directory containing JSON files")
    parser.add_argument("--output", default="scraped_data/import.sql",
                        help="Output SQL file path")
    args = parser.parse_args()

    generate_sql(args.data_dir, args.output)


if __name__ == "__main__":
    main()
