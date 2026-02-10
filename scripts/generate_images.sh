#!/usr/bin/env bash
set -euo pipefail

API_KEY="${GEMINI_API_KEY:?Set GEMINI_API_KEY env var}"
MODEL="nano-banana-pro-preview"
ENDPOINT="https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent"
OUT_DIR="$(cd "$(dirname "$0")/../frontend/public/images/properties" && pwd)"

mkdir -p "$OUT_DIR"

generate_image() {
  local id="$1"
  local prompt="$2"
  local outfile="${OUT_DIR}/${id}.jpg"

  if [[ -f "$outfile" ]]; then
    echo "SKIP $id (already exists)"
    return
  fi

  echo "GENERATING $id ..."
  echo "  Prompt: ${prompt:0:80}..."

  local response
  response=$(curl -s -X POST "${ENDPOINT}?key=${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$(cat <<ENDJSON
{
  "contents": [{
    "parts": [
      {"text": "$prompt"}
    ]
  }],
  "generationConfig": {
    "responseModalities": ["IMAGE"]
  }
}
ENDJSON
)")

  # Check for error
  if echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',{}).get('message',''))" 2>/dev/null | grep -q .; then
    local errmsg
    errmsg=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',{}).get('message','unknown error'))")
    echo "  ERROR: $errmsg"
    return 1
  fi

  # Extract base64 image data
  local b64data
  b64data=$(echo "$response" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for cand in d.get('candidates', []):
    for part in cand.get('content', {}).get('parts', []):
        if 'inlineData' in part:
            print(part['inlineData']['data'])
            sys.exit(0)
print('')
" 2>/dev/null)

  if [[ -z "$b64data" ]]; then
    echo "  ERROR: No image data in response"
    echo "$response" | python3 -m json.tool 2>/dev/null | head -20
    return 1
  fi

  echo "$b64data" | base64 -d > "$outfile"
  local size
  size=$(wc -c < "$outfile" | tr -d ' ')
  echo "  OK: ${outfile} (${size} bytes)"
}

# Property prompts - photorealistic Bali real estate photography style
declare -A PROMPTS
PROMPTS[b1000000-0000-0000-0000-000000000001]="Professional real estate photograph of a luxury beachfront villa in Seminyak Bali with infinity pool overlooking the ocean, tropical garden, modern Balinese architecture, golden hour sunset lighting, 4 bedrooms, high-end interior visible through glass doors, palm trees, pristine white sand beach in background"
PROMPTS[b1000000-0000-0000-0000-000000000002]="Professional real estate photograph of a modern tropical villa in Canggu Bali surrounded by lush green rice field terraces, contemporary architecture with natural wood and stone materials, private swimming pool, open-air living room, 3 bedrooms, morning light, tropical vegetation"
PROMPTS[b1000000-0000-0000-0000-000000000003]="Professional real estate photograph of a traditional Balinese villa compound in Ubud surrounded by dense tropical jungle, thatched roof pavilions, ornate stone carvings, garden courtyard with fountain, 5 bedrooms, lush vegetation, sacred temple elements, mystical morning mist"
PROMPTS[b1000000-0000-0000-0000-000000000004]="Professional real estate photograph of a spectacular modern clifftop villa in Uluwatu Bali with panoramic Indian Ocean views, dramatic cliff edge infinity pool, 6 bedrooms, contemporary minimalist architecture, white walls, sunset sky with orange and purple colors, waves crashing below"
PROMPTS[b1000000-0000-0000-0000-000000000005]="Professional real estate photograph of a charming colonial-style beach house in Sanur Bali with a lush tropical garden, covered veranda, 3 bedrooms, tiled roof, white walls, mature frangipani trees, calm blue ocean visible behind, morning light, relaxed beach town atmosphere"
PROMPTS[b1000000-0000-0000-0000-000000000006]="Professional real estate photograph of a premium modern penthouse apartment in Nusa Dua Bali with panoramic ocean views from a spacious balcony, luxurious interior with marble floors, floor-to-ceiling windows, 2 bedrooms, resort-style pool visible below, manicured tropical grounds"
PROMPTS[b1000000-0000-0000-0000-000000000007]="Professional real estate photograph of a prime flat land plot in Canggu Bali with beautiful rice field views, green terraced paddies stretching to the horizon, a red survey marker flag, palm trees lining the boundary, blue sky with white clouds, investment opportunity aerial perspective"
PROMPTS[b1000000-0000-0000-0000-000000000008]="Professional real estate photograph of a prime commercial retail space on a busy main street in Seminyak Bali, modern shopfront with large glass windows, trendy restaurant and boutique neighbors, pedestrian-friendly street, evening lighting, tropical urban setting"
PROMPTS[b1000000-0000-0000-0000-000000000009]="Professional real estate photograph of a luxury pool villa in Jimbaran Bali with sweeping bay views, private infinity pool, 3 bedrooms, Balinese-modern fusion architecture, alang-alang thatched roof gazebo, sunset over Jimbaran Bay, seafood restaurants below, warm golden lighting"
PROMPTS[b1000000-0000-0000-0000-000000000010]="Professional real estate photograph of a stylish boutique villa in the heart of Seminyak Bali, private plunge pool surrounded by tropical plants, 2 bedrooms, contemporary Bali design with exposed concrete and teak wood, outdoor shower, colorful bougainvillea, daytime shot"
PROMPTS[b1000000-0000-0000-0000-000000000011]="Professional real estate photograph of a cozy romantic jungle retreat villa in Ubud Bali, small private pool surrounded by tropical rainforest, 1 bedroom, open-air bathroom, bamboo furniture, wooden deck, hanging lanterns, morning sunlight filtering through palm fronds, serene atmosphere"
PROMPTS[b1000000-0000-0000-0000-000000000012]="Professional real estate photograph of a modern beachfront apartment in Sanur Bali, 2 bedrooms, contemporary interior with ocean views from living room, sunrise light streaming through windows, calm turquoise sea visible from balcony, clean minimalist Scandinavian-tropical design"
PROMPTS[b1000000-0000-0000-0000-000000000013]="Professional real estate photograph of a spacious family villa in Berawa Canggu Bali, large swimming pool with kids area, 4 bedrooms, open-plan living and dining area, tropical garden with lawn, modern architecture with natural materials, bright daytime shot, family-friendly atmosphere"
PROMPTS[b1000000-0000-0000-0000-000000000014]="Professional real estate photograph of a minimalist studio apartment with panoramic rice terrace views in Ubud Bali, 1 bedroom, floor-to-ceiling windows, modern compact design, small balcony overlooking green terraces, clean white interior with wood accents, morning light"
PROMPTS[b1000000-0000-0000-0000-000000000015]="Professional real estate photograph of a modern 3-bedroom townhouse in Seminyak Bali, three-story contemporary design, rooftop terrace, small garden courtyard, clean lines, tropical landscaping, motorcycle parking, quiet residential street, warm afternoon light"
PROMPTS[b1000000-0000-0000-0000-000000000016]="Professional real estate photograph of a grand oceanfront estate in Uluwatu Bali with private beach access, 8 bedrooms, massive resort-style infinity pool, manicured tropical gardens, stone pathways, Balinese pavilion, dramatic ocean backdrop with waves, luxury real estate, aerial perspective"
PROMPTS[b1000000-0000-0000-0000-000000000017]="Professional real estate photograph of a unique eco-friendly bamboo house in Ubud Bali, 2 bedrooms, stunning bamboo architecture rising from the jungle, open-air design, natural materials throughout, dramatic curved bamboo roof structure, river visible below, lush tropical vegetation"
PROMPTS[b1000000-0000-0000-0000-000000000018]="Professional real estate photograph of a luxury resort penthouse in Nusa Dua Bali, 3 bedrooms, expansive wraparound terrace with ocean views, resort pool and gardens below, elegant modern interior, marble and gold accents, five-star amenities visible, twilight blue hour shot"
PROMPTS[b1000000-0000-0000-0000-000000000019]="Professional real estate photograph of a surfer-style tropical villa near Padang Padang Beach in Uluwatu Bali, 3 bedrooms, laid-back bohemian design with surfboards on the wall, small pool, ocean glimpses through tropical trees, natural stone and wood materials, relaxed coastal vibe"
PROMPTS[b1000000-0000-0000-0000-000000000020]="Professional real estate photograph of hillside land with panoramic bay views in Jimbaran Bali, sloped terrain with potential ocean views, green grass and scattered palm trees, wooden fence boundary markers, overlooking Jimbaran Bay, blue sky, ideal luxury villa development plot"

echo "=== Generating ${#PROMPTS[@]} property images ==="
echo "Output directory: $OUT_DIR"
echo ""

count=0
total=${#PROMPTS[@]}
for id in $(echo "${!PROMPTS[@]}" | tr ' ' '\n' | sort); do
  count=$((count + 1))
  echo "[$count/$total] Property: $id"
  generate_image "$id" "${PROMPTS[$id]}" || true
  echo ""
  # Rate limiting - avoid hitting API quota
  if [[ $count -lt $total ]]; then
    sleep 2
  fi
done

echo "=== Done! Generated images in $OUT_DIR ==="
ls -lh "$OUT_DIR"/*.jpg 2>/dev/null || echo "No images generated"
