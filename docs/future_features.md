# ShatterApp — Future Features & User Feedback

> Living document. Add new suggestions as they come in. Each entry includes the original request, implementation options, and a recommended approach.

---

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done

## Priority / Effort Legend
- **Priority:** High / Medium / Low
- **Effort:** S (≤1d) / M (≤3d) / L (≤1w) / XL (>1w)

---

## #1 — Cohesion-Aware Randomizer + Skirmish Build Mode

**Status:** `[ ]` Not started
**Priority:** High
**Effort:** L
**Target version:** v2.16.0

**Context:** The current randomizer (`src/utils/randomBuild.ts`) only generates a fixed 2-squad strike force with a soft tag-synergy preference. Players want (a) control over how *cohesive* the generated squads feel, (b) support for any of the 1/2/3/4-squad build modes the app supports, and (c) an option to randomize the mission alongside the squads. There is also no existing way to build a single-squad list, which Feature #3 (2v2 multiplayer) also needs.

### Cohesion Spectrum (5 levels)

| Value | Label | Behavior |
|---|---|---|
| 0 | Locked | Hard-filter the pool to one random `swpCode`. All units come from the same pack. Falls back to Pack-Loyal if no pack can satisfy constraints. |
| 25 | Pack-Loyal | 5× weight for units sharing the squad's primary `swpCode`. |
| 50 | Tag-Aligned | 3× weight for units sharing at least one tag with the squad's primary. *(Closest to current behavior.)* |
| 75 | Loose | 1.5× weight for tag-sharing units. |
| 100 | Chaos | No cohesion weighting. Random valid pick from the whole eligible pool. |

Hard constraints (era compatibility, PC ≤ SP budget, character-type uniqueness, name uniqueness) are always enforced regardless of cohesion.

### Recommended Approach

1. Add `'skirmish'` to `BuildMode` union in `src/types/index.ts`; extend `activeSquadCount` computed in `src/stores/strikeForce.ts:134` to return 1 for skirmish. Update `hasStrikeForceConflict()` (lines 299–312) to accept variable-length `Squad[]` (1–4).
2. Rewrite `generateRandomStrikeForce()` in `src/utils/randomBuild.ts:26–134` to accept `{ squadCount: 1|2|3|4, cohesion: 0|25|50|75|100, ownedSwpCodes?: Set<string> }` and return `Squad[] | null`. Reuse existing `eraSet`, `eraCompatible`, `sharesTag` helpers (lines 7–24). Add `cohesionWeight()` for weighted selection.
3. Persist `cohesion` and `randomizeMission` prefs on the strikeForce store (both default: `cohesion=50`, `randomizeMission=false`).
4. In `src/components/build/StrikeForcePanel.vue`: add Skirmish button to the build-mode selector (lines 136–152); remove the inline 🎲 Random / Owned buttons (lines 77–93); add a new **Random Generator** section with cohesion slider (native `<input type="range" step="25">` with `accent-sw-gold` per `src/components/custom/phase4/StancesForm.vue:70–95`), owned-only toggle, "Randomize mission too" checkbox, dynamic "Will generate: N squads" label, and Generate button.
5. Update `src/views/BuildView.vue` `onRandom` handler (lines 34–51) to pull `cohesion`, `buildMode`, `activeSquadCount` from the store, call the new generator, distribute results back to `squads` / `extraSquads`. When `randomizeMission` is on, pick a random entry from the missions store and call `sfStore.setMission()`.

### Implementation Notes

- **UI pattern reuse:** slider = native `<input type="range">` + `accent-sw-gold`; toggle rows copy the markup at `src/components/collection/SettingsPanel.vue:109–134` for visual consistency.
- **Cohesion=0 fallback:** if no single pack has enough Primary/Secondary/Support units to fill `squadCount` squads, downgrade to Pack-Loyal and surface a subtle notice (toast or inline caption).
- **Tag array:** `Character.tags` is already `string[]` (parsed in `scraper/normalise.ts:88–94`); no re-parsing needed.
- **Tests:** create `tests/unit/utils/randomBuild.spec.ts` covering squadCount 1 & 4, cohesion 0 (Locked pack) + 100 (Chaos distribution), owned-only filter, null return on impossible pool. Create `tests/unit/stores/strikeForce.spec.ts` covering `activeSquadCount` across all 4 modes, skirmish clears `squads[1]` + both `extraSquads`, `hasStrikeForceConflict` detects duplicates across 3- and 4-squad forces.

### Acceptance Criteria
1. Skirmish button in StrikeForcePanel selector; clicking shows exactly one squad slot in BuildView.
2. Random Generator section visible with 5-label cohesion slider highlighting the current value.
3. "Will generate: N squads" line updates immediately when buildMode changes.
4. Cohesion=0 generates a force where all units share one `swpCode`, with graceful fallback if impossible.
5. Cohesion=100 produces valid strike forces with no tag/pack bias.
6. Owned-only toggle is respected at every cohesion level.
7. Premiere mode fills all 4 squads with no duplicate units or character types.
8. Cohesion and "Randomize mission too" preferences persist across reload.
9. "Randomize mission too" checkbox assigns a random mission when checked; leaves mission untouched when unchecked.

---

## #2 — Landscape Lockout Override + Tablet Support

**Status:** `[ ]` Not started
**Priority:** Medium
**Effort:** S
**Target version:** v2.16.0

**Context:** The app force-locks all touch devices to portrait via a fullscreen overlay (`src/App.vue:136–146`) plus `screen.orientation.lock('portrait-primary')` (`src/App.vue:36`), triggered by CSS `@media (orientation: landscape) and (pointer: coarse)` (lines 150–159). Two problems:
1. No user escape hatch. Players who want landscape (tablet, folding phone) are locked out with no instructions.
2. Tablets are mis-targeted. `(pointer: coarse)` matches both phones and tablets, but the responsive layout already handles ≥640px viewports well — no hardcoded phone-width assumptions exist per audit.

### Recommended Approach

1. Add `allowLandscapeMode: ref(false)` to `src/stores/settings.ts` (auto-persisted via existing `{ persist: true }`).
2. In `src/App.vue`:
   - Bind `.landscape-block` visibility to `!settingsStore.allowLandscapeMode` (still within the tightened media query).
   - Rewrite the overlay copy to explain the workaround and add an **Open Settings** button that opens the SettingsPanel drawer directly.
   - Gate the `screen.orientation.lock(...)` call on `!allowLandscapeMode`; call `screen.orientation.unlock?.()` when the toggle flips on at runtime.
3. Tighten the CSS media query to exclude tablets:
   ```css
   @media screen and (orientation: landscape) and (pointer: coarse) and (max-width: 767px) { ... }
   ```
4. Add a new **Display** section to `src/components/collection/SettingsPanel.vue` with an "Allow landscape mode" toggle row (copy the toggle pattern from lines 109–134).

### Implementation Notes

- **Tablet audit** (verification pass, no separate code change expected): spot-check iPad portrait (768×1024) and landscape (1024×768) across BrowseView, BuildView, Custom Builder Phase 1 & 4, PlayView, CharacterProfile modal, SettingsPanel. All existing breakpoints (`sm:`/`md:`/`lg:`) already accommodate tablet widths — file follow-ups only if something actually breaks.
- **Overlay copy (draft):**
  > **Rotate Your Device**
  > ShatterApp's mobile layout is portrait-first.
  >
  > Want to use landscape anyway?
  > → Open Settings → toggle **"Allow landscape mode"**
  >
  > [ Open Settings ]
- **Screen Orientation API:** already wrapped in `?.` + `.catch()` — extend with conditional, no new error handling needed.

### Acceptance Criteria
1. Phone in landscape with toggle OFF shows the rotate overlay with new instructions + "Open Settings" button.
2. Clicking "Open Settings" from the overlay opens the Settings drawer.
3. Toggling "Allow landscape mode" ON immediately dismisses the overlay (no reload).
4. Toggling it OFF restores the lockout next time the device rotates.
5. Any viewport ≥768px in landscape never shows the overlay, regardless of toggle.
6. Setting persists across reload.
7. `screen.orientation.lock('portrait-primary')` is not called when landscape is allowed; orientation is unlocked at runtime when toggled on.
8. Tablet audit table passes across all listed views.

---

## #3 — 2v2 Multiplayer Mode

**Status:** `[ ]` Not started
**Priority:** Medium
**Effort:** XL
**Target version:** v2.17.0
**Depends on:** #1 (Skirmish build mode)

**Context:** Current Play multiplayer is fixed 1v1 — one host creates a 4-letter code, one guest joins, both sync full strike force / tracker / dice over Socket.io. The room schema, server handlers, and client UI all hardcode "host + guest = 2 players" (`server/rooms.ts:6–13`, `server/index.ts:55–183`, `src/stores/rollSession.ts`, `src/components/play/multiplayer/MultiplayerPanel.vue`).

We want a **2v2 mode** alongside the existing 1v1: 4 players, 2 teams (Red / Blue) × 2 slots each, match gated until both teams are full. Each player brings exactly **one squad** — Skirmish build required. Existing 1v1 path stays as the default and is untouched.

### Recommended Approach

**Server (`server/rooms.ts` + `server/index.ts`):**
Extend the `Room` shape:
```typescript
export type RoomMode = '1v1' | '2v2'
export type Team = 'red' | 'blue'
export interface RoomPlayer {
  socketId: string; name?: string; team?: Team; disconnectedAt?: number
}
export interface Room {
  code: string
  mode: RoomMode                  // NEW — defaults to '1v1'
  players: RoomPlayer[]           // REPLACES host/guest pair; cap 2 (1v1) or 4 (2v2)
  gracePeriod?: ReturnType<typeof setTimeout>
  duelRoles: Set<'attacker' | 'defender'>
}
```
- `createRoom(socketId, name?, mode)` accepts mode.
- `joinRoom` capacity = `mode === '2v2' ? 4 : 2`; returns `'full'` at cap.
- New `selectTeam(code, socketId, team)` — rejects if team has 2 players.
- New `isMatchReady(room)` — true when 1v1 has 2 connected players OR 2v2 has 2 players on each team.
- Replace `getOpponentSocketId` with `getOtherPlayerSocketIds(room, mySocketId): string[]`; switch all broadcasts to `socket.to(code).emit(...)` so 2v2 fan-out works for free.

New socket events:
- `select-team` (client → server) → ACK `{ ok; players } | { ok: false; reason }`
- `room-update` (server → all) `{ players, mode, ready }` — broadcast whenever team membership changes.

**Client:**
- `src/stores/rollSession.ts`: refactor to `mode`, `players[]` (includes self), `myTeam`, `matchReady`, `playerUnits: Record<socketId, PlayUnit[]>`, `playerForcePools`. Computed `teammates` / `opponents`. Keep a legacy `opponentUnits` computed for 1v1 back-compat.
- `src/composables/useDiceRoom.ts`: `createRoom(name?, mode)`, new `selectTeam(team)` method, listener for `room-update`. `opponent-units` merges into `playerUnits` map keyed by sender socket id.
- `src/components/play/multiplayer/MultiplayerPanel.vue`: add 1v1 / 2v2 radio picker above Create / Join buttons. Show a note on 2v2: *"Each player brings 1 squad. Build → Skirmish mode required."*
- **NEW** `src/components/play/multiplayer/TeamSelectPanel.vue`: two-column Red/Blue layout with 2 slots each. Shown between join and match-unlock. Status flips to "Match ready" when `matchReady`.
- `src/components/play/multiplayer/SessionBanner.vue`: 2v2 variant shows a 4-pill row of player names, tinted by team.
- `src/views/PlayView.vue`: route to TeamSelectPanel when `mode === '2v2' && !matchReady`. Enforce Skirmish: if `sfStore.buildMode !== 'skirmish'`, show a blocking banner linking to BuildView.
- `src/components/play/units/UnitsTab.vue`: when `players.length > 2`, render a 4-column grid (one per player, tinted by team); otherwise keep existing 1v1 layout.

### Implementation Notes

- **Dice / duel subsystem** stays as-is for MVP. Any 2 players in the 2v2 room can still claim attacker/defender as they do today.
- **Disconnect handling:** existing 30s grace period applies per-player. A disconnect in 2v2 drops `matchReady` to false; rejoin within 30s restores the player to their previous team slot.
- **Back-compat shim:** keep legacy `room.host` / `room.guest` getters resolving to `players[0]` / `players[1]` until all 1v1 code paths migrate to `players[]`.
- **Roster visibility:** all 4 rosters visible to all players (read-only from others). Only own roster is editable.

### Acceptance Criteria
1. MultiplayerPanel shows a 1v1 / 2v2 mode picker, default 1v1.
2. Creating a 2v2 room yields a 4-letter code; host sees TeamSelectPanel with 4 empty slots.
3. Up to 4 players join the same 2v2 room; a 5th gets "Room full".
4. Each player picks Red or Blue; teams cap at 2 players each; over-cap joins rejected with a clear message.
5. When both teams reach 2 players, status flips to "Match ready" and play UI unlocks for all.
6. A player whose build is not in Skirmish mode sees a blocking banner explaining how to switch, cannot lock their roster.
7. During play, all 4 rosters are visible to everyone, color-tinted by team; only own roster editable.
8. Disconnect flips `matchReady` to false; rejoin within 30s restores prior team slot.
9. Leaving a 2v2 room frees the team slot for a new joiner.
10. 1v1 mode flow is unchanged — no regression.
