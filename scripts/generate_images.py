#!/usr/bin/env python3
"""Generate property images using Google Gemini Nano Banana Pro."""

import json
import base64
import time
import os
import sys
import urllib.request
import urllib.error

API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL = "nano-banana-pro-preview"
ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(SCRIPT_DIR, "..", "frontend", "public", "images", "properties")
os.makedirs(OUT_DIR, exist_ok=True)

PROPERTIES = [
    ("b1000000-0000-0000-0000-000000000001",
     "Professional real estate photograph of a luxury beachfront villa in Seminyak Bali with infinity pool overlooking the ocean, tropical garden, modern Balinese architecture, golden hour sunset lighting, 4 bedrooms, high-end interior visible through glass doors, palm trees, pristine white sand beach in background"),
    ("b1000000-0000-0000-0000-000000000002",
     "Professional real estate photograph of a modern tropical villa in Canggu Bali surrounded by lush green rice field terraces, contemporary architecture with natural wood and stone materials, private swimming pool, open-air living room, 3 bedrooms, morning light, tropical vegetation"),
    ("b1000000-0000-0000-0000-000000000003",
     "Professional real estate photograph of a traditional Balinese villa compound in Ubud surrounded by dense tropical jungle, thatched roof pavilions, ornate stone carvings, garden courtyard with fountain, 5 bedrooms, lush vegetation, sacred temple elements, mystical morning mist"),
    ("b1000000-0000-0000-0000-000000000004",
     "Professional real estate photograph of a spectacular modern clifftop villa in Uluwatu Bali with panoramic Indian Ocean views, dramatic cliff edge infinity pool, 6 bedrooms, contemporary minimalist architecture, white walls, sunset sky with orange and purple colors, waves crashing below"),
    ("b1000000-0000-0000-0000-000000000005",
     "Professional real estate photograph of a charming colonial-style beach house in Sanur Bali with a lush tropical garden, covered veranda, 3 bedrooms, tiled roof, white walls, mature frangipani trees, calm blue ocean visible behind, morning light, relaxed beach town atmosphere"),
    ("b1000000-0000-0000-0000-000000000006",
     "Professional real estate photograph of a premium modern penthouse apartment in Nusa Dua Bali with panoramic ocean views from a spacious balcony, luxurious interior with marble floors, floor-to-ceiling windows, 2 bedrooms, resort-style pool visible below, manicured tropical grounds"),
    ("b1000000-0000-0000-0000-000000000007",
     "Professional real estate photograph of a prime flat land plot in Canggu Bali with beautiful rice field views, green terraced paddies stretching to the horizon, palm trees lining the boundary, blue sky with white clouds, investment opportunity, wide angle landscape"),
    ("b1000000-0000-0000-0000-000000000008",
     "Professional real estate photograph of a prime commercial retail space on a busy main street in Seminyak Bali, modern shopfront with large glass windows, trendy restaurant and boutique neighbors, pedestrian-friendly street, evening lighting, tropical urban setting"),
    ("b1000000-0000-0000-0000-000000000009",
     "Professional real estate photograph of a luxury pool villa in Jimbaran Bali with sweeping bay views, private infinity pool, 3 bedrooms, Balinese-modern fusion architecture, alang-alang thatched roof gazebo, sunset over Jimbaran Bay, warm golden lighting"),
    ("b1000000-0000-0000-0000-000000000010",
     "Professional real estate photograph of a stylish boutique villa in the heart of Seminyak Bali, private plunge pool surrounded by tropical plants, 2 bedrooms, contemporary Bali design with exposed concrete and teak wood, outdoor shower, colorful bougainvillea, daytime shot"),
    ("b1000000-0000-0000-0000-000000000011",
     "Professional real estate photograph of a cozy romantic jungle retreat villa in Ubud Bali, small private pool surrounded by tropical rainforest, 1 bedroom, open-air bathroom, bamboo furniture, wooden deck, hanging lanterns, morning sunlight filtering through palm fronds, serene atmosphere"),
    ("b1000000-0000-0000-0000-000000000012",
     "Professional real estate photograph of a modern beachfront apartment in Sanur Bali, 2 bedrooms, contemporary interior with ocean views from living room, sunrise light streaming through windows, calm turquoise sea visible from balcony, clean minimalist tropical design"),
    ("b1000000-0000-0000-0000-000000000013",
     "Professional real estate photograph of a spacious family villa in Berawa Canggu Bali, large swimming pool with kids area, 4 bedrooms, open-plan living and dining area, tropical garden with lawn, modern architecture with natural materials, bright daytime shot"),
    ("b1000000-0000-0000-0000-000000000014",
     "Professional real estate photograph of a minimalist studio apartment with panoramic rice terrace views in Ubud Bali, 1 bedroom, floor-to-ceiling windows, modern compact design, small balcony overlooking green terraces, clean white interior with wood accents, morning light"),
    ("b1000000-0000-0000-0000-000000000015",
     "Professional real estate photograph of a modern 3-bedroom townhouse in Seminyak Bali, three-story contemporary design, rooftop terrace, small garden courtyard, clean lines, tropical landscaping, warm afternoon light"),
    ("b1000000-0000-0000-0000-000000000016",
     "Professional real estate photograph of a grand oceanfront estate in Uluwatu Bali with private beach access, 8 bedrooms, massive resort-style infinity pool, manicured tropical gardens, stone pathways, Balinese pavilion, dramatic ocean backdrop with waves, aerial perspective"),
    ("b1000000-0000-0000-0000-000000000017",
     "Professional real estate photograph of a unique eco-friendly bamboo house in Ubud Bali, 2 bedrooms, stunning bamboo architecture rising from the jungle, open-air design, natural materials throughout, dramatic curved bamboo roof structure, river visible below, lush tropical vegetation"),
    ("b1000000-0000-0000-0000-000000000018",
     "Professional real estate photograph of a luxury resort penthouse in Nusa Dua Bali, 3 bedrooms, expansive wraparound terrace with ocean views, resort pool and gardens below, elegant modern interior, marble and gold accents, twilight blue hour shot"),
    ("b1000000-0000-0000-0000-000000000019",
     "Professional real estate photograph of a surfer-style tropical villa near Padang Padang Beach in Uluwatu Bali, 3 bedrooms, laid-back bohemian design with surfboards on the wall, small pool, ocean glimpses through tropical trees, natural stone and wood materials, relaxed coastal vibe"),
    ("b1000000-0000-0000-0000-000000000020",
     "Professional real estate photograph of hillside land with panoramic bay views in Jimbaran Bali, sloped terrain with potential ocean views, green grass and scattered palm trees, overlooking Jimbaran Bay, blue sky, ideal luxury villa development plot"),
]


def generate_image(prop_id, prompt):
    outfile = os.path.join(OUT_DIR, f"{prop_id}.jpg")
    if os.path.exists(outfile) and os.path.getsize(outfile) > 1000:
        print(f"  SKIP (already exists, {os.path.getsize(outfile)} bytes)")
        return True

    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]}
    }).encode("utf-8")

    req = urllib.request.Request(
        ENDPOINT,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        print(f"  HTTP ERROR {e.code}: {err_body[:200]}")
        return False
    except Exception as e:
        print(f"  ERROR: {e}")
        return False

    if "error" in data:
        print(f"  API ERROR: {data['error'].get('message', 'unknown')}")
        return False

    # Extract image
    for cand in data.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            if "inlineData" in part:
                img_bytes = base64.b64decode(part["inlineData"]["data"])
                with open(outfile, "wb") as f:
                    f.write(img_bytes)
                print(f"  OK: {len(img_bytes):,} bytes -> {outfile}")
                return True

    print("  ERROR: No image data in response")
    return False


def main():
    print(f"=== Generating {len(PROPERTIES)} property images ===")
    print(f"Model: {MODEL}")
    print(f"Output: {OUT_DIR}")
    print()

    success = 0
    for i, (prop_id, prompt) in enumerate(PROPERTIES, 1):
        print(f"[{i}/{len(PROPERTIES)}] {prop_id}")
        print(f"  Prompt: {prompt[:70]}...")
        if generate_image(prop_id, prompt):
            success += 1
        print()

        # Rate limiting
        if i < len(PROPERTIES):
            time.sleep(3)

    print(f"=== Done! {success}/{len(PROPERTIES)} images generated ===")

    # List output
    files = sorted(f for f in os.listdir(OUT_DIR) if f.endswith(".jpg"))
    total_size = sum(os.path.getsize(os.path.join(OUT_DIR, f)) for f in files)
    print(f"{len(files)} files, {total_size / 1024 / 1024:.1f} MB total")


if __name__ == "__main__":
    main()
