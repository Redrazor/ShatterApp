# May 2025 Errata Bulk Update — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update all 32 units from the May 2025 AMG errata — replace card images and update ability data to match the official errata PDF.

**Architecture:** A Python batch script extracts all card images from the 52-page errata PDF using template-ratio cropping (validated during Ahsoka update). Ability data is updated per-unit using the ability-extract skill with user validation in the browser. Processing is split into sessions of 4-6 units to manage context.

**Tech Stack:** Python 3 (Pillow, NumPy), pdftoppm (poppler-utils), pdftotext, Playwright (browser ability extraction), Vue 3 dev server

---

### Task 1: Build the page map from PDF text

**Files:**
- Create: `scripts/extract-errata-cards.py`

This task creates the extraction script with the page-mapping logic. The PDF has 52 pages. Each unit occupies 2 consecutive pages: a Type A page (ability card + unit card) followed by a Type B page (stance cards). Unit names appear as all-caps headers on Type A pages.

- [ ] **Step 1: Create the script with page-map builder**

```python
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
```

- [ ] **Step 2: Test the page map**

```bash
python3 scripts/extract-errata-cards.py /tmp/unit-card-extract/errata.pdf /tmp/errata-extract
```

Expected: prints 32 unit names with their page numbers (31 with 2-page pairs, some may share pages for stance-only updates). Verify a few known units appear with correct page numbers (Ahsoka should be pages 3-4 based on our earlier work).

- [ ] **Step 3: Commit**

```bash
git add scripts/extract-errata-cards.py
git commit -m "feat: add errata card extraction script — page mapping"
```

---

### Task 2: Add card extraction functions to the script

**Files:**
- Modify: `scripts/extract-errata-cards.py`

Add the three card extraction functions: ability card (Type A top), unit front card (Type A bottom, rotated), and stance cards (Type B).

- [ ] **Step 1: Add the ability card extractor**

Append to `scripts/extract-errata-cards.py` before the `if __name__` block:

```python
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
```

- [ ] **Step 2: Test extraction on Ahsoka's pages (known good)**

```python
# Quick manual test — run in Python REPL
from PIL import Image
# Page 3 = Ahsoka Type A, Page 4 = Ahsoka Type B
p3 = Image.open("/tmp/unit-card-extract/hires/page3-03.png")
p4 = Image.open("/tmp/unit-card-extract/hires/page4-04.png")

# These imports assume the script is importable
exec(open("scripts/extract-errata-cards.py").read())
ability = extract_ability_card(p3)
front = extract_unit_front(p3)
s1, s2 = extract_stances(p4)
print(f"Ability: {ability.size if ability else 'FAIL'}")
print(f"Front: {front.size if front else 'FAIL'}")
print(f"Stance1: {s1.size if s1 else 'FAIL'}")
print(f"Stance2: {s2.size if s2 else 'FAIL'}")
```

Expected: Ability=(1800,1200), Front=(1200,1800), Stance1=(1794,~1037), Stance2=(1794,~1037). Visually verify a couple of the output images.

- [ ] **Step 3: Commit**

```bash
git add scripts/extract-errata-cards.py
git commit -m "feat: add card extraction functions (ability, front, stances)"
```

---

### Task 3: Add the main extraction pipeline and character matching

**Files:**
- Modify: `scripts/extract-errata-cards.py`

Replace the `if __name__` block with the full pipeline: render → extract → match → copy → compress.

- [ ] **Step 1: Add the main pipeline**

Replace the existing `if __name__` block with:

```python
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

    # Step 2: Collect all pages to render
    all_pages = []
    for pages in page_map.values():
        all_pages.extend(pages)

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
```

- [ ] **Step 2: Run the full extraction pipeline**

```bash
python3 scripts/extract-errata-cards.py /tmp/unit-card-extract/errata.pdf /tmp/errata-extract
```

Expected: processes all 32 units, prints success/failure for each. Most should succeed. Note any failures for manual follow-up.

- [ ] **Step 3: Visual spot-check**

Start the dev server (`npm run dev:all`) and check 3-4 units in the browser:
- One Core Set unit (e.g., General Anakin Skywalker)
- One non-Core unit (e.g., Aurra Sing)
- One single-stance unit (e.g., Dark Troopers)

Verify cards display correctly — no white borders, no cropping artifacts, correct content.

- [ ] **Step 4: Fix any failed extractions manually**

For any units that failed, diagnose the issue (page layout different, name match failed, etc.) and either:
- Adjust the script constants/logic, or
- Extract manually using the approach validated with Ahsoka

- [ ] **Step 5: Commit**

```bash
git add scripts/extract-errata-cards.py
git add -f public/images/SWP*.png  # force-add gitignored images
git add public/images-compressed/
git commit -m "feat: batch extract all 32 errata card images from PDF"
```

---

### Task 4: Ability extraction — Batch 1 (confirmed mismatches, 8 units)

**Files:**
- Modify: `public/data/abilities.json`

Uses the **ability-extract skill** for each unit. The app must be running.

- [ ] **Step 1: Start the dev servers**

```bash
npm run dev:all
```

- [ ] **Step 2: Process each unit using ability-extract skill**

For each of the 8 units below, invoke `/ability-extract <unit name>`:

1. Asajj Ventress, Sith Assassin
2. General Anakin Skywalker
3. 212th Clone Troopers
4. ARF Clone Troopers
5. Aurra Sing
6. Gwarm
7. Weequay Pirates
8. Elite Squad Troopers

For each unit, the skill will:
- Navigate to the unit's profile in the browser
- Flip to the ability card
- Extract abilities via vision
- Present for user validation
- Save to abilities.json on approval

- [ ] **Step 3: Commit batch 1**

```bash
git add public/data/abilities.json
git commit -m "fix: update abilities for 8 errata units with confirmed mismatches"
```

---

### Task 5: Ability extraction — Batch 2 (Core Set + SWP03-SWP12, ~13 units)

**Files:**
- Modify: `public/data/abilities.json`

- [ ] **Step 1: Process each unit using ability-extract skill**

1. 501st Clone Troopers (SWP01)
2. Jango Fett, Bounty Hunter (SWP03)
3. MagnaGuard (SWP03)
4. Republic Clone Commandos (SWP04)
5. CC-2224 Clone Commander Cody (SWP06)
6. Jedi Master Mace Windu (SWP08)
7. CT-411 Commander Ponds (SWP08)
8. Cad Bane, Notorious Hunter (SWP09)
9. Bounty Hunters (SWP09)
10. Hondo, Honest Businessman (SWP10)
11. Fourth Sister (SWP12)
12. Grand Inquisitor, Fallen Jedi (SWP12)
13. Third Sister (SWP12)

- [ ] **Step 2: Commit batch 2**

```bash
git add public/data/abilities.json
git commit -m "fix: update abilities for 13 errata units (SWP01-SWP12)"
```

---

### Task 6: Ability extraction — Batch 3 (SWP22+, ~9 units)

**Files:**
- Modify: `public/data/abilities.json`

- [ ] **Step 1: Process each unit using ability-extract skill**

1. Jedi Knight Luke Skywalker (SWP22)
2. Dark Troopers (SWP26)
3. Chief Chirpa (SWP27)
4. Obi-Wan Kenobi, Out of Hiding (SWP30)
5. Darth Vader, Jedi Hunter (SWP30)
6. Gideon Hask, Inferno Squad (SWP34)
7. Imperial Special Forces (SWP34)
8. C-3PO and R2-D2 (SWP39)
9. Logray, Bright Tree Shaman (SWP39)

- [ ] **Step 2: Commit batch 3**

```bash
git add public/data/abilities.json
git commit -m "fix: update abilities for 9 errata units (SWP22-SWP39)"
```

---

### Task 7: Seed, test, and finalize

**Files:**
- No new files — validation and deployment steps

- [ ] **Step 1: Seed the database**

```bash
npm run seed
```

Expected: `Seed complete: 133 characters, 5 missions, 54 products`

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass (747+). Fix any failures.

- [ ] **Step 3: Run coverage**

```bash
npm run test:coverage
```

Expected: coverage at or above current threshold.

- [ ] **Step 4: Compress and deploy images**

```bash
npm run images:compress
npm run images:deploy
```

- [ ] **Step 5: Final commit on feature branch**

```bash
git add -A
git commit -m "chore: seed database and compress images after errata update"
```

- [ ] **Step 6: Create PR**

```bash
git push origin feature/budget-filter
gh pr create --title "feat: May 2025 errata bulk update (32 units)" --body "$(cat <<'EOF'
## Summary
- Budget filter for unit picker (on by default, disables over-budget units)
- Improved landscape blocker visibility (addresses black screen reports)
- Updated all 32 units from May 2025 AMG errata:
  - Replaced card images (ability, unit front, stances) from official PDF
  - Updated ability data for all 32 units (validated via browser)
  - 8 units had confirmed ability name/count changes
  - 24 units had description updates

## Test plan
- [ ] Verify budget filter enables/disables correctly in Build view
- [ ] Verify landscape blocker shows gold icon and clear text on mobile landscape
- [ ] Spot-check 5+ errata units — cards display correctly, abilities match PDF
- [ ] All 747+ tests pass
- [ ] Coverage threshold met

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
