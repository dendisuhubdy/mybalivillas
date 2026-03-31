#!/usr/bin/env python3
"""Generate sample property listings with AI images and insert via API."""

import json, base64, time, os, urllib.request, urllib.error

API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL = "gemini-2.5-flash-image"
ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(SCRIPT_DIR, "..", "frontend", "public", "images", "listings")
os.makedirs(OUT_DIR, exist_ok=True)

LISTINGS = [
    # Sale Freehold
    {
        "title": "Modern Luxury Villa with Infinity Pool in Canggu",
        "slug": "modern-luxury-villa-canggu",
        "description": "Stunning 4-bedroom contemporary villa featuring an infinity pool overlooking rice fields, open-plan living spaces, fully equipped gourmet kitchen, and tropical gardens. Located in the heart of Canggu, minutes from Echo Beach and trendy cafes.",
        "property_type": "villa", "listing_type": "sale_freehold",
        "price": 950000, "currency": "USD",
        "area": "Canggu", "address": "Jl. Pantai Batu Bolong, Canggu",
        "bedrooms": 4, "bathrooms": 4, "land_size_sqm": 500, "building_size_sqm": 380,
        "features": ["Private Pool", "Rice Field View", "Fully Furnished", "Tropical Garden", "Parking", "Security"],
        "image_prompts": [
            "Luxurious modern Balinese villa exterior with infinity pool surrounded by tropical gardens, rice field view in background, contemporary architecture with natural stone and wood, golden hour lighting, real estate photography",
            "Beautiful open-plan living room of luxury Bali villa, high ceilings with wooden beams, modern furniture, floor-to-ceiling glass doors opening to pool and garden, interior design photography",
            "Elegant master bedroom in Bali villa with king bed, en-suite bathroom visible, tropical view through large windows, natural materials and neutral tones, real estate interior photography",
        ],
    },
    {
        "title": "Beachfront Estate with Ocean Views in Uluwatu",
        "slug": "beachfront-estate-uluwatu",
        "description": "Magnificent 5-bedroom clifftop estate with panoramic Indian Ocean views. Features a private cinema room, rooftop sunset lounge, 20-meter infinity pool, and direct cliff access. Premium Uluwatu location near top surf breaks.",
        "property_type": "villa", "listing_type": "sale_freehold",
        "price": 2800000, "currency": "USD",
        "area": "Uluwatu", "address": "Jl. Labuansait, Pecatu",
        "bedrooms": 5, "bathrooms": 6, "land_size_sqm": 1200, "building_size_sqm": 850,
        "features": ["Ocean View", "Infinity Pool", "Home Cinema", "Rooftop Lounge", "Staff Quarters", "Security"],
        "image_prompts": [
            "Spectacular clifftop luxury villa in Bali with dramatic ocean view, 20-meter infinity pool on cliff edge, modern tropical architecture, blue sky, premium real estate photography",
            "Luxurious rooftop lounge of Bali villa with panoramic ocean sunset view, comfortable outdoor furniture, cocktail bar, warm ambient lighting, lifestyle photography",
            "Stunning master suite in clifftop Bali villa with floor-to-ceiling windows showing ocean view, luxurious king bed, freestanding bathtub, modern tropical design",
        ],
    },
    {
        "title": "Prime Investment Land in Seminyak",
        "slug": "prime-land-seminyak",
        "description": "Rare 800sqm freehold land in prime Seminyak location, perfect for boutique hotel or villa development. Flat terrain with road access, electricity and water connected. Walking distance to Seminyak Beach.",
        "property_type": "land", "listing_type": "sale_freehold",
        "price": 1600000, "currency": "USD",
        "area": "Seminyak", "address": "Jl. Kayu Aya, Seminyak",
        "land_size_sqm": 800,
        "features": ["Freehold Title", "Flat Terrain", "Road Access", "Near Beach", "Electricity", "Water"],
        "image_prompts": [
            "Aerial view of a vacant plot of land in Bali with tropical vegetation, road access visible, surrounded by villas, flat terrain, real estate aerial photography",
        ],
    },
    # Sale Leasehold
    {
        "title": "Stylish 3BR Villa with Pool in Pererenan",
        "slug": "stylish-villa-pererenan",
        "description": "Beautifully designed 3-bedroom villa on a 25-year leasehold. Features a private pool, open-plan kitchen, outdoor shower, and lush tropical garden. Located in up-and-coming Pererenan, 5 minutes from the beach.",
        "property_type": "villa", "listing_type": "sale_leasehold",
        "price": 280000, "currency": "USD",
        "area": "Pererenan", "address": "Jl. Pantai Pererenan",
        "bedrooms": 3, "bathrooms": 3, "land_size_sqm": 300, "building_size_sqm": 220,
        "features": ["Private Pool", "Tropical Garden", "Fully Furnished", "Outdoor Shower", "WiFi", "AC"],
        "image_prompts": [
            "Charming modern Bali villa with private pool in tropical garden setting, natural stone and wood architecture, Pererenan style, inviting outdoor living area, real estate photography",
            "Bright open-plan kitchen and dining area of Bali villa, modern appliances, wooden countertops, tropical plants, natural light, interior photography",
            "Tropical garden with private swimming pool at Bali villa, loungers, frangipani trees, stone path, peaceful atmosphere, real estate exterior photography",
        ],
    },
    {
        "title": "Cozy 2BR Villa near Ubud Rice Terraces",
        "slug": "cozy-villa-ubud-terraces",
        "description": "Enchanting 2-bedroom villa surrounded by rice paddies on a 30-year lease. Features traditional Balinese architecture, yoga deck, and a plunge pool overlooking the terraces. Perfect retreat for nature lovers.",
        "property_type": "villa", "listing_type": "sale_leasehold",
        "price": 180000, "currency": "USD",
        "area": "Ubud", "address": "Jl. Raya Tegallalang, Ubud",
        "bedrooms": 2, "bathrooms": 2, "land_size_sqm": 400, "building_size_sqm": 160,
        "features": ["Rice Field View", "Plunge Pool", "Yoga Deck", "Traditional Architecture", "Garden", "WiFi"],
        "image_prompts": [
            "Traditional Balinese villa surrounded by emerald green rice terraces in Ubud, thatched roof, plunge pool, wooden deck, misty morning atmosphere, real estate photography",
            "Serene yoga deck at Ubud villa overlooking rice paddies, wooden platform with cushions, tropical plants, morning light, wellness lifestyle photography",
            "Cozy bedroom in traditional Bali villa with four-poster bed, natural materials, view of rice terraces through window, warm lighting, interior photography",
        ],
    },
    {
        "title": "Modern Apartment Complex in Sanur",
        "slug": "modern-apartment-sanur",
        "description": "Brand new 1-bedroom apartment in a modern complex with communal pool and gym. 20-year leasehold with option to extend. Walking distance to Sanur Beach promenade and international schools.",
        "property_type": "apartment", "listing_type": "sale_leasehold",
        "price": 95000, "currency": "USD",
        "area": "Sanur", "address": "Jl. Danau Tamblingan, Sanur",
        "bedrooms": 1, "bathrooms": 1, "building_size_sqm": 55,
        "features": ["Communal Pool", "Gym", "Security 24/7", "Near Beach", "Parking", "Furnished"],
        "image_prompts": [
            "Modern apartment building in tropical Bali setting with communal swimming pool, contemporary architecture, palm trees, well-maintained gardens, real estate photography",
        ],
    },
    # Short-Term Rent
    {
        "title": "Tropical Pool Villa - Daily Rental in Canggu",
        "slug": "tropical-pool-villa-daily-canggu",
        "description": "Perfect holiday villa with 3 bedrooms, private pool, and outdoor living pavilion. Located in central Canggu, walking distance to restaurants, shops, and surf spots. Includes daily housekeeping and breakfast.",
        "property_type": "villa", "listing_type": "short_term_rent",
        "price": 3500000, "price_period": "per_night", "currency": "IDR",
        "area": "Canggu", "address": "Jl. Batu Mejan, Canggu",
        "bedrooms": 3, "bathrooms": 3, "land_size_sqm": 350, "building_size_sqm": 250,
        "features": ["Private Pool", "Daily Housekeeping", "Breakfast Included", "WiFi", "AC", "Smart TV"],
        "image_prompts": [
            "Inviting tropical Bali villa with private pool ready for vacation guests, colorful tropical flowers, outdoor dining area, tiki torches, holiday atmosphere, hospitality photography",
            "Beautiful outdoor dining pavilion at Bali holiday villa, set table for breakfast, tropical garden view, morning sunshine, hospitality photography",
            "Luxurious guest bedroom in Bali rental villa, white linens, tropical decor, ceiling fan, fresh flowers on bedside table, hospitality interior photography",
        ],
    },
    {
        "title": "Romantic Rice Field Retreat in Ubud",
        "slug": "romantic-rice-field-retreat-ubud",
        "description": "Intimate 1-bedroom luxury retreat surrounded by rice paddies. Features an outdoor bathtub, private plunge pool, and breathtaking views. Ideal for couples seeking a unique Bali experience. Breakfast and spa credit included.",
        "property_type": "villa", "listing_type": "short_term_rent",
        "price": 2800000, "price_period": "per_night", "currency": "IDR",
        "area": "Ubud", "address": "Jl. Suweta, Ubud",
        "bedrooms": 1, "bathrooms": 1, "land_size_sqm": 200, "building_size_sqm": 80,
        "features": ["Rice Field View", "Plunge Pool", "Outdoor Bathtub", "Breakfast Included", "Spa Credit", "WiFi"],
        "image_prompts": [
            "Romantic luxury retreat in Ubud Bali with outdoor bathtub overlooking rice paddies, candles, flower petals, intimate atmosphere, sunset light, luxury hospitality photography",
            "Private plunge pool at intimate Bali retreat with rice terrace view, wooden deck, tropical plants, couples resort atmosphere, travel photography",
            "Elegant open-air bedroom at Bali retreat with canopy bed, flowing curtains, rice field view, romantic lighting, luxury accommodation photography",
        ],
    },
    {
        "title": "Beachfront Holiday Home in Nusa Dua",
        "slug": "beachfront-holiday-nusa-dua",
        "description": "Spacious 4-bedroom beachfront house available for weekly rental. Direct beach access, BBQ area, large garden, and ocean views from every room. Perfect for families and groups visiting Bali.",
        "property_type": "house", "listing_type": "short_term_rent",
        "price": 18000000, "price_period": "per_week", "currency": "IDR",
        "area": "Nusa Dua", "address": "BTDC Area, Nusa Dua",
        "bedrooms": 4, "bathrooms": 3, "land_size_sqm": 600, "building_size_sqm": 350,
        "features": ["Beachfront", "Ocean View", "BBQ Area", "Garden", "Parking", "Fully Equipped Kitchen"],
        "image_prompts": [
            "Spacious beachfront holiday house in Nusa Dua Bali with ocean view, large terrace, tropical garden leading to white sand beach, family vacation atmosphere, real estate photography",
            "Bright living room of beachfront Bali house with ocean panorama through windows, comfortable sofas, natural materials, coastal decor, interior photography",
            "Tropical garden with BBQ area at beachfront Bali house, ocean visible in background, outdoor dining table, palm trees, family-friendly atmosphere, hospitality photography",
        ],
    },
]


def generate_image(filename, prompt):
    outfile = os.path.join(OUT_DIR, filename)
    if os.path.exists(outfile) and os.path.getsize(outfile) > 1000:
        print(f"    SKIP {filename}")
        return True
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["IMAGE"]}}).encode()
    req = urllib.request.Request(ENDPOINT, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())
    except Exception as e:
        print(f"    ERROR: {e}")
        return False
    for cand in data.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            if "inlineData" in part:
                with open(outfile, "wb") as f:
                    f.write(base64.b64decode(part["inlineData"]["data"]))
                print(f"    OK {filename}")
                return True
    print(f"    ERROR: No image data for {filename}")
    return False


def main():
    if not API_KEY:
        print("ERROR: GEMINI_API_KEY not set"); return

    for i, listing in enumerate(LISTINGS, 1):
        slug = listing["slug"]
        print(f"\n[{i}/{len(LISTINGS)}] {listing['title']}")

        # Generate images
        image_urls = []
        for j, prompt in enumerate(listing.get("image_prompts", []), 1):
            filename = f"{slug}-{j}.jpg"
            if generate_image(filename, prompt):
                image_urls.append(f"/images/listings/{filename}")
            time.sleep(2)

        listing["_image_urls"] = image_urls

    # Output SQL for inserting
    print("\n\n=== SQL INSERT STATEMENTS ===\n")
    admin_id = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
    for listing in LISTINGS:
        images_json = json.dumps(listing["_image_urls"])
        features_json = json.dumps(listing.get("features", []))
        thumb = listing["_image_urls"][0] if listing["_image_urls"] else ""
        pp = f"'{listing['price_period']}'" if listing.get("price_period") else "NULL"
        land = listing.get("land_size_sqm", "NULL")
        building = listing.get("building_size_sqm", "NULL")
        beds = listing.get("bedrooms", 0)
        baths = listing.get("bathrooms", 0)

        sql = f"""INSERT INTO properties (owner_id, title, slug, description, property_type, listing_type, price, price_period, currency, area, address, bedrooms, bathrooms, land_size_sqm, building_size_sqm, features, images, thumbnail_url, is_active, is_featured) VALUES ('{admin_id}', '{listing["title"].replace("'", "''")}', '{listing["slug"]}', '{listing["description"].replace("'", "''")}', '{listing["property_type"]}', '{listing["listing_type"]}', {listing["price"]}, {pp}, '{listing["currency"]}', '{listing["area"]}', '{listing.get("address", "")}', {beds}, {baths}, {land if land != "NULL" else "NULL"}, {building if building != "NULL" else "NULL"}, '{features_json}'::jsonb, '{images_json}'::jsonb, '{thumb}', true, true);"""
        print(sql)
        print()


if __name__ == "__main__":
    main()
