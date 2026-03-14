# Multiplayer Feature Bugs

## ✅ BUG-1: Player name not showing correctly in SessionBanner — FIXED
Both players should see `[your name] vs [opponent name]`. Previously only own name showed; opponent side displayed "...".
- Fix: Embedded player names in `create-room` and `join-room` socket payloads (atomic handshake). Eliminated timing dependency entirely. Names stored server-side in `rooms.ts` and returned in ack + `player-joined` events.

## ✅ BUG-2: Struggle cards are different per player — FIXED
When a mission is confirmed, struggle cards were randomly picked independently on each client. Both players should see the exact same cards.
- Fix: Added `struggleCards` to `TrackerSnapshot` type and `_buildSnapshot()`. `applySnapshot()` now uses received cards directly instead of re-rolling. Opponent always mirrors HOST's cards.

## ✅ BUG-3: Opponent roster heading still reads "Opponent's Team" — FIXED
AC says it should display `[opponent's name]'s Team`. Downstream of BUG-1 — resolved automatically once `opponentName` populates correctly via the BUG-1 fix.

## ✅ BUG-4: Both players can still choose the same dice role — FIXED
Once Player A picks Attacker, Player B should be automatically locked to Defender — the role picker should not appear for Player B at all.
- Fix: Server now tracks `duelRole` per room and rejects duplicate claims. Server also sends `role-assigned` back to the claimer (not just the opponent) as authoritative confirmation. Client no longer sets `myRole` optimistically — waits for server's `role-assigned`. `reset-duel` clears the server-side `duelRole` so roles can be re-picked for the next duel.

## ✅ BUG-5: Net hits are wrong and differ between players — FIXED
Net hits should reflect the combined live state of both pools and show the same number for both players.
- Fix: Replaced `hits()` / `hasResult()` plain functions with `computed` properties (`netHits`, `hasResult`) that derive directly from `myPool` + `session.opponentPool` in multiplayer mode, bypassing the stale `@update:summary` event chain entirely. Solo mode still uses the summary-based approach.

## ✅ BUG-6: Duel history needs full redesign — FIXED
- Fix: Replaced flat per-roll log with `DuelRow` model (`atkPool, defPool, atkName, defName, netHits`). DicePanel now shows a live "Active" row (both pools + net hits updating in real time) plus frozen past rows committed on Reset Duel. `commitDuel()` in the store snapshots both pools with deep-copied dies. `onRolesReset` handler also commits before clearing so the opponent's history stays in sync. Old `addDuelHistory` removed from store and PlayView.

## ✅ BUG-7: Force pool refresh shows all tokens active but opponent sees stale state — FIXED
When the force pool is refreshed (all spent tokens reset to unspent), the local player sees all tokens become active correctly. However the opponent's force pool display in OpponentRoster did not update to reflect the refresh.
- Fix: `refreshForcePool()` in `playUnits.ts` was resetting `spentTokens` but never calling `_syncUnits()`. Added `_syncUnits()` call so the updated pool is immediately broadcast to the opponent.
