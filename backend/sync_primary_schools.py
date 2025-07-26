#!/usr/bin/env python3
"""
Fetch all Primary schools from the MOE 'General information of schools' dataset,
generate a slug for each, then clear out your existing `primaries` table
and insert the fresh list of { slug, name, code } records—reporting successes
and any errors without assuming an `error` attribute on the response.
"""

import os
import requests
from slugify import slugify
from supabase import create_client, Client

# ——— CONFIGURATION ————————————————————————————————————————————————
RESOURCE_ID  = "d_688b934f82c1059ed0a6993d2a829089"
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
TABLE_NAME   = "primaries"
FETCH_LIMIT  = 1000
# ————————————————————————————————————————————————————————————————

def fetch_primary_schools(resource_id: str, limit: int = FETCH_LIMIT) -> list[dict]:
    """
    Retrieves up to `limit` records from data.gov.sg, filters for PRIMARY schools,
    and returns a list of dicts with keys: slug, name, code.
    """
    url = "https://data.gov.sg/api/action/datastore_search"
    params = {"resource_id": resource_id, "limit": limit}
    resp = requests.get(url, params=params)
    resp.raise_for_status()

    records = resp.json()["result"]["records"]
    primaries = []
    for rec in records:
        if rec.get("mainlevel_code", "").strip().lower() == "primary":
            name = rec.get("school_name", "").strip()
            code = rec.get("dgp_code", "").strip()   # Dgp Code field
            if name and code:
                primaries.append({
                    "slug": slugify(name, lowercase=True),
                    "name": name,
                    "code": code
                })
    return primaries

def sync_primaries():
    # 1) Fetch fresh data
    schools = fetch_primary_schools(RESOURCE_ID)
    if not schools:
        print("⚠️ No Primary schools found – aborting.")
        return

    # 2) Init Supabase client
    sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # 3) Delete existing rows
    try:
        del_resp = sb.table(TABLE_NAME).delete().neq("slug", "").execute()
        status = getattr(del_resp, "status_code", None) or del_resp.get("statusCode", None)
        if status and status >= 300:
            print(f"⚠️ Delete responded with status {status}; check your table permissions.")
        else:
            print(f"🗑  Cleared existing records from `{TABLE_NAME}`.")
    except Exception as e:
        print("⚠️ Could not clear existing records:", e)

    # 4) Insert new batch
    try:
        ins_resp = sb.table(TABLE_NAME).insert(schools).execute()
        # Try to pull the returned data payload to count inserted rows
        data = getattr(ins_resp, "data", None) or (ins_resp.get("data") if isinstance(ins_resp, dict) else None)
        count = len(data) if isinstance(data, list) else len(schools)
        print(f"✅ Inserted {count} records into `{TABLE_NAME}`.")
    except Exception as e:
        print("❌ Insert error:", e)

if __name__ == "__main__":
    sync_primaries()
