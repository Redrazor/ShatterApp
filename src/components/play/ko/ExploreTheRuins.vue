<script setup lang="ts">
import { ref } from 'vue'
import { useKeyopsStore } from '../../../stores/keyops.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'
import { rollAttack } from '../../../utils/dice.ts'
import type { AttackFace } from '../../../utils/dice.ts'
import DieFace from '../../dice/DieFace.vue'

const koStore = useKeyopsStore()

// ─── Section D: Mysterious Workings ───────────────────────────────────────
interface MwEffect {
  face: AttackFace
  title: string
  desc: string
}

const MW_EFFECTS: MwEffect[] = [
  {
    face: 'strike',
    title: 'Ancient Traps',
    desc: 'Choose an Active objective and roll 3 Attack Dice. For each ★ in the roll, each Unit with characters contesting that objective suffers ✦. Cannot choose an already-chosen objective this Turn.',
  },
  {
    face: 'expertise',
    title: 'Collapse',
    desc: 'Choose an enemy Unit. If the chosen Unit is ★★, it suffers ✦✦✦. Otherwise, the opposing player may have it suffer QD; if they decline, the chosen Unit may H. You control this move.',
  },
  {
    face: 'failure',
    title: 'Collapse: Refresh',
    desc: 'Refresh ✦.',
  },
  {
    face: 'crit',
    title: 'Collapse',
    desc: 'Choose an objective. Place the objective token within ⊕2 of its current location, at any elevation. Cannot choose an already-chosen objective this Turn.',
  },
]

const mwRoll = ref<AttackFace | null>(null)

function resolveMysterious() {
  mwRoll.value = rollAttack()
}

function clearMW() {
  mwRoll.value = null
}

// ─── Section E: Operation Pool ────────────────────────────────────────────
interface Token {
  id: number
  symbol: string
}

const INITIAL_POOL: Token[] = [
  { id: 0, symbol: '✤' },
  { id: 1, symbol: '♟' },
  { id: 2, symbol: '✕' },
  { id: 3, symbol: '♦' },
  { id: 4, symbol: '✳' },
  { id: 5, symbol: '✦' },
]

const poolTokens = ref<Token[]>([...INITIAL_POOL])
const aggressorTokens = ref<Token[]>([])
const sentinelTokens = ref<Token[]>([])

function assignTo(token: Token, target: 'aggressor' | 'sentinel') {
  poolTokens.value = poolTokens.value.filter(t => t.id !== token.id)
  if (target === 'aggressor') aggressorTokens.value = [...aggressorTokens.value, token]
  else sentinelTokens.value = [...sentinelTokens.value, token]
}

function returnToken(token: Token, from: 'aggressor' | 'sentinel') {
  if (from === 'aggressor') aggressorTokens.value = aggressorTokens.value.filter(t => t.id !== token.id)
  else sentinelTokens.value = sentinelTokens.value.filter(t => t.id !== token.id)
  poolTokens.value = [...poolTokens.value, token]
}

function returnAll(from: 'aggressor' | 'sentinel') {
  if (from === 'aggressor') {
    poolTokens.value = [...poolTokens.value, ...aggressorTokens.value]
    aggressorTokens.value = []
  } else {
    poolTokens.value = [...poolTokens.value, ...sentinelTokens.value]
    sentinelTokens.value = []
  }
}

// ─── Section F: Used Objectives ───────────────────────────────────────────
const usedObjectives = ref<Set<number>>(new Set())

function toggleObjective(n: number) {
  const next = new Set(usedObjectives.value)
  if (next.has(n)) next.delete(n)
  else next.add(n)
  usedObjectives.value = next
}

function resetTurn() {
  usedObjectives.value = new Set()
}
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
        class="w-[70%] h-auto rounded-lg mx-auto block"
        alt="Explore the Ruins Dashboard"
      />
    </div>

    <!-- ─── Section D: Mysterious Workings ──────────────────────────────── -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
      <div class="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
        Mysterious Workings
      </div>

      <!-- Roll button / result -->
      <div class="mb-3 flex items-center gap-3">
        <button
          class="rounded-lg border border-amber-700/60 bg-amber-900/30 px-4 py-2 text-sm font-semibold text-amber-300
                 shadow-[0_2px_0_0_rgba(0,0,0,0.4)] transition-all
                 hover:border-amber-500 hover:bg-amber-800/40 hover:text-amber-200
                 active:shadow-none active:translate-y-0.5
                 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="mwRoll !== null"
          @click="resolveMysterious"
        >
          Resolve Mysterious Working
        </button>
        <button
          v-if="mwRoll !== null"
          class="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs font-medium text-zinc-400
                 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
          @click="clearMW"
        >
          Clear
        </button>
      </div>

      <!-- Die result -->
      <div v-if="mwRoll !== null" class="mb-3 flex items-center gap-3">
        <DieFace type="attack" :face="mwRoll" :size="56" />
        <div class="text-sm font-semibold text-amber-300 capitalize">{{ mwRoll }}</div>
      </div>

      <!-- Effects table -->
      <div class="overflow-hidden rounded-lg border border-zinc-700/50">
        <div
          v-for="effect in MW_EFFECTS"
          :key="effect.face"
          class="flex items-start gap-3 border-b border-zinc-700/40 px-3 py-2.5 last:border-b-0 transition-colors duration-150"
          :class="mwRoll === effect.face
            ? 'bg-amber-500/15 ring-1 ring-inset ring-amber-500/40'
            : 'bg-zinc-900/40'"
        >
          <div class="mt-0.5 flex-none">
            <DieFace type="attack" :face="effect.face" :size="28" />
          </div>
          <div>
            <div class="text-xs font-bold text-zinc-200">{{ effect.title }}</div>
            <div class="mt-0.5 text-[11px] leading-relaxed text-zinc-400">{{ effect.desc }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Section E: Operation Pool ───────────────────────────────────── -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
      <div class="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
        Operation Pool
      </div>

      <!-- Pool tokens -->
      <div class="mb-3">
        <div class="mb-1.5 text-[10px] font-medium text-zinc-600">Pool</div>
        <div v-if="poolTokens.length === 0" class="text-[11px] text-zinc-700">All tokens assigned</div>
        <div v-else class="flex flex-wrap gap-2">
          <div
            v-for="token in poolTokens"
            :key="token.id"
            class="flex flex-col items-center gap-0.5"
          >
            <div
              class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-zinc-500
                     bg-zinc-700 text-base font-bold text-zinc-200 shadow"
            >
              {{ token.symbol }}
            </div>
            <div class="flex gap-0.5">
              <button
                class="rounded px-1.5 py-0.5 text-[9px] font-bold text-red-400 border border-red-900/50
                       hover:bg-red-900/30 transition-colors"
                title="Assign to Aggressor"
                @click="assignTo(token, 'aggressor')"
              >A</button>
              <button
                class="rounded px-1.5 py-0.5 text-[9px] font-bold text-blue-400 border border-blue-900/50
                       hover:bg-blue-900/30 transition-colors"
                title="Assign to Sentinel"
                @click="assignTo(token, 'sentinel')"
              >S</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Assignment zones -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Aggressor -->
        <div class="rounded-lg border border-red-900/40 bg-red-950/20 p-2">
          <div class="mb-1.5 flex items-center justify-between">
            <span class="text-[10px] font-bold text-red-400">Aggressor</span>
            <button
              v-if="aggressorTokens.length > 0"
              class="text-[9px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
              @click="returnAll('aggressor')"
            >Return All</button>
          </div>
          <div v-if="aggressorTokens.length === 0" class="text-[10px] text-zinc-700">—</div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="token in aggressorTokens"
              :key="token.id"
              class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-red-700
                     bg-red-900/40 text-sm font-bold text-red-200 shadow hover:bg-red-800/50 transition-colors"
              title="Return to pool"
              @click="returnToken(token, 'aggressor')"
            >
              {{ token.symbol }}
            </button>
          </div>
        </div>

        <!-- Sentinel -->
        <div class="rounded-lg border border-blue-900/40 bg-blue-950/20 p-2">
          <div class="mb-1.5 flex items-center justify-between">
            <span class="text-[10px] font-bold text-blue-400">Sentinel</span>
            <button
              v-if="sentinelTokens.length > 0"
              class="text-[9px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
              @click="returnAll('sentinel')"
            >Return All</button>
          </div>
          <div v-if="sentinelTokens.length === 0" class="text-[10px] text-zinc-700">—</div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="token in sentinelTokens"
              :key="token.id"
              class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-700
                     bg-blue-900/40 text-sm font-bold text-blue-200 shadow hover:bg-blue-800/50 transition-colors"
              title="Return to pool"
              @click="returnToken(token, 'sentinel')"
            >
              {{ token.symbol }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Section F: Used Objectives This Turn ─────────────────────────── -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
      <div class="mb-3 flex items-center justify-between">
        <div class="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          Objectives Used This Turn
        </div>
        <button
          class="text-[10px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
          @click="resetTurn"
        >
          Reset Turn
        </button>
      </div>
      <div class="flex gap-2">
        <button
          v-for="n in [1, 2, 3, 4, 5]"
          :key="n"
          class="flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all"
          :class="usedObjectives.has(n)
            ? 'border-zinc-500 bg-zinc-600 text-zinc-400 line-through'
            : 'border-zinc-600 bg-zinc-800/60 text-zinc-300 hover:border-zinc-400 hover:text-zinc-100'"
          @click="toggleObjective(n)"
        >
          {{ n }}
        </button>
      </div>
      <div v-if="usedObjectives.size > 0" class="mt-2 text-[10px] text-zinc-600">
        Tap a used objective again to unmark it.
      </div>
    </div>

  </div>
</template>
