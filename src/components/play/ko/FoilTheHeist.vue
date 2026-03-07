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

// ─── Section E: Struggle Tracker ─────────────────────────────────────────────
const MAX_MOMENTUM = 10

const aggressorMomentum = ref(0)
const sentinelMomentum = ref(0)

function addMomentum(side: 'aggressor' | 'sentinel', n = 1) {
  if (side === 'aggressor') aggressorMomentum.value = Math.min(MAX_MOMENTUM, aggressorMomentum.value + n)
  else sentinelMomentum.value = Math.min(MAX_MOMENTUM, sentinelMomentum.value + n)
}
function removeMomentum(side: 'aggressor' | 'sentinel', n = 1) {
  if (side === 'aggressor') aggressorMomentum.value = Math.max(0, aggressorMomentum.value - n)
  else sentinelMomentum.value = Math.max(0, sentinelMomentum.value - n)
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

    <!-- ─── Section D: Force Field Power Tracker ─────────────────────────── -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
      <div class="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
        Force Field Power Tracker
      </div>

      <!-- Current position label -->
      <div class="mb-3 flex items-center gap-3">
        <div
          class="rounded-lg px-3 py-1.5 text-sm font-bold transition-colors"
          :class="atFullPower
            ? 'bg-red-900/50 border border-red-600/60 text-red-300'
            : atFieldEngaged
              ? 'bg-amber-900/40 border border-amber-600/50 text-amber-300'
              : 'bg-zinc-800 border border-zinc-600 text-zinc-300'"
        >
          {{ currentLabel() }}
          <span v-if="atFullPower" class="ml-1 text-[10px] font-normal opacity-70">(Stage ends)</span>
          <span v-else-if="atFieldEngaged" class="ml-1 text-[10px] font-normal opacity-70">(Aggressor removes 1 momentum)</span>
        </div>
        <div class="text-[11px] text-zinc-600">Position {{ fieldPower }} / {{ maxPosition }}</div>
      </div>

      <!-- Track visualization -->
      <div class="mb-3 flex items-center gap-1 flex-wrap">
        <div
          v-for="(label, i) in TRACK_LABELS"
          :key="i"
          class="flex items-center justify-center rounded text-[9px] font-bold transition-all"
          :class="[
            i === fieldPower
              ? 'bg-amber-500 text-black w-8 h-8 ring-2 ring-amber-300'
              : i < fieldPower
                ? 'bg-zinc-600 text-zinc-400 w-6 h-6'
                : 'bg-zinc-800 text-zinc-600 w-6 h-6',
            NAMED_POSITIONS.has(i) && i !== fieldPower ? 'ring-1 ring-zinc-500' : ''
          ]"
          :title="NAMED_POSITIONS.has(i) ? label : ''"
        >
          {{ NAMED_POSITIONS.has(i) ? (i === 0 ? 'PD' : i === 5 ? 'FE' : i === 8 ? 'FE' : 'FP') : '▶' }}
        </div>
      </div>

      <!-- Controls -->
      <div class="flex gap-2">
        <button
          class="rounded-lg border border-blue-800/60 bg-blue-900/30 px-3 py-2 text-xs font-semibold text-blue-300
                 shadow-[0_2px_0_0_rgba(0,0,0,0.4)] transition-all
                 hover:border-blue-500 hover:bg-blue-800/40
                 active:shadow-none active:translate-y-0.5
                 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="fieldPower === 0"
          @click="moveBack"
        >
          ← Power Down
        </button>
        <button
          class="rounded-lg border border-red-800/60 bg-red-900/30 px-3 py-2 text-xs font-semibold text-red-300
                 shadow-[0_2px_0_0_rgba(0,0,0,0.4)] transition-all
                 hover:border-red-500 hover:bg-red-800/40
                 active:shadow-none active:translate-y-0.5
                 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="fieldPower === maxPosition"
          @click="moveForward"
        >
          Power Up →
        </button>
      </div>
    </div>

    <!-- ─── Section E: Struggle Tracker ──────────────────────────────────── -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
      <div class="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
        Struggle Tracker
      </div>

      <div class="grid grid-cols-2 gap-3">
        <!-- Aggressor -->
        <div class="rounded-lg border border-red-900/40 bg-red-950/20 p-3">
          <div class="mb-2 text-[10px] font-bold text-red-400">Aggressor</div>
          <div class="mb-2 flex items-center gap-2">
            <span class="text-xl font-bold tabular-nums text-red-200">{{ aggressorMomentum }}</span>
            <span class="text-[10px] text-zinc-600">momentum</span>
          </div>
          <div class="flex gap-1">
            <button
              class="rounded border border-red-900/50 bg-red-950/40 px-2 py-1 text-xs font-bold text-red-400
                     hover:bg-red-900/40 transition-colors disabled:opacity-40"
              :disabled="aggressorMomentum === 0"
              @click="removeMomentum('aggressor')"
            >−</button>
            <button
              class="rounded border border-red-700/50 bg-red-900/30 px-2 py-1 text-xs font-bold text-red-300
                     hover:bg-red-800/40 transition-colors disabled:opacity-40"
              :disabled="aggressorMomentum >= MAX_MOMENTUM"
              @click="addMomentum('aggressor')"
            >+</button>
          </div>
        </div>

        <!-- Sentinel -->
        <div class="rounded-lg border border-blue-900/40 bg-blue-950/20 p-3">
          <div class="mb-2 text-[10px] font-bold text-blue-400">Sentinel</div>
          <div class="mb-2 flex items-center gap-2">
            <span class="text-xl font-bold tabular-nums text-blue-200">{{ sentinelMomentum }}</span>
            <span class="text-[10px] text-zinc-600">momentum</span>
          </div>
          <div class="flex gap-1">
            <button
              class="rounded border border-blue-900/50 bg-blue-950/40 px-2 py-1 text-xs font-bold text-blue-400
                     hover:bg-blue-900/40 transition-colors disabled:opacity-40"
              :disabled="sentinelMomentum === 0"
              @click="removeMomentum('sentinel')"
            >−</button>
            <button
              class="rounded border border-blue-700/50 bg-blue-900/30 px-2 py-1 text-xs font-bold text-blue-300
                     hover:bg-blue-800/40 transition-colors disabled:opacity-40"
              :disabled="sentinelMomentum >= MAX_MOMENTUM"
              @click="addMomentum('sentinel')"
            >+</button>
          </div>
        </div>
      </div>

      <!-- Full tracker visual -->
      <div class="mt-3">
        <div class="mb-1 flex justify-between text-[9px] text-zinc-700">
          <span>Aggressor</span>
          <span>Sentinel</span>
        </div>
        <div class="flex h-4 overflow-hidden rounded-full border border-zinc-700">
          <div
            class="bg-red-700 transition-all duration-300"
            :style="{ width: `${(aggressorMomentum / MAX_MOMENTUM) * 50}%` }"
          />
          <div class="flex-1 bg-zinc-800" />
          <div
            class="bg-blue-700 transition-all duration-300"
            :style="{ width: `${(sentinelMomentum / MAX_MOMENTUM) * 50}%` }"
          />
        </div>
        <div class="mt-1 text-center text-[10px] text-zinc-600">
          {{ aggressorMomentum }} / {{ MAX_MOMENTUM }} each
        </div>
      </div>
    </div>

    <!-- ─── Section F: Setbacks ───────────────────────────────────────────── -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
      <div class="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
        Setbacks
      </div>

      <div class="mb-2 flex items-center gap-3">
        <span
          class="text-2xl font-bold tabular-nums transition-colors"
          :class="setbackWarning ? 'text-red-400' : 'text-zinc-200'"
        >{{ setbacks }}</span>
        <span class="text-[10px] text-zinc-600">damage tokens / {{ MAX_SETBACKS }}</span>
        <span v-if="setbackWarning" class="text-[10px] font-semibold text-red-400">
          Aggressor captured — Foil the Heist!
        </span>
      </div>

      <!-- Pip row -->
      <div class="mb-3 flex flex-wrap gap-1.5">
        <div
          v-for="n in MAX_SETBACKS"
          :key="n"
          class="h-5 w-5 rounded-sm border transition-colors"
          :class="n <= setbacks
            ? 'bg-red-700 border-red-600'
            : 'bg-zinc-800 border-zinc-700'"
        />
      </div>

      <div class="flex gap-2">
        <button
          class="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs font-semibold text-zinc-400
                 hover:border-zinc-500 hover:text-zinc-200 transition-colors
                 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="setbacks === 0"
          @click="removeSetback"
        >− Remove</button>
        <button
          class="rounded-lg border border-red-800/60 bg-red-900/30 px-3 py-2 text-xs font-semibold text-red-300
                 hover:border-red-600 hover:bg-red-800/40 transition-colors
                 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="setbackWarning"
          @click="addSetback"
        >+ Add Setback</button>
      </div>
    </div>

  </div>
</template>
