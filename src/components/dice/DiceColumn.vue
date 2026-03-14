<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import DieFace from './DieFace.vue'
import { rollAttack, rollDefense, ATTACK_FACES, DEFENSE_FACES } from '../../utils/dice.ts'
import type { DieState, AttackFace, DefenseFace } from '../../utils/dice.ts'

// DieState import needed for props type (re-export)
export type { DieState }

const props = defineProps<{
  type: 'attack' | 'defense'
  readonly?: boolean
  externalPool?: DieState[]
}>()
const emit = defineEmits<{
  (e: 'update:summary', val: Record<string, number>): void
  (e: 'update:pool', val: DieState[]): void
  (e: 'rolled'): void
}>()

let nextId = 0
const pool         = ref<DieState[]>([])
const rolling      = ref(false)
const lastCount    = ref<number | null>(null)
const selectedId   = ref<number | null>(null)
const addOpen      = ref(false)
const rerollMode   = ref(false)
const rerollSel    = ref(new Set<number>())
const rerollingIds = ref(new Set<number>())

const rollFn     = props.type === 'attack' ? rollAttack : rollDefense
const faces      = (props.type === 'attack' ? ATTACK_FACES : DEFENSE_FACES) as (AttackFace | DefenseFace)[]
const label      = props.type === 'attack' ? 'Attack' : 'Defense'
const accentClass = props.type === 'attack' ? 'text-sw-gold' : 'text-blue-400'
const btnActive  = props.type === 'attack' ? 'bg-sw-gold text-sw-dark' : 'bg-blue-500 text-white'
const btnBase    = 'rounded-lg py-1.5 text-sm font-bold transition-colors'

// ── Roll N dice ───────────────────────────────────────────────
function roll(n: number) {
  if (rolling.value) return
  rolling.value = true
  lastCount.value = n
  selectedId.value = null
  addOpen.value = false
  rerollMode.value = false
  rerollSel.value = new Set()

  pool.value = Array.from({ length: n }, () => ({
    id: nextId++, type: props.type, face: rollFn(), locked: false, isBonus: false,
  }))

  setTimeout(() => { rolling.value = false }, 550)
  emit('rolled')
}

// ── Die interaction ───────────────────────────────────────────
function selectDie(die: DieState) {
  if (rolling.value) return
  if (rerollMode.value) {
    const s = new Set(rerollSel.value)
    s.has(die.id) ? s.delete(die.id) : s.add(die.id)
    rerollSel.value = s
    return
  }
  addOpen.value = false
  selectedId.value = selectedId.value === die.id ? null : die.id
}

function changeFace(die: DieState, face: AttackFace | DefenseFace) {
  die.face = face
  selectedId.value = null
}

function rerollDie(die: DieState) {
  selectedId.value = null
  rerollingIds.value = new Set([die.id])
  die.face = rollFn()
  setTimeout(() => { rerollingIds.value = new Set() }, 550)
}

function removeDie(id: number) {
  pool.value = pool.value.filter(d => d.id !== id)
  selectedId.value = null
}

// ── Add die ───────────────────────────────────────────────────
function addDie(face: AttackFace | DefenseFace) {
  pool.value.push({ id: nextId++, type: props.type, face, locked: false, isBonus: true })
  addOpen.value = false
}

// ── Reroll mode ───────────────────────────────────────────────
function toggleRerollMode() {
  rerollMode.value = !rerollMode.value
  rerollSel.value = new Set()
  selectedId.value = null
  addOpen.value = false
}

function confirmReroll() {
  rerollingIds.value = new Set(rerollSel.value)
  for (const die of pool.value) {
    if (rerollSel.value.has(die.id)) die.face = rollFn()
  }
  rerollSel.value = new Set()
  rerollMode.value = false
  setTimeout(() => { rerollingIds.value = new Set() }, 550)
}

// ── Clear ─────────────────────────────────────────────────────
function clear() {
  pool.value = []; selectedId.value = null; addOpen.value = false
  rerollMode.value = false; rerollSel.value = new Set()
  rerollingIds.value = new Set(); rolling.value = false; lastCount.value = null
}

// ── Computed ──────────────────────────────────────────────────
const selectedDie = computed(() => pool.value.find(d => d.id === selectedId.value) ?? null)
const hasPool     = computed(() => pool.value.length > 0)

const displayPool = computed(() => props.externalPool ?? pool.value)

watch(pool, () => {
  if (props.readonly) return
  const out: Record<string, number> = {}
  for (const f of faces) out[f] = pool.value.filter(d => d.face === f).length
  emit('update:summary', out)
  emit('update:pool', [...pool.value])
}, { deep: true, immediate: true, flush: 'sync' })

// When external pool changes, emit summary too
watch(() => props.externalPool, (ext) => {
  if (!ext) return
  const out: Record<string, number> = {}
  for (const f of faces) out[f] = ext.filter(d => d.face === f).length
  emit('update:summary', out)
}, { deep: true })

const summary = computed(() => {
  const out: { face: AttackFace | DefenseFace; count: number }[] = []
  for (const f of faces) {
    const count = displayPool.value.filter(d => d.face === f).length
    if (count > 0) out.push({ face: f, count })
  }
  return out
})

const faceColorClass = (face: string) => {
  if (face === 'expertise') return 'text-amber-400'
  if (face === 'failure')   return 'text-red-400'
  if (face === 'crit')      return 'text-sw-gold'
  return 'text-sw-text'
}
const faceChipClass = (face: string) => {
  if (face === 'expertise') return 'border-amber-500/30'
  if (face === 'failure')   return 'border-red-500/30'
  return 'border-white/8'
}
</script>

<template>
  <div class="flex flex-col gap-4">

    <!-- Header -->
    <h2 :class="['text-lg font-bold', accentClass]">{{ label }}</h2>

    <!-- Number buttons 1–12 (hidden in readonly) -->
    <div v-if="!readonly" class="grid grid-cols-6 gap-1">
      <button
        v-for="n in 12" :key="n"
        :class="[btnBase,
          lastCount === n && !rolling
            ? btnActive
            : 'bg-white/8 text-sw-text/70 hover:bg-white/16 hover:text-sw-text',
          'text-center']"
        :disabled="rolling"
        @click="roll(n)"
      >{{ n }}</button>
    </div>

    <!-- Dice pool -->
    <div v-if="displayPool.length > 0" class="flex flex-wrap gap-2">
      <div
        v-for="die in displayPool" :key="die.id"
        :class="[
          'relative rounded-lg transition-all',
          !readonly ? 'cursor-pointer select-none' : '',
          !readonly && selectedId === die.id
            ? 'ring-2 ring-sw-gold ring-offset-2 ring-offset-sw-bg'
            : !readonly && rerollMode && rerollSel.has(die.id)
              ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-sw-bg'
              : 'opacity-90 hover:opacity-100',
        ]"
        @click="!readonly && selectDie(die)"
      >
        <div :class="rolling || rerollingIds.has(die.id) ? 'die-rolling' : ''">
          <DieFace :type="type" :face="die.face" :size="60" />
        </div>
        <div v-if="die.isBonus"
          class="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-sw-gold text-[9px] font-bold text-sw-dark">+</div>
      </div>
    </div>

    <!-- Per-die action panel (hidden in readonly) -->
    <div v-if="!readonly && selectedDie && !rerollMode" class="rounded-xl border border-sw-gold/30 bg-sw-card p-3 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-sw-text/50">Change face</p>
        <div class="flex gap-1.5">
          <button class="rounded border border-sw-gold/30 px-2 py-0.5 text-[10px] text-sw-text/60 hover:border-sw-gold hover:text-sw-text"
            @click="rerollDie(selectedDie)">↺ Reroll</button>
          <button class="rounded border border-red-500/40 px-2 py-0.5 text-[10px] text-red-400 hover:bg-red-500/10"
            @click="removeDie(selectedDie.id)">Remove</button>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <div v-for="face in faces" :key="face"
          :class="['flex cursor-pointer flex-col items-center gap-1 rounded p-1.5 transition-all',
            selectedDie.face === face ? 'bg-sw-gold/10 ring-1 ring-sw-gold/40' : 'opacity-60 hover:opacity-100']"
          @click="changeFace(selectedDie, face)">
          <DieFace :type="type" :face="face" :size="40" />
          <span class="text-[8px] capitalize text-sw-text/50">{{ face }}</span>
        </div>
      </div>
    </div>

    <!-- Reroll mode bar (hidden in readonly) -->
    <div v-if="!readonly && rerollMode" class="flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/5 px-3 py-2">
      <p class="flex-1 text-xs text-sw-text/60">
        {{ rerollSel.size === 0 ? 'Tap dice to select.' : `${rerollSel.size} selected.` }}
      </p>
      <button :disabled="rerollSel.size === 0"
        class="rounded-lg bg-sw-gold px-3 py-1 text-xs font-bold text-sw-dark disabled:opacity-40"
        @click="confirmReroll">Reroll</button>
      <button class="text-xs text-sw-text/30 hover:text-sw-text" @click="toggleRerollMode">Cancel</button>
    </div>

    <!-- Action buttons (hidden in readonly) -->
    <div v-if="!readonly && hasPool" class="flex flex-wrap gap-1.5">
      <button
        :class="['rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
          rerollMode ? 'border-blue-400/60 bg-blue-500/10 text-blue-400' : 'border-sw-gold/30 text-sw-text/60 hover:border-sw-gold hover:text-sw-text']"
        @click="toggleRerollMode">↺ Reroll dice</button>
      <button
        :class="['rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
          addOpen ? 'border-sw-gold bg-sw-gold/10 text-sw-gold' : 'border-sw-gold/30 text-sw-text/60 hover:border-sw-gold hover:text-sw-text']"
        @click="addOpen = !addOpen; rerollMode = false; selectedId = null">+ Add die</button>
      <button class="ml-auto rounded-lg px-2.5 py-1 text-xs text-sw-text/30 hover:text-sw-text" @click="clear">Clear</button>
    </div>

    <!-- Add die face picker (hidden in readonly) -->
    <div v-if="!readonly && addOpen" class="rounded-xl border border-sw-gold/20 bg-sw-card p-3">
      <p class="mb-2 text-[10px] text-sw-text/50">Pick face to add:</p>
      <div class="flex flex-wrap gap-2">
        <div v-for="face in faces" :key="face"
          class="flex cursor-pointer flex-col items-center gap-1 opacity-70 transition-opacity hover:opacity-100"
          @click="addDie(face)">
          <DieFace :type="type" :face="face" :size="40" />
          <span class="text-[8px] capitalize text-sw-text/50">{{ face }}</span>
        </div>
      </div>
    </div>

    <!-- Results summary -->
    <div v-if="displayPool.length > 0" class="rounded-xl border border-white/8 bg-black/20 p-3">
      <p class="mb-2 text-[10px] uppercase tracking-widest text-sw-text/40">Results</p>
      <div class="flex flex-wrap gap-1.5">
        <div v-for="item in summary" :key="item.face"
          :class="['result-chip', faceChipClass(item.face)]">
          <DieFace :type="type" :face="item.face" :size="22" />
          <span :class="['font-bold text-sm', faceColorClass(item.face)]">{{ item.count }}</span>
          <span class="text-[10px] capitalize text-sw-text/50">{{ item.face }}</span>
        </div>
        <p v-if="summary.length === 0" class="text-xs text-sw-text/30">—</p>
      </div>
    </div>

  </div>
</template>

<style scoped>
.result-chip {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 8px; border-radius: 8px;
  border: 1px solid rgb(255 255 255 / 0.08);
  background: rgb(0 0 0 / 0.2);
}
@keyframes die-roll {
  0%   { transform: scale(1)    rotate(0deg); }
  25%  { transform: scale(0.85) rotate(-25deg); }
  55%  { transform: scale(1.1)  rotate(18deg); }
  80%  { transform: scale(0.95) rotate(-8deg); }
  100% { transform: scale(1)    rotate(0deg); }
}
.die-rolling { animation: die-roll 0.55s ease-out; }
</style>
