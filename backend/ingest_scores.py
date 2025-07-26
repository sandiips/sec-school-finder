#!/usr/bin/env python3
import os
import json
import pandas as pd
import re
from collections import defaultdict
from difflib import get_close_matches
from supabase import create_client, Client
from postgrest.exceptions import APIError

# ─── CONFIG ───────────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")

# Initialize Supabase client
auth_supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
# Use same for writes
supabase: Client = auth_supabase

# ─── SLUGIFY HELPERS ───────────────────────────────────────────────────────────
def slugify(name: str) -> str:
    s = name.lower().strip()
    # remove punctuation
    s = re.sub(r"[\.\'\"\(\):,]", "", s)
    # replace spaces/underscores with hyphens
    s = re.sub(r"[\s_]+", "-", s)
    return s

# ─── FETCH VALID SLUGS ─────────────────────────────────────────────────────────
resp = auth_supabase.table('schools').select('name').execute()
valid_entries = resp.data or []
valid_slugs = set(slugify(entry.get('name','')) for entry in valid_entries)

# Helper to normalize raw slug to a valid school slug
def normalize_slug(raw: str) -> str:
    slug = raw.strip().lower()
    if slug in valid_slugs:
        return slug
    # try fuzzy matching
    matches = get_close_matches(slug, list(valid_slugs), n=1, cutoff=0.75)
    return matches[0] if matches else slug

# ─── DATA LOADER ────────────────────────────────────────────────────────────────
def load_data(prefix: str) -> list:
    json_path = os.path.join('data', f'{prefix}_scores.json')
    csv_path  = os.path.join('data', f'{prefix}_scores_extracted.csv')
    if os.path.exists(json_path):
        print(f"[DEBUG] Loading JSON data from {json_path}")
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"[DEBUG] Loaded {len(data)} rows from JSON for '{prefix}'")
        return data
    elif os.path.exists(csv_path):
        print(f"[DEBUG] Loading CSV data from {csv_path}")
        df = pd.read_csv(csv_path)
        print(f"[DEBUG] Loaded {len(df)} rows from CSV for '{prefix}'")
        return df.to_dict(orient='records')
    else:
        print(f"⚠️ No data file found for {prefix}")
        return []

# ─── INGEST FOOTBALL SCORES ─────────────────────────────────────────────────────
def ingest_sports():
    """Extract best knockout round per school from match numbers, insert with year."""
    rows = load_data('football')
    if not rows:
        print("⚠️ No football data to process")
        return
    print(f"[DEBUG] Sample football row keys: {list(rows[0].keys())}")

    # Determine weight per match: Quarterfinals=1, Semifinals=2, Finals=3
    weights = {}
    for row in rows:
        match_no = (row.get('MATCH NO') or row.get('Match No') or '').upper()
        if 'QF' in match_no:
            w = 1
        elif 'SF' in match_no:
            w = 2
        elif 'FINAL' in match_no:
            w = 3
        else:
            w = 0
        # Assign for both teams
        for team_key in ['TEAM A', 'Team A', 'team a', 'TEAM_A']:
            team = row.get(team_key)
            if team:
                slug = normalize_slug(slugify(team))
                weights[slug] = max(weights.get(slug, 0), w)
        for team_key in ['TEAM B', 'Team B', 'team b', 'TEAM_B']:
            team = row.get(team_key)
            if team:
                slug = normalize_slug(slugify(team))
                weights[slug] = max(weights.get(slug, 0), w)

    print(f"[DEBUG] Computed football weights sample: {list(weights.items())[:5]}")
    records = [
        {
            'school_slug': slug,
            'sport': 'football',
            'score': float(weight),
            'year': 2024
        }
        for slug, weight in weights.items() if weight > 0
    ]
    if not records:
        print("⚠️ No football records to insert")
        return
    # Delete existing for year
    print("[DEBUG] Deleting existing football records for 2024")
    supabase.table('school_sports_scores')\
        .delete().eq('sport','football').eq('year',2024).execute()
    print(f"[DEBUG] Inserting {len(records)} football records")
    supabase.table('school_sports_scores').insert(records).execute()
    print(f"✔️ Inserted {len(records)} football records")

# ─── INGEST CCA SCORES ───────────────────────────────────────────────────────────
def ingest_cca():
    """Count National Robotics Competition entries per school, insert with year."""
    rows = load_data('cca')
    if not rows:
        print("⚠️ No CCA data to process")
        return
    counts = defaultdict(int)
    for row in rows:
        raw = row.get('school_slug') or row.get('School','')
        slug = normalize_slug(slugify(raw))
        counts[slug] += 1
    print(f"[DEBUG] Computed CCA counts sample: {list(counts.items())[:5]}")
    records = [
        {
            'school_slug': slug,
            'cca': 'National Robotics Competition',
            'score': float(cnt),
            'year': 2024
        }
        for slug, cnt in counts.items()
    ]
    if not records:
        print("⚠️ No CCA records to insert")
        return
    print("[DEBUG] Deleting existing CCA records for 2024")
    supabase.table('school_cca_scores')\
        .delete().eq('cca','National Robotics Competition').eq('year',2024).execute()
    print(f"[DEBUG] Inserting {len(records)} CCA records")
    supabase.table('school_cca_scores').insert(records).execute()
    print(f"✔️ Inserted {len(records)} CCA records")

# ─── MAIN ───────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("🔄 Starting ingestion...")
    ingest_sports()
    ingest_cca()
    print("✅ Ingestion complete")
