<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKeyopsStore } from '../../../stores/keyops.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'

const koStore = useKeyopsStore()

// ─── Section D: Force Field Power Tracker ────────────────────────────────────
// Track positions (0-based index):
// 0: Powered Down
// 1-3: Powered Down arrow spaces
// 4: Field Engaged (first)
// 5-7: Field Engaged arrow spaces
// 8: Field Engaged (second)
// 9-10: Field Engaged arrow spaces
// 11: Full Power
//
// Simplified as a linear 0–8 scale matching the visual tracker:
// Spaces: [Powered Down] → → → → [Field Engaged] → → [Field Engaged] → [Full Power]
// We model it as 9 positions (0=Powered Down, 4=Field Engaged, 7=Field Engaged 2, 8=Full Power)

const TRACK_LABELS: string[] = [
  'Powered Down',
  '▶',
  '▶',
  '▶',
  '▶',
  'Field Engaged',
  '▶',
  '▶',
  'Field Engaged',
  '▶',
  '▶',
  'Full Power',
]

// Named positions for highlighting
const NAMED_POSITIONS = new Set([0, 5, 8, 11])

const fieldPower = ref(0)
const maxPosition = TRACK_LABELS.length - 1

function moveForward() {
  if (fieldPower.value < maxPosition) fieldPower.value++
}
function moveBack() {
  if (fieldPower.value > 0) fieldPower.value--
}

const atFullPower = computed(() => fieldPower.value === maxPosition)
const atFieldEngaged = computed(() => fieldPower.value === 5 || fieldPower.value === 8)

function currentLabel(): string {
  return TRACK_LABELS[fieldPower.value]
}

// ─── Section F: Setbacks ─────────────────────────────────────────────────────
const MAX_SETBACKS = 10

const setbacks = ref(0)

function addSetback() {
  setbacks.value = Math.min(MAX_SETBACKS, setbacks.value + 1)
}
function removeSetback() {
  setbacks.value = Math.max(0, setbacks.value - 1)
}

const setbackWarning = computed(() => setbacks.value >= MAX_SETBACKS)
</script>

<template>
  <div class="space-y-4">

    <!-- ─── Sections D + F: Force Field + Setbacks (2-column) ────────────── -->
    <div class="grid grid-cols-2 gap-3">

      <!-- ─── Section D: Force Field Power Tracker ──────────────────────── -->
      <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-3 py-3">
        <div class="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          Force Field
        </div>

        <!-- Current position label -->
        <div class="mb-2">
          <div
            class="rounded px-2 py-1 text-xs font-bold transition-colors"
            :class="atFullPower
              ? 'bg-red-900/50 border border-red-600/60 text-red-300'
              : atFieldEngaged
                ? 'bg-amber-900/40 border border-amber-600/50 text-amber-300'
                : 'bg-zinc-800 border border-zinc-600 text-zinc-300'"
          >
            {{ currentLabel() }}
            <div v-if="atFullPower" class="text-[9px] font-normal opacity-70">Stage ends</div>
            <div v-else-if="atFieldEngaged" class="text-[9px] font-normal opacity-70">Remove 1 momentum</div>
          </div>
        </div>

        <!-- Track visualization -->
        <div class="mb-2 flex flex-wrap gap-0.5">
          <div
            v-for="(label, i) in TRACK_LABELS"
            :key="i"
            class="flex items-center justify-center rounded text-[8px] font-bold transition-all"
            :class="[
              i === fieldPower
                ? 'bg-amber-500 text-black w-7 h-7 ring-2 ring-amber-300'
                : i < fieldPower
                  ? 'bg-zinc-600 text-zinc-400 w-5 h-5'
                  : 'bg-zinc-800 text-zinc-600 w-5 h-5',
              NAMED_POSITIONS.has(i) && i !== fieldPower ? 'ring-1 ring-zinc-500' : ''
            ]"
            :title="NAMED_POSITIONS.has(i) ? label : ''"
          >
            {{ NAMED_POSITIONS.has(i) ? (i === 0 ? 'PD' : i === 5 ? 'FE' : i === 8 ? 'FE' : 'FP') : '▶' }}
          </div>
        </div>

        <!-- Controls -->
        <div class="flex flex-col gap-1.5">
          <button
            class="rounded border border-blue-800/60 bg-blue-900/30 px-2 py-1.5 text-[10px] font-semibold text-blue-300
                   hover:border-blue-500 hover:bg-blue-800/40 transition-colors
                   disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="fieldPower === 0"
            @click="moveBack"
          >← Power Down</button>
          <button
            class="rounded border border-red-800/60 bg-red-900/30 px-2 py-1.5 text-[10px] font-semibold text-red-300
                   hover:border-red-500 hover:bg-red-800/40 transition-colors
                   disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="fieldPower === maxPosition"
            @click="moveForward"
          >Power Up →</button>
        </div>
      </div>

      <!-- ─── Section F: Setbacks ────────────────────────────────────────── -->
      <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-3 py-3">
        <div class="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          Setbacks
        </div>

        <div class="mb-2 flex items-center gap-2">
          <span
            class="text-2xl font-bold tabular-nums transition-colors"
            :class="setbackWarning ? 'text-red-400' : 'text-zinc-200'"
          >{{ setbacks }}</span>
          <span class="text-[10px] text-zinc-600">/ {{ MAX_SETBACKS }}</span>
        </div>
        <div v-if="setbackWarning" class="mb-2 text-[10px] font-semibold text-red-400">
          Aggressor captured!
        </div>

        <!-- Pip row -->
        <div class="mb-2 flex flex-wrap gap-1">
          <div
            v-for="n in MAX_SETBACKS"
            :key="n"
            class="h-4 w-4 rounded-sm border transition-colors"
            :class="n <= setbacks
              ? 'bg-red-700 border-red-600'
              : 'bg-zinc-800 border-zinc-700'"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <button
            class="rounded border border-zinc-700 bg-zinc-800/60 px-2 py-1.5 text-[10px] font-semibold text-zinc-400
                   hover:border-zinc-500 hover:text-zinc-200 transition-colors
                   disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="setbacks === 0"
            @click="removeSetback"
          >− Remove</button>
          <button
            class="rounded border border-red-800/60 bg-red-900/30 px-2 py-1.5 text-[10px] font-semibold text-red-300
                   hover:border-red-600 hover:bg-red-800/40 transition-colors
                   disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="setbackWarning"
            @click="addSetback"
          >+ Add Setback</button>
        </div>
      </div>
    </div>

    <!-- ─── Section C: Tracker ───────────────────────────────────────────── -->
    <div
      v-if="koStore.selectedKoMission?.tracker"
      class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3"
    >
      <div class="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
        Dashboard / Tracker
      </div>
      <img
        :src="imageUrl(koStore.selectedKoMission!.tracker)"
        class="w-full h-auto rounded-lg mx-auto block"
        alt="Foil the Heist Dashboard"
      />
    </div>

  </div>
</template>
