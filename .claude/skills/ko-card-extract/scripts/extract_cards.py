#!/usr/bin/env python3
"""
extract_cards.py — AMG Key Operations print-sheet card extractor.

Usage:
    python3 extract_cards.py <pdf_url_or_path> <output_dir> [--width 800] [--dpi 300]

    pdf_url_or_path : HTTP(S) URL or local file path of the AMG print-sheet PDF.
    output_dir      : Directory to write cropped PNG files.
    --width         : Output image width in pixels (default: 800).
    --dpi           : Render resolution for pdftoppm (default: 300).

Output files (one per page, two cards per page, except tracker pages):
    page<N>-front.png   — front (art) side of the card on page N
    page<N>-back.png    — back (rules) side of the card on page N

Tracker pages (single full-page card) are saved as:
    page<N>-tracker.png

Algorithm overview
------------------
AMG print sheets have one or two cards per page sharing continuous left/right
border lines, with a small inter-card white gap in the center (~30 px at 300 dpi).

1.  Render PDF → PNG at `dpi` resolution using pdftoppm.
2.  For each page:
    a. Center-strip scan (40–60% of width, gap threshold 15 px) → Card 1 bounds.
       The TALLEST cluster = Card 1 (the front/art card, always contiguous).
    b. Full-interior scan (15–85% width) from Card 1 bottom downward → Card 2 top.
    c. Last-thick-red-band scan from bottom upward → Card 2 bottom
       (reliable because AMG cards always end with a thick red horizontal border).
    d. X-bounds from mid-section of each card (avoids title/footer).
3.  Resize each crop to `target_width` preserving aspect ratio.
"""

import argparse
import os
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image


# ── Card detection ────────────────────────────────────────────────────────

def find_cards_on_page(img_path: str, padding: int = 6,
                       card_color: str = "red") -> list[tuple[int, int, int, int]]:
    """
    Detect card bounding boxes on a single AMG print-sheet page.

    Returns a list of (left, top, right, bottom) tuples — one or two entries.
    """
    img = Image.open(img_path).convert("RGB")
    arr = np.array(img)
    h, w = arr.shape[:2]

    # ── Step 1: Locate Card 1 top via center-strip content ────────────────
    cx1, cx2 = int(w * 0.40), int(w * 0.60)
    center = arr[:, cx1:cx2, :]
    has_content = center.min(axis=(1, 2)) < 235

    content_rows = np.where(has_content)[0]
    if len(content_rows) == 0:
        return []
    c1_top = int(content_rows[0])

    # ── Step 2: Separator scan → split point ──────────────────────────────
    # The two cards are separated by a thin solid-colour horizontal band.
    # Scan top→bottom from the vertical midpoint; the first row where >85%
    # of interior pixels match the card colour is the split.
    xi1, xi2 = int(w * 0.10), int(w * 0.90)
    r_ch, g_ch, b_ch = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    def separator_frac(y: int) -> float:
        rs = r_ch[y, xi1:xi2]
        gs = g_ch[y, xi1:xi2]
        bs = b_ch[y, xi1:xi2]
        if card_color == "grey":
            # Low-saturation grey (dark to mid): brightness 150–480, max-min < 40
            bright = rs.astype(int) + gs.astype(int) + bs.astype(int)
            sat = (np.maximum(np.maximum(rs, gs), bs).astype(int) -
                   np.minimum(np.minimum(rs, gs), bs).astype(int))
            return ((bright > 150) & (bright < 480) & (sat < 40)).mean()
        else:
            return ((rs > 90) & (gs < 70) & (bs < 70)).mean()

    sep_threshold = 0.70 if card_color == "grey" else 0.85
    split_y: int | None = None
    for y in range(h // 2, h):
        if separator_frac(y) > sep_threshold:
            split_y = y
            break

    if split_y is None:
        # Fallback: no separator found — treat as single card
        c1_bottom = int(content_rows[-1])
        c2_top = None
    else:
        # Card 1 ends just before the separator
        c1_bottom = split_y - 1
        # Card 2 starts AT the separator (includes band + back title header)
        c2_top = split_y

    # ── Step 3: Last thick card-colour band → Card 2 bottom ───────────────
    def is_card_color_row(y: int) -> np.ndarray:
        rs = r_ch[y, xi1:xi2]
        gs = g_ch[y, xi1:xi2]
        bs = b_ch[y, xi1:xi2]
        if card_color == "grey":
            bright = rs.astype(int) + gs.astype(int) + bs.astype(int)
            sat = (np.maximum(np.maximum(rs, gs), bs).astype(int) -
                   np.minimum(np.minimum(rs, gs), bs).astype(int))
            return (bright > 150) & (bright < 480) & (sat < 40)
        else:
            return (rs > 100) & (gs < 70) & (bs < 70)

    last_thick_band: int | None = None
    for y in range(h - 1, c1_bottom, -1):
        row_mask = is_card_color_row(y)
        max_run = cur = 0
        for v in row_mask:
            cur = cur + 1 if v else 0
            if cur > max_run:
                max_run = cur
        if max_run > int((xi2 - xi1) * 0.3):
            last_thick_band = y
            break
    if last_thick_band is None:
        # Fallback: last row with any non-white content below Card 1
        for y in range(h - 1, c1_bottom, -1):
            if arr[y, xi1:xi2, :].min() < 200:
                last_thick_band = y
                break
    c2_bottom = last_thick_band if last_thick_band is not None else h - 50

    # ── Step 4: X-bounds from mid-section of each card ────────────────────
    def x_bounds(top: int, bottom: int) -> tuple[int, int]:
        mid_top = top + (bottom - top) // 4
        mid_bot = bottom - (bottom - top) // 4
        region = arr[mid_top:mid_bot, int(w * 0.05):int(w * 0.95), :]
        has_col = region.min(axis=(0, 2)) < 235
        col_idx = np.where(has_col)[0]
        if len(col_idx) == 0:
            return (int(w * 0.05), int(w * 0.95))
        left = max(0, int(w * 0.05) + int(col_idx[0]) - padding)
        right = min(w, int(w * 0.05) + int(col_idx[-1]) + padding + 1)
        return (left, right)

    c1_l, c1_r = x_bounds(c1_top, c1_bottom)

    if c2_top is None:
        # Single-card page (tracker)
        return [(c1_l, max(0, c1_top - padding), c1_r, min(h, c2_bottom + padding))]

    c2_l, c2_r = x_bounds(c2_top, c2_bottom)

    return [
        (c1_l, max(0, c1_top - padding),    c1_r, min(h, c1_bottom + padding)),
        (c2_l, max(0, c2_top - padding),    c2_r, min(h, c2_bottom + padding)),
    ]


def crop_and_resize(img: Image.Image, box: tuple[int, int, int, int],
                    target_width: int) -> Image.Image:
    card = img.crop(box)
    w, h = card.size
    new_h = int(h * target_width / w)
    return card.resize((target_width, new_h), Image.LANCZOS)


# ── PDF rendering ─────────────────────────────────────────────────────────

def render_pdf(src: str, out_dir: str, dpi: int) -> list[str]:
    """Download (if URL) and render PDF pages to PNG. Returns sorted page paths."""
    if src.startswith("http://") or src.startswith("https://"):
        pdf_path = os.path.join(out_dir, "source.pdf")
        print(f"Downloading {src} ...")
        urllib.request.urlretrieve(src, pdf_path)
    else:
        pdf_path = src

    prefix = os.path.join(out_dir, "page")
    subprocess.run(
        ["pdftoppm", "-r", str(dpi), "-png", pdf_path, prefix],
        check=True,
    )
    pages = sorted(
        p for p in Path(out_dir).iterdir()
        if p.name.startswith("page") and p.suffix == ".png"
    )
    return [str(p) for p in pages]


# ── Main ──────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source",     help="PDF URL or local path")
    parser.add_argument("output_dir", help="Directory to write card PNGs")
    parser.add_argument("--width",    type=int, default=800, help="Output width in px (default: 800)")
    parser.add_argument("--dpi",      type=int, default=300, help="Render DPI (default: 300)")
    parser.add_argument("--tracker-pages", type=str, default="",
                        help="Comma-separated 1-based page numbers that are full-page trackers (e.g. '4')")
    parser.add_argument("--card-color", choices=["red", "grey"], default="red",
                        help="Card border/separator colour for detection (default: red)")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    tracker_pages = set(int(p) for p in args.tracker_pages.split(",") if p.strip())

    with tempfile.TemporaryDirectory() as tmp:
        pages = render_pdf(args.source, tmp, args.dpi)
        print(f"Rendered {len(pages)} page(s).")

        for i, page_path in enumerate(pages, start=1):
            page_num = f"page{i:02d}"
            img = Image.open(page_path)
            cards = find_cards_on_page(page_path, card_color=args.card_color)

            if i in tracker_pages or len(cards) == 1:
                # Treat as single tracker card — union all detected boxes
                if not cards:
                    print(f"  Page {i}: no cards detected, skipping.")
                    continue
                al = min(c[0] for c in cards)
                at = min(c[1] for c in cards)
                ar = max(c[2] for c in cards)
                ab = max(c[3] for c in cards)
                out_path = os.path.join(args.output_dir, f"{page_num}-tracker.png")
                crop_and_resize(img, (al, at, ar, ab), args.width).save(out_path, optimize=True)
                kb = os.path.getsize(out_path) // 1024
                print(f"  Page {i} [tracker]: {al},{at}→{ar},{ab} → {args.width}px ({kb}KB) → {out_path}")

            elif len(cards) >= 2:
                front_path = os.path.join(args.output_dir, f"{page_num}-front.png")
                back_path  = os.path.join(args.output_dir, f"{page_num}-back.png")
                crop_and_resize(img, cards[0], args.width).save(front_path, optimize=True)
                crop_and_resize(img, cards[1], args.width).save(back_path,  optimize=True)
                kb_f = os.path.getsize(front_path) // 1024
                kb_b = os.path.getsize(back_path)  // 1024
                print(f"  Page {i} [front]: {cards[0]} → {front_path} ({kb_f}KB)")
                print(f"  Page {i} [back ]: {cards[1]} → {back_path}  ({kb_b}KB)")

            else:
                print(f"  Page {i}: {len(cards)} card(s) detected — skipping (unexpected layout).")

    print("Done.")


if __name__ == "__main__":
    main()
