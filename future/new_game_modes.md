# ShatterApp — New Game Modes

> Dedicated spec for game mode expansions to the Play view. Each mode reuses the existing struggle track infrastructure and adds mode-specific UI, labels, and mechanics.

---

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done

---

## #8 — Key Operations game mode

**Context:** Key Operations (KO) is an asymmetric 2-player competitive format. One player is the **Aggressor**, the other the **Sentinel**. Uses the same struggle track as Standard play with additional asymmetric mechanics.

**Status:** `[ ]`

### Feature Breakdown

- **Role labels:** Replace "P1 / P2" with "Aggressor / Sentinel" (amber / blue — same palette as existing players)
- **Advantage Cards:** Each player has 3 role-specific card chips (Flanking / Reserve / Coordinated Assault for Aggressor; Defensive / Support / Reinforcement for Sentinel). Tap to mark used.
- **Campaign mode:** 3-op series. First to win 2 ops wins the campaign. Campaign progress shown as 3 pip bar above the struggle track.
- **Mode selector:** Tab bar at top of PlayView: `[ Standard ] [ Key Operations ] [ Legendary Encounters ]`. Switching resets the current game.

### Implementation Notes
- New store: `src/stores/keyops.ts` — campaign state (persisted) + advantage card state (session)
- `PlayView.vue`: add mode selector, KO branch for UI, relabel P1/P2, add advantage card panel + campaign pip bar

**Files:**
- `src/stores/keyops.ts` — NEW
- `src/views/PlayView.vue` — mode selector + KO UI

---

## #9 — Legendary Encounters game mode

**Context:** Legendary Encounters (LE) is a 3-player asymmetric format. One player is the **Legend** (solo), the other two players are **Cadre 1** and **Cadre 2** (collaborative). Struggle track mechanics are identical to Standard play.

**Status:** `[ ]`

### Feature Breakdown

- **Role labels:** "Legend" (amber) vs "Cadres" (blue — represents both cadre players' shared side)
- **Mission filtering:** Only 2 specific LE missions exist — mission picker should filter to show only those
- **Rules note:** Small text below scoreboard: "Legend wins 2 struggles = Legend victory. Cadres win 2 struggles = Cadre victory."
- **No new store needed:** Re-uses `useStruggleStore` — only labels and mission filter change

### Implementation Notes
- LE missions identified by name/flag; hardcode the list to avoid schema changes
- `PlayView.vue`: LE branch in mode selector, filtered mission picker, relabelled scoreboard

**Files:**
- `src/views/PlayView.vue` — LE mode branch
