# May 2025 Errata Bulk Update — Design Spec

**Date:** 2026-03-28
**Source PDF:** `DOC24_Cards_Unit-Stance_PrintSheet-1.pdf` (Version 1.2, 05/09/2025)
**URL:** https://cdn.svc.asmodee.net/production-amgcom/uploads/2025/05/DOC24_Cards_Unit-Stance_PrintSheet-1.pdf
**Scope:** 32 units across 52 pages — full card image replacement + ability data update

---

## Units in Scope

### Confirmed Ability Mismatches (8 units — process first)

| Unit | SWP | Change Type |
|------|-----|-------------|
| Asajj Ventress, Sith Assassin | SWP01 | Ability renamed + rewritten |
| General Anakin Skywalker | SWP01 | Two abilities heavily rewritten |
| 212th Clone Troopers | SWP06 | New ability added (4th) |
| ARF Clone Troopers | SWP08 | Ability renamed + rewritten |
| Aurra Sing | SWP09 | Ability replaced entirely |
| Gwarm | SWP10 | New ability added (5th) |
| Weequay Pirates | SWP10 | New ability added (4th) |
| Elite Squad Troopers | SWP36 | Ability renamed + new ability added |

### Already Updated (1 unit)

| Unit | SWP | Status |
|------|-----|--------|
| Ahsoka Tano, Jedi No More | SWP01 | DONE — cards + abilities updated |

### Needs Description Review (23 units)

501st Clone Troopers (SWP01), Jango Fett (SWP03), MagnaGuard (SWP03), Republic Clone Commandos (SWP04), CC-2224 Clone Commander Cody (SWP06), Jedi Master Mace Windu (SWP08), CT-411 Commander Ponds (SWP08), Cad Bane (SWP09), Bounty Hunters (SWP09), Hondo (SWP10), Fourth Sister (SWP12), Grand Inquisitor (SWP12), Third Sister (SWP12), Jedi Knight Luke Skywalker (SWP22), Dark Troopers (SWP26), Chief Chirpa (SWP27), Obi-Wan Kenobi Out of Hiding (SWP30), Darth Vader Jedi Hunter (SWP30), Gideon Hask (SWP34), Imperial Special Forces (SWP34), C-3PO and R2-D2 (SWP39), Logray (SWP39)

### Stance-Only Update (1 unit)

| Unit | SWP | Notes |
|------|-----|-------|
| 104th Wolfpack Troopers | SWP11 | Only stance card updated, no ability changes |

---

## Phase 1: Batch Card Image Extraction

### Input
- Errata PDF (52 pages, already downloaded to `/tmp/unit-card-extract/errata.pdf`)
- `public/data/characters.json` for filename mapping

### Script: `scripts/extract-errata-cards.py`

A single Python script that:

1. **Builds a page map** from PDF text (`pdftotext`). Each unit name in the PDF maps to its page numbers. Unit names appear as all-caps headers on ability card pages (Type A). Stance pages (Type B) follow immediately after.

2. **Renders all 52 pages** at 600 DPI using `pdftoppm`.

3. **Extracts cards per unit** using the validated cropping approach:
   - **Type A page (ability + unit card)**:
     - Ability card (top): Anchor at the dark top-border line (first row with >2500 dark pixels). Use Anakin ability card ratio (h/w = 0.6667) to compute card height. Resize to 1800x1200.
     - Unit card (bottom): Rotated 90 CW on the page. Find content below ability card, crop using Anakin front ratio (h/w = 1.5) for page-height calculation. Rotate 90 CCW. Resize to 1200x1800.
   - **Type B page (stances)**:
     - Detect left/right card edges at first non-255 pixel from page edge.
     - Stance 1: From first full-content row (content frac > 0.99) to last full-content row before the gap (content frac drops below 0.50).
     - Stance 2: From first full-content row after the gap to last full-content row before footer area.
     - Resize both to 1794x1037 (matching existing stance dimensions).

4. **Matches to characters.json**: For each extracted unit, finds the matching character by name (case-insensitive fuzzy match). Copies images to `public/images/` using the existing filenames (`cardBack`, `cardFront`, `stance1`, `stance2` fields).

5. **Generates WebP**: For each replaced PNG, generates the corresponding WebP in `public/images-compressed/`.

### Output
- All card images replaced in `public/images/` and `public/images-compressed/`
- A log file listing every unit processed, filenames replaced, and any units that failed matching

### Validation
- Quick visual spot-check of a sample of units in the browser
- Compare dimensions against existing cards to ensure consistency

---

## Phase 2: Ability Data Update (Per Unit via Browser)

Uses the existing **ability-extract skill** for each unit.

### Workflow per unit

1. App must be running (`npm run dev:all` or equivalent).
2. Navigate to the unit's profile page in the browser (`/browse/{slug}`).
3. Click Card tab, flip to ability card (back). The card now shows the errata version (from Phase 1).
4. Read the card via vision. Extract each ability: name, type (icon), cost, description with icon tokens.
5. Present extracted abilities to the user for validation.
6. On user approval, save to `public/data/abilities.json`.

### Icon Token Mapping

The ability-extract skill defines the full icon-to-token mapping. Key tokens:
- Movement: `[advance]`, `[jump]`, `[dash]`, `[reposition]`, `[climb]`, `[shove]`
- Combat: `[ranged]`, `[melee]`, `[damage]`, `[heal]`
- Status: `[strained]`, `[exposed]`, `[disarmed]`, `[pinned]`, `[hunker]`
- Dice: `[fail]`, `[block]`, `[success]`, `[surge]`
- Resource: `[force]`

### Processing Order

**Batch 1 — Confirmed mismatches (8 units):**
1. Asajj Ventress, Sith Assassin (SWP01)
2. General Anakin Skywalker (SWP01)
3. 212th Clone Troopers (SWP06)
4. ARF Clone Troopers (SWP08)
5. Aurra Sing (SWP09)
6. Gwarm (SWP10)
7. Weequay Pirates (SWP10)
8. Elite Squad Troopers (SWP36)

**Batch 2 — Core Set units (SWP01, 4 remaining):**
9. 501st Clone Troopers

**Batch 3 — SWP03-SWP12 (10 units):**
10-19. Jango Fett, MagnaGuard, Republic Clone Commandos, CC-2224 Cody, Mace Windu, CT-411 Ponds, Cad Bane, Bounty Hunters, Hondo, Fourth Sister, Grand Inquisitor, Third Sister

**Batch 4 — SWP22+ (remaining units):**
20-31. Luke Skywalker, Dark Troopers, Chief Chirpa, Obi-Wan, Vader, Gideon Hask, Imperial Special Forces, C-3PO/R2-D2, Logray

**Batch 5 — Stance-only:**
32. 104th Wolfpack Troopers (no ability update needed, cards only from Phase 1)

### Session Management
- Process 4-6 units per conversation session to manage context
- Each session: start app, process units, commit batch
- Ability-extract skill handles navigation, vision, and save

---

## Phase 3: Finalize and Deploy

1. Run `npm run seed` to propagate `abilities.json` changes to SQLite
2. Run `npm run images:compress` to regenerate all WebP files
3. Run `npm run images:deploy` to upload to Firebase CDN
4. Run `npm test` to verify nothing broke
5. Commit all changes on the feature branch
6. Create PR for review

---

## File Changes Summary

| File | Change |
|------|--------|
| `public/images/SWP*_*_Unit_Back.png` | Replaced (32 ability cards) |
| `public/images/SWP*_*_Unit_Front.png` | Replaced (32 unit cards) |
| `public/images/SWP*_*_Stance_1.png` | Replaced (32 stance 1 cards) |
| `public/images/SWP*_*_Stance_2.png` | Replaced (where applicable) |
| `public/images-compressed/*.webp` | Regenerated for all replaced PNGs |
| `public/data/abilities.json` | Updated entries for all 32 units |
| `scripts/extract-errata-cards.py` | New script (reusable for future errata) |

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| PDF page layout varies between units | Template-ratio approach is robust; fallback to manual crop for edge cases |
| Unit name matching fails | Fuzzy match + manual override map for known mismatches |
| Some units have 1 stance, not 2 | Script detects single vs dual stance pages |
| Icon tokens misidentified | Ability-extract skill includes reference icon PNGs for comparison; user validates each unit |
| Context window pressure during ability extraction | Process in batches of 4-6 units per session |
| Card dimensions vary from Anakin template | Verify output dimensions match existing cards; adjust per-unit if needed |

---

## Success Criteria

- All 32 units have updated card images matching the errata PDF
- All 32 units have correct ability data in abilities.json (validated by user via browser)
- No regression in existing tests (`npm test` passes)
- Images deployed to Firebase CDN
- Single feature branch with clean commit history
