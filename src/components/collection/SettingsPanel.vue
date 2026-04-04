<script setup lang="ts">
import { useSettingsStore } from '../../stores/settings.ts'

defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const settings = useSettingsStore()

const customToggles = [
  {
    key: 'showCustomTab' as const,
    label: 'Allow Custom Profiles',
    desc: 'Shows the Custom tab in the navigation for creating homebrew unit profiles.',
  },
]

const collectionToggles = [
  {
    key: 'autoMarkUnitsOwned' as const,
    label: 'Auto-mark units as owned',
    desc: 'When you mark a pack owned, all its units are marked owned automatically (and un-marked when removed).',
  },
  {
    key: 'showPaintedToggle' as const,
    label: 'Mark painted units',
    desc: 'Adds a cyan painted indicator per unit inside each pack.',
  },
  {
    key: 'showBasedToggle' as const,
    label: 'Mark based units',
    desc: 'Adds a based indicator per unit inside each pack.',
  },
]

const playToggles = [
  {
    key: 'showRollTab' as const,
    label: 'Enable General Roll',
    desc: 'Shows the Roll tab in the navigation.',
    dependsOn: null,
  },
  {
    key: 'showProbabilityRoller' as const,
    label: 'Enable Probability Calculator',
    desc: 'Shows the Probability tab in the Dice Roller.',
    dependsOn: 'showRollTab' as const,
  },
  {
    key: 'playShowRoster' as const,
    label: 'Show unit roster',
    desc: 'Shows the Units tab in the Play screen.',
    dependsOn: null,
  },
  {
    key: 'playShowTracker' as const,
    label: 'Show tracker',
    desc: 'Shows the Tracker tab in the Play screen.',
    dependsOn: null,
  },
  {
    key: 'playShowDice' as const,
    label: 'Show dice',
    desc: 'Shows the Dice tab in the Play screen.',
    dependsOn: null,
  },
  {
    key: 'playShowOrderDeck' as const,
    label: 'Show order deck',
    desc: 'Shows the Order Deck section in the Play screen (Standard/KO modes only).',
    dependsOn: null,
  },
]
</script>

<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-40 bg-black/60"
      @click="$emit('close')"
    />
  </Transition>

  <!-- Drawer -->
  <Transition name="slide">
    <div
      v-if="open"
      class="fixed right-0 top-0 z-50 h-full w-80 max-w-[90vw] overflow-y-auto bg-sw-card border-l border-sw-gold/20 shadow-2xl flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-sw-gold/20 px-4 py-4">
        <h2 class="text-base font-bold text-sw-gold">Settings</h2>
        <button
          class="rounded-lg p-1.5 text-sw-text/50 hover:text-sw-gold transition-colors"
          @click="$emit('close')"
        >✕</button>
      </div>

      <div class="flex-1 space-y-6 px-4 py-5">
        <!-- Custom section -->
        <section class="space-y-3">
          <p class="text-[10px] font-bold uppercase tracking-widest text-sw-text/40">Custom</p>
          <div
            v-for="t in customToggles"
            :key="t.key"
            class="flex items-start justify-between gap-3"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-sw-text">{{ t.label }}</p>
              <p class="text-[11px] text-sw-text/40 leading-snug mt-0.5">{{ t.desc }}</p>
            </div>
            <button
              :class="[
                'relative mt-0.5 shrink-0 h-5 w-9 rounded-full transition-colors',
                settings[t.key] ? 'bg-sw-gold' : 'bg-sw-dark border border-sw-gold/20',
              ]"
              role="switch"
              :aria-checked="settings[t.key]"
              @click="settings[t.key] = !settings[t.key]"
            >
              <span
                :class="[
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200',
                  settings[t.key] ? 'right-0.5' : 'left-0.5',
                ]"
              />
            </button>
          </div>
        </section>

        <!-- Collection section -->
        <section class="space-y-3">
          <p class="text-[10px] font-bold uppercase tracking-widest text-sw-text/40">Collection</p>
          <div
            v-for="t in collectionToggles"
            :key="t.key"
            class="flex items-start justify-between gap-3"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-sw-text">{{ t.label }}</p>
              <p class="text-[11px] text-sw-text/40 leading-snug mt-0.5">{{ t.desc }}</p>
            </div>
            <button
              :class="[
                'relative mt-0.5 shrink-0 h-5 w-9 rounded-full transition-colors',
                settings[t.key] ? 'bg-sw-gold' : 'bg-sw-dark border border-sw-gold/20',
              ]"
              role="switch"
              :aria-checked="settings[t.key]"
              @click="settings[t.key] = !settings[t.key]"
            >
              <span
                :class="[
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200',
                  settings[t.key] ? 'right-0.5' : 'left-0.5',
                ]"
              />
            </button>
          </div>
        </section>

        <!-- Play section -->
        <section class="space-y-3">
          <p class="text-[10px] font-bold uppercase tracking-widest text-sw-text/40">Play</p>
          <div
            v-for="t in playToggles"
            :key="t.key"
            :class="[
              'flex items-start justify-between gap-3',
              t.dependsOn && !settings[t.dependsOn] ? 'opacity-50' : '',
            ]"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-sw-text">{{ t.label }}</p>
              <p class="text-[11px] text-sw-text/40 leading-snug mt-0.5">{{ t.desc }}</p>
              <p
                v-if="t.dependsOn && !settings[t.dependsOn]"
                class="text-[11px] text-amber-400/80 leading-snug mt-0.5"
              >Requires "Enable General Roll" to be on.</p>
            </div>
            <button
              :class="[
                'relative mt-0.5 shrink-0 h-5 w-9 rounded-full transition-colors',
                settings[t.key] ? 'bg-sw-gold' : 'bg-sw-dark border border-sw-gold/20',
                t.dependsOn && !settings[t.dependsOn] ? 'cursor-not-allowed' : '',
              ]"
              role="switch"
              :aria-checked="settings[t.key]"
              :disabled="!!(t.dependsOn && !settings[t.dependsOn])"
              @click="!(t.dependsOn && !settings[t.dependsOn]) && (settings[t.key] = !settings[t.key])"
            >
              <span
                :class="[
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200',
                  settings[t.key] ? 'right-0.5' : 'left-0.5',
                ]"
              />
            </button>
          </div>
        </section>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: transform 0.25s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>
