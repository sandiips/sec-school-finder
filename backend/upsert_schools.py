#!/usr/bin/env python3
import os
import json
from supabase import create_client, Client

# ─── CONFIG ───────────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")

INPUT_PATH = "data/moe_schools_cop_2024_geo.json"
TABLE_NAME = "schools"

# ─── INIT CLIENT ────────────────────────────────────────────────────────────────
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── HELPERS ────────────────────────────────────────────────────────────────────
def chunked_iterable(iterable, size):
    for i in range(0, len(iterable), size):
        yield iterable[i : i + size]

# ─── MAIN ───────────────────────────────────────────────────────────────────────
def main():
    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    print(f"Loaded {len(records)} records from {INPUT_PATH}")

    BATCH_SIZE = 100
    for batch in chunked_iterable(records, BATCH_SIZE):
        try:
            res = supabase.table(TABLE_NAME).upsert(batch, on_conflict=["name"]).execute()
        except Exception as exc:
            print(f"❌ Exception during upsert: {exc}")
            continue

        # supabase-py v2: APIResponse may not have .error, so use getattr
        err = getattr(res, "error", None)
        status = getattr(res, "status_code", None)

        if err:
            print(f"⚠️  Upsert error: {err}")
        elif status and not (200 <= status < 300):
            print(f"⚠️  Unexpected status code: {status}")
        else:
            print(f"✔  Upserted {len(batch)} records (status {status})")

    print("Done.")

if __name__ == "__main__":
    main()
