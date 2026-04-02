#!/usr/bin/env python3
"""Scrape 100 listings from villa-bali.com and upload to mybali.villas."""

import json, os, re, time, hashlib
from pathlib import Path
from urllib.parse import urlparse
import httpx
from bs4 import BeautifulSoup

ADMIN_API = "https://admin.mybali.villas/api/admin"
ADMIN_EMAIL = "admin@mybalivilla.com"
ADMIN_PASS = "admin123"
UPLOAD_API = "https://mybali.villas/api/v1/uploads/image"
OWNER_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / ".." / "scraped_data"
IMG_DIR = DATA_DIR / "images"
DATA_DIR.mkdir(exist_ok=True)
IMG_DIR.mkdir(exist_ok=True)

TARGET = 100


def get_admin_token():
    with httpx.Client(timeout=30) as c:
        r = c.post(f"{ADMIN_API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
        r.raise_for_status()
        return r.json()["data"]["token"]


def extract_villas_from_html(html):
    """Extract villa JSON data from villa-bali.com HTML using vfGlobals pattern."""
    # villa-bali.com uses: vfGlobals['villas'] = {"nbResults":...}
    for marker in ["vfGlobals['villas'] = {", "vfGlobals['villas']={", "'villas': {"]:
        start_idx = html.find(marker)
        if start_idx == -1:
            continue
        # Find the opening { of the JSON object
        json_start = start_idx + len(marker) - 1
        depth = 0
        i = json_start
        while i < len(html):
            if html[i] == "{":
                depth += 1
            elif html[i] == "}":
                depth -= 1
                if depth == 0:
                    break
            i += 1
        raw_json = html[json_start:i + 1]
        raw_json = raw_json.replace("&#36;", "$").replace("&#039;", "'").replace("&amp;", "&").replace("&quot;", '"')
        try:
            return json.loads(raw_json)
        except json.JSONDecodeError:
            continue
    return None


def scrape_listings():
    print("=== Scraping villa-bali.com ===")
    client = httpx.Client(headers=HEADERS, follow_redirects=True, timeout=30)
    all_villas = []
    seen_ids = set()

    # Paginate through main search
    for page in range(1, 8):
        url = f"https://www.villa-bali.com/en/search?page={page}"
        print(f"  Fetching page {page}...")
        try:
            r = client.get(url)
            if r.status_code != 200:
                print(f"    Status {r.status_code}, stopping")
                break
        except Exception as e:
            print(f"    Error: {e}")
            break

        data = extract_villas_from_html(r.text)
        if not data:
            print("    No data found")
            break

        items = data.get("items", [])
        new_count = 0
        for item in items:
            vid = item.get("villa", {}).get("id")
            if vid and vid not in seen_ids:
                seen_ids.add(vid)
                all_villas.append(item)
                new_count += 1
        print(f"    Got {new_count} new villas (total: {len(all_villas)})")
        if new_count == 0:
            break
        if len(all_villas) >= TARGET:
            break
        time.sleep(0.5)

    all_villas = all_villas[:TARGET]
    print(f"  Total summaries: {len(all_villas)}")

    # Fetch detail pages for images and descriptions
    listings = []
    for i, item in enumerate(all_villas):
        villa = item.get("villa", {})
        links = item.get("links", {})
        content = item.get("content", {})
        slug = villa.get("slug", "")
        location_name = villa.get("location", {}).get("name", "Bali")

        detail_path = links.get("villa", f"/en/villa/{location_name.lower()}/{slug}")
        detail_url = f"https://www.villa-bali.com{detail_path}"

        print(f"  [{i+1}/{len(all_villas)}] {slug}")

        try:
            r = client.get(detail_url)
            r.raise_for_status()
            soup = BeautifulSoup(r.text, "lxml")

            # Images
            image_urls = []
            seen_imgs = set()
            for img in soup.find_all(attrs={"data-src": True}):
                src = img["data-src"]
                if ("villa" in src.lower() or "cf-img" in src) and "logo" not in src.lower() and "icon" not in src.lower() and "partner" not in src.lower() and "payment" not in src.lower() and "user" not in src.lower():
                    if src not in seen_imgs:
                        seen_imgs.add(src)
                        image_urls.append(src)
            for img in soup.find_all("img", src=True):
                src = img["src"]
                if "cf-img" in src and "villa" in src.lower() and src not in seen_imgs:
                    seen_imgs.add(src)
                    image_urls.append(src)

            # Description
            description = ""
            meta_desc = soup.find("meta", {"name": "description"})
            if meta_desc:
                description = meta_desc.get("content", "")

            text = soup.get_text("\n", strip=True)
            lines = [l for l in text.split("\n") if l.strip()]
            desc_parts = []
            for line in lines:
                if len(line) > 80 and not line.startswith("©") and "cookie" not in line.lower() and "accept" not in line.lower():
                    desc_parts.append(line)
                    if len(" ".join(desc_parts)) > 500:
                        break
            if desc_parts:
                description = " ".join(desc_parts)

            # Features
            features = []
            for line in lines:
                if any(kw in line.lower() for kw in ["swimming pool", "private pool", "garden", "wifi", "kitchen", "parking", "staff", "breakfast", "gym", "spa", "bbq", "jacuzzi"]):
                    if 10 < len(line) < 60:
                        features.append(line.strip())

        except Exception as e:
            print(f"    Detail error: {e}")
            image_urls = []
            description = content.get("short_description", "") if isinstance(content, dict) else ""
            features = []

        name = villa.get("name", "")
        bedrooms = villa.get("bedroomNumber", 0)
        bathrooms = villa.get("bathroomNumber", 0)
        min_price = villa.get("minPrice", {})
        price = 0
        currency = "USD"
        if isinstance(min_price, dict):
            price = min_price.get("discountedPrice") or min_price.get("originalPrice", 0)
            curr_info = min_price.get("currency", {})
            if isinstance(curr_info, dict):
                currency = curr_info.get("code", "usd").upper()

        coords = villa.get("point", [])
        short_desc = content.get("short_description", "") if isinstance(content, dict) else ""

        if not description and short_desc:
            description = short_desc

        listings.append({
            "title": name,
            "description": description[:2000] if description else f"Beautiful {bedrooms}-bedroom villa in {location_name}, Bali.",
            "property_type": "villa",
            "listing_type": "short_term_rent",
            "price": price,
            "price_period": "per_night",
            "currency": currency,
            "area": location_name,
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "latitude": coords[1] if len(coords) > 1 else None,
            "longitude": coords[0] if len(coords) > 0 else None,
            "features": list(set(features))[:10] if features else ["Private Pool", "WiFi"],
            "image_urls": image_urls[:8],
            "contact": "Villa-Bali.com: +62 361 737 357 | WhatsApp: +62 812 3804 0785 | Email: info@villa-bali.com",
            "source": "villa-bali.com",
            "source_url": detail_url,
        })

        time.sleep(0.3)

    client.close()
    print(f"  Scraped {len(listings)} listings")
    return listings


def download_images(listings):
    print("\n=== Downloading images ===")
    client = httpx.Client(headers={
        **HEADERS,
        "Accept": "image/*,*/*;q=0.8",
        "Referer": "https://www.villa-bali.com/",
    }, follow_redirects=True, timeout=15)
    total = 0

    for i, listing in enumerate(listings):
        local_images = []
        for img_url in listing.get("image_urls", []):
            if not img_url or not img_url.startswith("http"):
                continue
            url_hash = hashlib.md5(img_url.encode()).hexdigest()[:12]
            ext = Path(urlparse(img_url).path).suffix or ".jpg"
            if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
                ext = ".jpg"
            filepath = IMG_DIR / f"{url_hash}{ext}"

            if filepath.exists():
                local_images.append(str(filepath))
                continue
            try:
                r = client.get(img_url, timeout=15)
                r.raise_for_status()
                filepath.write_bytes(r.content)
                local_images.append(str(filepath))
                total += 1
            except Exception as e:
                pass  # Skip failed downloads silently

        listing["local_images"] = local_images
        if (i + 1) % 25 == 0:
            print(f"  {i+1}/{len(listings)} ({total} downloaded)")

    client.close()
    print(f"  Downloaded {total} images")
    return listings


def upload_listings(listings, token):
    print(f"\n=== Uploading {len(listings)} listings ===")
    client = httpx.Client(timeout=60, follow_redirects=True)
    auth = {"Authorization": f"Bearer {token}"}
    uploaded = 0
    failed = 0

    for i, listing in enumerate(listings):
        # Upload images
        uploaded_imgs = []
        for img_path in listing.get("local_images", [])[:5]:
            try:
                with open(img_path, "rb") as f:
                    files = {"file": (Path(img_path).name, f, "image/jpeg")}
                    r = client.post(UPLOAD_API, files=files, headers=auth)
                    if r.status_code == 200:
                        img_url = r.json().get("data", {}).get("url", "")
                        if img_url:
                            uploaded_imgs.append(img_url)
            except Exception:
                pass

        if not uploaded_imgs and listing.get("image_urls"):
            uploaded_imgs = listing["image_urls"][:5]

        desc = listing.get("description", "")
        contact = listing.get("contact", "")
        if contact:
            desc += f"\n\nContact for reservation: {contact}"
        source_url = listing.get("source_url", "")
        if source_url:
            desc += f"\n\nOriginal listing: {source_url}"

        payload = {
            "title": listing["title"],
            "description": desc,
            "property_type": "villa",
            "listing_type": listing.get("listing_type", "short_term_rent"),
            "price": listing.get("price", 0),
            "currency": listing.get("currency", "USD"),
            "area": listing.get("area", "Bali"),
            "owner_id": OWNER_ID,
            "bedrooms": listing.get("bedrooms", 0),
            "bathrooms": listing.get("bathrooms", 0),
            "features": listing.get("features", []),
            "images": uploaded_imgs,
            "thumbnail_url": uploaded_imgs[0] if uploaded_imgs else None,
            "is_active": True,
        }
        if listing.get("price_period"):
            payload["price_period"] = listing["price_period"]
        if listing.get("latitude"):
            payload["latitude"] = listing["latitude"]
        if listing.get("longitude"):
            payload["longitude"] = listing["longitude"]
        payload = {k: v for k, v in payload.items() if v is not None}

        try:
            r = client.post(f"{ADMIN_API}/properties", json=payload, headers=auth)
            if r.status_code in [200, 201]:
                uploaded += 1
            else:
                print(f"    [{i+1}] Failed ({r.status_code}): {r.text[:150]}")
                failed += 1
        except Exception as e:
            print(f"    [{i+1}] Error: {e}")
            failed += 1

        if (i + 1) % 10 == 0:
            print(f"  Progress: {i+1}/{len(listings)} (uploaded: {uploaded}, failed: {failed})")

    client.close()
    print(f"\n=== Upload complete: {uploaded} success, {failed} failed ===")
    return uploaded, failed


def main():
    print("Villa-Bali.com Scraper & Uploader")
    print("=" * 50)

    token = get_admin_token()
    print(f"Auth token: {token[:20]}...")

    listings = scrape_listings()
    listings = download_images(listings)

    with open(DATA_DIR / "villa_bali_listings.json", "w") as f:
        json.dump(listings, f, indent=2, default=str)

    uploaded, failed = upload_listings(listings, token)
    print(f"\nDONE: {uploaded} uploaded, {failed} failed")


if __name__ == "__main__":
    main()
