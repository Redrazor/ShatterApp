<script setup lang="ts">
defineProps<{ show: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const entries = [
  {
    version: '2.15.3',
    date: '2026-04-29',
    changes: [
      'Settings — new "Allow landscape mode" toggle in Display lets users opt out of the portrait-only lockout on phones',
      'Settings — tablets (≥768px) no longer hit the landscape lockout at all',
      'Accessibility — orientation overlay now uses role="dialog" + aria-modal, and "Open Settings" works from the overlay',
    ],
  },
  {
    version: '2.15.2',
    date: '2026-04-16',
    changes: [
      'Data — added Baylan Skoll (SWP82: Secure the Future) — Primary, New Republic era',
    ],
  },
  {
    version: '2.15.1',
    date: '2026-04-16',
    changes: [
      'Custom Builder — abilities card auto-reduces font size in 4 tiers as text grows, preventing content from clipping off the card',
      'Custom Builder — fixed card previews overflowing their containers on desktop across all phases',
    ],
  },
  {
    version: '2.15.0',
    date: '2026-04-15',
    changes: [
      'Browse — unit profiles now show a "Last Updated" date instead of the card art status badge',
      'Data — added Morgan Elsbeth (SWP83: My Loyalty, My Life) — Primary, New Republic era',
    ],
  },
  {
    version: '2.14.0',
    date: '2026-04-15',
    changes: [
      'Custom Builder — full mobile UX overhaul: 22 fixes across all phases',
      'Custom — combat tree now supports long-press + tap to reposition icons on touch devices',
      'Custom — expertise delete × badge now always visible (no longer hover-only)',
      'Custom — canvas previews scale correctly on retina displays (2× DPR)',
      'Custom — ProfileVisualModal cards stack vertically on mobile; PDF export is first action',
      'Custom — all touch targets raised to 44px minimum across all phases',
      'Custom — large photo uploads compressed to 1200px max before storage',
      'Custom — inline confirm UI replaces native confirm() dialog (PWA-safe)',
      'Custom — dropdowns and pickers clamped to viewport width; virtual keyboard aware',
    ],
  },
  {
    version: '2.13.3',
    date: '2026-04-09',
    changes: [
      'Custom Builder — fixed canvas taint from era icon missing crossOrigin header (follow-up to v2.13.2)',
    ],
  },
  {
    version: '2.13.2',
    date: '2026-04-09',
    changes: [
      'Custom Builder — fixed "Rendering cards..." hang caused by cross-origin canvas taint (production only)',
    ],
  },
  {
    version: '2.13.1',
    date: '2026-04-09',
    changes: [
      'Dice — Attack dice roller and Probability Calculator now support up to 30 dice (was 12/14)',
    ],
  },
  {
    version: '2.13.0',
    date: '2026-04-08',
    changes: [
      'Custom — New Custom Profiles page: build and manage homebrew Shatterpoint unit profiles',
      'Custom — Phase 1: front card editor (unit type, cost, FP, era, faction, portrait upload)',
      'Custom — Phase 2: stats & abilities editor with insights panel (percentile comparison vs roster)',
      'Custom — Phase 3: stance editor with ranged/melee dice, expertise tables, and combat tree',
      'Custom — Phase 4: order card editor; publish profiles to your roster for use in squad building',
      'Custom — Full card canvas preview: live-rendered front card, abilities card, stance card, and order card',
    ],
  },
  {
    version: '2.12.1',
    date: '2026-04-03',
    changes: [
      'Play — Wound flow is now deliberate: filling the damage track sets a Wounded condition instead of auto-wounding',
      'Play — Flip Wounded button clears damage and adds an Injured dot; Defeat Unit button appears when the Injured track is full',
      'Play — Wounds track renamed to Injured throughout',
      'Play — Order deck card images now load correctly in production',
    ],
  },
  {
    version: '2.12.0',
    date: '2026-04-02',
    changes: [
      'Roll — New Probability Calculator tab: pick attack and defence dice to see cumulative hit probabilities across 50,000 simulated rolls',
      'Settings — Probability Calculator toggle; automatically disabled if the Roll tab is turned off',
    ],
  },
  {
    version: '2.11.0',
    date: '2026-04-02',
    changes: [
      'Build — Visualise your saved list as a card-art grid (Squad 1 / Squad 2); download as PNG or share a link with social preview',
      'Build — Premiere/Threemiere lists show a squad picker before visualising so you can choose which 2 squads to display',
    ],
  },
  {
    version: '2.10.0',
    date: '2026-04-02',
    changes: [
      'Build — Random Strike Force generator: fill empty slots instantly with a faction-aware pick; toggle Owned to restrict to your collection',
    ],
  },
  {
    version: '2.9.0',
    date: '2026-04-02',
    changes: [
      'Build — Share your list as a QR code: tap the QR icon to generate a scannable code anyone can open on their device',
    ],
  },
  {
    version: '2.8.0',
    date: '2026-04-02',
    changes: [
      'Browse — Advanced filters: filter units by PC range, Force value, Stamina range, and Durability range',
    ],
  },
  {
    version: '2.7.0',
    date: '2026-04-02',
    changes: [
      'Build — Export to Longshanks: generates an SPT code for your full list to paste into longshanks.org tournament registration',
    ],
  },
  {
    version: '2.6.0',
    date: '2026-04-01',
    changes: [
      'Play — Order Deck builder for Standard and Key Operations: build, shuffle, draw, and discard order cards per unit',
      'Collection — Total units owned now counts models (not characters) for accurate pack totals',
    ],
  },
  {
    version: '2.5.0',
    date: '2026-03-31',
    changes: [
      'Settings — New settings panel accessible from the nav (gear icon on desktop, "Settings" on mobile)',
      'Collection — Auto-mark all units owned/un-owned when toggling a pack',
      'Collection — Mark Painted and Mark Based toggles with per-unit indicators and stats (count + %)',
      'Play — Toggle Units, Tracker, and Dice tabs on/off individually',
      'Roll — General Roll tab enabled by default',
      'Play — Multiplayer button renamed to "Enable Multiplayer"',
      'Data — Backup format v2: includes painted, based, and settings data',
    ],
  },
  {
    version: '2.4.0',
    date: '2026-03-30',
    changes: [
      'Build — Budget filter in unit picker: hide units above a points threshold',
      'Data — Ahsoka errata card images updated (May 2025)',
      'UI — Landscape blocker improvements',
    ],
  },
  {
    version: '2.3.1',
    date: '2026-03-26',
    changes: [
      'Play — Force cost starburst tokens now display before ability names, matching the card art',
      'Data — Ability data corrected for 18+ units (cost values, descriptions, icon tokens)',
    ],
  },
  {
    version: '2.3.0',
    date: '2026-03-26',
    changes: [
      'Build — Threemiere format: 3-squad build mode sitting between Standard (2) and Premiere (4)',
      'Build — Format selector replaces the old Premiere checkbox with Standard / Threemiere / Premiere toggle',
      'Build — Saved list badges show cyan "Threemiere" or amber "Premiere" labels',
      'Build — Old saved builds auto-migrate to the new format seamlessly',
    ],
  },
  {
    version: '2.2.0',
    date: '2026-03-15',
    changes: [
      'SEO — robots.txt and sitemap.xml added; all 133 unit pages indexed with slug URLs',
      'SEO — Slug-based character URLs: /browse/ahsoka-tano-fulcrum instead of /browse/23; old numeric links auto-redirect',
      'SEO — Per-route page titles and meta descriptions; Open Graph + Twitter Card tags on every page',
      'SEO — Character profile pages include og:image (unit card art), canonical URL, and BreadcrumbList JSON-LD',
      'SEO — OG share image added (shown when sharing shatterapp.com on Discord, iMessage, etc.)',
      'PWA — manifest icons updated to use real app icons',
    ],
  },
  {
    version: '2.1.1',
    date: '2026-03-15',
    changes: [
      'Multiplayer — Rejoining a room now correctly broadcasts the rejoining player\'s name to the remaining player',
    ],
  },
  {
    version: '2.1.0',
    date: '2026-03-15',
    changes: [
      'Play — Clicking an attack (⚔) or defense (🛡) stat button on any unit card navigates to the Dice tab and pre-rolls the correct number of dice',
      'Play — Dice tab is now always visible (solo and multiplayer)',
      'Play — Unit stance card and active conditions appear above the corresponding dice column',
      'Play — Multiplayer: both players\' stance cards display side by side; opponent\'s unit synced via socket',
      'Play — Disarmed condition locks attacker\'s expertise dice (cannot modify); Exposed locks defender\'s expertise dice',
      'Dice — "+ Add die" immediately rolls a random face; no face-picker required',
      'Data — Fixed missing ranged defense stats for General Obi-Wan Kenobi (Form III Soresu: 5), MagnaGuard (Defensive Programs: 5), and Padawan Ahsoka Tano (Jar\'Kai: 5)',
    ],
  },
  {
    version: '2.0.3',
    date: '2026-03-14',
    changes: [
      'Chore — removed dev/QA screenshots from repository; moved docs to /docs folder',
    ],
  },
  {
    version: '2.0.2',
    date: '2026-03-14',
    changes: [
      'Reference — Keyword Reference tab lists all rule keywords (Immunity, Impact, Protection, Scale, Sharpshooter, Steadfast) with definitions and search',
      'Reference — Icon descriptions always visible on desktop; toggle retained on mobile',
      'Multiplayer — Player name field pre-filled with a random SW name; shown in session banner and opponent roster heading',
      'Multiplayer — Opponent roster now shows force pool, stance names, and full condition labels',
      'Multiplayer — Struggle tracker cards now sync correctly between both players (fix regression)',
      'Dice — Role picker shows "— opponent\'s role" instead of "(taken)"',
      'Build — Clear mission ✕ button on the mission selector',
      'Build — List names with only spaces now save as "Unnamed"',
    ],
  },
  {
    version: '2.0.1',
    date: '2026-03-14',
    changes: [
      'Build — Premiere format checkbox adds Squad 3 & 4 for competitive 4-squad lists',
      'Build — Premiere lists show ★ Premiere badge; all 4 squads save, load, share, and print',
      'Play — Importing a Premiere build shows a 2-of-4 squad picker before adding units',
      'Fix — Play view multiplayer now works correctly (socket event handlers restored)',
    ],
  },
  {
    version: '2.0.0',
    date: '2026-03-14',
    changes: [
      'Play — Real-time multiplayer via Socket.io: create or join a room by code',
      'Play — Role picker (Attacker / Defender) with server-authoritative deduplication',
      'Play — Live dice pool sync: opponent rolls appear in real time',
      'Play — Duel history with live Active row and committed past duels',
      'Play — Opponent roster shows units, force pool, and mission in real time',
      'Play — Session banner shows both player names; struggle cards synced from host',
    ],
  },
  {
    version: '1.12.0',
    date: '2026-03-13',
    changes: [
      'Play — Rule keywords (Immunity, Impact, Protection, Scale, Sharpshooter, Steadfast) highlighted amber in ability descriptions; tap for inline rulebook tooltip',
      'Play — Clicking a unit tag now highlights matching references in ability text',
    ],
  },
  {
    version: '1.11.2',
    date: '2026-03-13',
    changes: [
      'Play — Combat stat buttons are compact on desktop instead of full-width',
    ],
  },
  {
    version: '1.11.1',
    date: '2026-03-13',
    changes: [
      'Server now auto-seeds the database on startup — production data always reflects the latest JSON',
    ],
  },
  {
    version: '1.11.0',
    date: '2026-03-12',
    changes: [
      'Mobile — Combat stats redesigned: full-width stance switcher + one row per type (Ranged/Melee) with properly sized buttons',
      'Mobile — Favorites and Owned filter buttons now always visible (no longer hover-only)',
      'Mobile — KO and Legendary mission cards now display at full width, same as Standard',
      'Mobile — Ability tooltip dismissible by tapping outside on touch devices',
      'Mobile — Unit search picker height reduced to stay visible above keyboard',
      'Mobile — Force Pool tokens use a consistent 6-column grid layout',
      'Play — Legendary mode no longer shows a Galactic Legend picker step (auto-selected)',
      'Collection export now includes individually owned unit IDs',
    ],
  },
  {
    version: '1.10.0',
    date: '2026-03-11',
    changes: [
      'Play — Ability type icons (active, reactive, tactic, innate, identity) re-cropped from SWP01 card art for clean, accurate visuals',
      'Play — Ability type icon tooltip: hover/tap to see what each ability type means',
      'Play — Combat stats (Ranged/Melee atk/def) shown as labelled buttons in the unit header row',
      'Play — Abilities section is now collapsible and shows larger, more readable text',
    ],
  },
  {
    version: '1.9.0',
    date: '2026-03-10',
    changes: [
      'Play — Force Pool: aggregate FP from all roster units shown as spendable tokens at top of Units tab',
      'Play — Force tokens use the Shatterpoint starburst symbol; click to spend/restore, Refresh button resets all',
      'Play — Condition chips are now clickable to remove directly from the card',
      'Play — Unit cards show profile tags; tap a tag to highlight all roster-mates sharing that keyword (auto-clears after 5s)',
    ],
  },
  {
    version: '1.8.1',
    date: '2026-03-10',
    changes: [
      'Added full card art and thumbnails for SWP62 Delta Squad (Boss, Fixer, Sev & Scorch)',
      'Added full card art and thumbnails for SWP63 Terror from Below (Riff Tamson, Nossor Ri, Aqua Droids)',
      'Fixed Republic Clone Commandos ability card (updated to v1.3 errata, stamina 7)',
    ],
  },
  {
    version: '1.8.0',
    date: '2026-03-10',
    changes: [
      'Pack contents expansion — tap "Units (N)" on any product card to see included characters',
      'Individual character ownership — mark individual models as owned (for off-pack purchases)',
    ],
  },
  {
    version: '1.6.0',
    date: '2026-03-09',
    changes: [
      'Legendary Encounters mode — 3-player asymmetric play',
      'Victory Tracker (9 positions, Green/Yellow/Red Alert Levels)',
      'GL Order Deck management (7 cards + Shatterpoint)',
      'Force Pools for cadre1, cadre2, and Galactic Legend',
      'Turn phase pill indicator',
      'Mission 1 "Make an Entrance" and Mission 2 "Uninvited Guests" interactive trackers',
    ],
  },
  {
    version: '1.5.10',
    date: '2026-03-08',
    changes: [
      'Fixed broken images in "In the same pack" section of unit profiles',
      'Added changelog modal accessible from footer version badge',
    ],
  },
  {
    version: '1.5.7',
    date: '2026-03-07',
    changes: [
      'Fixed Jailbreak stage-1 image naming',
    ],
  },
  {
    version: '1.5.6',
    date: '2026-03-07',
    changes: [
      'Mission 6 Crash Landing — card images and tracker UI',
      'Mission 5 Jailbreak — card images, tracker UI, 5-face Stage I card',
      'Extract the Agent KO mission — images and interaction component',
      'Trigger a Chain Reaction KO mission — images and interaction component',
      'Fixed carousel flash; 2-col stage card layout for KO missions',
    ],
  },
  {
    version: '1.5.1',
    date: '2026-03-07',
    changes: [
      'Foil the Heist KO mission — images, interaction component, 3-face card selector',
      'Fixed duplicate Struggle Tracker in Foil the Heist component',
      'Refactored Force Field + Setbacks into 2-col layout above tracker image',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-03-06',
    changes: [
      'Key Operations mode — mission picker, mission-specific tracker components',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-03-05',
    changes: [
      'Legendary Encounters mode — 3-player asymmetric play',
      'Victory Tracker, GL Order Deck, Force Pools, Turn Order indicator',
      'Mission 1 "Make an Entrance" and Mission 2 "Uninvited Guests" trackers',
      'Full mobile pass and polish',
    ],
  },
  {
    version: '1.3.6',
    date: '2026-03-04',
    changes: [
      'PWA install banner (add to home screen prompt)',
    ],
  },
  {
    version: '1.3.5',
    date: '2026-03-04',
    changes: [
      'Shatterpoint dice roller',
    ],
  },
  {
    version: '1.3.4',
    date: '2026-03-04',
    changes: [
      'Unit comparison panel (2–3 units, explicit trigger)',
    ],
  },
  {
    version: '1.3.3',
    date: '2026-03-04',
    changes: [
      'Mobile card zoom, owned-only filter',
    ],
  },
  {
    version: '1.3.2',
    date: '2026-03-04',
    changes: [
      'Print view, owned-only filter, remove premiere from build',
    ],
  },
  {
    version: '1.3.1',
    date: '2026-03-04',
    changes: [
      'JSON backup/export for collection, errata badge fix, collection padding',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-03-04',
    changes: [
      'Errata / balance history system per unit',
      'Various stat corrections',
    ],
  },
  {
    version: '1.2.1',
    date: '2026-03-03',
    changes: [
      'Live on shatterapp.com',
      'Footer, license, public GitHub repo',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-03-03',
    changes: [
      'Play view with struggle tracker, mission picker, and collapsible mission card',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-03-03',
    changes: [
      'Build uniqueness rules and legality badges',
      'Profile share links (base64url encoded)',
      'Multi-list Strike Force builder',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-03-03',
    changes: [
      'Initial release — Browse, Build, Collection views',
    ],
  },
]
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')" />

        <div class="relative z-10 w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl border border-sw-gold/30 bg-sw-card shadow-2xl">
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <h2 class="text-base font-bold text-sw-gold">What's New</h2>
            <button
              class="rounded-full bg-black/40 p-1.5 text-sw-text/50 hover:text-sw-text transition-colors"
              @click="$emit('close')"
            >✕</button>
          </div>

          <!-- Entries -->
          <div class="overflow-y-auto px-5 py-4 space-y-5">
            <div v-for="entry in entries" :key="entry.version">
              <div class="flex items-baseline gap-2 mb-1.5">
                <span class="text-xs font-bold text-sw-gold">v{{ entry.version }}</span>
                <span class="text-[10px] text-sw-text/30">{{ entry.date }}</span>
              </div>
              <ul class="space-y-1">
                <li
                  v-for="change in entry.changes"
                  :key="change"
                  class="text-xs text-sw-text/70 flex gap-2"
                >
                  <span class="text-sw-gold/40 flex-shrink-0">·</span>
                  {{ change }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
