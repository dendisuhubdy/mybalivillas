#!/usr/bin/env python3
"""
Generate villa images using Google Gemini 2.0 Flash Experimental model.
Saves images to frontend/public/images/properties/ and outputs updated SQL.
"""

import os
import sys
import time
import json
from pathlib import Path

from google import genai
from google.genai import types

# Config
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("ERROR: GEMINI_API_KEY not set. Source your ~/.zshrc first.")
    sys.exit(1)

client = genai.Client(api_key=API_KEY)

PROJECT_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = PROJECT_ROOT / "frontend" / "public" / "images" / "properties"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Each property: (id_suffix, slug, prompt, num_images)
PROPERTIES = [
    (
        "001", "luxury-beachfront-villa-seminyak",
        "A luxury beachfront villa in Seminyak, Bali with an infinity pool overlooking the ocean, tropical gardens, modern architecture, golden hour lighting",
        4
    ),
    (
        "002", "modern-tropical-villa-canggu",
        "A modern tropical villa in Canggu, Bali with rice field views, private pool, contemporary Balinese design, lush greenery",
        3
    ),
    (
        "003", "traditional-balinese-compound-ubud",
        "A traditional Balinese compound in Ubud jungle, multiple pavilions, natural stone pool, thatched roofs, lush tropical vegetation, Ayung River valley views",
        3
    ),
    (
        "004", "clifftop-villa-uluwatu",
        "A spectacular clifftop villa in Uluwatu, Bali perched on dramatic ocean cliffs, infinity pool on the edge, panoramic Indian Ocean views, luxury modern design",
        3
    ),
    (
        "005", "charming-beach-house-sanur",
        "A charming beach house in Sanur, Bali with tropical garden, covered terrace, private pool, family-friendly atmosphere, calm waters nearby",
        2
    ),
    (
        "006", "premium-penthouse-nusa-dua",
        "A premium penthouse apartment in Nusa Dua, Bali resort complex, panoramic ocean views from spacious balcony, luxury interior, high-end finishes",
        2
    ),
    (
        "007", "prime-investment-land-canggu",
        "A beautiful plot of land in Canggu, Bali with stunning rice field views, tropical landscape, road access, development potential, golden hour",
        2
    ),
    (
        "008", "prime-commercial-space-seminyak",
        "A modern commercial retail space on a bustling street in Seminyak, Bali, street frontage, restaurant interior, contemporary design",
        2
    ),
    (
        "009", "luxury-pool-villa-jimbaran",
        "A luxury pool villa in Jimbaran, Bali with panoramic bay views, infinity pool overlooking Jimbaran Bay, sunset colors, tropical luxury",
        3
    ),
    (
        "010", "stylish-pool-villa-seminyak",
        "A stylish private pool villa in central Seminyak, Bali, designer furnishings, private pool, outdoor shower, modern tropical interior",
        2
    ),
    (
        "011", "cozy-jungle-retreat-ubud",
        "A cozy jungle retreat in Ubud, Bali with a plunge pool, surrounded by lush greenery and tropical plants, serene atmosphere, morning light",
        2
    ),
    (
        "012", "beachfront-apartment-sanur",
        "A modern beachfront apartment in Sanur, Bali with sunrise ocean views, large balcony, contemporary interior, tropical seaside setting",
        2
    ),
    (
        "013", "spacious-family-villa-canggu",
        "A spacious family villa in Berawa, Canggu, Bali with large pool, enclosed garden, modern kitchen, tropical family home, safe for children",
        3
    ),
    (
        "014", "minimalist-studio-ubud",
        "A minimalist studio apartment overlooking Ubud rice terraces in Bali, clean modern design, workspace, small balcony with stunning views",
        2
    ),
    (
        "015", "modern-townhouse-seminyak",
        "A modern 3-bedroom townhouse in Seminyak, Bali compound, shared pool, rooftop area, contemporary design, open-plan living",
        2
    ),
    (
        "016", "grand-oceanfront-estate-uluwatu",
        "A grand oceanfront estate on Uluwatu cliffs in Bali, multiple living pavilions, two infinity pools, private beach access, dramatic architecture, aerial view",
        3
    ),
    (
        "017", "eco-bamboo-house-ubud",
        "A unique eco-friendly bamboo house in Ubud jungle, Bali, stunning bamboo architecture, open-air living spaces, natural pool, jungle canopy views",
        2
    ),
    (
        "018", "luxury-resort-penthouse-nusa-dua",
        "A luxury resort penthouse in Nusa Dua, Bali, expansive living space, ocean views from every room, resort pool and facilities, tropical luxury",
        2
    ),
    (
        "019", "surfers-paradise-uluwatu",
        "A laid-back surf villa near Padang Padang Beach, Uluwatu, Bali, pool, rooftop deck sunset view, surf boards, tropical casual style",
        2
    ),
    (
        "020", "hillside-land-jimbaran",
        "A hillside land plot in Jimbaran, Bali with panoramic bay views, terraced landscape, tropical vegetation, development potential, ocean visible",
        2
    ),
]


def generate_image(prompt: str, slug: str, index: int) -> str | None:
    """Generate a single image using Gemini and save it."""
    filename = f"{slug}-{index + 1}.png"
    filepath = OUTPUT_DIR / filename

    # Skip if already generated
    if filepath.exists() and filepath.stat().st_size > 0:
        print(f"  [SKIP] {filename} already exists")
        return f"/images/properties/{filename}"

    full_prompt = (
        f"Generate a photorealistic real estate photography image: {prompt}. "
        f"Professional architectural photography style, high quality, well-lit, "
        f"wide angle lens, no text or watermarks, no people."
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=full_prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )

        # Extract image from response parts
        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                image_data = part.inline_data.data
                with open(filepath, "wb") as f:
                    f.write(image_data)
                size_kb = filepath.stat().st_size // 1024
                print(f"  [OK] {filename} ({size_kb} KB)")
                return f"/images/properties/{filename}"

        print(f"  [WARN] No image data in response for {filename}")
        for part in response.candidates[0].content.parts:
            if part.text:
                print(f"         Gemini said: {part.text[:200]}")
        return None

    except Exception as e:
        print(f"  [ERROR] {filename}: {e}")
        return None


def main():
    print(f"Generating villa images using Gemini 2.0 Flash Exp")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"{'=' * 60}")

    results = {}
    total_generated = 0
    total_skipped = 0
    total_failed = 0

    for id_suffix, slug, prompt, num_images in PROPERTIES:
        print(f"\nProperty {id_suffix}: {slug}")
        images = []
        for i in range(num_images):
            angle_hints = [
                "front exterior view",
                "interior living area view",
                "pool and garden view",
                "aerial or elevated view",
            ]
            varied_prompt = f"{prompt}, {angle_hints[i % len(angle_hints)]}"

            path = generate_image(varied_prompt, slug, i)
            if path:
                images.append(path)
                total_generated += 1
            else:
                total_failed += 1

            # Rate limiting
            time.sleep(3)

        results[id_suffix] = {
            "slug": slug,
            "images": images,
            "thumbnail": images[0] if images else None,
        }

    print(f"\n{'=' * 60}")
    print(f"Results: {total_generated} generated, {total_failed} failed")
    print(f"\nGenerating updated seed SQL...")

    generate_updated_sql(results)


def generate_updated_sql(results: dict):
    """Generate a SQL update script with new image paths."""
    updated_sql = PROJECT_ROOT / "migrations" / "002_seed_data_generated_images.sql"

    with open(updated_sql, "w") as f:
        f.write("-- =============================================================================\n")
        f.write("-- Generated Villa Images - Update Script\n")
        f.write("-- Updates property images with AI-generated images from Gemini\n")
        f.write("-- Run after 002_seed_data.sql to replace Unsplash URLs with local images\n")
        f.write("-- =============================================================================\n\n")

        for id_suffix, data in results.items():
            if not data["images"]:
                continue

            prop_id = f"b1000000-0000-0000-0000-0000000000{id_suffix}"
            images_json = json.dumps(data["images"])

            f.write(f"-- Property: {data['slug']}\n")
            f.write(f"UPDATE properties SET\n")
            f.write(f"    images = '{images_json}'::jsonb,\n")
            f.write(f"    thumbnail_url = '{data['thumbnail']}'\n")
            f.write(f"WHERE id = '{prop_id}';\n\n")

    print(f"Updated SQL written to: {updated_sql}")

    summary_path = OUTPUT_DIR / "manifest.json"
    with open(summary_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Image manifest written to: {summary_path}")


if __name__ == "__main__":
    main()
