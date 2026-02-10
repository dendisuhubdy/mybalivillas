#!/usr/bin/env python3
"""Generate area images using Google Gemini Nano Banana Pro."""

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
OUT_DIR = os.path.join(SCRIPT_DIR, "..", "frontend", "public", "images", "areas")
os.makedirs(OUT_DIR, exist_ok=True)

AREAS = [
    ("seminyak",
     "Beautiful aerial landscape photograph of Seminyak Bali, trendy beachside area with upscale beach clubs, golden sand beach, turquoise ocean waves, luxury villas and restaurants along the coast, palm trees, vibrant sunset sky, professional travel photography"),
    ("canggu",
     "Beautiful aerial landscape photograph of Canggu Bali, surf village with lush green rice paddies in foreground, rugged coastline with breaking waves, hip cafes and villas scattered among tropical vegetation, dramatic cloud formations, golden hour lighting, professional travel photography"),
    ("ubud",
     "Beautiful aerial landscape photograph of Ubud Bali, cultural heart of Bali with iconic tiered rice terraces (Tegallalang), dense tropical jungle, ancient stone temples, Ayung river valley, misty morning atmosphere, lush green vegetation, professional travel photography"),
    ("uluwatu",
     "Beautiful aerial landscape photograph of Uluwatu Bali, dramatic limestone cliffs dropping into deep blue Indian Ocean, Uluwatu temple perched on cliff edge, world-class surf breaks with white foam waves, golden sunset sky, rugged coastline, professional travel photography"),
    ("sanur",
     "Beautiful aerial landscape photograph of Sanur Bali, relaxed coastal town with calm turquoise waters, traditional jukung fishing boats on white sand beach, paved beachfront promenade lined with trees, Mount Agung visible in distance, peaceful morning light, professional travel photography"),
    ("nusa-dua",
     "Beautiful aerial landscape photograph of Nusa Dua Bali, exclusive resort enclave with pristine white sand beaches, crystal clear turquoise lagoon, manicured tropical gardens, luxury resorts along the coastline, water sports activities, bright blue sky, professional travel photography"),
    ("jimbaran",
     "Beautiful aerial landscape photograph of Jimbaran Bay Bali, sweeping crescent bay with calm waters, seafood restaurants on the beach with flickering torches, traditional fishing boats, Bali airport runway visible in distance, spectacular orange and pink sunset sky, professional travel photography"),
    ("kuta",
     "Beautiful aerial landscape photograph of Kuta Bali, bustling tourist hub with wide sandy beach, surfers riding waves, colorful beachfront, busy streets with shops and hotels, aircraft approaching nearby airport, vibrant tropical energy, late afternoon golden light, professional travel photography"),
]


def generate_image(slug, prompt):
    outfile = os.path.join(OUT_DIR, f"{slug}.jpg")
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
    print(f"=== Generating {len(AREAS)} area images ===")
    print(f"Model: {MODEL}")
    print(f"Output: {OUT_DIR}")
    print()

    success = 0
    for i, (slug, prompt) in enumerate(AREAS, 1):
        print(f"[{i}/{len(AREAS)}] {slug}")
        print(f"  Prompt: {prompt[:70]}...")
        if generate_image(slug, prompt):
            success += 1
        print()

        # Rate limiting
        if i < len(AREAS):
            time.sleep(3)

    print(f"=== Done! {success}/{len(AREAS)} images generated ===")

    # List output
    files = sorted(f for f in os.listdir(OUT_DIR) if f.endswith(".jpg"))
    total_size = sum(os.path.getsize(os.path.join(OUT_DIR, f)) for f in files)
    print(f"{len(files)} files, {total_size / 1024 / 1024:.1f} MB total")


if __name__ == "__main__":
    main()
