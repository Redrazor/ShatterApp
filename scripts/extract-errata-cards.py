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


def extract_ability_card(page_img: Image.Image) -> Image.Image | None:
    """Extract ability card from top of Type A page.

    Finds the dark top-border line, uses Anakin ratio for height.
    Returns cropped card resized to 1800x1200, or None on failure.
    """
    arr = np.array(page_img.convert("RGB"))
    h, w = arr.shape[:2]

    # Find the dark top-border line (first row with >2500 dark pixels)
    border_y = None
    for y in range(0, h):
        dark = np.where(np.all(arr[y] < DARK_THRESHOLD, axis=-1))[0]
        if len(dark) > 2500:
            above = np.sum(np.all(arr[max(0, y - 5)] < DARK_THRESHOLD, axis=-1))
            if above < 500:
                border_y = y
                # Get X bounds from this border line
                x_left, x_right = dark[0], dark[-1]
                break

    if border_y is None:
        return None

    card_width = x_right - x_left + 1
    card_height = int(card_width * ABILITY_RATIO)
    card = page_img.crop((x_left, border_y, x_right + 1, border_y + card_height))
    return card.resize(ABILITY_SIZE, Image.LANCZOS)


def extract_unit_front(page_img: Image.Image) -> Image.Image | None:
    """Extract unit front card from bottom of Type A page (rotated 90 CW).

    Finds content below ability card, uses Anakin front ratio, rotates.
    Returns cropped card resized to 1200x1800, or None on failure.
    """
    arr = np.array(page_img.convert("RGB"))
    h, w = arr.shape[:2]

    # Find ability card bottom (dark border + ratio height)
    border_y = None
    x_left = x_right = 0
    for y in range(0, h):
        dark = np.where(np.all(arr[y] < DARK_THRESHOLD, axis=-1))[0]
        if len(dark) > 2500:
            above = np.sum(np.all(arr[max(0, y - 5)] < DARK_THRESHOLD, axis=-1))
            if above < 500:
                border_y = y
                x_left, x_right = dark[0], dark[-1]
                break

    if border_y is None:
        return None

    card_width = x_right - x_left + 1
    ability_height = int(card_width * ABILITY_RATIO)
    unit_area_top = border_y + ability_height

    # Find unit card content bounds in the area below ability card
    # Extended section to capture full rotated card
    section = page_img.crop((0, unit_area_top, w, min(h, unit_area_top + 2500)))
    section_arr = np.array(section.convert("RGB"))
    sh, sw = section_arr.shape[:2]

    # Find content X bounds at the test row
    test_y = min(500, sh - 1)
    for x in range(0, sw):
        if np.any(section_arr[test_y, x] < 240):
            ux_left = x
            break
    else:
        return None

    for x in range(sw - 1, 0, -1):
        if np.any(section_arr[test_y, x] < 240):
            ux_right = x
            break
    else:
        return None

    u_width = ux_right - ux_left + 1
    # Rotated card: page-width = card-height, page-height = card-width
    u_page_height = int(u_width / FRONT_RATIO)

    unit_card = section.crop((ux_left, 0, ux_right + 1, u_page_height))
    rotated = unit_card.rotate(90, expand=True)
    return rotated.resize(FRONT_SIZE, Image.LANCZOS)


def extract_stances(page_img: Image.Image) -> tuple[Image.Image | None, Image.Image | None]:
    """Extract stance cards from Type B page.

    Finds card edges at white boundary, splits at content gap.
    Returns (stance1, stance2) resized to 1794x1037. stance2 may be None.
    """
    arr = np.array(page_img.convert("RGB"))
    h, w = arr.shape[:2]

    # Find left/right card edges (first non-255 pixel at vertical center)
    mid_y = h // 2
    card_left = card_right = None

    for x in range(0, w):
        if not np.all(arr[mid_y, x] == 255):
            card_left = x
            break

    for x in range(w - 1, 0, -1):
        if not np.all(arr[mid_y, x] == 255):
            card_right = x
            break

    if card_left is None or card_right is None:
        return None, None

    # Find card top: first row with >0.99 content fraction in card columns
    card_top = None
    for y in range(0, h):
        row = arr[y, card_left:card_right + 1]
        frac = np.mean(np.any(row < CONTENT_THRESHOLD, axis=-1))
        if frac > 0.99:
            card_top = y
            break

    if card_top is None:
        return None, None

    # Find gap between stance 1 and stance 2:
    # Scan for rows where content fraction drops below 0.50
    gap_start = None
    for y in range(card_top + 500, h):
        row = arr[y, card_left:card_right + 1]
        frac = np.mean(np.any(row < CONTENT_THRESHOLD, axis=-1))
        if frac < 0.50:
            gap_start = y
            break

    if gap_start is None:
        # Single stance card — find bottom
        card_bottom = card_top
        for y in range(h - 1, card_top, -1):
            row = arr[y, card_left:card_right + 1]
            frac = np.mean(np.any(row < CONTENT_THRESHOLD, axis=-1))
            if frac > 0.99:
                card_bottom = y
                break
        stance1 = page_img.crop((card_left, card_top, card_right + 1, card_bottom + 1))
        ratio = STANCE_WIDTH / stance1.width
        stance1 = stance1.resize((STANCE_WIDTH, int(stance1.height * ratio)), Image.LANCZOS)
        return stance1, None

    # Two stance cards
    s1_bottom = gap_start - 1

    # Find stance 2 start (first full-content row after gap)
    s2_top = None
    for y in range(gap_start, h):
        row = arr[y, card_left:card_right + 1]
        frac = np.mean(np.any(row < CONTENT_THRESHOLD, axis=-1))
        if frac > 0.99:
            s2_top = y
            break

    # Find stance 2 bottom
    s2_bottom = s2_top or gap_start
    for y in range(h - 1, (s2_top or gap_start), -1):
        row = arr[y, card_left:card_right + 1]
        frac = np.mean(np.any(row < CONTENT_THRESHOLD, axis=-1))
        if frac > 0.99:
            s2_bottom = y
            break

    stance1 = page_img.crop((card_left, card_top, card_right + 1, s1_bottom + 1))
    ratio1 = STANCE_WIDTH / stance1.width
    stance1 = stance1.resize((STANCE_WIDTH, int(stance1.height * ratio1)), Image.LANCZOS)

    stance2 = None
    if s2_top is not None:
        stance2 = page_img.crop((card_left, s2_top, card_right + 1, s2_bottom + 1))
        ratio2 = STANCE_WIDTH / stance2.width
        stance2 = stance2.resize((STANCE_WIDTH, int(stance2.height * ratio2)), Image.LANCZOS)

    return stance1, stance2


def match_to_character(unit_name: str, characters: list[dict]) -> dict | None:
    """Find matching character in characters.json by name (case-insensitive)."""
    name_lower = unit_name.lower()
    for c in characters:
        if c["name"].lower() == name_lower:
            return c
    return None


def copy_and_compress(
    src: Image.Image, dest_png: str, dest_webp: str
) -> None:
    """Save PNG and generate WebP compressed version."""
    src.save(dest_png)
    src.convert("RGB").save(dest_webp, "WEBP", quality=85)


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 extract-errata-cards.py <pdf_path> <output_dir>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]
    os.makedirs(output_dir, exist_ok=True)

    project_root = Path(__file__).resolve().parent.parent
    images_dir = project_root / "public" / "images"
    compressed_dir = project_root / "public" / "images-compressed"

    # Load characters
    with open(project_root / "public" / "data" / "characters.json") as f:
        characters = json.load(f)

    # Step 1: Build page map
    print("Building page map...")
    page_map = build_page_map(pdf_path)
    print(f"Found {len(page_map)} units\n")

    # Get PDF page count to avoid requesting out-of-bounds pages
    info = subprocess.run(
        ["pdfinfo", pdf_path], capture_output=True, text=True, check=True
    )
    pdf_page_count = int(next(
        line.split(":")[1].strip()
        for line in info.stdout.splitlines()
        if line.startswith("Pages:")
    ))

    # Step 2: Collect all pages to render (skip pages beyond PDF length)
    all_pages = []
    for pages in page_map.values():
        all_pages.extend(p for p in pages if p <= pdf_page_count)

    print(f"Rendering {len(set(all_pages))} unique pages at {DPI} DPI...")
    rendered = render_pages(pdf_path, output_dir, all_pages)
    print(f"Rendered {len(rendered)} pages\n")

    # Step 3: Process each unit
    results = {"success": [], "failed": [], "skipped": []}

    for unit_name, pages in sorted(page_map.items()):
        type_a_page, type_b_page = pages[0], pages[1]
        char = match_to_character(unit_name, characters)

        if char is None:
            print(f"  SKIP {unit_name} — no match in characters.json")
            results["skipped"].append(unit_name)
            continue

        print(f"Processing: {unit_name} (ID: {char['id']}, {char['swpCode']})")

        try:
            # Extract from Type A page
            if type_a_page in rendered:
                page_a = Image.open(rendered[type_a_page])
                ability_card = extract_ability_card(page_a)
                unit_front = extract_unit_front(page_a)
            else:
                ability_card = unit_front = None

            # Extract from Type B page
            if type_b_page in rendered:
                page_b = Image.open(rendered[type_b_page])
                stance1, stance2 = extract_stances(page_b)
            else:
                stance1 = stance2 = None

            # Copy to project directories
            replaced = []

            if ability_card and char.get("cardBack"):
                fname = Path(char["cardBack"]).name.replace(".png", "")
                copy_and_compress(
                    ability_card,
                    str(images_dir / f"{fname}.png"),
                    str(compressed_dir / f"{fname}.webp"),
                )
                replaced.append("cardBack")

            if unit_front and char.get("cardFront"):
                fname = Path(char["cardFront"]).name.replace(".png", "")
                copy_and_compress(
                    unit_front,
                    str(images_dir / f"{fname}.png"),
                    str(compressed_dir / f"{fname}.webp"),
                )
                replaced.append("cardFront")

            if stance1 and char.get("stance1"):
                fname = Path(char["stance1"]).name.replace(".png", "")
                copy_and_compress(
                    stance1,
                    str(images_dir / f"{fname}.png"),
                    str(compressed_dir / f"{fname}.webp"),
                )
                replaced.append("stance1")

            if stance2 and char.get("stance2"):
                fname = Path(char["stance2"]).name.replace(".png", "")
                copy_and_compress(
                    stance2,
                    str(images_dir / f"{fname}.png"),
                    str(compressed_dir / f"{fname}.webp"),
                )
                replaced.append("stance2")

            print(f"  ✓ Replaced: {', '.join(replaced)}")
            results["success"].append((unit_name, replaced))

        except Exception as e:
            print(f"  ✗ FAILED: {e}")
            results["failed"].append((unit_name, str(e)))

    # Summary
    print(f"\n{'='*60}")
    print(f"SUMMARY: {len(results['success'])} succeeded, "
          f"{len(results['failed'])} failed, {len(results['skipped'])} skipped")
    if results["failed"]:
        print("\nFailed units:")
        for name, err in results["failed"]:
            print(f"  {name}: {err}")


if __name__ == "__main__":
    main()
