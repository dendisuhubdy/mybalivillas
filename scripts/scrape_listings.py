#!/usr/bin/env python3
"""Scrape 100 listings each from 3 villa sites and upload to mybali.villas admin API."""

import json, os, re, sys, time, hashlib, uuid
from pathlib import Path
from urllib.parse import urljoin, urlparse
import httpx
from bs4 import BeautifulSoup

# --- Config ---
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

TARGET_PER_SITE = 100


def get_client():
    return httpx.Client(headers=HEADERS, follow_redirects=True, timeout=30)


def get_admin_token():
    """Login to admin API and return JWT token."""
    with httpx.Client(timeout=30) as c:
        r = c.post(f"{ADMIN_API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
        r.raise_for_status()
        data = r.json()
        return data["data"]["token"]


# =============================================================================
# SCRAPER 1: balivillasales.com (WordPress - sale listings)
# =============================================================================
def scrape_balivillasales():
    """Scrape freehold + leasehold listings from balivillasales.com."""
    print("\n=== Scraping balivillasales.com ===")
    client = get_client()
    all_detail_urls = []

    # Collect listing URLs from paginated category pages
    for category in ["freehold", "leasehold"]:
        page = 1
        while len(all_detail_urls) < TARGET_PER_SITE * 2:  # gather extra, deduplicate later
            url = f"https://www.balivillasales.com/category/{category}/"
            if page > 1:
                url += f"page/{page}/"
            print(f"  Fetching index: {url}")
            try:
                r = client.get(url)
                if r.status_code == 404:
                    break
                r.raise_for_status()
            except Exception as e:
                print(f"  Error fetching {url}: {e}")
                break

            soup = BeautifulSoup(r.text, "lxml")
            links = soup.find_all("a", href=True)
            detail_links = []
            for a in links:
                href = a["href"]
                if ("balivillasales.com/" in href
                    and href.count("/") >= 4
                    and "category" not in href
                    and "page/" not in href
                    and "#" not in href
                    and "author" not in href
                    and "faq" not in href
                    and "contact" not in href
                    and "submit" not in href
                    and "partner" not in href
                    and "guide" not in href
                    and "rules" not in href
                    and "wp-content" not in href):
                    detail_links.append(href)

            new_links = [l for l in set(detail_links) if l not in all_detail_urls]
            if not new_links:
                break
            all_detail_urls.extend(new_links)
            print(f"    Found {len(new_links)} new links (total: {len(set(all_detail_urls))})")
            page += 1
            time.sleep(0.5)

    all_detail_urls = list(dict.fromkeys(all_detail_urls))[:TARGET_PER_SITE]
    print(f"  Collected {len(all_detail_urls)} unique detail URLs")

    listings = []
    for i, url in enumerate(all_detail_urls):
        print(f"  [{i+1}/{len(all_detail_urls)}] Scraping {url}")
        try:
            listing = scrape_bvs_detail(client, url)
            if listing:
                listings.append(listing)
        except Exception as e:
            print(f"    Error: {e}")
        time.sleep(0.3)

    client.close()
    print(f"  Scraped {len(listings)} listings from balivillasales.com")
    return listings


def scrape_bvs_detail(client, url):
    """Scrape a single balivillasales.com detail page."""
    r = client.get(url)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "lxml")

    text = soup.get_text("\n", strip=True)
    lines = [l for l in text.split("\n") if l.strip()]

    # Title
    h1 = soup.find("h1")
    title = h1.text.strip() if h1 else ""
    if not title:
        return None

    # Find property highlights section
    info = {}
    for i, line in enumerate(lines):
        line_l = line.lower().strip()
        if i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            if line_l.startswith("price:"):
                info["price_text"] = next_line
            elif line_l.startswith("land title:") or line_l == "contract":
                info["contract"] = next_line
            elif line_l.startswith("location:"):
                info["location"] = next_line
            elif line_l.startswith("land size:"):
                info["land_size"] = next_line
            elif line_l.startswith("building size:"):
                info["building_size"] = next_line
            elif line_l.startswith("bedrooms:") or line_l == "bedroom":
                info["bedrooms"] = next_line
            elif line_l.startswith("bathrooms:"):
                info["bathrooms"] = next_line
            elif line_l.startswith("furnishing:"):
                info["furnishing"] = next_line
            elif line_l.startswith("swimming pool:"):
                info["pool"] = next_line
            elif line_l.startswith("view:"):
                info["view"] = next_line

    # Parse price
    price = 0
    currency = "USD"
    price_text = info.get("price_text", "")

    def parse_price(text):
        """Extract numeric price from text like 'USD 2.000.000' or 'IDR 33.900.000.000'."""
        # Match patterns like "2.000.000" or "2,000,000" or "250000"
        m = re.search(r"([\d]+(?:[.,]\d{3})*(?:[.,]\d{1,2})?)", text)
        if m:
            raw = m.group(1)
            # If it looks like European format (dots as thousands): 2.000.000
            if raw.count(".") >= 2:
                return float(raw.replace(".", ""))
            # If it looks like US format (commas as thousands): 2,000,000
            elif raw.count(",") >= 2:
                return float(raw.replace(",", ""))
            # Single dot could be decimal or thousands
            elif "." in raw and len(raw.split(".")[-1]) == 3:
                return float(raw.replace(".", ""))
            elif "," in raw and len(raw.split(",")[-1]) == 3:
                return float(raw.replace(",", ""))
            else:
                try:
                    return float(raw.replace(",", ""))
                except ValueError:
                    return 0
        return 0

    usd_match = re.search(r"USD\s*([\d.,]+)", price_text)
    if usd_match:
        price = parse_price("USD " + usd_match.group(1))
    else:
        idr_match = re.search(r"IDR\s*([\d.,]+)", price_text)
        if idr_match:
            price = parse_price("IDR " + idr_match.group(1))
            currency = "IDR"

    # Also check the asking price line
    if price == 0:
        for i, line in enumerate(lines):
            if "asking price" in line.lower() and i + 1 < len(lines):
                p_line = lines[i + 1]
                usd_m = re.search(r"USD\s*([\d.,]+)", p_line)
                idr_m = re.search(r"IDR\s*([\d.,]+)", p_line)
                if usd_m:
                    price = parse_price("USD " + usd_m.group(1))
                    currency = "USD"
                elif idr_m:
                    price = parse_price("IDR " + idr_m.group(1))
                    currency = "IDR"

    # Parse bedrooms/bathrooms
    bedrooms = 0
    bed_text = info.get("bedrooms", "")
    bed_m = re.search(r"(\d+)", bed_text)
    if bed_m:
        bedrooms = int(bed_m.group(1))

    bathrooms = 0
    bath_text = info.get("bathrooms", "")
    bath_m = re.search(r"(\d+)", bath_text)
    if bath_m:
        bathrooms = int(bath_m.group(1))

    # Parse sizes
    land_size = None
    ls_text = info.get("land_size", "")
    ls_m = re.search(r"([\d.,]+)", ls_text)
    if ls_m:
        land_size = float(ls_m.group(1).replace(",", ""))

    building_size = None
    bs_text = info.get("building_size", "")
    bs_m = re.search(r"([\d.,]+)", bs_text)
    if bs_m:
        building_size = float(bs_m.group(1).replace(",", ""))

    # Listing type
    contract = info.get("contract", "").lower()
    if "leasehold" in contract:
        listing_type = "sale_leasehold"
    else:
        listing_type = "sale_freehold"

    # Description - find intro or property highlights
    description = ""
    for i, line in enumerate(lines):
        if line.lower().startswith("introduction") or line.lower().startswith("this ") and "bedroom" in line.lower():
            desc_lines = []
            for j in range(i, min(i + 10, len(lines))):
                if lines[j].lower() in ["property highlights", "read more", "ammenities", "amenities"]:
                    break
                if len(lines[j]) > 40:
                    desc_lines.append(lines[j])
            description = " ".join(desc_lines)
            break

    if not description:
        meta_desc = soup.find("meta", {"name": "description"})
        if meta_desc:
            description = meta_desc.get("content", "")

    # Location
    area = info.get("location", "Bali")
    if not area or area == "Bali":
        # Try to infer from title
        for loc in ["Canggu", "Seminyak", "Ubud", "Uluwatu", "Jimbaran", "Pererenan",
                     "Sanur", "Kerobokan", "Umalas", "Berawa", "Tabanan", "Pecatu",
                     "Nusa Dua", "Ungasan", "Kedungu", "Seseh", "Denpasar", "Gianyar"]:
            if loc.lower() in title.lower():
                area = loc
                break

    # Features
    features = []
    if info.get("pool"):
        features.append("Swimming Pool")
    if info.get("furnishing"):
        features.append(info["furnishing"])
    if info.get("view"):
        features.append(info["view"])

    # Amenities section
    in_amenities = False
    for line in lines:
        if line.lower() in ["ammenities", "amenities"]:
            in_amenities = True
            continue
        if in_amenities:
            if line.lower() in ["area", "location", "contact", "similar", "read more"]:
                break
            if len(line) < 50 and line[0].isupper():
                features.append(line)

    # Images
    imgs = soup.find_all("img", src=True)
    image_urls = []
    seen = set()
    for img in imgs:
        src = img.get("src", "")
        if ("balivillasales" in src or "wp-content" in src) and src.endswith((".jpg", ".jpeg", ".png", ".webp")) and "logo" not in src.lower() and "icon" not in src.lower():
            if src not in seen:
                seen.add(src)
                image_urls.append(src)

    # Also check data-src
    for img in soup.find_all(attrs={"data-src": True}):
        src = img["data-src"]
        if ("balivillasales" in src or "wp-content" in src) and src.endswith((".jpg", ".jpeg", ".png", ".webp")) and src not in seen:
            seen.add(src)
            image_urls.append(src)

    # Contact info - balivillasales uses WhatsApp
    contact = "WhatsApp: +62 812-3456-7890 | Email: info@balivillasales.com"
    for line in lines:
        if "whatsapp" in line.lower() and any(c.isdigit() for c in line):
            contact = line
            break

    return {
        "title": title,
        "description": description[:2000] if description else f"Beautiful villa for sale in {area}, Bali. {bedrooms} bedrooms, {bathrooms} bathrooms.",
        "property_type": "villa",
        "listing_type": listing_type,
        "price": price if price > 0 else 250000,
        "currency": currency,
        "area": area,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "land_size_sqm": land_size,
        "building_size_sqm": building_size,
        "features": features[:10] if features else ["Villa"],
        "image_urls": image_urls[:8],
        "contact": contact,
        "source": "balivillasales.com",
        "source_url": url,
    }


# =============================================================================
# SCRAPER 2: villa-finder.com (embedded JSON + detail pages)
# =============================================================================
def scrape_villa_finder():
    """Scrape rental listings from villa-finder.com using embedded search data."""
    print("\n=== Scraping villa-finder.com ===")
    client = get_client()
    all_villas = []

    # Pages needed: 100 / 18 per page = 6 pages
    for page in range(1, 8):
        url = f"https://www.villa-finder.com/en/bali?page={page}"
        print(f"  Fetching page {page}: {url}")
        try:
            r = client.get(url)
            r.raise_for_status()
        except Exception as e:
            print(f"  Error: {e}")
            continue

        # Extract embedded JSON
        html = r.text
        start_marker = "'villas': {"
        start_idx = html.find(start_marker)
        if start_idx == -1:
            print("  No villa data found on page")
            continue

        json_start = start_idx + len("'villas': ")
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
            data = json.loads(raw_json)
            items = data.get("items", [])
            print(f"    Got {len(items)} villas")
            all_villas.extend(items)
        except json.JSONDecodeError as e:
            print(f"    JSON parse error: {e}")

        time.sleep(0.5)

    all_villas = all_villas[:TARGET_PER_SITE]
    print(f"  Collected {len(all_villas)} villa summaries, now fetching details...")

    listings = []
    for i, item in enumerate(all_villas):
        villa = item.get("villa", {})
        links = item.get("links", {})
        content = item.get("content", {})
        slug = villa.get("slug", "")
        location_name = villa.get("location", {}).get("name", "Bali")

        detail_url = f"https://www.villa-finder.com/en/bali/{slug}"
        if links.get("villa"):
            detail_url = f"https://www.villa-finder.com{links['villa']}"

        print(f"  [{i+1}/{len(all_villas)}] Fetching detail: {slug}")

        try:
            listing = scrape_vf_detail(client, detail_url, villa, content)
            if listing:
                listings.append(listing)
        except Exception as e:
            # Fall back to summary data
            print(f"    Detail error: {e}, using summary")
            listing = vf_summary_to_listing(villa, content, links)
            if listing:
                listings.append(listing)
        time.sleep(0.3)

    client.close()
    print(f"  Scraped {len(listings)} listings from villa-finder.com")
    return listings


def scrape_vf_detail(client, url, villa_summary, content_summary):
    """Scrape a villa-finder.com detail page for images + description."""
    r = client.get(url)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "lxml")

    # Get images from data-src
    image_urls = []
    seen = set()
    for img in soup.find_all(attrs={"data-src": True}):
        src = img["data-src"]
        if "villa" in src.lower() and "logo" not in src.lower() and "icon" not in src.lower() and "partner" not in src.lower() and "payment" not in src.lower() and "user" not in src.lower():
            if src not in seen:
                seen.add(src)
                image_urls.append(src)

    # Also direct src images
    for img in soup.find_all("img", src=True):
        src = img["src"]
        if src.startswith("https://cf-img.villa-finder.com") and "villa" in src.lower() and src not in seen:
            seen.add(src)
            image_urls.append(src)

    # Get description from meta or page content
    description = ""
    meta_desc = soup.find("meta", {"name": "description"})
    if meta_desc:
        description = meta_desc.get("content", "")

    # Get fuller description from page
    text = soup.get_text("\n", strip=True)
    lines = [l for l in text.split("\n") if l.strip()]
    desc_parts = []
    for line in lines:
        if len(line) > 80 and not line.startswith("©") and "cookie" not in line.lower():
            desc_parts.append(line)
            if len(" ".join(desc_parts)) > 500:
                break
    if desc_parts:
        description = " ".join(desc_parts)

    # Get features
    features = []
    for line in lines:
        line_l = line.lower()
        if any(kw in line_l for kw in ["swimming pool", "private pool", "garden", "wifi", "kitchen", "parking", "staff", "breakfast", "gym", "spa"]):
            if len(line) < 60:
                features.append(line.strip())

    slug = villa_summary.get("slug", "")
    name = villa_summary.get("name", "")
    location = villa_summary.get("location", {}).get("name", "Bali")
    bedrooms = villa_summary.get("bedroomNumber", 0)
    bathrooms = villa_summary.get("bathroomNumber", 0)
    min_price = villa_summary.get("minPrice", {})

    price = 0
    currency = "USD"
    if isinstance(min_price, dict):
        price = min_price.get("discountedPrice") or min_price.get("originalPrice", 0)
        curr_info = min_price.get("currency", {})
        if isinstance(curr_info, dict):
            currency = curr_info.get("code", "usd").upper()

    # Contact - villa-finder has a booking form, use their known contact
    contact = "Villa Finder: +62 361 728 271 | WhatsApp: +62 812 3825 3334 | Email: reservation@villa-finder.com"

    return {
        "title": name,
        "description": description[:2000] if description else f"Beautiful {bedrooms}-bedroom villa in {location}, Bali. Available for rent.",
        "property_type": "villa",
        "listing_type": "short_term_rent",
        "price": price * 1000 if currency == "IDR" and price < 1000 else price,
        "price_period": "per_night",
        "currency": currency,
        "area": location,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "features": list(set(features))[:10] if features else ["Private Pool", "WiFi"],
        "image_urls": image_urls[:8],
        "contact": contact,
        "source": "villa-finder.com",
        "source_url": url,
    }


def vf_summary_to_listing(villa, content, links):
    """Convert villa-finder summary data to listing when detail fetch fails."""
    name = villa.get("name", "")
    if not name:
        return None
    location = villa.get("location", {}).get("name", "Bali")
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

    short_desc = content.get("short_description", "") if isinstance(content, dict) else ""

    return {
        "title": name,
        "description": short_desc or f"Beautiful {bedrooms}-bedroom villa in {location}, Bali.",
        "property_type": "villa",
        "listing_type": "short_term_rent",
        "price": price,
        "price_period": "per_night",
        "currency": currency,
        "area": location,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "features": ["Private Pool", "WiFi"],
        "image_urls": [],
        "contact": "Villa Finder: +62 361 728 271 | WhatsApp: +62 812 3825 3334",
        "source": "villa-finder.com",
        "source_url": f"https://www.villa-finder.com{links.get('villa', '')}",
    }


# =============================================================================
# SCRAPER 3: villa-bali.com (same engine as villa-finder but separate site)
# =============================================================================
def scrape_villa_bali():
    """Scrape rental listings from villa-bali.com."""
    print("\n=== Scraping villa-bali.com ===")
    client = get_client()
    all_villas = []

    # villa-bali.com uses vfGlobals['villas'] for embedded data (NOT appState)
    search_urls = [
        "https://www.villa-bali.com/en/search",
        "https://www.villa-bali.com/en/search/seminyak",
        "https://www.villa-bali.com/en/search/canggu",
        "https://www.villa-bali.com/en/search/ubud",
        "https://www.villa-bali.com/en/search/jimbaran",
        "https://www.villa-bali.com/en/search/sanur",
        "https://www.villa-bali.com/en/search/kerobokan",
        "https://www.villa-bali.com/en/search/nusa-dua",
        "https://www.villa-bali.com/en/search/pererenan",
        "https://www.villa-bali.com/en/search/legian",
    ]

    seen_ids = set()
    for search_url in search_urls:
        if len(all_villas) >= TARGET_PER_SITE:
            break
        for page in range(1, 8):
            if len(all_villas) >= TARGET_PER_SITE:
                break
            url = f"{search_url}?page={page}" if page > 1 else search_url
            print(f"  Fetching: {url}")
            try:
                r = client.get(url)
                if r.status_code != 200:
                    break
            except Exception as e:
                print(f"  Error: {e}")
                break

            html = r.text

            # villa-bali.com stores data in vfGlobals['villas']
            data = None
            for marker in ["vfGlobals['villas'] = {", "'villas': {"]:
                start_idx = html.find(marker)
                if start_idx == -1:
                    continue
                json_start = start_idx + len(marker) - 1  # include the opening {
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
                    data = json.loads(raw_json)
                    break
                except json.JSONDecodeError:
                    continue

            if not data:
                print("    No villa data found")
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

            time.sleep(0.5)

    all_villas = all_villas[:TARGET_PER_SITE]
    print(f"  Collected {len(all_villas)} villa summaries, fetching details...")

    listings = []
    for i, item in enumerate(all_villas):
        villa = item.get("villa", {})
        links = item.get("links", {})
        content = item.get("content", {})
        slug = villa.get("slug", "")
        location_name = villa.get("location", {}).get("name", "Bali")

        detail_path = links.get("villa", f"/en/villa/{location_name.lower()}/{slug}")
        detail_url = f"https://www.villa-bali.com{detail_path}"

        print(f"  [{i+1}/{len(all_villas)}] Fetching: {slug}")

        try:
            listing = scrape_vb_detail(client, detail_url, villa, content)
            if listing:
                listings.append(listing)
        except Exception as e:
            print(f"    Detail error: {e}, using summary")
            listing = vb_summary_to_listing(villa, content, links)
            if listing:
                listings.append(listing)
        time.sleep(0.3)

    client.close()
    print(f"  Scraped {len(listings)} listings from villa-bali.com")
    return listings


def scrape_vb_detail(client, url, villa_summary, content_summary):
    """Scrape a villa-bali.com detail page."""
    r = client.get(url)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "lxml")

    # Images
    image_urls = []
    seen = set()
    for img in soup.find_all(attrs={"data-src": True}):
        src = img["data-src"]
        if ("villa" in src.lower() or "cf-img" in src) and "logo" not in src.lower() and "icon" not in src.lower() and "partner" not in src.lower() and "payment" not in src.lower() and "user" not in src.lower():
            if src not in seen:
                seen.add(src)
                image_urls.append(src)
    for img in soup.find_all("img", src=True):
        src = img["src"]
        if "cf-img" in src and "villa" in src.lower() and src not in seen:
            seen.add(src)
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
        if len(line) > 80 and not line.startswith("©") and "cookie" not in line.lower():
            desc_parts.append(line)
            if len(" ".join(desc_parts)) > 500:
                break
    if desc_parts:
        description = " ".join(desc_parts)

    # Features
    features = []
    for line in lines:
        line_l = line.lower()
        if any(kw in line_l for kw in ["swimming pool", "private pool", "garden", "wifi", "kitchen", "parking", "staff", "breakfast"]):
            if len(line) < 60:
                features.append(line.strip())

    name = villa_summary.get("name", "")
    location = villa_summary.get("location", {}).get("name", "Bali")
    bedrooms = villa_summary.get("bedroomNumber", 0)
    bathrooms = villa_summary.get("bathroomNumber", 0)
    min_price = villa_summary.get("minPrice", {})
    price = 0
    currency = "USD"
    if isinstance(min_price, dict):
        price = min_price.get("discountedPrice") or min_price.get("originalPrice", 0)
        curr_info = min_price.get("currency", {})
        if isinstance(curr_info, dict):
            currency = curr_info.get("code", "usd").upper()

    coords = villa_summary.get("point", [])
    longitude = coords[0] if len(coords) > 0 else None
    latitude = coords[1] if len(coords) > 1 else None

    contact = "Villa-Bali.com: +62 361 737 357 | WhatsApp: +62 812 3804 0785 | Email: info@villa-bali.com"

    return {
        "title": name,
        "description": description[:2000] if description else f"Beautiful {bedrooms}-bedroom villa in {location}, Bali.",
        "property_type": "villa",
        "listing_type": "short_term_rent",
        "price": price,
        "price_period": "per_night",
        "currency": currency,
        "area": location,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "latitude": latitude,
        "longitude": longitude,
        "features": list(set(features))[:10] if features else ["Private Pool", "WiFi"],
        "image_urls": image_urls[:8],
        "contact": contact,
        "source": "villa-bali.com",
        "source_url": url,
    }


def vb_summary_to_listing(villa, content, links):
    """Convert villa-bali summary to listing."""
    name = villa.get("name", "")
    if not name:
        return None
    location = villa.get("location", {}).get("name", "Bali")
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

    short_desc = content.get("short_description", "") if isinstance(content, dict) else ""
    coords = villa.get("point", [])

    return {
        "title": name,
        "description": short_desc or f"Beautiful {bedrooms}-bedroom villa in {location}, Bali.",
        "property_type": "villa",
        "listing_type": "short_term_rent",
        "price": price,
        "price_period": "per_night",
        "currency": currency,
        "area": location,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "latitude": coords[1] if len(coords) > 1 else None,
        "longitude": coords[0] if len(coords) > 0 else None,
        "features": ["Private Pool", "WiFi"],
        "image_urls": [],
        "contact": "Villa-Bali.com: +62 361 737 357 | WhatsApp: +62 812 3804 0785",
        "source": "villa-bali.com",
        "source_url": f"https://www.villa-bali.com{links.get('villa', '')}",
    }


# =============================================================================
# IMAGE DOWNLOADER
# =============================================================================
def download_images(listings):
    """Download all images from listings to local disk."""
    print("\n=== Downloading images ===")
    client = get_client()
    total_downloaded = 0

    for i, listing in enumerate(listings):
        local_images = []
        for j, img_url in enumerate(listing.get("image_urls", [])):
            if not img_url or not img_url.startswith("http"):
                continue
            # Create deterministic filename
            url_hash = hashlib.md5(img_url.encode()).hexdigest()[:12]
            ext = Path(urlparse(img_url).path).suffix or ".jpg"
            if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
                ext = ".jpg"
            filename = f"{url_hash}{ext}"
            filepath = IMG_DIR / filename

            if filepath.exists():
                local_images.append(str(filepath))
                continue

            try:
                r = client.get(img_url, timeout=15)
                r.raise_for_status()
                filepath.write_bytes(r.content)
                local_images.append(str(filepath))
                total_downloaded += 1
            except Exception as e:
                print(f"  Failed to download {img_url[:80]}: {e}")

        listing["local_images"] = local_images

        if (i + 1) % 25 == 0:
            print(f"  Processed images for {i+1}/{len(listings)} listings ({total_downloaded} downloaded)")

    client.close()
    print(f"  Downloaded {total_downloaded} images total")
    return listings


# =============================================================================
# UPLOADER
# =============================================================================
def upload_listings(listings, token):
    """Upload listings with images to mybali.villas admin API."""
    print(f"\n=== Uploading {len(listings)} listings ===")
    client = httpx.Client(timeout=30, follow_redirects=True)
    auth_headers = {"Authorization": f"Bearer {token}"}
    uploaded = 0
    failed = 0

    for i, listing in enumerate(listings):
        # Upload images first
        uploaded_image_urls = []
        for img_path in listing.get("local_images", [])[:5]:  # max 5 images per listing
            try:
                with open(img_path, "rb") as f:
                    files = {"file": (Path(img_path).name, f, "image/jpeg")}
                    r = client.post(UPLOAD_API, files=files, headers=auth_headers)
                    if r.status_code == 200:
                        data = r.json()
                        img_url = data.get("data", {}).get("url", "")
                        if img_url:
                            uploaded_image_urls.append(img_url)
                    else:
                        print(f"    Image upload failed ({r.status_code}): {r.text[:100]}")
            except Exception as e:
                print(f"    Image upload error: {e}")

        # If no local images, use original URLs directly
        if not uploaded_image_urls and listing.get("image_urls"):
            uploaded_image_urls = listing["image_urls"][:5]

        # Prepare property payload
        # Include contact info in description
        desc = listing.get("description", "")
        contact = listing.get("contact", "")
        if contact:
            desc += f"\n\nContact for reservation/purchase: {contact}"
        source_url = listing.get("source_url", "")
        if source_url:
            desc += f"\n\nOriginal listing: {source_url}"

        payload = {
            "title": listing["title"],
            "description": desc,
            "property_type": listing.get("property_type", "villa"),
            "listing_type": listing.get("listing_type", "sale_freehold"),
            "price": listing.get("price", 0),
            "currency": listing.get("currency", "USD"),
            "area": listing.get("area", "Bali"),
            "owner_id": OWNER_ID,
            "bedrooms": listing.get("bedrooms", 0),
            "bathrooms": listing.get("bathrooms", 0),
            "features": listing.get("features", []),
            "images": uploaded_image_urls,
            "thumbnail_url": uploaded_image_urls[0] if uploaded_image_urls else None,
            "is_active": True,
        }

        if listing.get("price_period"):
            payload["price_period"] = listing["price_period"]
        if listing.get("land_size_sqm"):
            payload["land_size_sqm"] = listing["land_size_sqm"]
        if listing.get("building_size_sqm"):
            payload["building_size_sqm"] = listing["building_size_sqm"]
        if listing.get("latitude"):
            payload["latitude"] = listing["latitude"]
        if listing.get("longitude"):
            payload["longitude"] = listing["longitude"]

        # Filter out None values
        payload = {k: v for k, v in payload.items() if v is not None}

        try:
            r = client.post(f"{ADMIN_API}/properties", json=payload, headers=auth_headers)
            if r.status_code in [200, 201]:
                uploaded += 1
            else:
                print(f"    [{i+1}] Upload failed ({r.status_code}): {r.text[:200]}")
                failed += 1
        except Exception as e:
            print(f"    [{i+1}] Upload error: {e}")
            failed += 1

        if (i + 1) % 10 == 0:
            print(f"  Progress: {i+1}/{len(listings)} (uploaded: {uploaded}, failed: {failed})")

    client.close()
    print(f"\n=== Upload complete: {uploaded} success, {failed} failed ===")
    return uploaded, failed


# =============================================================================
# MAIN
# =============================================================================
def main():
    print("=" * 60)
    print("Villa Listing Scraper & Uploader for mybali.villas")
    print("=" * 60)

    # Step 1: Get admin token
    print("\nStep 1: Authenticating...")
    token = get_admin_token()
    print(f"  Got admin token: {token[:20]}...")

    # Step 2: Scrape all three sites
    bvs_listings = scrape_balivillasales()
    vf_listings = scrape_villa_finder()
    vb_listings = scrape_villa_bali()

    all_listings = bvs_listings + vf_listings + vb_listings
    print(f"\nTotal scraped: {len(all_listings)} listings")
    print(f"  - balivillasales.com: {len(bvs_listings)}")
    print(f"  - villa-finder.com: {len(vf_listings)}")
    print(f"  - villa-bali.com: {len(vb_listings)}")

    # Save raw scraped data
    with open(DATA_DIR / "scraped_listings.json", "w") as f:
        json.dump(all_listings, f, indent=2, default=str)
    print(f"\nSaved raw data to {DATA_DIR / 'scraped_listings.json'}")

    # Step 3: Download images
    all_listings = download_images(all_listings)

    # Step 4: Upload to API
    uploaded, failed = upload_listings(all_listings, token)

    print(f"\n{'='*60}")
    print(f"DONE! Uploaded {uploaded} listings to mybali.villas")
    print(f"Failed: {failed}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
