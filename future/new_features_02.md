# ShatterApp — Remaining Features Implementation Plan

## Context

9 features were originally open (`[ ]`) in `future/future_features.md`. Two are excluded:
- **#12 (Profile-Linked Dice Rolls)** — done, status updated to `[x]`
- **#14 (Homebrew Builder)** — data not ready, skipped
- **#20 (Keywords & Icon Glossary)** — done, shipped v2.0.2, status updated to `[x]`

That leaves **7 features** to implement. This plan covers the recommended order and a concrete implementation blueprint for each.

---

## Recommended Order

| # | Feature | Effort | Why this order |
|---|---------|--------|----------------|
| **#22** | Order Deck Builder | S | Zero deps, data already exists (`orderCard`/`model` on Character), purely additive UI |
| **#17** | Richer Unit Filters | S | Extends existing composable + FilterPanel, no new files, high daily-use value |
| **#21** | Random Strike Force Generator | S–M | New util + button, uses existing `isSquadValid()`, characters store |
| **#16** | SPT / Longshanks Export | M | All 133 chars have `spt` field; new util + button in StrikeForcePanel |
| **#20** | Keywords & Icon Glossary | M | Extends ReferenceView; data curation is main bottleneck (not code) |
| **#18** | QR Code Build Sharing | S | Only feature needing a new npm dep (`qrcode`); trivial wrapper around existing `encodeBuild()` |
| **#19** | Dice Probability Calculator | L | Most complex: Web Worker, Monte Carlo sim, new component + tab in RollView |

**Rationale:** Quick wins with zero dependencies first → medium features using existing data → new dependency → heavy feature last.

---

---

## Feature #22 — Order Deck Builder

**Goal:** Show order card & model images for all units in the current Strike Force build.

### Files
- **Create:** `src/components/build/OrderDeckPanel.vue`
- **Modify:** `src/views/BuildView.vue` — import + render panel below squad grid

### Implementation
1. `OrderDeckPanel.vue` receives an array of `Character` objects (all non-null units from active squads)
2. Renders a responsive grid (2-col mobile, 3-4 col desktop) of order card images via `imageUrl(char.orderCard)`
3. Each card shows: order card image, unit name label, optional model image
4. Appends a final "+ 1 Shatterpoint Card" reminder slot
5. Only renders when ≥1 unit is placed (`v-if`)
6. Falls back to "No order card" placeholder when `orderCard` is falsy

### Testing
- Unit test: computed list length, correct image paths
- Manual: verify images load from CDN

---

## Feature #17 — Richer Unit Filters in Browse

**Goal:** Add PC range, Force value chips, Stamina range, Durability range to Browse filters.

### Files
- **Modify:** `src/composables/useSearch.ts` — extend `SearchFilters` + filter logic
- **Modify:** `src/components/ui/FilterPanel.vue` — new filter controls
- **Modify:** `src/views/BrowseView.vue` — initialize new filter defaults
- **Modify:** `tests/unit/composables/useSearch.spec.ts` — new test cases

### Implementation
1. Add to `SearchFilters`:
   - `pcMin / pcMax: number | null` — range for PC (null = no filter)
   - `fpValues: number[]` — multi-select chip for Force (0–4)
   - `staminaMin / staminaMax: number | null`
   - `durabilityMin / durabilityMax: number | null`
2. Filter logic (AND composition, same pattern as existing):
   - PC: `char.pc !== null && char.pc >= pcMin && char.pc <= pcMax` (skip if both null)
   - Force: `fpValues.length === 0 || fpValues.includes(char.fp)`
   - Stamina/Durability: simple range checks
3. UI in FilterPanel: collapsible "Advanced Filters" section with:
   - PC: two number inputs (min/max)
   - Force: row of toggle chips (0, 1, 2, 3, 4)
   - Stamina/Durability: two number inputs each
4. "Clear advanced" button resets all to defaults

### Testing
- Unit tests for each filter dimension + combined filters
- Edge case: Primaries with `pc: null` should pass PC filters

---

## Feature #21 — Random Strike Force Generator

**Goal:** "Random" button generates a valid Strike Force in the current build draft.

### Files
- **Create:** `src/utils/randomBuild.ts`
- **Modify:** `src/views/BuildView.vue` — add Random button + handler

### Implementation
1. `generateRandomStrikeForce(characters, options?)` returns squad slot assignments or null
2. Options: `{ ownedOnly?, ownedSwpSet?, era?, buildMode? }`
3. Algorithm per squad:
   - Pick random Primary → filter eligible Secondaries/Supports by era overlap + PC budget
   - Pick random Secondary (pc ≤ primary.sp) → pick random Support (pc ≤ remaining budget)
   - Enforce uniqueness across squads (no duplicate `characterType`)
4. Retry up to 50 attempts per squad; return null if impossible
5. UI: button in BuildView header area, toast on success/failure
6. Populates draft via existing store actions

### Testing
- Unit test with controlled character pool: verify output passes `isSquadValid()`
- Test null case with impossible constraints

---

## Feature #16 — SPT / Longshanks Tournament Export

**Goal:** "Export SPT" button generates an SPT code string and copies to clipboard.

### Files
- **Create:** `src/utils/sptExport.ts`
- **Modify:** `src/components/build/StrikeForcePanel.vue` — add SPT button + emit
- **Modify:** `src/views/BuildView.vue` — handle emit

### Implementation
1. All 133 characters have `spt` (8-digit code, e.g. `"00440103"`)
2. `generateSptCode(squads, mission?)` concatenates unit `spt` values in squad order
3. Format research needed: validate concatenated format against Tabletop Admiral exports
4. Button alongside Save/Share/Print, only enabled when build is complete
5. Copies to clipboard + shows toast; optional modal display of the code

### Testing
- Unit test: known characters → expected concatenated string
- Test missing spt field → returns null
- Manual: compare against external tools

---

## Feature #20 — Keywords & Icon Glossary

**Goal:** Searchable, categorized glossary of all Shatterpoint keywords and game terms.

### Files
- **Create:** `public/data/glossary.json` — manually curated
- **Create:** `src/stores/glossary.ts` — lazy-load store
- **Create:** `src/components/reference/GlossaryPanel.vue`
- **Modify:** `src/views/ReferenceView.vue` — add Glossary tab

### Implementation
1. `glossary.json`: array of categories, each with entries `{ term, definition, icon? }`
2. Store: lazy-load pattern (same as `galacticLegends.ts`)
3. UI: search input + collapsible category sections + alphabetized entries
4. Categories: Combat Keywords, Conditions, Ability Icons, Game Terms
5. Data curation from AMG rulebook is the main effort (~2-3 hours manual work)

### Testing
- Unit test: store loads, search filters correctly
- Manual: verify all sections render and collapse

---

## Feature #18 — QR Code Build Sharing

**Goal:** Modal with scannable QR code encoding the build share URL.

### Files
- **Create:** `src/components/build/QrShareModal.vue`
- **Modify:** `src/views/BuildView.vue` — add QR button + modal
- **Modify:** `package.json` — `npm install qrcode @types/qrcode`

### Implementation
1. Install `qrcode` (~15kB)
2. `QrShareModal.vue`: receives URL prop, renders QR via `qrcode.toDataURL(url)`
3. White background QR image (≥200×200px), build name heading, "Copy Link" fallback button
4. Trigger: QR icon button near existing Share button
5. URL generated via existing `encodeBuild()` pattern

### Testing
- Unit test: modal renders with URL prop
- Manual: scan QR with phone, verify correct URL

---

## Feature #19 — Dice Probability Calculator

**Goal:** Monte Carlo simulation showing hit probability distributions for attack vs defense dice pools.

### Files
- **Create:** `src/utils/diceProb.ts` — simulation logic
- **Create:** `src/utils/diceProb.worker.ts` — Web Worker wrapper
- **Create:** `src/components/dice/ProbabilityCalculator.vue`
- **Modify:** `src/views/RollView.vue` — add Roller/Probability tab toggle

### Implementation
1. `simulate(atkCount, defCount, runs=50000)` → distribution map + cumulative P(≥X) + avg hits
2. Reuse face distributions from existing `src/utils/dice.ts` (ATTACK_TABLE, DEFENSE_TABLE)
3. Web Worker via Vite native support: `new Worker(new URL('./diceProb.worker.ts', import.meta.url))`
4. UI: two number steppers (attack 1-12, defense 0-12), results table with CSS bar chart
5. Color-code: green ≥50% probability, red <25%
6. 300ms debounce on input change
7. Tab toggle in RollView: "Roller" | "Probability"

### Testing
- Unit test `simulate()`: distribution sums to `runs`, statistical sanity checks (e.g. 6 atk / 0 def ≈ 3.0 avg hits)
- Manual: verify worker communication, UI responsiveness

---

## Per-Feature Version Bump Plan

Each feature gets its own branch, PR, merge, then minor version bump on main:
- #22 → v2.6.0
- #17 → v2.7.0
- #21 → v2.8.0
- #16 → v2.9.0
- #20 → v2.10.0
- #18 → v2.11.0
- #19 → v2.12.0

(Version numbers are suggestions — confirm with user at each bump step.)
