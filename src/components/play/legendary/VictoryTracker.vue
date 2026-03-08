<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  position: number
}>()

const emit = defineEmits<{
  advance: []
  retreat: []
}>()

// 9 spaces: 0–8  (matches physical dashboard)
const SPACES = Array.from({ length: 9 }, (_, i) => i)

function alertFor(space: number): 'green' | 'yellow' | 'red' {
  if (space <= 2) return 'green'
  if (space <= 5) return 'yellow'
  return 'red'
}

const alertLevel = computed(() => alertFor(props.position))

const alertLabel = computed(() => {
  if (alertLevel.value === 'green') return 'Condition Green'
  if (alertLevel.value === 'yellow') return 'Yellow Alert'
  return 'Red Alert'
})

const forceRefresh = computed(() => {
  if (alertLevel.value === 'green') return 0
  if (alertLevel.value === 'yellow') return 1
  return 2
})

function spaceClass(space: number): string {
  const alert = alertFor(space)
  const isCurrent = space === props.position
  const isPast = space < props.position

  let base = 'relative flex h-9 flex-1 items-center justify-center rounded text-[11px] font-bold transition-all select-none '

  if (isCurrent) {
    if (alert === 'green') base += 'bg-emerald-500 text-white ring-2 ring-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.6)] scale-110 z-10 '
    else if (alert === 'yellow') base += 'bg-yellow-400 text-zinc-900 ring-2 ring-yellow-200 shadow-[0_0_10px_rgba(250,204,21,0.6)] scale-110 z-10 '
    else base += 'bg-red-500 text-white ring-2 ring-red-300 shadow-[0_0_10px_rgba(239,68,68,0.6)] scale-110 z-10 '
  } else if (isPast) {
    if (alert === 'green') base += 'bg-emerald-900/60 text-emerald-400 border border-emerald-800/50 '
    else if (alert === 'yellow') base += 'bg-yellow-900/60 text-yellow-500 border border-yellow-800/50 '
    else base += 'bg-red-900/60 text-red-400 border border-red-800/50 '
  } else {
    if (alert === 'green') base += 'bg-zinc-800 text-emerald-700 border border-zinc-700/40 '
    else if (alert === 'yellow') base += 'bg-zinc-800 text-yellow-800 border border-zinc-700/40 '
    else base += 'bg-zinc-800 text-red-900 border border-zinc-700/40 '
  }

  return base
}

const alertBadgeClass = computed(() => {
  if (alertLevel.value === 'green') return 'bg-emerald-900/60 text-emerald-400 border-emerald-700/50'
  if (alertLevel.value === 'yellow') return 'bg-yellow-900/60 text-yellow-400 border-yellow-700/50'
  return 'bg-red-900/60 text-red-400 border-red-700/50'
})
</script>

<template>
  <div class="rounded-xl border border-zinc-700/50 bg-zinc-900/80 px-4 py-3 space-y-3">
    <!-- Header row -->
    <div class="flex items-center justify-between">
      <div class="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Victory Tracker</div>
      <div class="flex items-center gap-2">
        <span
          class="rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          :class="alertBadgeClass"
        >{{ alertLabel }}</span>
        <span
          v-if="forceRefresh > 0"
          class="rounded border border-sky-800/50 bg-sky-950/60 px-2 py-0.5 text-[10px] font-bold text-sky-400"
        >+{{ forceRefresh }} Force/turn</span>
        <span
          v-else
          class="rounded border border-zinc-700/40 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-600"
        >No Force Refresh</span>
      </div>
    </div>

    <!-- Track spaces 0–8 -->
    <div class="flex gap-0.5">
      <div
        v-for="space in SPACES"
        :key="space"
        :class="spaceClass(space)"
      >
        {{ space }}
        <div
          v-if="space === position"
          class="absolute inset-0.5 rounded-sm border border-white/50 bg-white/15 backdrop-blur-sm"
        />
      </div>
    </div>

    <!-- Zone labels -->
    <div class="flex gap-0.5 text-[9px]">
      <div class="flex-[3] text-center font-semibold text-emerald-700">0 – 2</div>
      <div class="flex-[3] text-center font-semibold text-yellow-800">3 – 5</div>
      <div class="flex-[3] text-center font-semibold text-red-900">6 – 8</div>
    </div>

    <!-- +/- controls -->
    <div class="grid grid-cols-2 gap-2">
      <button
        class="rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-800 px-3 py-2 text-sm font-bold
               border border-zinc-600/50 text-zinc-300 transition-all
               shadow-[0_3px_0_0_rgba(0,0,0,0.5)] hover:from-zinc-600 hover:to-zinc-700
               active:shadow-[0_1px_0_0_rgba(0,0,0,0.5)] active:translate-y-[2px]
               disabled:opacity-30 disabled:cursor-not-allowed disabled:active:translate-y-0"
        :disabled="position <= 0"
        @click="emit('retreat')"
      >← Retreat</button>
      <button
        class="rounded-lg bg-gradient-to-b from-red-700 to-red-900 px-3 py-2 text-sm font-bold
               border border-red-600/50 text-red-100 transition-all
               shadow-[0_3px_0_0_rgba(0,0,0,0.5)] hover:from-red-600 hover:to-red-800
               active:shadow-[0_1px_0_0_rgba(0,0,0,0.5)] active:translate-y-[2px]
               disabled:opacity-30 disabled:cursor-not-allowed disabled:active:translate-y-0"
        :disabled="position >= 8"
        @click="emit('advance')"
      >Advance →</button>
    </div>
  </div>
</template>
