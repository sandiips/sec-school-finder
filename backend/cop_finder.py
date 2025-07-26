#!/usr/bin/env python3
"""
cop_finder.py

1) fetch_school_data() scrapes:
     - School code
     - Address
     - PSLE COP ranges by Posting Group (including any HCL qualifiers)
2) batch_fetch() loads any existing JSON (with error handling),
   skips already-fetched schools, fetches the rest, and appends
   them to the JSON under data/.
"""

import requests
from bs4 import BeautifulSoup
import re
import json
from json import JSONDecodeError
import os
import time

BASE_URL = "https://www.moe.gov.sg/schoolfinder/schooldetail?schoolname={}"


def slugify(name: str) -> str:
    """Convert a school name into the hyphenated slug used by MOE."""
    s = name.lower()
    s = re.sub(r"[^\w\s-]", "", s)
    return re.sub(r"[\s_]+", "-", s).strip("-")


def parse_range(text: str):
    """
    Parse strings like:
       "4(D) - 6(M)" → (4, "D", 6, "M")
       "25 - 28"     → (25, None, 28, None)
       "15"          → (15, None, 15, None)
       "-" or ""     → (None, None, None, None)
    """
    t = text.strip()
    if not t or t in ("-", "–"):
        return None, None, None, None

    parts = re.split(r"\s*[–-]\s*", t)
    def parse_part(p: str):
        m = re.match(r"^(\d+)(?:\((\w+)\))?$", p.strip())
        if not m:
            return None, None
        return int(m.group(1)), m.group(2) if m.group(2) else None

    if len(parts) == 1:
        lo, loq = parse_part(parts[0])
        return lo, loq, lo, loq
    else:
        lo, loq = parse_part(parts[0])
        hi, hiq = parse_part(parts[1])
        return lo, loq, hi, hiq


def fetch_school_data(school_name: str, year: int = 2024) -> dict:
    """
    Scrape code, address, and COP ranges for a given school and year.
    Returns {
      name, code, address,
      cop_ranges: [
        {
          year, posting_group,
          affiliated_min_score, affiliated_min_qualifier,
          affiliated_max_score, affiliated_max_qualifier,
          nonaffiliated_min_score, nonaffiliated_min_qualifier,
          nonaffiliated_max_score, nonaffiliated_max_qualifier
        }, …
      ]
    }
    """
    slug = slugify(school_name)
    url = BASE_URL.format(slug)
    resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    # — School code —
    code_node = soup.find(string=re.compile(r"School code", re.IGNORECASE))
    if not code_node:
        raise RuntimeError(f"School code not found for '{school_name}'")
    code_text = code_node.parent.get_text(strip=True)
    m_code = re.search(r"(\d+)", code_text)
    code = int(m_code.group(1)) if m_code else None

    # — Address —
    addr_el = soup.find("a", string=re.compile(r".+,\s*S\d{6}$"))
    address = addr_el.get_text(strip=True) if addr_el else None

    # — COP table for the given year —
    heading = soup.find(
        "span",
        class_="moe-collapsible__heading",
        string=re.compile(f"PSLE score range of {year}", re.IGNORECASE)
    )
    if not heading:
        raise RuntimeError(f"PSLE heading for {year} not found for '{school_name}'")
    block = heading.find_parent("div", class_="moe-collapsible__block")
    table = block.find("table")
    if not table or not table.tbody:
        raise RuntimeError(f"No COP table under PSLE heading for '{school_name}'")

    cop_rows = []
    for tr in table.tbody.find_all("tr"):
        pg_text = tr.th.get_text(strip=True)
        m_pg = re.search(r"(\d+)", pg_text)
        pg = int(m_pg.group(1)) if m_pg else None

        cells = [td.get_text(strip=True) for td in tr.find_all("td")]
        a_lo,  a_loq,  a_hi,  a_hiq  = parse_range(cells[0])
        n_lo,  n_loq,  n_hi,  n_hiq  = parse_range(cells[1])

        cop_rows.append({
            "year":                          year,
            "posting_group":                 pg,
            "affiliated_min_score":          a_lo,
            "affiliated_min_qualifier":      a_loq,
            "affiliated_max_score":          a_hi,
            "affiliated_max_qualifier":      a_hiq,
            "nonaffiliated_min_score":       n_lo,
            "nonaffiliated_min_qualifier":   n_loq,
            "nonaffiliated_max_score":       n_hi,
            "nonaffiliated_max_qualifier":   n_hiq,
        })

    return {
        "name":       school_name,
        "code":       code,
        "address":    address,
        "cop_ranges": cop_rows
    }


def batch_fetch(
    school_list: list[str],
    year: int = 2024,
    out_path: str = "data/moe_schools_cop_2024.json",
    pause: float = 1.0
):
    """
    1) Attempt to load existing JSON (catching JSONDecodeError).
    2) Skip names already present.
    3) Fetch the rest, append, and overwrite the file.
    """
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    # Load existing, or start fresh on error/empty
    existing = []
    fetched_names = set()
    if os.path.isfile(out_path):
        try:
            with open(out_path, "r", encoding="utf-8") as f:
                existing = json.load(f)
            fetched_names = {rec["name"] for rec in existing}
        except (JSONDecodeError, ValueError):
            print(f"⚠️  Warning: could not parse '{out_path}' – starting empty.")
            existing = []
            fetched_names = set()

    to_fetch = [s for s in school_list if s not in fetched_names]
    if not to_fetch:
        print("✔ All schools already fetched; nothing to do.")
        return

    new_records = []
    for name in to_fetch:
        print(f"→ Fetching '{name}' … ", end="", flush=True)
        try:
            rec = fetch_school_data(name, year)
            new_records.append(rec)
            print("OK")
        except Exception as e:
            print(f"FAIL ({e})")
        time.sleep(pause)

    combined = existing + new_records
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)

    print(f"\n✔ Appended {len(new_records)} record(s); total now {len(combined)} at {out_path}")


if __name__ == "__main__":
    # === EDIT THIS LIST as needed ===
    schools_to_fetch = [
        "anglochinese-school-barker-road",
        "crescent-girls-school",
        "northlight-school"

        # … add or correct slugs here
    ]

    batch_fetch(
        schools_to_fetch,
        year=2024,
        out_path="data/moe_schools_cop_2024.json",
        pause=1.0
    )
