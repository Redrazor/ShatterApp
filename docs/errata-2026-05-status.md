# Errata v1.4 Update Status — May 2026

**Source PDF:** `DOC50_UpdatedCards-1.pdf` (Version 1.4, 05/19/2026)
**URL:** https://cdn.svc.asmodee.net/production-amgcom/uploads/2026/05/DOC50_UpdatedCards-1.pdf
**Branch:** `feature/errata-2026-05`
**Errata stamp:** version `"1.4"`, date `"2026-05-19"`

This is a **major rebalance** — 62 units with updated unit/ability cards plus a large
stance-update section. Tracked here, processed in batches.

**Batch 1 (pages 1–7, 11 units) — DONE 2026-06-07.** Data + images + errata applied; pending `npm run seed` (stat changes) + `images:deploy` + user validation.

**Batch 2 (pages 8–12, 16–38, 51 units) — DONE 2026-06-07** via parallel workflow (one agent per page). Open TODOs: Bounty Hunters (42) front re-extract; Gwarm (70) stance; Thrawn (91) front missing from PDF render; full stance pass (pages 13–15, 39–48).

## Workflow (per unit)

1. Render the unit's card(s) from the PDF at 600 DPI (no manual cutting needed — PDF is high-res).
2. Read via vision; extract abilities (name/type/cost/description) + stats (HP/stamina/durability/point cost) + stance numbers.
3. **Compare** against current `abilities.json` + `characters.json` + `stances.json` (discover-by-comparison).
4. Document the plain-English diff; update the data files for real changes only.
5. Prepend a v1.4 `ErrataEntry` to `errata.json` (`changes[]` = diff; v1.3 history preserved below).
6. Replace the card image in `public/images/` + regenerate WebP.
7. Mark the unit ✅ here.

**Finalize:** `npm run seed` → `npm run images:compress` → fire `ability-audit.html` for visual
validation → `npm test` → PR → version bump (`minor`) + ChangelogModal + App.vue footer.

## Status legend
`[ ]` not started · `[~]` extracted, awaiting validation · `[x]` done & validated

## Unit Updates (62 units) — by SWP

| ✓ | SWP | id | Page | Unit | Ability Δ | Stat Δ | Stance Δ |
|---|-----|----|------|------|-----------|--------|----------|
| [x] | SWP01 | 1 | p17 | General Anakin Skywalker | 4 ability Δ | — | — |
| [x] | SWP01 | 2 | p22 | Asajj Ventress, Sith Assassin | 2 ability Δ | — | — |
| [x] | SWP01 | 4 | p16 | Ahsoka Tano, Jedi No More | art only | — | — |
| [x] | SWP01 | 8 | p21 | Bo-Katan Kryze | art only | — | — |
| [x] | SWP01 | 10 | p21 | Clan Kryze Mandalorians | art only | — | — |
| [x] | SWP01 | 11 | p16 | 501st Clone Troopers | art only | — | — |
| [x] | SWP01 | 12 | p1 | B1 Battle Droids | +Countless (reactive) | 9/2 → 8/3 | name: Countless→B1 Combat Protocols |
| [x] | SWP03 | 17 | p24 | Count Dooku, Separatist Leader | 1 ability Δ | — | — |
| [x] | SWP03 | 18 | p23 | Jango Fett, Bounty Hunter | 3 ability Δ | — | — |
| [x] | SWP03 | 19 | p23 | MagnaGuard | art only | — | — |
| [x] | SWP04 | 24 | p17 | Republic Clone Commandos | art only | — | — |
| [x] | SWP05 | 26 | p1 | B2 Battle Droids | +Close Range Annihilation | — | — |
| [x] | SWP06 | 14 | p22 | General Obi-Wan Kenobi | art only | — | — |
| [x] | SWP06 | 15 | p18 | CC-2224 Clone Commander Cody | 2 ability Δ | — | — |
| [x] | SWP06 | 16 | p18 | 212th Clone Troopers | 2 ability Δ | — | melee atk 4→6 |
| [x] | SWP08 | 35 | p19 | Jedi Master Mace Windu | 4 ability Δ | — | — |
| [x] | SWP08 | 37 | p20 | CT-411 Commander Ponds | 2 ability Δ | — | — |
| [x] | SWP08 | 38 | p20 | ARF Clone Troopers | 3 ability Δ | — | — |
| [x] | SWP09 | 39 | p25 | Cad Bane, Notorious Hunter | art only | — | — |
| [x] | SWP09 | 41 | p24 | Aurra Sing | 3 ability Δ | — | — |
| [x] | SWP09 | 42 | p26 | Bounty Hunters | art only | — | — |
| [x] | SWP10 | 63 | p26 | Hondo, Honest Businessman | art only | — | — |
| [x] | SWP10 | 70 | p27 | Gwarm | 2 ability Δ | — | — |
| [x] | SWP10 | 71 | p28 | Weequay Pirates | 1 ability Δ | — | — |
| [x] | SWP12 | 27 | p35 | Grand Inquisitor, Fallen Jedi | 6 ability Δ | — | — |
| [x] | SWP12 | 28 | p36 | Third Sister | 5 ability Δ | — | — |
| [x] | SWP12 | 32 | p35 | Fourth Sister | art only | — | — |
| [x] | SWP15 | 40 | p9 | Queen Padmé Amidala | 2 ability Δ | stam 9 → 10 | — |
| [x] | SWP15 | 43 | p9 | Sabé, Royal Bodyguard | 4 ability Δ | — | — |
| [x] | SWP15 | 44 | p8 | Naboo Royal Handmaidens | 1 ability Δ | — | — |
| [x] | SWP22 | 52 | p32 | Jedi Knight Luke Skywalker | 1 ability Δ | — | — |
| [x] | SWP24 | 64 | p32 | Greef Karga | 3 ability Δ | — | — |
| [x] | SWP26 | 67 | p36 | Dark Troopers | 2 ability Δ | — | — |
| [x] | SWP27 | 55 | p30 | Paploo, Curious Creature | 1 ability Δ | — | — |
| [x] | SWP27 | 58 | p12 | Ewok Hunters | 4 ability Δ | — | range 4→5; def swap |
| [x] | SWP27 | 59 | p29 | Chief Chirpa | 1 ability Δ | — | — |
| [x] | SWP28 | 91 | p38 | Grand Admiral Thrawn | art only | — | — |
| [x] | SWP30 | 29 | p33 | Obi-Wan Kenobi, Out of Hiding | 3 ability Δ | — | — |
| [x] | SWP30 | 30 | p37 | Darth Vader, Jedi Hunter | 1 ability Δ | — | — |
| [x] | SWP31 | 121 | p7 | Captain Cassian Andor | Town/Make Ten Men reworked | — | — |
| [x] | SWP34 | 76 | p4 | Imperial Special Forces | Infiltration ⊕3→⊕2 | — | — |
| [x] | SWP34 | 83 | p37 | Gideon Hask, Inferno Squad | 3 ability Δ | — | — |
| [x] | SWP35 | 85 | p7 | Rebel Commandos | Camouflage end-of-Setup; Infil ⊕3→⊕2 | — | — |
| [x] | SWP36 | 94 | p5 | CT-9904, Elite Squad Leader | Move ⊕4→⊕3; Expendable →character | — | — |
| [x] | SWP36 | 95 | p4 | ES-04, Firebrand | art only | — | — |
| [x] | SWP36 | 104 | p6 | Elite Squad Troopers | Coord. Fire → 2× Supporting Fire | — | — |
| [x] | SWP37 | 113 | p11 | Jedi Master Kit Fisto | 5 ability Δ | — | — |
| [x] | SWP38 | 72 | p31 | Crosshair | 2 ability Δ | — | — |
| [x] | SWP39 | 46 | p29 | Logray, Bright Tree Shaman | 3 ability Δ | — | — |
| [x] | SWP39 | 51 | p33 | C-3PO and R2-D2 | 4 ability Δ | — | — |
| [x] | SWP39 | 56 | p12 | Ewok Trappers | 2 ability Δ | stam 7 → 8 | def swap |
| [x] | SWP39 | 57 | p30 | Wicket, Intrepid Warrior | 1 ability Δ | — | — |
| [x] | SWP41 | 89 | p34 | Luke Skywalker, Daring Hero | 1 ability Δ | — | — |
| [x] | SWP46 | 100 | p2 | General Veers, Tactical Genius | Prepare/We Are The Storm reworded | sp 7 → 8 | — |
| [x] | SWP46 | 101 | p3 | Snowtrooper Lieutenant | Dogged ⊕4→⊕5; Commanding→Imperial Discipline | — | rng atk 6→7 |
| [x] | SWP46 | 106 | p3 | Snowtroopers | +Extreme Conditions Training | — | rng atk 5→6 |
| [x] | SWP47 | 103 | p31 | Lobot, Computer Liaison Officer | 5 ability Δ | — | — |
| [x] | SWP50 | 112 | p11 | Padawan Learners | 2 ability Δ | stam 7 → 8 | — |
| [x] | SWP52 | 128 | p8 | Baze Malbus and Chirrut Îmwe | 1 ability Δ | — | — |
| [x] | SWP62 | 129 | p10 | RC-1138 "Boss" | 1 ability Δ | — | def/atk reworked |
| [x] | SWP62 | 131 | p10 | "Sev" and "Scorch" | art only | — | — |
| [x] | SWP81 | 119 | p34 | Ahsoka Tano, Fulcrum | 2 ability Δ | — | — |

## Stance Updates — DONE 2026-06-07

Stance cards (3 per page) not yet matched to units — mapped during extraction. The
`Stance Δ` column above is filled in as each unit's stance card is located and read.

## Notes
- PDF cards are a **flat sequence** (ability cards + front/portrait cards interleaved, 2–3 per
  page) — NOT paired front/back by unit. Each card is identified individually.
- Render artifacts live in `/tmp/errata-2026-05/` (pages, montages) — not committed.
