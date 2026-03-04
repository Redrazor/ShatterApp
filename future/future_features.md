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

**Status:** `[ ]` *(Phase 2 — tracked here for planning)*

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
**Short term:** Improve the PWA install experience. Add a custom `beforeinstallprompt` banner component (`src/components/AppInstallBanner.vue`) modelled after `AppImportBanner.vue`. This gives most users an app-like experience immediately.

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
- `future/future_features.md`: this entry

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
- `future/future_features.md`: this entry

**Files:**
- `src/views/PlayView.vue` — LE mode branch

---

## #10 — Dice Roller: Roll History Log

**Context:** Players sometimes need to reference a previous roll result mid-game (e.g. disputed outcome, multi-roll sequence). A session log avoids re-rolling unnecessarily.

**Status:** `[ ]`

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

**Status:** `[ ]`

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

**Status:** `[ ]`

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

## #13 — Play View: Unit Conditions System

**Context:** Shatterpoint has a set of conditions (Disarmed, Weakened, Exhausted, Hobbled, etc.) that can be applied to units during play. Tracking them manually is error-prone. Conditions should be markable on each unit's profile in Play view, display a symbol, and mechanically affect dice options in the roller.

**Status:** `[ ]`

### Conditions & Mechanical Effects

| Condition | Symbol | Dice Impact |
|---|---|---|
| **Disarmed** | ⚔️✗ | Expertise results on attack dice cannot be changed to other faces |
| **Weakened** | ↓ | Attack dice count reduced by 1 (min 1) |
| **Exhausted** | 💤 | Cannot attack (attack buttons disabled) |
| **Hobbled** | 🦶 | Ranged attack option disabled |
| **Exposed** | 👁️ | Defense dice count reduced by 1 (min 0) |

*(Condition list and exact rules to be verified against official AMG rulebook)*

### Feature Breakdown

- **Condition picker on Play profile:** Tap a "Conditions" chip/button on a unit card to open a small overlay showing all condition icons. Tap to toggle each on/off.
- **Active condition icons:** Applied conditions appear as small icon chips below the unit name on the Play card
- **Dice roller integration (via #12 link):** When navigating to the roller from a unit profile, active conditions are passed along and enforced:
  - Disarmed → expertise face-change blocked (greyed out in the face picker popover)
  - Weakened → dice count decremented before rolling
  - Exhausted → attack button disabled on the profile
  - Hobbled → ranged option disabled
  - Exposed → defense count decremented
- **Persistence:** Conditions persist for the game session (cleared on "New Game" / reset)

### Implementation Notes
- `src/stores/playState.ts` (NEW or extend existing play store): `conditions: Record<unitId, ConditionKey[]>`
- `ConditionKey` enum: `'disarmed' | 'weakened' | 'exhausted' | 'hobbled' | 'exposed'`
- `src/components/play/ConditionPicker.vue` (NEW): icon grid overlay, emits toggled condition list
- `DiceColumn.vue`: accept optional `conditions` prop; enforce Disarmed lock on expertise face changes; adjust initial roll count for Weakened/Exposed
- SVG or emoji icons per condition — consider a consistent icon set (Heroicons or custom SVG)
- **Requires #12** (profile-linked rolls) to be built first for condition enforcement in the roller to work end-to-end
