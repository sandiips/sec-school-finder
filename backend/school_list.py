#!/usr/bin/env python3
"""
Fetch all Secondary schools from the MOE 'General information of schools' dataset
and print each slug on its own line, wrapped in quotes and followed by a comma:
"school-slug1",
"school-slug2",
…
"""

import requests
from slugify import slugify

# ID for the 'General information of schools' resource on data.gov.sg
RESOURCE_ID = "d_688b934f82c1059ed0a6993d2a829089"

def fetch_secondary_slugs(resource_id: str, limit: int = 1000) -> list[str]:
    """
    Retrieves up to `limit` records from the given resource,
    filters for mainlevel_code == 'SECONDARY',
    slugifies each school_name, and returns the list of slugs.
    """
    url = "https://data.gov.sg/api/action/datastore_search"
    params = {"resource_id": resource_id, "limit": limit}
    resp = requests.get(url, params=params)
    resp.raise_for_status()

    records = resp.json()["result"]["records"]
    slugs = []
    for rec in records:
        if rec.get("mainlevel_code", "").strip().lower() == "secondary":
            name = rec.get("school_name", "").strip()
            if name:
                slugs.append(slugify(name, lowercase=True))
    return slugs

def main():
    slugs = fetch_secondary_slugs(RESOURCE_ID)
    # Print each slug wrapped in quotes, with a trailing comma, one per line
    for slug in slugs:
        print(f'"{slug}",')

if __name__ == "__main__":
    main()
