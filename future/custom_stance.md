# Custom Builder — Phase 4 Stance Features

Tracks the two remaining stance card sub-features.
Each is its own branch, PR, and version bump.

---

## Feature 4a — Combat Tree

**Status:** `not started`
**Branch:** `feature/custom-stance-combat-tree`

### What it is
The left/centre section of each stance card. Two attack chains (Ranged + Melee),
each showing cumulative effects for 1 Hit, 2 Hits, 3 Hits (and optionally 4 Hits),
plus a separate Crit result bubble. Each bubble holds a short effect label
(e.g. "Push 1", "Stagger", "+1 Strike", "Deal Damage").

### Data model additions (StanceData)

```ts
export interface CombatTreeNode {
  effect: string   // short label, e.g. "Push 1", "+1 Strike"
}

export interface CombatChain {
  hit1:  CombatTreeNode
  hit2:  CombatTreeNode
  hit3:  CombatTreeNode
  hit4:  CombatTreeNode | null  // optional 4th node
  crit:  CombatTreeNode
}

// Added to StanceData:
rangedChain: CombatChain | null
meleeChain:  CombatChain | null
```

### UI (StancesForm.vue addition)
- Two collapsible panels per stance ("Ranged Chain" / "Melee Chain")
- Each panel: 4 text inputs (Hit 1–4) + 1 crit input
- Hit 4 enabled by a checkbox toggle ("4-hit chain")
- 28-char max per node label

### Canvas rendering (useStanceCanvas.ts addition)
- Draw two horizontal chains in the left 580px of the 836×481 canvas
  (right 256px is already occupied by the stats block)
- Ranged chain: y ≈ 130–200; Melee chain: y ≈ 260–330
- Each hit node: rounded rect bubble, white fill, black border, bold label centred
- Connecting lines between bubbles (stroke)
- Crit bubble: diamond shape, gold border, above hit-1 node
- Fallback: if chain is null, draw nothing (template already has placeholder lines)

### Acceptance criteria
- AC1: Entering a Hit 1 effect updates the canvas bubble in real time
- AC2: Toggling Hit 4 shows/hides the 4th bubble and its connector line
- AC3: Crit bubble renders as a diamond above Hit 1
- AC4: Ranged chain sits above Melee chain with clear label separation
- AC5: Long text (28 chars) fits inside the bubble without overflow
- AC6: Null/empty chain leaves the canvas area blank (no artefacts)

---

## Feature 4b — Expertise Tables

**Status:** `not started`
**Branch:** `feature/custom-stance-expertise-tables`

### What it is
A grid at the bottom of each stance card with one column per expertise count (1–3,
sometimes 1–4) and one row per weapon/defense slot. Each cell holds a short effect
label (e.g. "+1 Strike", "Pierce 1", "Dodge 1", "Reroll 1").

### Data model additions (StanceData)

```ts
export interface ExpertiseCell {
  effect: string   // e.g. "+1 Strike", "Pierce 1", empty = blank cell
}

export interface ExpertiseRow {
  col1: ExpertiseCell
  col2: ExpertiseCell
  col3: ExpertiseCell
  col4: ExpertiseCell | null  // optional 4th column
}

export interface ExpertiseTable {
  ranged:   ExpertiseRow   // row for the ranged weapon
  melee:    ExpertiseRow   // row for the melee weapon
  defense:  ExpertiseRow   // row for defensive equipment
  columns: 3 | 4           // how many expertise columns (controls col4 visibility)
}

// Added to StanceData:
expertise: ExpertiseTable | null
```

### UI (StancesForm.vue addition)
- One section per stance: "Expertise Table"
- Toggle: 3-column / 4-column mode
- 3 × 3 (or 3 × 4) grid of text inputs, labelled by row (Ranged / Melee / Defense)
  and column (1 / 2 / 3 / 4)
- 20-char max per cell

### Canvas rendering (useStanceCanvas.ts addition)
- Rendered below the bottom strip (y ≈ 340–470 in the 836×481 canvas)
- Grid: left col = weapon label, then 3 (or 4) data columns
- Cell background: alternating light grey rows for readability
- Column headers: bold "1" "2" "3" ("4") in small caps above the data rows
- Row labels: weapon/defense names from `rangedWeapon` / `meleeWeapon` / `defensiveEquipment`
  (already stored in StanceData) — reused, not duplicated
- Null expertise table = nothing drawn below the strip

### Acceptance criteria
- AC1: Entering an effect in Ranged/col1 updates the canvas cell in real time
- AC2: Switching 3→4 columns adds a 4th column to both UI and canvas
- AC3: Row labels in the table use the weapon names from the bottom strip
- AC4: Empty cells render as blank (no placeholder text)
- AC5: The table fits within the card bounds at all column counts
- AC6: Null expertise table leaves the canvas below the strip blank

---

## Implementation order

Build **4a first**, then **4b**. Both depend only on changes to:
- `src/types/index.ts` — data model
- `src/stores/homebrew.ts` — default values + updateStance patch merging
- `src/composables/useStanceCanvas.ts` — canvas rendering
- `src/components/custom/phase4/StancesForm.vue` — UI inputs
- Tests for the new type shapes and canvas rendering helpers

No new files expected beyond the above.
