# Plan: Stance Card Expertise Tree Analysis

## Context
The user wants a thorough, data-driven analysis of the expertise "trees" embedded in every stance card across all 133 characters (175 stance card images). These trees are purely visual — they are not captured in stances.json (which only stores attack/defense numbers). This is a visual data extraction + statistics task that produces a single output `.md` file.

The tree structure on each stance card shows:
- One or more **orange starting squares** (leftmost column) — the entry node(s)
- **White squares** containing 1 or 2 orange symbols (expertise results)
- **Lines** connecting squares (paths), always read left → right

**User decisions:**
- Multi-start cards: analyze each orange starting square **independently** as its own tree origin
- Variance scope: include **all 9 symbols** (Damage, Shove, Exposed, Strained, Pinned, Disarmed, Reposition, Heal, Hunker)

---

## Icon Legend (confirmed from `public/images/icons/`)

| Symbol | Icon file | Visual | Description |
|--------|-----------|--------|-------------|
| Damage | `damage.png` | Lightning bolt/spark | Unit suffers 1 damage |
| Shove | `shove.png` | Triple-bar right arrow | Forced movement |
| Exposed | `exposed.png` | Exclamation mark (!) | Removes defense expertise |
| Strained | `strained.png` | Two teardrops | Damage on next action |
| Pinned | `pinned.png` | Notched/stepped arrow | Blocks movement |
| Disarmed | `disarmed.png` | Broken blaster | Removes attack expertise |
| Reposition | `reposition.png` | 4-directional cross arrow | Move self |
| Heal | `heal.png` | Medical cross (circuit) | Remove damage/condition |
| Hunker | `hunker.png` | Solid upward triangle | Gain cover tokens |

---

## Structural Taxonomy (observed from sample)

| Tree Shape | Description | Example |
|------------|-------------|---------|
| Linear | Single chain, no branches | Some support units |
| Linear + late branch | Branch at final node, 2 terminal options | ARF Clone Troopers |
| Linear + early branch | Branch at start, 2 diverging paths of different lengths | Grievous Stance 1 |
| Parallel rows | 2 rows from start, no convergence, same length | Anakin Stance 2 |
| Diamond | Branch then converge to single terminal | Dooku Stance 2, Anakin Stance 1 |
| Complex lattice | Multiple intermediate nodes with cross-connections | Dooku Stance 1 |
| Multi-start independent | 2–3 orange starts, each feeds separate chain | Thrawn Stance 1 |
| Fan | Start branches into 3+ paths | Obi-Wan Stance 1 |

---

## Data Schema (per-card recording)

For each stance card image, record:

```
CHARACTER: <name>
CARD_FILE: <filename>
STANCE: <1 or 2>
STANCE_NAME: <name from card>

START_NODES: <count>
  [For each orange start node A, B, C...]
  Start-A symbols: <symbol1>[+<symbol2>]

TREE_TOPOLOGY:
  [List all white nodes with symbols, using positional labels like row-col]
  Node notation: <label>: <sym1>[+<sym2>]
  Connections: <from> → <to>, <from> → <to>, ...

PATHS (from each start to each terminal, reading left→right only):
  Start-A:
    Path 1: Start-A → N1 → N2 → N3  (length = X squares)
    Path 2: Start-A → N1 → N4        (length = Y squares)
  Start-B:
    Path 1: ...

BRANCH_POINTS per start:
  Start-A: <count>  (nodes with >1 forward exit)

SYMBOL_INVENTORY (ALL nodes including orange start squares):
  <sym>: <count> single, <pairs listing>
```

---

## Execution Approach

### Phase A — Image Extraction (batched by SWP pack)

Read ALL stance card images in this order, using `Read` tool on each PNG/JPG.
Record tree data for each before moving to next batch.

Image files are in `public/images/`, named like:
`SWP{nn}_{Name}_Stance[_{1|2}].png` (or variations with lowercase/dashes)

**Batch groupings** (~10–12 cards each):
1. SWP01: Anakin ×2, Ahsoka ×2, Asajj ×2, B1, Bo-Katan, Gar, Rex, 501st, Clan Kryze
2. SWP03: Dooku ×2, Jango | SWP04: Barriss | SWP05: Grievous ×2, B2
3. SWP06: Obi-Wan ×2, 212th, Cody | SWP08: Ponds, ARF
4. SWP09: Cad Bane ×2, Aurra Sing, Bounty Hunters | SWP10: Hondo ×2, Gwarm
5. SWP11: Wolffe, Wolfpack | SWP15: Handmaidens | SWP16: Mandos
6. SWP21: Vader ×2 | SWP22: Luke, Boushh | SWP24: Karga, IG-11
7. SWP25: Boba, Bossk, Dengar, IG-88B | SWP26: Dark Troopers, Death Escort
8. SWP27: Chirpa ×2, Hunters | SWP28: Thrawn ×2, Kallus, ISB
9. SWP29: Ezra, Zeb | SWP31: Cassian ×2, Rebel Pathfinders
10. SWP34: Iden ×2, Hask, Meeko, ISF | SWP35: Han ×2, Chewie, Commandos
11. SWP36: Crosshair ×2, ES04, Elites | SWP37: Fil, Fil's Squad
12. SWP38: Hunter ×2, Tech+Echo, Crosshair | SWP39: Logray, 3PO ×2, Ewok Trappers
13. SWP41: Leia, Han+Chewie | SWP44: Hera ×2, Chopper
14. SWP46: Veers ×2 | SWP51: Death Troopers, Specialist, Krennic ×2
15. SWP52: Bodhi, Baze ×2 | SWP81: Ahsoka ×2, Vader
16. Remaining SWPs (SWP62, SWP63, etc.)

> **Context management**: If context is running long mid-batch, compile stats from completed batches first, write to the output .md incrementally, then continue.

### Phase B — Statistical Compilation

After all cards are read, compute:

**1. Path Lengths**
- For every path from every start node on every card, note path length (squares from orange start through white nodes to terminal, inclusive of start square)
- Global min, global max, mean, median
- Distribution: count of paths of length 2, 3, 4, 5, 6, 7+

**2. Branch Counts per start-origin**
- For each orange start node: count nodes where >1 forward exit exists
- Distribution: how many start-origins have 0, 1, 2, 3+ branch points
- Min/max per card (the range of branching across one card's start nodes)

**3. Symbol Inventory**
- Count every square slot including orange start squares (a square with 2 symbols counts as 2 slots)
- Table A: single-symbol squares — count per symbol type (all squares, including orange starts)
- Table B: dual-symbol pairs — every unique {sym1 + sym2} combination with count
  (treat {Damage+Shove} == {Shove+Damage} — combine duplicates; include orange start pairs)
- Table C: grand total symbol occurrences across all cards (starts + white squares)

**4. Per-card Variance by Condition**
- For each stance card start-origin, for each of the 9 symbols:
  - Count symbol occurrences on each path (sum across all squares on that path, both single and dual-symbol squares)
  - Record min_count (least exposures on any path from this start) and max_count (most exposures on any path from this start)
  - Variance = max_count − min_count
- Output: table showing cards with highest variance per symbol
- Also: global answer to "for a given Damage symbol, what's the min you can have on any path vs the max"

---

## First Step Upon Starting

Before any image analysis begins, write this entire plan document verbatim to:
`/home/redrazor/workspace/ShatterApp/shatter_stats_plan.md`

This ensures the plan is persisted in the project repo so this or any session can reference it.

---

## Output File

**Location**: `analysis/stance-tree-analysis.md`
(Create `analysis/` directory if it doesn't exist)

**Structure:**
```
# Stance Card Expertise Tree Analysis
## Summary
## Icon Legend
## 1. Path Length Analysis
   - Global min/max + who holds each record
   - Distribution table (path length → count of paths)
## 2. Branch Count Analysis
   - Range + who has the most/least branching
   - Distribution table
## 3. Symbol Distribution
   - Table A: single-symbol squares
   - Table B: dual-symbol pair combinations (sorted by frequency)
   - Table C: total symbol occurrences
## 4. Condition Variance Per Stance Card
   - Per-symbol: min possible on any path / max possible on any path (global)
   - Table: for each symbol, which card+start has the highest variance (max-min)
   - Variance = 0 means every path through this start exposes equal amounts
## Appendix: Raw Per-Card Data
   - One section per character, one subsection per stance card
   - Shows tree topology, all paths, and per-path symbol counts
```

---

## Verification

After writing the output file:
1. Spot-check 3–5 cards: re-read the image, manually trace the paths, and confirm the recorded data matches
2. Verify totals add up (e.g., sum of all path counts per symbol in variance tables should be consistent with symbol inventory)
3. Confirm min/max path length holders are correct by re-reading those specific card images
