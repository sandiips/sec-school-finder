#!/usr/bin/env python3
# geo_code.py

import json
import time
import os

from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable

INPUT_PATH  = "data/moe_schools_cop_2024.json"
OUTPUT_PATH = "data/moe_schools_cop_2024_geo.json"
USER_AGENT  = "school-finder-geocoder"
MAX_RETRIES = 3
TIMEOUT     = 10  # seconds

def geocode_with_retries(geolocator, address):
    """Try up to MAX_RETRIES to geocode, return (lat, lng) or (None, None)."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            loc = geolocator.geocode(address, timeout=TIMEOUT)
            if loc:
                return loc.latitude, loc.longitude
            # no result → break early
            return None, None
        except (GeocoderTimedOut, GeocoderUnavailable) as e:
            print(f"  ⚠️  Attempt {attempt}/{MAX_RETRIES} failed for '{address}': {e}")
            if attempt < MAX_RETRIES:
                time.sleep(2 ** attempt)  # exponential backoff: 2, 4, 8s
            else:
                print(f"  ❌ Giving up on '{address}'")
                return None, None

def main():
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    # 1) Load
    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        schools = json.load(f)

    geolocator = Nominatim(user_agent=USER_AGENT)

    # 2) Geocode missing entries
    for rec in schools:
        if "lat" in rec and rec["lat"] is not None:
            continue  # already geocoded

        addr = rec.get("address")
        if not addr:
            print(f"→ Skipping '{rec['name']}' (no address)")
            rec["lat"], rec["lng"] = None, None
            continue

        print(f"→ Geocoding '{rec['name']}' @ {addr}")
        lat, lng = geocode_with_retries(geolocator, addr)
        rec["lat"], rec["lng"] = lat, lng
        print(f"   → Result: lat={lat}, lng={lng}")
        time.sleep(1)  # polite rate‑limit

    # 3) Write out
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(schools, f, ensure_ascii=False, indent=2)

    print(f"\n✔ Geocoded data written to '{OUTPUT_PATH}'")

if __name__ == "__main__":
    main()
