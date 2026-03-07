<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKeyopsStore } from '../../../stores/keyops.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'

const koStore = useKeyopsStore()

// ─── Section D: Docking Clamps (Stage I) ─────────────────────────────────────
// 5 Docking Clamps. Aggressor disables them one by one.
// Stage ends when ≤ 1 Active Docking Clamp remains.
const TOTAL_CLAMPS = 5

const clamps = ref<boolean[]>(Array(TOTAL_CLAMPS).fill(true))

function toggleClamp(i: number) {
  clamps.value = clamps.value.map((v, idx) => idx === i ? !v : v)
}

const activeClamps = computed(() => clamps.value.filter(Boolean).length)
const stageIComplete = computed(() => activeClamps.value <= 1)

function resetClamps() {
  clamps.value = Array(TOTAL_CLAMPS).fill(true)
}

// ─── Section E: Lockdown Tracker (Stages I & II) ─────────────────────────────
// Sentinel fills Lockdown Tracker spaces with Damage tokens.
// When all filled → Defender adds 1 Momentum each side + resets tracker.
const LOCKDOWN_MAX = 8

const lockdownTokens = ref(0)

function addLockdown() {
  if (lockdownTokens.value < LOCKDOWN_MAX) lockdownTokens.value++
}
function removeLockdown() {
  if (lockdownTokens.value > 0) lockdownTokens.value--
}
function resetLockdown() { lockdownTokens.value = 0 }

const lockdownFull = computed(() => lockdownTokens.value >= LOCKDOWN_MAX)

// ─── Section F: Escape Ship Damage (Stage II) ────────────────────────────────
// Escape Ship is an Armored Target. When all spaces filled →
// remove all ✦ from ship card + Sentinel adds 2 Momentum.
const ESCAPE_SHIP_MAX = 5

const escapeShipDamage = ref(0)

function addEscapeDamage() {
  if (escapeShipDamage.value < ESCAPE_SHIP_MAX) escapeShipDamage.value++
}
function removeEscapeDamage() {
  if (escapeShipDamage.value > 0) escapeShipDamage.value--
}

const escapeShipFull = computed(() => escapeShipDamage.value >= ESCAPE_SHIP_MAX)
</script>

<template>
  <div class="space-y-4">

    <!-- ─── Sections D + E: Docking Clamps + Lockdown Tracker (2-col) ──── -->
    <div class="grid grid-cols-2 gap-3">

      <!-- ─── Section D: Docking Clamps ────────────────────────────────── -->
      <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-3 py-3">
        <div class="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          Docking Clamps
        </div>
        <div class="mb-1 text-[9px] text-zinc-700">Stage I</div>

        <div
          class="mb-2 rounded px-2 py-1 text-xs font-bold transition-colors"
          :class="stageIComplete
            ? 'bg-green-900/50 border border-green-600/60 text-green-300'
            : 'bg-zinc-800 border border-zinc-600 text-zinc-300'"
        >
          <template v-if="stageIComplete">Stage I Complete!</template>
          <template v-else>{{ activeClamps }} active</template>
        </div>

        <!-- 5 clamp toggles — tap to disable -->
        <div class="mb-2 flex gap-1 flex-wrap">
          <button
            v-for="(active, i) in clamps"
            :key="i"
            class="flex h-8 w-8 items-center justify-center rounded border-2 text-[10px] font-bold transition-all"
            :class="active
              ? 'border-amber-500 bg-amber-900/40 text-amber-200'
              : 'border-zinc-700 bg-zinc-800/60 text-zinc-600 line-through'"
            :title="active ? 'Active — tap to disable' : 'Inactive'"
            @click="toggleClamp(i)"
          >{{ i + 1 }}</button>
        </div>

        <button
          class="w-full rounded border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-[10px] font-semibold text-zinc-500
                 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
          @click="resetClamps"
        >Reset</button>
      </div>

      <!-- ─── Section E: Lockdown Tracker ──────────────────────────────── -->
      <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-3 py-3">
        <div class="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          Lockdown
        </div>
        <div class="mb-1 text-[9px] text-zinc-700">Stages I + II</div>

        <div
          class="mb-2 rounded px-2 py-1 text-xs font-bold transition-colors"
          :class="lockdownFull
            ? 'bg-red-900/50 border border-red-600/60 text-red-300'
            : 'bg-zinc-800 border border-zinc-600 text-zinc-300'"
        >
          <template v-if="lockdownFull">Full! +1 Mom each side</template>
          <template v-else>{{ lockdownTokens }} / {{ LOCKDOWN_MAX }}</template>
        </div>

        <div class="mb-2 flex flex-wrap gap-1">
          <div
            v-for="n in LOCKDOWN_MAX"
            :key="n"
            class="h-4 w-4 rounded-sm border transition-colors"
            :class="n <= lockdownTokens
              ? 'bg-red-700 border-red-600'
              : 'bg-zinc-800 border-zinc-700'"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <button
            class="rounded border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-[10px] font-semibold text-zinc-400
                   hover:border-zinc-500 hover:text-zinc-200 transition-colors
                   disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="lockdownTokens === 0"
            @click="removeLockdown"
          >− Remove</button>
          <button
            class="rounded border border-red-800/60 bg-red-900/30 px-2 py-1 text-[10px] font-semibold text-red-300
                   hover:border-red-600 hover:bg-red-800/40 transition-colors
                   disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="lockdownFull"
            @click="addLockdown"
          >+ Damage</button>
          <button
            v-if="lockdownFull"
            class="rounded border border-green-800/60 bg-green-900/30 px-2 py-1 text-[9px] font-semibold text-green-300
                   hover:border-green-600 transition-colors"
            @click="resetLockdown"
          >Reset Tracker</button>
        </div>
      </div>
    </div>

    <!-- ─── Section F: Escape Ship Damage ───────────────────────────────── -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
      <div class="mb-2 flex items-center justify-between">
        <div>
          <div class="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
            Escape Ship
          </div>
          <div class="text-[9px] text-zinc-700">Stage II — Armored Target</div>
        </div>
        <div
          class="rounded px-2 py-1 text-xs font-bold transition-colors"
          :class="escapeShipFull
            ? 'bg-green-900/50 border border-green-600/60 text-green-300'
            : 'bg-zinc-800 border border-zinc-600 text-zinc-300'"
        >
          <template v-if="escapeShipFull">Disabled! Sentinel +2 Mom</template>
          <template v-else>{{ escapeShipDamage }} / {{ ESCAPE_SHIP_MAX }}</template>
        </div>
      </div>

      <div class="mb-3 flex gap-1.5">
        <div
          v-for="n in ESCAPE_SHIP_MAX"
          :key="n"
          class="h-5 flex-1 rounded border transition-colors"
          :class="n <= escapeShipDamage
            ? 'bg-orange-700 border-orange-600'
            : 'bg-zinc-800 border-zinc-700'"
        />
      </div>

      <div class="flex gap-2">
        <button
          class="rounded border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-[10px] font-semibold text-zinc-400
                 hover:border-zinc-500 hover:text-zinc-200 transition-colors
                 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="escapeShipDamage === 0"
          @click="removeEscapeDamage"
        >− Remove</button>
        <button
          class="rounded border border-orange-800/60 bg-orange-900/30 px-3 py-1.5 text-[10px] font-semibold text-orange-300
                 hover:border-orange-600 hover:bg-orange-800/40 transition-colors
                 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="escapeShipFull"
          @click="addEscapeDamage"
        >+ Damage</button>
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
        alt="Extract the Agent Dashboard"
      />
    </div>

  </div>
</template>
