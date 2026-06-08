<script setup lang="ts">
import { computed } from 'vue'
import type { Mission, BuildMode } from '../../types/index.ts'
import type { CohesionLevel } from '../../utils/randomBuild.ts'

const props = defineProps<{
  name: string
  mission: Mission | null
  isComplete: boolean
  buildMode: BuildMode
  ownedOnly: boolean
  cohesion: CohesionLevel
  randomizeMission: boolean
}>()

const emit = defineEmits<{
  (e: 'update:name', val: string): void
  (e: 'update:buildMode', val: BuildMode): void
  (e: 'update:ownedOnly', val: boolean): void
  (e: 'update:cohesion', val: CohesionLevel): void
  (e: 'update:randomizeMission', val: boolean): void
  (e: 'pick-mission'): void
  (e: 'clear-mission'): void
  (e: 'reset'): void
  (e: 'save'): void
  (e: 'share'): void
  (e: 'qr'): void
  (e: 'export'): void
  (e: 'print'): void
  (e: 'random'): void
}>()

const modes: { value: BuildMode; label: string; squads: number }[] = [
  { value: 'skirmish', label: 'Skirmish', squads: 1 },
  { value: 'standard', label: 'Standard', squads: 2 },
  { value: 'threemiere', label: 'Threemiere', squads: 3 },
  { value: 'premiere', label: 'Premiere', squads: 4 },
]

const cohesionLabels: Record<number, string> = {
  0: 'Locked', 25: 'Pack-Loyal', 50: 'Tag-Aligned', 75: 'Loose', 100: 'Chaos',
}
const cohesionLabel = computed(() => cohesionLabels[props.cohesion] ?? '')
const willGenerate = computed(() => modes.find(m => m.value === props.buildMode)?.squads ?? 2)

function onCohesion(e: Event) {
  emit('update:cohesion', Number((e.target as HTMLInputElement).value) as CohesionLevel)
}
</script>

<template>
  <div class="rounded-xl border border-sw-gold/20 bg-sw-card p-4 space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <h2 class="text-lg font-bold text-sw-gold flex-1">Strike Force</h2>
      <div class="flex flex-wrap items-center gap-1">
        <span
          v-if="isComplete"
          class="rounded-full bg-green-500/20 px-3 py-0.5 text-xs font-medium text-green-400 no-print"
        >
          ✓ Complete
        </span>
        <button
          class="no-print rounded px-2 py-1 text-xs text-sw-gold/70 hover:text-sw-gold"
          @click="$emit('save')"
        >
          Save
        </button>
        <button
          class="no-print rounded px-2 py-1 text-xs text-sw-blue/70 hover:text-sw-blue"
          @click="$emit('share')"
        >
          Share
        </button>
        <button
          class="no-print rounded px-2 py-1 text-xs text-sw-blue/50 hover:text-sw-blue"
          title="Show QR code"
          @click="$emit('qr')"
        >
          QR
        </button>
        <button
          class="no-print rounded px-2 py-1 text-xs text-sw-text/50 hover:text-sw-gold"
          title="Export to Longshanks"
          @click="$emit('export')"
        >
          Export
        </button>
        <button
          class="no-print hidden sm:block rounded px-2 py-1 text-xs text-sw-text/40 hover:text-sw-gold"
          @click="$emit('print')"
        >
          Print
        </button>
        <button
          class="no-print rounded px-2 py-1 text-xs text-sw-text/50 hover:text-red-400"
          @click="$emit('reset')"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- Name -->
    <div>
      <label class="mb-1 block text-xs text-sw-text/50">List Name</label>
      <input
        type="text"
        :value="name"
        placeholder="My Strike Force"
        class="w-full rounded-lg border border-sw-gold/30 bg-sw-dark px-3 py-2 text-sw-text placeholder-sw-text/30 focus:border-sw-gold focus:outline-none"
        @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Mission -->
    <div>
      <label class="mb-1 block text-xs text-sw-text/50">Mission</label>
      <div class="flex gap-2 items-stretch">
        <button
          class="flex-1 rounded-lg border border-sw-gold/30 bg-sw-dark px-3 py-2 text-left transition-colors hover:border-sw-gold"
          @click="$emit('pick-mission')"
        >
          <span v-if="mission" class="text-sw-text">{{ mission.name }}</span>
          <span v-else class="text-sw-text/40">Select mission…</span>
        </button>
        <button
          v-if="mission"
          class="rounded-lg border border-sw-gold/20 bg-sw-dark px-2.5 text-sw-text/40 hover:text-sw-text/80 hover:border-sw-gold/40 transition-colors"
          title="Clear mission"
          @click="$emit('clear-mission')"
        >✕</button>
      </div>
    </div>

    <!-- Build Mode Selector -->
    <div class="no-print">
      <label class="mb-1.5 block text-xs text-sw-text/50">Format</label>
      <div class="flex rounded-lg border border-sw-gold/20 overflow-hidden">
        <button
          v-for="m in modes"
          :key="m.value"
          class="flex-1 px-3 py-1.5 text-xs font-medium transition-colors text-center"
          :class="buildMode === m.value
            ? 'bg-sw-gold/20 text-sw-gold'
            : 'text-zinc-500 hover:text-sw-text/70 hover:bg-sw-card'"
          @click="$emit('update:buildMode', m.value)"
        >
          {{ m.label }}
          <span class="text-[10px] opacity-60 ml-0.5">({{ m.squads }})</span>
        </button>
      </div>
    </div>

    <!-- Random Generator -->
    <div class="no-print rounded-lg border border-sw-gold/15 bg-sw-dark/40 p-3 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-sw-gold/80">Random Generator</span>
        <span class="text-[10px] text-sw-text/40">
          Will generate: {{ willGenerate }} squad{{ willGenerate === 1 ? '' : 's' }}
        </span>
      </div>

      <!-- Cohesion slider -->
      <div>
        <div class="mb-1 flex items-center justify-between">
          <span class="text-xs text-sw-text/50">Cohesion</span>
          <span class="text-xs font-medium text-sw-gold">{{ cohesionLabel }}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="25"
          :value="cohesion"
          class="w-full accent-sw-gold"
          aria-label="Cohesion level"
          @input="onCohesion"
        />
        <div class="mt-0.5 flex justify-between text-[9px] text-sw-text/30">
          <span>Locked</span>
          <span>Pack</span>
          <span>Tag</span>
          <span>Loose</span>
          <span>Chaos</span>
        </div>
      </div>

      <!-- Toggles -->
      <label class="flex cursor-pointer items-center justify-between">
        <span class="text-xs text-sw-text/60">Owned units only</span>
        <button
          type="button"
          role="switch"
          :aria-checked="ownedOnly"
          class="relative h-5 w-9 shrink-0 rounded-full transition-colors"
          :class="ownedOnly ? 'bg-sw-gold' : 'bg-sw-text/20'"
          @click="$emit('update:ownedOnly', !ownedOnly)"
        >
          <span
            class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
            :class="ownedOnly ? 'translate-x-4' : ''"
          />
        </button>
      </label>

      <label class="flex cursor-pointer items-center justify-between">
        <span class="text-xs text-sw-text/60">Randomize mission too</span>
        <button
          type="button"
          role="switch"
          :aria-checked="randomizeMission"
          class="relative h-5 w-9 shrink-0 rounded-full transition-colors"
          :class="randomizeMission ? 'bg-sw-gold' : 'bg-sw-text/20'"
          @click="$emit('update:randomizeMission', !randomizeMission)"
        >
          <span
            class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
            :class="randomizeMission ? 'translate-x-4' : ''"
          />
        </button>
      </label>

      <!-- Generate -->
      <button
        type="button"
        class="w-full rounded-lg border border-sw-gold/40 bg-sw-gold/10 px-3 py-2 text-sm font-medium text-sw-gold transition-colors hover:bg-sw-gold/20"
        @click="$emit('random')"
      >
        🎲 Generate Strike Force
      </button>
    </div>

  </div>
</template>
