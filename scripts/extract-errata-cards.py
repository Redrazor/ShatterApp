#!/usr/bin/env python3
"""Extract card images from AMG errata print-sheet PDF."""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

# --- Constants validated during Ahsoka extraction ---
DPI = 600
ABILITY_RATIO = 1200 / 1800   # 0.6667 h/w (landscape)
FRONT_RATIO = 1800 / 1200     # 1.5 h/w (portrait, used for page-height calc)
STANCE_WIDTH = 1794
STANCE_HEIGHT = 1037
ABILITY_SIZE = (1800, 1200)
FRONT_SIZE = (1200, 1800)
DARK_THRESHOLD = 80
CONTENT_THRESHOLD = 250


def build_page_map(pdf_path: str) -> dict[str, list[int]]:
    """Extract unit names and their page numbers from the PDF.

    Returns dict mapping unit_name -> [type_a_page, type_b_page].
    Pages are 1-indexed.
    """
    result = subprocess.run(
        ["pdftotext", "-layout", pdf_path, "-"],
        capture_output=True, text=True, check=True,
    )
    text = result.stdout

    # Split text by form-feed to get per-page text
    pages = text.split("\f")

    # Load characters.json for name matching
    chars_path = Path(__file__).resolve().parent.parent / "public" / "data" / "characters.json"
    with open(chars_path) as f:
        characters = json.load(f)
    char_names = {c["name"].lower(): c["name"] for c in characters}

    page_map: dict[str, list[int]] = {}

    for page_idx, page_text in enumerate(pages):
        page_num = page_idx + 1
        page_lower = page_text.lower()

        # Check if any character name appears on this page
        for name_lower, name in char_names.items():
            if name_lower in page_lower and name not in page_map:
                # Type A page (ability card) — unit name appears here first
                # Type B page (stances) is the next page
                page_map[name] = [page_num, page_num + 1]
                break

    return page_map


def render_pages(pdf_path: str, output_dir: str, pages: list[int]) -> dict[int, str]:
    """Render specific PDF pages to PNG at DPI resolution.

    Returns dict mapping page_number -> png_file_path.
    """
    rendered = {}
    unique_pages = sorted(set(pages))

    for p in unique_pages:
        prefix = os.path.join(output_dir, f"page{p:02d}")
        subprocess.run(
            ["pdftoppm", "-f", str(p), "-l", str(p), "-r", str(DPI),
             "-png", pdf_path, prefix],
            check=True,
        )
        # pdftoppm names output as prefix-NN.png
        candidates = list(Path(output_dir).glob(f"page{p:02d}-*.png"))
        if candidates:
            rendered[p] = str(candidates[0])

    return rendered


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 extract-errata-cards.py <pdf_path> <output_dir>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]
    os.makedirs(output_dir, exist_ok=True)

    print("Building page map...")
    page_map = build_page_map(pdf_path)
    print(f"Found {len(page_map)} units in PDF")
    for name, pages in sorted(page_map.items()):
        print(f"  {name}: pages {pages}")
