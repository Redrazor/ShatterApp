<script setup lang="ts">
defineProps<{ show: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const entries = [
  {
    version: '1.6.1',
    date: '2026-03-09',
    changes: [
      'Legendary Encounters: removed GL picker — selecting a mission now goes straight into the game',
      'GL Force Pool remains on the game screen for manual tracking',
      'Raised test coverage threshold to 75%',
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
