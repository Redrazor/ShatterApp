# ShatterApp — Future Features & User Feedback

> Living document. Add new suggestions as they come in. Each entry includes the original request, implementation options, and a recommended approach.

---

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done

---

## #1 — Keep Render.com API awake (no cold starts)

**User feedback:** Server keeps going to sleep, causing ~30s cold starts on first load.

**Status:** `[x]` Done — `.github/workflows/keepalive.yml` added (pings API every 10 min via GitHub Actions cron). `RENDER_API_URL` secret required in repo settings.

### Options

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **UptimeRobot ping** | Free | 5 min | External service pings `/api/characters` every 5 min. No code changes. |
| **cron-job.org ping** | Free | 5 min | Same as UptimeRobot, alternative provider. |
| **GitHub Actions keepalive** | Free | 15 min | Scheduled workflow (every 10 min) hits the API endpoint. Lives in repo. |
| **Render.com paid upgrade** | $7/mo | 0 min | Starter instance never sleeps. Flip of a switch. |
| **Migrate to Railway.app** | $5/mo | 1–2 hrs | Hobby plan, no sleep, better DX than Render. Needs redeploy. |

### Recommended Approach
**Short term (free):** Set up UptimeRobot — create a free account, add an HTTP monitor pointing at `https://<render-url>/api/characters`, interval 5 minutes. Zero code changes, live in 5 minutes.

**Long term:** If traffic grows and reliability matters more, migrate to Railway ($5/mo) or upgrade Render to the $7/mo Starter plan.

### Implementation Notes
- Render free tier spins down after **15 min** of inactivity
- Ping endpoint should be something lightweight — `/api/characters` returns JSON quickly
- UptimeRobot also gives free uptime monitoring as a bonus (email alerts if server goes down)
- GitHub Actions approach: add `.github/workflows/keepalive.yml` with a `schedule: cron: '*/10 * * * *'` trigger and a `curl` step

---

## #2 — Persistent user data (collection + saved lists survive reboots)

**User feedback:** Users lose their collection and saved Strike Force lists when localStorage is cleared, they switch device, or the app redeploys. Need a more permanent backup/sync solution.

**Status:** `[x]` Done (Phase A) — v1.3.1. Export/Import buttons added to Collection view. `src/composables/useDataBackup.ts` handles JSON backup (`{ version, collection, savedLists }`). Profile share link and AppImportBanner removed. Phase B (Firebase cloud sync) deferred to Phase 2 alongside #7 (mobile).

### Context
Currently both `collection` and `strikeForce` stores use `pinia-plugin-persistedstate` → localStorage. This is device- and browser-specific. The app already has a basic profile share link (`/?p=<encoded>`) but it requires manual effort and isn't a true backup.

Firebase is already in the project (for image CDN at `shatterapp-images.web.app`), making Firebase Auth + Firestore the lowest-friction cloud option.

### Options

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **JSON export/import** | Free | 2–3 hrs | Download all user data as `.json`; import to restore. No auth, no backend. |
| **Google login + Firestore** | Free tier | 1–2 days | Firebase Auth (Google) + Firestore stores data per user. Cross-device, automatic. |
| **Anonymous token sync** | Free tier | 1 day | Generate a UUID for the user, store in localStorage. Backend saves data keyed by UUID. No login needed but UUID loss = data loss. |
| **GitHub OAuth** | Free | 1–2 days | Alternative to Google, less friction for tech-savvy users. |

### Recommended Approach

**Phase A — JSON export/import (ship first, low effort):**
- Add an "Export data" button in Collection or a settings panel → triggers a JSON download of `{ collection, savedLists }`
- Add an "Import data" button that reads the JSON file and restores both stores
- Files: `src/views/CollectionView.vue` or a new `src/views/SettingsView.vue`, new composable `src/composables/useDataBackup.ts`
- No backend changes required

**Phase B — Google login + Firestore (proper solution) — Phase 2, pair with mobile (#7):**
- Firebase is already set up (`firebase.json`, `.firebaserc` → project `shatterapp-images`)
- Add `firebase` JS SDK to frontend: `npm install firebase`
- Enable Firebase Auth (Google provider) in Firebase Console
- Enable Firestore in Firebase Console
- On login: read user doc from Firestore → merge with localStorage state
- On any store change: debounced write to Firestore under `users/{uid}/data`
- Files to create/edit:
  - `src/plugins/firebase.ts` — Firebase app init
  - `src/stores/auth.ts` — user session store
  - `src/composables/useCloudSync.ts` — watch stores, debounce write to Firestore
  - `src/components/AppHeader.vue` (or `App.vue`) — Google Sign-In button
- Firestore free tier: 50k reads/day, 20k writes/day — more than sufficient for this scale
- **Ship alongside #7 (Capacitor/mobile)** — cloud sync is more valuable once the app is installable

### Implementation Notes
- Ship Phase A immediately — gives users a manual backup today
- Phase B can run alongside localStorage (Firestore as source of truth on login, localStorage as offline cache)
- Keep auth optional — app remains fully functional without login

---

## #3 — Balance change tracking + card art freshness indicator

**User feedback:** Inspired by Jarvis Protocol. Users want to know (a) whether a unit has received any balance/errata changes and what those were, and (b) whether the physical card art in the app reflects the current rules or is outdated.

**Status:** `[x]` Done — v1.3.0. `public/data/errata.json` seeded with 31 units from the Jan 2026 / v1.3 print sheet. `src/stores/errata.ts` Pinia store. Card freshness badge (✓ / ⚠) and collapsible Balance History added to both `CharacterProfile.vue` and `UnitProfileModal.vue`. Card images on Firebase updated to AMG CDN v1.3 prints (122 files). `characters.json` stats corrected for 8 units with HP changes in v1.3.

### Context
- No errata or changelog system exists anywhere in the codebase today
- `Character.releaseDate` exists in the type and schema but is entirely unpopulated (always `""`)
- Both profile components (`UnitProfileModal.vue`, `CharacterProfile.vue`) are scrollable stats panels — a collapsible section at the bottom is a natural fit
- Card art freshness indicator would sit above the card image in both components
- Data for balance changes would need to be **manually curated** — it does not exist in the pointbreaksw.com API scraper output

### Feature Breakdown

#### A — Card art freshness indicator
A small badge above the card image:
- **Green ✓** — card art is current (reflects latest rules)
- **Red ✗** — card art is outdated (old print; errata has changed stats/rules since printing)

#### B — Balance changelog section (collapsible)
A `<details>` / collapsible panel at the bottom of the stats section in both profile components showing a chronological list of changes, e.g.:
```
v1.2 — 2024-11-01
• SP reduced from 8 to 7
• Tag "Warrior" removed

v1.0 — 2023-06-01
• Initial release
```

### Data Design

**Key decision: where does the changelog data live?**

| Option | Pros | Cons |
|---|---|---|
| **`public/data/errata.json`** — static curated file, committed to repo | Simple, no DB changes, fast | Manual to maintain, needs a commit per update |
| **New `errata` DB table** — scraped or manually seeded | Structured, queryable | More complexity; scraper can't auto-populate this |
| **Inline in `characters.json`** — add `changelog[]` field per character | Single source of truth | Bloats the JSON; still manually maintained |

**Recommended:** `public/data/errata.json` — a standalone curated JSON file, keyed by character `id` or `swpCode`, committed alongside `characters.json`. No DB changes needed; frontend fetches it directly (or it's bundled into the Vite build via a store).

**Schema:**
```json
{
  "82": [
    {
      "version": "1.2",
      "date": "2024-11-01",
      "cardArtCurrent": false,
      "changes": ["SP reduced from 8 to 7", "Tag 'Warrior' removed"]
    },
    {
      "version": "1.0",
      "date": "2023-06-01",
      "cardArtCurrent": true,
      "changes": ["Initial release"]
    }
  ]
}
```
- `cardArtCurrent` on the **latest entry** drives the green/red badge
- Keyed by `character.id` for exact matching

### Implementation Plan

**New files:**
- `public/data/errata.json` — curated balance changelog (manually maintained)
- `src/stores/errata.ts` — Pinia store, fetches `errata.json`, exposes `getErrata(characterId)`

**Files to edit:**
- `src/components/browse/CharacterProfile.vue` — add freshness badge above card + collapsible changelog section at bottom of stats panel
- `src/components/browse/UnitProfileModal.vue` — same additions

**Badge placement:** Above the card image tabs (Card / Stance), inside the image column header area.

**Collapsible section:** Use a `<details><summary>` element styled to match the existing Reference view collapsible sections. Starts closed. Shows "No balance changes recorded" if entry is missing from errata.json.

### Notes
- This is **entirely manually curated data** — someone (you) needs to populate `errata.json` by cross-referencing AMG patch notes / Jarvis Protocol
- Jarvis Protocol is a good reference for what change entries should look like
- Consider a simple admin script or markdown-to-JSON converter to make maintaining errata easier long term
- The `releaseDate` field on `Character` could be repurposed or supplemented to show the initial release date in the profile

---

## #4 — Printable / shareable squad sheet

**User feedback:** Players want to bring a clean summary of their squad to a game table — either printed or shown on phone — without needing to navigate the full app UI.

**Status:** `[x]` Done — v1.3.2. CSS `@media print` stylesheet (`src/assets/print.css`) overrides theme to light, hides nav/footer/UI chrome via `.no-print`. Print button added to StrikeForcePanel. "Build" heading hidden in print. Premiere event removed from app entirely.

### Context
The builder already stores the full squad (primary + secondary + support, all with stat references). The missing piece is a single-page "game night view" that collapses all the info a player needs mid-game.

### Feature Breakdown

#### A — Print view (CSS `@media print`)
A dedicated print stylesheet (`src/assets/print.css`) that:
- Hides header, nav, side panels
- Renders each unit as a compact row: portrait thumbnail | name | HP | SP | tags
- One A4 page for a full 4-unit squad

#### B — Shareable image (canvas / html2canvas)
"Download squad card" button → `html2canvas` snapshot of the squad panel → PNG download.
Works for Discord sharing without needing the app.

#### C — Dedicated `/squad/:id` route (future)
A minimal, no-nav view of a single saved list, accessible via a short link. Could eventually be used for tournament list submission.

### Options

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **CSS print stylesheet** | Free | 2–3 hrs | No deps, works immediately via browser print dialog |
| **html2canvas download** | Free | 3–4 hrs | `npm install html2canvas`; capture DOM node → PNG |
| **Server-side image gen (Puppeteer)** | Free (Render) | 1 day | More reliable rendering; heavier infra |

### Recommended Approach
**Ship Phase A first:** Add `@media print` styles to hide nav/panels and format `StrikeForcePanel` as a clean print layout. Add a "Print squad" button that calls `window.print()`.

**Phase B later:** `html2canvas` for the download-as-PNG use case, specifically useful for social sharing.

### Implementation Notes
- Files: `src/assets/print.css` (imported in `main.ts`), button added to `StrikeForcePanel.vue`
- Squad share link already exists (`/build?sf=<encoded>`) — the shareable link use case is already covered
- Print layout should include: squad name, mission, each unit name + hp + sp + tags. No card images needed.

---

## #5 — Unit comparison panel

**User feedback:** When building a squad, users want to compare two or three candidate units side-by-side to decide which one to slot in — e.g. "should I run Darth Vader or Darth Maul as primary?"

**Status:** `[x]` Done — v1.3.2. Compare button on UnitCard, compareIds in BrowseView, CompareModal with 2-column stat comparison and green highlights for better values.

### Context
`UnitProfileModal.vue` shows a single unit's full stat block in a modal. There is no mechanism to view two profiles at once. The Browse view has `useSearch` composable for filtering but no multi-select concept.

### Feature Breakdown

A floating "comparison tray" (max 3 units):
- Any `UnitCard` gets a "+" compare button on hover/long-press
- Tray slides up from bottom of screen showing 2–3 columns
- Each column = compact stat block: HP, SP, tags, abilities text
- "Clear" button dismisses tray

### Options

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **Side-by-side modal** | Free | 4–6 hrs | Simpler: clicking "Compare" on card A then card B opens a 2-column modal |
| **Persistent comparison tray** | Free | 1 day | Slides up from bottom, stays open while user browses. More UX work. |
| **Separate `/compare` route** | Free | 1–2 days | `/compare?ids=12,45,67` — shareable comparison URL |

### Recommended Approach
**Side-by-side modal (simplest):** Add a "Compare" mode toggle to BrowseView. In compare mode, clicking a card opens the comparison modal. Second click on another card adds it to the same modal as a second column. Limit 3 columns. No new route needed.

### Implementation Notes
- New store slice or simple `ref([])` in `BrowseView` for `compareIds`
- New component: `src/components/browse/CompareModal.vue` — receives array of `Character` objects, renders columns
- Reuse existing stat sections from `CharacterProfile.vue` as a sub-component
- "Compare" button on `UnitCard` is hidden by default; appears when compare mode is active (toggle in BrowseView toolbar)

---

## #6 — Shatterpoint dice roller

**User feedback:** A built-in dice roller tuned for Shatterpoint's custom dice (Attack, Defence) would let players resolve rolls without needing a separate app or physical dice.

**Status:** `[x]` Done — v1.3.5. Two-column layout (Attack / Defense), numbered roll buttons 1–12, per-die edit/reroll/remove, add-die face picker, multi-select reroll mode, CSS wobble animation, SVG die faces built from real dice image, reactive Duel Result (crits + max(0, strikes − blocks)).

### Context
Shatterpoint uses **2** custom dice types:

**Attack die (d8) — red:**
| Roll | Face | Count |
|---|---|---|
| 8 | Crit | 1 |
| 5–7 | Strike | 3 |
| 3–4 | Expertise | 2 |
| 1–2 | Failure | 2 |

**Defense die (d6) — blue:**
| Roll | Face | Count |
|---|---|---|
| 5–6 | Block | 2 |
| 3–4 | Expertise | 2 |
| 1–2 | Failure | 2 |

### Expertise Mechanic
Expertise results are **wild** — each Expertise face can be spent to either:
- **Transform** an existing die result to any other face (e.g. Strike → Crit, or Failure → Block)
- **Add** a new result die to the pool (e.g. add a free Strike or Block)
- Both (one Expertise = one action; multiple Expertise = multiple actions)

The roller UI must support this interactively: after a roll, the player spends unspent Expertise results one at a time to mutate the pool before finalising the total.

### Feature Breakdown

1. **Dice selector:** `+` / `–` buttons to choose how many Attack (d8) and Defense (d6) dice to roll
2. **Roll:** Animated spin → each die settles on a face (Crit / Strike / Expertise / Failure / Block)
3. **Expertise spending panel:** Appears when any die shows Expertise
   - Shows count of available (unspent) Expertise results
   - Two actions per Expertise spend:
     - **Transform:** click any die in the pool → cycle or pick a new face from a small popover
     - **Add die:** pick a face type to inject into the results pool as a new "bonus" die
   - Spent Expertise counter decrements; panel hides when all spent or dismissed
4. **Results summary:** Running total of Crits, Strikes, Blocks, Failures (Expertise shown separately as "unspent")
5. **Reroll:** tap individual dice to lock/unlock, reroll unlocked only (resets Expertise spending)
6. **Clear / Reset:** start over

### Options

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **Simple text result** | Free | 2 hrs | Roll → show text faces. No animation, no Expertise UI. |
| **SVG die faces + CSS animation** | Free | 4–6 hrs | Custom SVG per face, CSS spin on roll. Polished feel, no deps. |
| **3D dice (dice-box lib)** | Free | 1–2 days | `@3d-dice/dice-box` WebGL dice. Very impressive but heavyweight. |

### Recommended Approach
**SVG die faces with CSS animation.** 4 distinct face symbols (Crit, Strike/Block, Expertise, Failure) rendered as SVG, coloured by die type. CSS `rotateY` spin on roll. Expertise spending UI as an inline action row below the dice pool.

### Implementation Notes
- New route: `/roll`
- New files:
  - `src/utils/dice.ts` — `rollAttack(): AttackFace`, `rollDefense(): DefenseFace`, face enums, probability tables
  - `src/components/dice/DieFace.vue` — SVG face keyed by `{ type: 'attack'|'defense', face }`
  - `src/components/dice/DiceRoller.vue` — full roller UI incl. Expertise spending
  - `src/views/RollView.vue` — thin page wrapper
- Face types:
  - Attack faces: `'crit' | 'strike' | 'expertise' | 'failure'`
  - Defense faces: `'block' | 'expertise' | 'failure'`
- Each die in the pool is a reactive object `{ type, face, locked, isBonus, id }`
- Expertise spend state: `expertiseAvailable = ref(0)`, decrements on each action
- Transform popover: shows only valid face options for that die's type
- Add-die action: injects a new die with `isBonus: true` and chosen face into the pool
- Rerolling resets `expertiseAvailable` and clears all bonus dice
- Nav entry: "Roll" tab in main nav

---

## #7 — Mobile app (Capacitor)

**User feedback:** Users want an installable mobile app with offline support, especially for use at the game table where internet may be spotty.

**Status:** `[x]` Done — v1.4.0. Phase A (PWA install banner) shipped in v1.3.6. v1.4.0 completes the mobile pass: hamburger nav, per-screen responsive fixes (Browse, Build, Play, Roll), mission picker swipe + fullscreen zoom (rotated 90°), struggle tracker vertical layout on mobile (P1 buttons top, vertical rail, P2 buttons bottom), struggle cards single-column vertical display. Phase B (Capacitor) deferred to Version 2.

### Context
The app is already a PWA (Vite PWA plugin with service worker). The main gap is that installing from the browser home screen is low-discoverability. Capacitor wraps the existing Vue/Vite build into a native iOS/Android shell with no rewrite needed.

### Options

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **Improve PWA install prompt** | Free | 2–3 hrs | Use `beforeinstallprompt` to show a custom "Add to Home Screen" banner. No app stores. |
| **Capacitor (iOS + Android)** | Free (build) | 2–3 days | `npm install @capacitor/core @capacitor/cli`; generates Xcode + Android Studio projects |
| **Capacitor — Android only** | Free | 1 day | Skip iOS to avoid needing a Mac + $99/yr Apple dev account |
| **Tauri mobile (beta)** | Free | 3–5 days | Rust-based alternative; smaller binary, but mobile support still maturing |

### Recommended Approach
**Short term (done):** Custom `beforeinstallprompt` banner (`AppInstallBanner.vue`) — Android/Chrome gets a native install prompt; iOS Safari gets a static "Share → Add to Home Screen" hint. Dismiss persisted to localStorage.

**Phase 2:** Capacitor for Play Store publishing. Android first (no paid account required), iOS later if demand justifies the Apple dev account cost.

### Implementation Notes
- PWA manifest is already configured via `vite-plugin-pwa` — icons, name, `display: standalone`
- Capacitor setup: `npx cap init`, `npx cap add android`, then `npx cap sync` after each build
- The API URL will need to switch from Render.com to the live URL at build time — already handled via `VITE_API_BASE` env var
- Offline data: consider caching `/api/characters` + `/api/missions` responses in a Pinia store that persists to localStorage, so the app is fully functional offline after first load
- Image CDN (Firebase Hosting) is already served via HTTPS — Capacitor apps can access it without extra config
- Key Capacitor plugins to consider: `@capacitor/share` (for squad share links), `@capacitor/haptics` (dice roll feedback)

---

<!-- ADD NEW SUGGESTIONS BELOW THIS LINE -->

---

## #10 — Dice Roller: Roll History Log

**Context:** Players sometimes need to reference a previous roll result mid-game (e.g. disputed outcome, multi-roll sequence). A session log avoids re-rolling unnecessarily.

**Status:** `[x]` Done — collapsible log panel in DiceRoller.vue. Logs on deliberate rolls only (numbered buttons), not manual face edits. Newest first, capped at 20, persisted to localStorage (survives refresh), Clear button. Shows Atk/Def face breakdown + hits + timestamp.

### Feature Breakdown

- Collapsible log panel below the Duel Result box
- Each entry records: timestamp, attack dice count + result breakdown, defense dice count + result breakdown, final Hits value
- Session-only (cleared on page refresh or explicit "Clear log" action)
- Entries are prepended (newest first)
- Optional: tap an entry to copy a plain-text summary to clipboard (e.g. "4A vs 2D → 2 Hits")

### Implementation Notes
- `DiceRoller.vue`: maintain a `rollLog = ref<RollEntry[]>([])`, push on each roll and on Duel Result change triggered by a deliberate roll (not on manual face edits)
- `RollEntry` type: `{ time: string; atkCounts: Record<string, number>; defCounts: Record<string, number>; hits: number }`
- Log panel styled consistently with Results and Duel Result boxes
- Limit to last 20 entries to avoid unbounded growth

---

## #11 — Dice Roller: Real-Time Multiplayer (WebSocket)

**Context:** At the table, both players want to roll simultaneously and see a shared Duel Result without passing a phone back and forth. A WebSocket-backed room allows each player to control only their side while both see the live result.

**Status:** `[x]` Done — v2.0.0. Socket.io on existing Express server. Room creation/join with 4-char code, host/guest roles, sync-units relay, opponent-left on disconnect. Also extends Play view unit roster sync (opponent team read-only).

> **Note:** Once multiplayer is built, extend #13 (Unit Roster) to support a second opponent team. The local player edits their own roster; the opponent's roster syncs read-only over the WebSocket room.

### Feature Breakdown

- **Room system:** Player A creates a room and shares a 4-character code; Player B joins via the code
- **Role selection prompt:** On joining a room, each player is asked "Are you Attacking or Defending?" — role is locked for that session
- **Split view:** Each player sees only their own column (Attack or Defense) with full interaction (roll, add, change, remove dice). The opposing column is read-only/hidden.
- **Duel Result:** Shown to both players in real time, updates as either side changes their dice
- **Sync protocol:** On any pool mutation (roll, face change, add, remove), the client emits the full pool summary to the server; server broadcasts to the other client in the room
- **Disconnection handling:** Show a "Waiting for opponent…" banner if the other player disconnects; allow rejoin by room code

### Options

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **Socket.io on existing Express server** | Free | 1–2 days | Add `socket.io` to `server/index.ts`; rooms are in-memory Maps. Easy to ship on Render. |
| **Dedicated WebSocket server (ws library)** | Free | 1–2 days | Lighter than Socket.io, no automatic reconnection. |
| **Partykit.io** | Free tier | 4–6 hrs | Managed WebSocket hosting, zero infra. Drop-in SDK. Simplest deployment path. |

### Recommended Approach
**Partykit.io** for zero-infra simplicity, or **Socket.io on the existing Express server** to avoid a new service. Room state is ephemeral (in-memory); no persistence needed.

### Implementation Notes
- New files: `src/composables/useDiceRoom.ts` — wraps socket connection, exposes `createRoom`, `joinRoom`, `sendSummary`, `onOpponentSummary`
- `DiceColumn.vue` gets an optional `readonly` prop — when `true`, disables all interactions and shows a "Read only" badge
- `DiceRoller.vue` adds a room join/create panel above the columns when multiplayer mode is active
- Roll history log (#10) should include opponent rolls when in multiplayer mode
- **Server changes:** `server/index.ts` — add Socket.io or ws upgrade; new `server/rooms.ts` — in-memory room Map

---

## #12 — Play View: Profile-Linked Dice Rolls

**Context:** Rather than manually counting dice, players should be able to tap "Attack" or "Defend" on a unit's profile in the Play view and be taken directly to the roller with the correct number of dice pre-rolled based on that unit's stats and active stance.

**Status:** `[x]` Done — v2.5.0. Play view unit roster (Units tab) has per-unit roll buttons for Attack/Defend. Tapping navigates to `/roll` with `?role=&count=&unitId=` query params and auto-rolls on arrival.

> **Note:** Build this as part of the Play view unit-tracking update (#13). Logic is tied to active units in a current game — not a standalone browse feature. Must be completed **before** multiplayer (#11), as conditions (#13) and profile-linked rolls feed directly into the multiplayer dice sharing flow.

### Feature Breakdown

- **Action buttons on Play profile:** Each unit card in Play view gains two button rows:
  - Row 1: `[ Attack ]` / `[ Defend ]`
  - Row 2: `[ Melee ]` / `[ Ranged ]` (shown after role is chosen; only relevant roles enabled based on stance)
- **Stance tracking:** The Play view tracks which stance is active for each unit (Stance 1 / Stance 2). This is already partially tracked in the struggle store; extend it to be per-unit and persistent for the session.
- **Dice count from stats:** On tap, read the unit's relevant stat from the active stance:
  - Attack → Melee Attack dice count or Ranged Attack dice count
  - Defend → Defense dice count
- **Navigate to roller:** Pass dice count and role to the roller (via route query or shared state), auto-roll on arrival
- **Stance summary panel under roller:** Below the Duel Result, show a compact read-only snapshot of the active stance stats (HP, SP, Attack, Defense, relevant abilities text) so the player can immediately interpret the result (e.g. "Each hit removes 1 HP")
- **Deep link:** The roller page accepts `?role=attack&count=4&unitId=82` query params so the Play view can construct the link directly

### Implementation Notes
- `src/views/PlayView.vue`: add `activeStance: Record<unitId, 1|2>` state, per-unit attack/defend buttons
- `src/views/RollView.vue`: read query params on mount, pre-roll if params present, show stance panel if `unitId` provided
- `src/components/dice/StancePanel.vue` (NEW): compact stat block from character + active stance data
- Character data available via `useCharactersStore` (already loaded)
- Stat mapping: stance 1 stats vs stance 2 stats — confirm field names from `src/types/index.ts`

---

## #13 — Play View: Unit Roster + Conditions + Damage Tracking

**Context:** The Play view currently has no concept of active units. This feature adds a full unit roster tab to Play: build or import your Strike Team, track damage per unit, and apply/remove conditions during play.

**Status:** `[x]` Done — Units tab added to Play view (alongside Tracker). Import from active build or manual unit picker. Per-unit damage track (auto-wounds on overflow), wound counter with manual ±, 5 toggle conditions (Hunker, Disarmed, Strained, Exposed, Pinned). Removed overlay when wounds ≥ durability. Roster locks on mission confirm, resets on Reset Game. Persisted to localStorage.

### Conditions (manual toggles)

| Condition |
|---|
| Hunker |
| Disarmed |
| Strained |
| Exposed |
| Pinned |

Dice roller enforcement deferred to #12 (profile-linked rolls).

**Wounded is not a toggle** — it is an auto-managed counter driven by the damage track (see Damage & Wound Mechanic below).

### Feature Breakdown

#### A — Unit roster setup (pre-game)
- New **"Units" tab** in Play view alongside the existing "Tracker" tab
- When no units are added, show two options:
  - **"Import from active build"** — pulls all units from the current `strikeForce` draft (primary + secondary + support)
  - **"Add unit"** — search/picker to manually add any character from the full roster
- Units can be freely added or removed until the game starts (mission confirmed)

#### B — Lock mechanic
- When the user confirms a mission (`inGame = true`), the roster is **locked**
- Locked state: add/remove buttons hidden, no roster changes possible
- A lock icon badge appears on the Units tab
- Only "Reset Game" unlocks the roster and clears all state

#### C — Per-unit tracking (in-game)
Each unit card in the Units tab shows:
- Thumbnail + name
- **Damage track:** row of filled/empty circles (0..stamina). Tap a circle to set damage to that position; tap the active last circle to remove 1 damage. Filling the last circle auto-increments wounds and resets damage to 0.
- **Wound counter:** `− N +` buttons showing accumulated wound tokens. Auto-increments when damage track overflows. Manually adjustable with `−`/`+` at any time.
- **Condition chips:** active conditions shown as small labelled pills below the name
- **"Conditions" button:** opens a small overlay grid with all 5 toggle conditions; tap to toggle on/off
- Unit dimmed + **"Removed"** overlay when `wounds >= durability`

#### D — Damage & Wound Mechanic
```
tap damage circle at position N:
  if N == current damage (last filled): damage -= 1   // undo
  else: damage = N
  if damage >= stamina:
    damage = 0
    wounds += 1

wounds − button: wounds = max(0, wounds - 1), clear Removed if applicable
wounds + button: wounds += 1
isRemoved: wounds >= durability
```

#### D — Persistence & reset
- Roster + damage + conditions persist across page refreshes (Pinia persist)
- **Reset Game** clears everything: roster, damage, conditions, lock state
- On reset, the user returns to the empty roster setup screen

#### E — Future: 2-team support (post-multiplayer #11)
- Add opponent team tracking — read-only view of the opponent's squad
- Opponent can only update their own side; changes sync via the multiplayer WebSocket room
- Tracked separately in store as `myUnits[]` / `opponentUnits[]`

### Data Design

```typescript
type ConditionKey = 'hunker' | 'disarmed' | 'strained' | 'exposed' | 'pinned'

interface PlayUnit {
  id: number
  name: string
  thumbnail: string
  stamina: number      // from Character.stamina — damage capacity per wound
  durability: number   // from Character.durability — wounds before Removed
  damage: number       // 0..stamina-1 (resets to 0 on wound)
  wounds: number       // accumulated wound tokens (0..durability)
  conditions: ConditionKey[]
}

// isRemoved: wounds >= durability
```

### Store: `src/stores/playUnits.ts` (NEW)
- `units: PlayUnit[]`
- `locked: boolean`
- `addUnit(character: Character)` — no-op if locked or duplicate
- `removeUnit(id: number)` — no-op if locked
- `importFromBuild(characters: Character[])` — bulk import, no-op if locked
- `lock()` — called when mission is confirmed in PlayView
- `unlock()` — called on reset
- `tapDamage(id, position)` — set damage to position; if position == current damage, decrement; if result >= stamina, reset to 0 and increment wounds
- `adjustWounds(id, delta)` — wounds = clamp(wounds + delta, 0, ∞)
- `toggleCondition(id, condition)` — add if absent, remove if present
- `reset()` — clears units, damage, conditions, sets locked = false
- `{ persist: true }`

### New Components
- `src/components/play/units/UnitsTab.vue` — full tab content (setup screen or roster)
- `src/components/play/units/UnitRosterCard.vue` — per-unit card: thumbnail, damage track, condition chips
- `src/components/play/units/ConditionPicker.vue` — 6-condition toggle overlay
- `src/components/play/units/UnitSearchPicker.vue` — search + add from character list

### PlayView changes
- Add tab bar: **Tracker** | **Units** (only visible once mode is selected)
- Call `playUnitsStore.lock()` when mission is confirmed (all 3 modes)
- Call `playUnitsStore.reset()` inside `handleReset()`
- Pass characters store to UnitSearchPicker and importFromBuild

---

## #14 — Homebrew Unit Profile Builder

**Context:** Players create custom or unofficial units (fan-made, campaign variants, modified profiles) and want to use the same app infrastructure — Browse, Build, Play — with their own characters alongside official ones.

**Status:** `[~]` In progress — Custom Builder Phase 1–4 shipped (v2.13–v2.15); polish work in flight on `feature/abilities-progressive-font` (progressive font tiers + desktop canvas overflow fix, 2 commits unmerged).

### Feature Breakdown

#### A — Profile builder UI
- New route `/homebrew` or accessible from Browse/Collection via an "Add custom unit" button
- Form fields covering the full `Character` shape:
  - Name, unit type (Primary / Secondary / Support), era, tags (free-text, semicolon-separated)
  - Points cost (PC), Strike Points (SP), Stamina, Durability, Force
  - Optional: thumbnail upload (crop to circular token via unit-thumbnail-gen pipeline), card art upload
  - Stances (text description or image upload per stance)
- Live preview of the unit card as fields are filled

#### B — Local storage persistence
- Homebrew units stored in a new `homebrew` Pinia store (`{ persist: true }`)
- Assigned synthetic IDs in a negative range (e.g. `-1`, `-2`, …) to avoid collisions with official character IDs
- Exported/imported alongside collection data in the JSON backup (#2)

#### C — Integration with existing features
- Homebrew units appear in Browse with a "Homebrew" badge
- Available in the Strike Force builder (subject to normal points/type rules)
- Available in the Play view unit roster (UnitSearchPicker shows homebrew units)
- **Not** included in Collection view (collection tracks official packs only)

#### D — Share & export
- Individual homebrew unit exportable as a JSON file
- Shareable via a URL-encoded link (extend `profileShare.ts` encoding)

### Data Design

```typescript
interface HomebrewCharacter extends Character {
  isHomebrew: true
  createdAt: string   // ISO date
}
```

Stored in `src/stores/homebrew.ts`:
- `units: HomebrewCharacter[]`
- `addUnit(data)` / `updateUnit(id, data)` / `deleteUnit(id)`
- IDs: `-(Date.now())` or a counter starting at -1

### Implementation Notes
- Keep the builder form simple — not every field is required. Missing fields fall back to safe defaults (e.g. `stamina: 1`, `durability: 1`, `pc: null`).
- Thumbnail upload: accept PNG/JPG, run through the circular crop logic client-side (canvas API or a lightweight Cropper.js integration) — no server needed.
- Official characters are read-only; homebrew characters are fully editable.
- Consider a "Clone official unit" shortcut — pre-fills the form from an existing character, letting the user tweak specific stats without starting from scratch.


---

## #15 — Play View: Unit Information Panel

**Status:** `[x]` Done — v1.11.2

**Description:** Upgrade the Play view's UnitRosterCard to show richer unit data inline, replacing the generic `UnitProfileModal` with a lightweight stance-image viewer and surfacing combat stats and abilities directly on the card.

### Sub-features

1. **Stance modal** — Tapping a unit's thumbnail/name opens `PlayUnitStanceModal.vue`: a lightweight overlay showing the stance card image with a Flip button to toggle between stance1/stance2 images. No full character profile, no external data required.

2. **Stance name labels** — The S1/S2 stance switcher buttons display the real stance name from `stances.json` (e.g. "Form V Djem So") instead of generic "S1"/"S2". Falls back to "S1"/"S2" if data is unavailable.

3. **Active stats bar** — After the stance switcher, a row of pill badges shows the active stance's ranged range, attack, and defense dice counts, and melee attack and defense. Updates when the active stance changes. Hidden if `stances.json` has no data for this unit.

4. **Abilities display** — Below the tag chips, a bordered section lists all abilities from `abilities.json` with a leading icon image (by ability type), bold ability name, and parsed description text. Keywords matching the unit's tags render in amber; other known keywords render bold white; `[icon_name]` inline tokens render as small icon images.

### Data files
- `public/data/stances.json` — populated by the `stance-extract` skill
- `public/data/abilities.json` — populated by the `ability-extract` skill

### Graceful degradation
All four sub-features degrade cleanly when data files are absent or a unit has no entry.

---

## #16 — SPT / Longshanks Tournament Export

**Context:** Competitive players register their Strike Force lists on longshanks.org (the community tournament platform) using a standardised SPT code string. Currently ShatterApp has no export path — players must re-enter their list manually on another site. Both Tabletop Admiral and ShatterpointDB already support SPT export.

**Status:** `[x]` Done — `src/utils/sptExport.ts` + `SptExportModal.vue` in BuildView. SPT string generation + copy to clipboard.

### Feature Breakdown

- **"Export for tournament" button** in StrikeForcePanel (inside the save/share button group)
- Generates a plain-text SPT code string encoding: primary + secondary + support unit IDs, points total, squad name, mission
- Button copies the code to clipboard and shows a brief "Copied!" toast
- Optional: display the code in a modal so the user can also manually copy it

### SPT Format Research Needed

The exact SPT code format used by longshanks.org must be confirmed before implementation. Options:
- Reverse-engineer an existing code from Tabletop Admiral/ShatterpointDB
- Check if longshanks.org publishes a format spec or has a public API

### Options

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **Clipboard copy only** | Free | 2–4 hrs | Simplest; user pastes into longshanks.org registration form |
| **Direct URL link to longshanks** | Free | 2–4 hrs | If longshanks accepts a query param, generate a direct link |
| **longshanks API integration** | Free (if available) | 1–2 days | Register the list directly without leaving ShatterApp |

### Recommended Approach
Clipboard copy with a modal display. Confirm the SPT format first (research spike), then encode from the current `strikeForce` draft.

### Implementation Notes
- New util `src/utils/sptExport.ts` — `encodeSPT(build: CompactBuild, characters: Character[]): string`
- Button in `src/components/build/StrikeForcePanel.vue` — alongside existing Save/Share buttons
- Toast via existing pattern in the app
- Requires confirming that character `id` or `swpCode` is the correct identifier for SPT encoding

---

## #17 — Richer Unit Filters in Browse

**Context:** ShatterApp's Browse filter panel supports basic type/era/faction filtering. ShatterpointDB exposes numeric filters (squad points range, force value, stamina, durability) that help players find units matching specific build criteria. These are especially useful when completing a Strike Force and needing a support within a certain point budget.

**Status:** `[x]` Done — PC, Force, Stamina, Durability numeric filters added to BrowseView filter panel.

### Feature Breakdown

Add to `FilterPanel.vue`:
- **Squad Points (PC) range** — min/max slider or `[3] to [9]` inputs
- **Force value** — multi-select chips: 0 / 1 / 2 / 3 / 4
- **Stamina range** — min/max inputs (e.g. 3–8)
- **Durability range** — min/max inputs (e.g. 1–4)

All new filters compose with existing filters (AND logic, consistent with `useSearch.ts`).

### Options

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **Range inputs (number fields)** | Free | 3–4 hrs | Simple; user types min/max. No extra deps. |
| **Range sliders** | Free | 4–6 hrs | More visual; requires a small slider component or library |
| **Chip multi-select (force only)** | Free | 1–2 hrs | Force is discrete (0–4); chips are cleaner than a range |

### Recommended Approach
Range inputs for stamina/durability/PC; chip multi-select for force value (discrete). No new dependencies.

### Implementation Notes
- `src/composables/useSearch.ts` — add `pcMin`, `pcMax`, `forceValues: number[]`, `staminaMin`, `staminaMax`, `durabilityMin`, `durabilityMax` to filter state and filter logic
- `src/components/ui/FilterPanel.vue` — add new filter controls in a collapsible "Advanced filters" section to avoid cluttering the panel
- `Character` type already has `pc`, `force`, `stamina`, `durability` fields

---

## #18 — QR Code Build Sharing

**Context:** Players at a physical game table want to share their Strike Force with an opponent face-to-face without saying a URL aloud. A QR code displayed on screen is the fastest in-person sharing mechanism. The build URL already exists (`/build?sf=<encoded>`); this feature simply wraps it in a QR code.

**Status:** `[x]` Done — `QrShareModal.vue` in Build view. QR generated from share URL, displayed in modal.

### Feature Breakdown

- **"Show QR" button** in StrikeForcePanel share area
- Opens a modal with a large QR code encoding the existing `encodeBuild()` share URL
- User holds phone up; opponent scans with any QR scanner (no app required)
- Also shows the short URL below the QR code as a fallback

### Options

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **`qrcode` npm package** | Free | 2–3 hrs | Lightweight, renders to canvas/SVG. `npm install qrcode`. |
| **`vue-qrcode` component** | Free | 2–3 hrs | Vue wrapper around qrcode.js; slightly easier integration |
| **Google Charts QR API** | Free | 1 hr | External URL: `chart.googleapis.com/chart?cht=qr&chs=...`. No npm, but external dep. |

### Recommended Approach
`qrcode` npm package — renders to a canvas element, no external HTTP dependency, tiny bundle size (~15 kB).

### Implementation Notes
- New component: `src/components/build/QrShareModal.vue` — receives a URL string, renders QR via `qrcode.toCanvas()`
- Trigger from a small QR icon button next to the existing Share button in `StrikeForcePanel.vue`
- QR code should encode the full absolute URL (including origin), not just the path
- Modal includes a "Copy link" button as a fallback alongside the QR image

---

## #19 — Dice Probability Calculator

**Context:** The existing dice roller (implemented in #6) lets players roll and view individual results. A separate probability calculator answers a different question: *"If I roll 4 attack vs 3 defense, what are my odds of getting 3+ hits?"* This is a pre-roll planning tool for learning the game and evaluating attacks before committing. Inspired by a similar tool in Jarvis Protocol (Marvel Crisis Protocol).

**Status:** `[x]` Done — Probability calculator tab in Roll view.

### Shatterpoint Dice Context

**Attack die (d8):** Crit / Strike / Expertise / Failure faces (exact distribution from physical dice)
**Defense die (d6):** Block / Expertise / Failure faces

Net hits = (Crits + Strikes) − Blocks. Expertise provides conditional bonuses per-unit (not modelled in Phase A).

### Feature Breakdown

#### Phase A — Basic probability table
- Input: attack dice count (1–12), defense dice count (0–12)
- Output: probability distribution table — P(net hits = N) for N = -8 to +12
- Highlight: cumulative probability P(net hits ≥ X) for configurable X
- Computed via enumeration or Monte Carlo simulation (10k+ runs)

#### Phase B — Expertise modelling (future)
- Add optional Expertise spending toggle per die
- More complex; defer until Phase A ships and players request it

### Options

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **Enumeration (exact)** | Free | 4–6 hrs | Iterate all die combinations; exact probabilities. Feasible up to ~6 dice. |
| **Monte Carlo simulation** | Free | 2–3 hrs | Run 50k simulations; near-exact for large pools. No combinatorial blowup. |
| **Pre-computed lookup table** | Free | 1 day | Generate all A×D combos offline, embed as JSON. Instant at runtime. |

### Recommended Approach
Monte Carlo (50k iterations) for Phase A — simplest to implement correctly and handles any pool size. Results are stable to < 1% variance at 50k. Run in a Web Worker to keep UI responsive.

### Implementation Notes
- New route `/roll/calc` or a tab alongside the existing roller in `RollView.vue`
- New util `src/utils/diceProb.ts` — `simulate(atkDice, defDice, runs): ResultDistribution`
- `src/components/dice/ProbabilityCalculator.vue` — inputs + results table
- Face distributions must be confirmed from physical dice (same data already used in `src/utils/dice.ts`)
- Display: bar chart (CSS bars) or numeric table; colour-code green ≥ 50% hit, red < 25%

---

## #20 — Keywords & Icon Glossary

**Context:** Shatterpoint uses a rich set of keyword and ability icons that appear on cards (e.g. "Hunker", "Pinned", "Expertise", "Shatterpoint" ability text icons). New players and veterans mid-game need a quick reference without leaving the app or opening a PDF. Competitor PointBreakSW ships this as a core feature.

**Status:** `[ ]`

### Feature Breakdown

- New **"Reference"** tab or sub-page (or expand existing if a reference section exists)
- Alphabetised list of all Shatterpoint keywords and ability icons
- Each entry: icon image (where applicable) + keyword name + plain-English rule text
- Search bar to filter by keyword name
- Collapsible by category: Combat Keywords / Conditions / Ability Icons / Game Terms

### Data Design

Manual curation required (no scraper source). Schema:

```json
[
  {
    "id": "hunker",
    "name": "Hunker",
    "category": "condition",
    "icon": "hunker.svg",
    "text": "This unit gains +1 Defense die on all defense rolls. Remove at end of activation."
  }
]
```

Stored in `public/data/glossary.json`. Icon images from the existing `public/images/icons/` directory (or equivalent).

### Options

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **Static JSON + simple list** | Free | 1 day (data) + 2 hrs (UI) | Easiest; fully offline, fast load |
| **Inline in abilities.json** | Free | — | Overlap with ability data; keep separate for clarity |

### Recommended Approach
New `glossary.json` file + a simple alphabetised list view. Reuse the existing `SearchBar` component for filtering. Data curation is the main effort (est. 2–3 hours to write all entries from AMG rulebook).

### Implementation Notes
- `public/data/glossary.json` — manually curated
- `src/stores/glossary.ts` — lazy-load store (same pattern as `galacticLegends.ts`)
- `src/components/reference/GlossaryView.vue` — list + search
- Add a "Reference" nav link (or fold into existing nav section)
- Tie into ability descriptions: keyword text in `abilities.json` descriptions could link to the glossary entry (future enhancement)

---

## #21 — Random Strike Force Generator

**Context:** Players sometimes want a random valid Strike Force — for practice games, quick pick-up games, or just exploring the unit roster. Inspired by similar features in Jarvis Protocol (Marvel Crisis Protocol). Also useful as a teaching tool for new players who don't know the meta.

**Status:** `[x]` Done — Random generator with tag synergy in Build view.

### Feature Breakdown

- **"Random" button** in BuildView or the existing UnitPickerDrawer
- Generates a legally valid Strike Force: 1 Primary + 1–2 Secondaries + 0–2 Supports within the Primary's SP budget
- Optionally: filter by era, faction, or owned collection only
- Result loads into the current draft (same as manually building)
- "Re-roll" button generates a new random list

### Algorithm

```
1. Pick a random Primary unit
2. Pick random Secondaries until budget is met or no valid Secondary fits
3. Pick random Supports until budget is met or no valid Support fits
4. Return the set; validate with isSquadValid()
```

Constraints: `secondary.pc + support.pc <= primary.sp`. Already enforced by `isSquadValid()` in `src/types/index.ts`.

### Options

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **Pure random** | Free | 2–3 hrs | No weighting; any legal combination equally likely |
| **Faction-coherent random** | Free | 3–4 hrs | Prefer units sharing a faction tag; more thematic results |
| **Weighted by collection** | Free | 2–3 hrs | Only rolls from owned units (collection store already exists) |

### Recommended Approach
Pure random with an optional "owned only" toggle (reuses collection store). Faction-coherent mode as a later toggle.

### Implementation Notes
- New util `src/utils/randomBuild.ts` — `generateRandomBuild(characters, options): { primary, secondaries, supports }`
- Options: `{ ownedOnly?: boolean; era?: string; faction?: string }`
- Button in `src/components/build/StrikeForcePanel.vue` or `UnitPickerDrawer.vue`
- After generation, call existing `strikeForce` store actions to load the result into the draft
- Edge case: if no valid combination exists (e.g. all owned Primaries have SP 0), show a toast and abort

---

## #22 — Order Deck Builder

**Context:** Every Shatterpoint Strike Force has a corresponding Order Deck — a set of order cards, one per unit, plus the Shatterpoint wild card. Players physically build this deck before each game. No existing tool tracks or builds order decks. This is a gap across all Shatterpoint companion apps.

**Status:** `[x]` Done — `OrderDeckSection.vue` + `src/stores/orderDeck.ts` in Play view Units tab.

### Data Availability

**No external data work needed.** The existing scraper already fetches `ORDER_CARD` and `MODEL` image fields from `api.pointbreaksw.com` and stores them in `public/data/characters.json`. Images are downloaded to `public/images/` (e.g. `SWP01_Ahsoka_Order.png`). The `Character` type already includes `orderCard?: string` and `model?: string` fields.

Running `npm run scrape` keeps these up to date automatically.

### Feature Breakdown

- **"Order Deck" section** in BuildView — shown below or alongside the Strike Force panel
- For each unit in the current Strike Force, display:
  - Order card image (`character.orderCard`)
  - Unit name
  - Model image (`character.model`) as optional flavour / reference
- **Deck summary:** total card count (one per unit + 1 Shatterpoint wild card)
- **"Build your deck" checklist** — a printable/saveable list of which physical cards to pull

### Options

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **Inline panel in BuildView** | Free | 3–4 hrs | Accordion/tab below the Strike Force; no new route |
| **Dedicated `/build/deck` tab** | Free | 4–6 hrs | Cleaner separation; requires tab navigation in BuildView |
| **Modal overlay** | Free | 2–3 hrs | Triggered by a "View Order Deck" button; simpler layout |

### Recommended Approach
Inline accordion panel or modal below the Strike Force panel — lowest friction, reuses the existing build state directly.

### Support Tool — Order Card Audit

`public/order-card-audit.html` (also at `tools/order-card-audit.html`) — a standalone HTML tool served by the Vite dev server at `http://localhost:5173/order-card-audit.html`.

**Purpose:** Visually verify that every unit's `orderCard` and `model` image paths are correct and the files actually exist before building the UI. Mirrors the workflow of `ability-audit.html`.

**Features:**
- Three-column image grid per unit: **Card Back** / **Order Card** / **Model**
- Click any image to zoom fullscreen
- Filter pills: All / Missing Order Card / Missing Model / Missing Either
- Stats bar: running count of missing images across the full roster
- Search by name or SWP code
- Broken image detection: if the path exists in `characters.json` but the file is absent on disk, the slot shows the path so you know exactly which image to re-scrape
- Orange border = at least one image missing; red border = both missing

**When to use:** Run after `npm run scrape` to confirm all order card and model images downloaded correctly before shipping the Order Deck Builder UI.

### Implementation Notes
- No new store or data file needed — `orderCard` and `model` already on `Character`
- `src/components/build/OrderDeckPanel.vue` (NEW) — receives array of `Character` objects from current build, renders card images
- Order card images served via existing `imageUrl()` util (CDN-aware)
- Include a reminder: "+ 1 Shatterpoint wild card" (present in every deck)
- This feature naturally pairs with #16 (SPT export) for a complete tournament prep workflow

---

## #23 — React Native port (true native iOS + Android)

**Context:** ShatterApp today ships as a Vue 3 PWA with a custom install banner (#7 Phase A). Phase B (Capacitor wrapping) was deferred. Rather than wrapping the existing web build, this challenge rebuilds the app in **React Native** so it can be published as a genuinely native iOS and Android app — unlocking App Store / Play Store distribution, better offline behaviour, native gestures, push notifications, and performance parity with other Shatterpoint companion apps.

**Status:** `[ ]` Not started

### Why React Native (not Capacitor)
| Path | Pros | Cons |
|---|---|---|
| **Capacitor wrap** (original #7 Phase B) | Zero rewrite, reuses Vue codebase as-is | Still a WebView under the hood, feels web-y, limited native feel, harder to pass store review polish bar |
| **React Native (Expo)** | True native UI, OTA updates via Expo, best-in-class store presence, large ecosystem, aligns with industry standard for cross-platform mobile | Full rewrite of views and components (Vue → React), duplicate codebase to maintain unless shared logic is extracted |
| **Flutter** | Excellent performance, single codebase | Dart learning curve, least overlap with existing TS/JS skillset |

**Chosen direction:** React Native via **Expo (managed workflow)** — fastest path to TestFlight + Play Store internal testing, OTA update support, and it keeps TypeScript so type definitions and pure logic can be shared with the web app.

### Scope — what gets ported

**Must ship (v2-native MVP):**
- Browse — character grid, filters, unit profile modal
- Build — Strike Force builder with validation
- Collection — product grid + owned toggles
- Play — mission tracker, units tab, damage/wound/conditions
- Dice Roller — full parity with web (attack/defense columns, Expertise, duel result)
- Reference — glossary / abilities lookup
- Persisted state (collection, strikeForce, playUnits, orderDeck)

**Deferred / reconsidered on mobile:**
- Profile share URLs (`/?p=`) — replaced by native share sheet + deep links
- QR share (#18) — use native camera for scanning too
- Print view (#4 Phase A) — not relevant on mobile; replace with PDF export via `expo-print`
- Multiplayer dice (#11) — defer to v2.1; revisit after MVP ships

### Architecture plan

**Monorepo (recommended):**
```
ShatterApp/
  apps/
    web/        — existing Vue/Vite app (unchanged)
    mobile/     — new Expo / React Native app
  packages/
    shared/     — TypeScript types, pure utilities, data contracts
      types/           (moved from src/types)
      utils/dice.ts    (pure — roll/face logic)
      utils/sptExport.ts
      utils/profileShare.ts
      utils/randomBuild.ts
      utils/diceProb.ts
      api/             (fetch wrappers for /api/characters, /api/missions, /api/products)
    data/       — JSON data files served to both apps
  server/       — existing Express API (unchanged — both apps consume it)
```

Pinia stores cannot be ported directly — replace with **Zustand** (closest shape to Pinia, supports persistence via `zustand/middleware`). Store *logic* (actions, derivations) is copied; store *API* stays familiar.

### Tech stack

| Concern | Web (today) | Mobile (new) |
|---|---|---|
| Framework | Vue 3 | React Native + Expo SDK 52+ |
| Routing | Vue Router | Expo Router (file-based) |
| State | Pinia + persistedstate | Zustand + AsyncStorage middleware |
| Styling | Tailwind v4 CSS | NativeWind (Tailwind for RN) — keeps `sw-bg`/`sw-gold`/`sw-card` class vocabulary |
| HTTP | `fetch` | `fetch` (same) |
| Images | `<img>` + WebP CDN | `expo-image` (cached, WebP support) |
| Icons | SVG inline | `react-native-svg` |
| Dice animation | CSS keyframes | Reanimated 3 |
| Local persistence | localStorage | AsyncStorage / MMKV |
| Share / deep links | URL hash | `expo-sharing` + `expo-linking` |
| Camera (QR scan) | — | `expo-camera` |
| PDF export (tournament sheet) | `window.print` | `expo-print` |

### Options

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **Expo managed workflow** | Free (dev) / $99 Apple + $25 Google one-time | 3–5 weeks | Easiest path; OTA updates via EAS Update; no Xcode required for most work |
| **React Native bare workflow** | Free (dev) + store fees | 5–7 weeks | Full native control; needed only if we hit an Expo-native module limitation |
| **React Native + Nx monorepo** | Free | +1 week setup | Better DX for shared packages; worth it long-term |

### Recommended Approach

**Phase 1 — Shared package extraction (web-only refactor, 3–5 days)**
- Create `packages/shared` workspace
- Move pure TS: `src/types`, `src/utils/dice.ts`, `src/utils/sptExport.ts`, `src/utils/profileShare.ts`, `src/utils/diceProb.ts`, `src/utils/randomBuild.ts`
- Update web imports; confirm all tests still pass; ship as a no-behaviour-change PR before starting mobile

**Phase 2 — Expo scaffold + Browse view (1 week)**
- `npx create-expo-app@latest apps/mobile --template` (TypeScript, Expo Router)
- Install NativeWind, Zustand, expo-image
- Wire up `VITE_API_BASE` equivalent (`EXPO_PUBLIC_API_BASE`) pointing at existing Render API
- Port Browse first — it's mostly read-only list + filters, perfect first milestone

**Phase 3 — Build + Collection + Play (2 weeks)**
- Port stores to Zustand one at a time: `characters` → `strikeForce` → `collection` → `playUnits` → `orderDeck`
- Port views in parallel with their stores

**Phase 4 — Dice Roller (3–4 days)**
- Custom dice faces as SVG components (reuse existing SVG definitions)
- Reanimated spin animation
- Expertise spending UI — same state machine as web

**Phase 5 — Native-only polish (1 week)**
- Native share sheet integration for build links
- Deep link handling for `shatterapp://build?sf=...`
- Haptics on dice roll (`expo-haptics`)
- App icon + splash screen (Shatterpoint-themed)
- Dark-mode only (matches web app's SW theme)

**Phase 6 — Store submission (1–2 weeks including review)**
- EAS Build for iOS + Android binaries
- TestFlight internal testing → external beta
- Play Store internal testing track → production
- App Store listing copy, screenshots, privacy policy

### Acceptance criteria (MVP launch)
1. `apps/mobile` Expo project builds iOS + Android binaries via EAS
2. All five main views (Browse, Build, Collection, Play, Roll) functional with data fetched from existing Render API
3. Persisted state survives app backgrounding and cold start
4. Images load via Firebase CDN (no bundled images)
5. App passes TestFlight internal review and Play Store internal testing track
6. Shared package has zero web-specific imports and is consumed by both apps

### Implementation Notes
- **Do not** duplicate the data scraper or API — both apps consume the same Express API on Render
- Asset strategy: bundle only icons + splash; all unit/card images load from the existing `shatterapp-images.web.app` CDN
- `isSquadValid()` and all pure logic already lives in `src/types/index.ts` — extracting to `packages/shared` is a pre-requisite for any mobile work
- **Risk:** Pinia persist afterRestore migration logic (strikeForce multi-list migration) must be re-implemented in Zustand middleware — easy to forget; write tests first
- **Risk:** NativeWind's Tailwind v4 support lagged web; verify current compatibility before committing styling approach — fallback is standard React Native `StyleSheet` with design tokens
- **Risk:** Apple review rejection — ensure no scraped official art is bundled in the binary (always CDN-delivered) and that the app clearly states it's a fan-made companion, not AMG-affiliated
- Consider staged rollout: Android first (lower review friction, no paid dev account required beyond the one-time $25), iOS after Android is stable
- OTA updates via EAS Update let us ship JS-only changes without a full store review — use for data updates, tuning, bug fixes
