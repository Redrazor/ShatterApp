<script setup lang="ts">
import type { Mission, BuildMode } from '../../types/index.ts'

defineProps<{
  name: string
  mission: Mission | null
  isComplete: boolean
  buildMode: BuildMode
}>()

defineEmits<{
  (e: 'update:name', val: string): void
  (e: 'update:buildMode', val: BuildMode): void
  (e: 'pick-mission'): void
  (e: 'clear-mission'): void
  (e: 'reset'): void
  (e: 'save'): void
  (e: 'share'): void
  (e: 'qr'): void
  (e: 'export'): void
  (e: 'print'): void
}>()

const modes: { value: BuildMode; label: string; squads: number }[] = [
  { value: 'standard', label: 'Standard', squads: 2 },
  { value: 'threemiere', label: 'Threemiere', squads: 3 },
  { value: 'premiere', label: 'Premiere', squads: 4 },
]
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

  </div>
</template>
