# etl_extract_scores.py

import re
import pandas as pd
import os

# You’ll need to install:
#   pip install tabula-py
# and have Java 8+ on your PATH

# Get path to this file's directory
script_dir = os.path.dirname(os.path.abspath(__file__))
# Build absolute path to project-root/data
data_dir = os.path.join(script_dir, os.pardir, 'data')

football_pdf = os.path.join(data_dir,
  'SSSC_Football_C_Div_Boys_L1_QFs_to_Final_Fixtures_Results.pdf')
cca_pdf      = os.path.join(data_dir,
  'nrc2023-award-winner.pdf')

from tabula import read_pdf  # tabula-py

def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^\w\s-]", "", s)
    return re.sub(r"[\s_]+", "-", s).strip("-")

def extract_pdf_tables(pdf_path: str) -> pd.DataFrame:
    """
    Use tabula-py to extract *all* tables from the PDF.
    Returns a single concatenated DataFrame.
    """
    # lattice=True is best for grid tables, stream=True otherwise
    tables = read_pdf(pdf_path, pages="all", lattice=True, multiple_tables=True)
    df = pd.concat(tables, ignore_index=True)
    # If the first row looks like headers (contains “School”), promote it
    if "School" in df.iloc[0].values:
        df.columns = df.iloc[0]
        df = df.drop(0).reset_index(drop=True)
    return df

def process_and_save(pdf_path: str, out_prefix: str):
    df = extract_pdf_tables(pdf_path)
    print(f"[+] Extracted {len(df)} rows from {pdf_path}")
    
    # Add slug for joining
    if "School" in df.columns:
        df["school_slug"] = df["School"].astype(str).apply(slugify)
    
    # Save for later ingestion
    df.to_csv(f"data/{out_prefix}_scores.csv", index=False)
    df.to_json(f"data/{out_prefix}_scores.json", orient="records")
    print(f"[+] Saved to data/{out_prefix}_scores.*")

if __name__ == "__main__":
    import os
    os.makedirs("data", exist_ok=True)

    # 1) Football results
    process_and_save(
      football_pdf,
      "football"
    )

    # 2) CCA results
    process_and_save(
      cca_pdf,
      "cca"
    )
