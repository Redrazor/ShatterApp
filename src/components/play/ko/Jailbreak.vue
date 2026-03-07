<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKeyopsStore } from '../../../stores/keyops.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'

const koStore = useKeyopsStore()

// ─── Suspicion Tracker (Stage I) ──────────────────────────────────────────────
// 8 spaces filled with Damage tokens as Sentinel gains Suspicion.
// When all filled → Sentinel Sounds the Alarm → Stage ends.
const SUSPICION_MAX = 8
const suspicion = ref(0)
function addSuspicion() { if (suspicion.value < SUSPICION_MAX) suspicion.value++ }
function removeSuspicion() { if (suspicion.value > 0) suspicion.value-- }
function resetSuspicion() { suspicion.value = 0 }
const alarmSounded = computed(() => suspicion.value >= SUSPICION_MAX)

// ─── Security Level (Stage I) ─────────────────────────────────────────────────
// 4 spaces on the Suspicion Tracker board. Aggressor can remove tokens by
// rolling dice while contesting the Access Core.
const SECURITY_MAX = 4
const securityLevel = ref(SECURITY_MAX) // starts full (all 4 filled)
function removeSecurityToken() { if (securityLevel.value > 0) securityLevel.value-- }
function addSecurityToken() { if (securityLevel.value < SECURITY_MAX) securityLevel.value++ }
function resetSecurity() { securityLevel.value = SECURITY_MAX }
const securityCleared = computed(() => securityLevel.value === 0)

// ─── Access Code Tracker (Stage II) ───────────────────────────────────────────
// Two sequences, each with 7 spaces. Aggressor fills spaces by rolling dice.
// Each sequence must be filled in order. When both locked → Aggressor wins.
const SEQ_SPACES = 7
const seq1 = ref<boolean[]>(Array(SEQ_SPACES).fill(false))
const seq2 = ref<boolean[]>(Array(SEQ_SPACES).fill(false))

function toggleSeq1(i: number) { seq1.value = seq1.value.map((v, idx) => idx === i ? !v : v) }
function toggleSeq2(i: number) { seq2.value = seq2.value.map((v, idx) => idx === i ? !v : v) }
function resetSeq1() { seq1.value = Array(SEQ_SPACES).fill(false) }
function resetSeq2() { seq2.value = Array(SEQ_SPACES).fill(false) }

const seq1Locked = computed(() => seq1.value.every(Boolean))
const seq2Locked = computed(() => seq2.value.every(Boolean))
const accessGranted = computed(() => seq1Locked.value && seq2Locked.value)
</script>

<template>
  <div class="space-y-4">

    <!-- ─── Stage I: Suspicion + Security Level (2-col) ──────────────────── -->
    <div class="grid grid-cols-2 gap-3">

      <!-- Suspicion Tracker -->
      <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-3 py-3">
        <div class="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          Suspicion
        </div>
        <div class="mb-1 text-[9px] text-zinc-700">Stage I</div>

        <div
          class="mb-2 rounded px-2 py-1 text-xs font-bold transition-colors"
          :class="alarmSounded
            ? 'bg-red-900/50 border border-red-600/60 text-red-300'
            : 'bg-zinc-800 border border-zinc-600 text-zinc-300'"
        >
          <template v-if="alarmSounded">Alarm Sounded!</template>
          <template v-else>{{ suspicion }} / {{ SUSPICION_MAX }}</template>
        </div>

        <div class="mb-2 flex flex-wrap gap-1">
          <div
            v-for="n in SUSPICION_MAX" :key="n"
            class="h-4 w-4 rounded-sm border transition-colors"
            :class="n <= suspicion
              ? 'bg-red-700 border-red-600'
              : 'bg-zinc-800 border-zinc-700'"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <button
            class="rounded border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-[10px] font-semibold text-zinc-400
                   hover:border-zinc-500 hover:text-zinc-200 transition-colors
                   disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="suspicion === 0"
            @click="removeSuspicion"
          >− Remove</button>
          <button
            class="rounded border border-red-800/60 bg-red-900/30 px-2 py-1 text-[10px] font-semibold text-red-300
                   hover:border-red-600 hover:bg-red-800/40 transition-colors
                   disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="alarmSounded"
            @click="addSuspicion"
          >+ Suspicion</button>
          <button
            v-if="alarmSounded"
            class="rounded border border-green-800/60 bg-green-900/30 px-2 py-1 text-[9px] font-semibold text-green-300
                   hover:border-green-600 transition-colors"
            @click="resetSuspicion"
          >Reset Tracker</button>
        </div>
      </div>

      <!-- Security Level -->
      <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-3 py-3">
        <div class="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          Security Level
        </div>
        <div class="mb-1 text-[9px] text-zinc-700">Stage I</div>

        <div
          class="mb-2 rounded px-2 py-1 text-xs font-bold transition-colors"
          :class="securityCleared
            ? 'bg-green-900/50 border border-green-600/60 text-green-300'
            : 'bg-zinc-800 border border-zinc-600 text-zinc-300'"
        >
          <template v-if="securityCleared">Cleared!</template>
          <template v-else>{{ securityLevel }} / {{ SECURITY_MAX }}</template>
        </div>

        <div class="mb-2 flex gap-1">
          <div
            v-for="n in SECURITY_MAX" :key="n"
            class="h-4 flex-1 rounded border transition-colors"
            :class="n <= securityLevel
              ? 'bg-orange-700 border-orange-600'
              : 'bg-zinc-800 border-zinc-700'"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <button
            class="rounded border border-orange-800/60 bg-orange-900/30 px-2 py-1 text-[10px] font-semibold text-orange-300
                   hover:border-orange-600 transition-colors
                   disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="securityCleared"
            @click="removeSecurityToken"
          >− Remove</button>
          <button
            class="rounded border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-[10px] font-semibold text-zinc-400
                   hover:border-zinc-500 hover:text-zinc-200 transition-colors
                   disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="securityLevel >= SECURITY_MAX"
            @click="addSecurityToken"
          >+ Add</button>
          <button
            class="rounded border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[9px] font-semibold text-zinc-500
                   hover:border-zinc-500 hover:text-zinc-300 transition-colors"
            @click="resetSecurity"
          >Reset</button>
        </div>
      </div>
    </div>

    <!-- ─── Stage II: Access Code Tracker ────────────────────────────────── -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
      <div class="mb-2 flex items-center justify-between">
        <div>
          <div class="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
            Access Code Tracker
          </div>
          <div class="text-[9px] text-zinc-700">Stage II</div>
        </div>
        <div
          v-if="accessGranted"
          class="rounded px-2 py-1 text-xs font-bold bg-green-900/50 border border-green-600/60 text-green-300"
        >
          Access Granted! Aggressor wins
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <!-- Sequence One -->
        <div>
          <div class="mb-1.5 flex items-center justify-between">
            <div class="text-[10px] font-semibold text-zinc-500">Sequence One</div>
            <span
              v-if="seq1Locked"
              class="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-600/40"
            >LOCKED</span>
          </div>
          <div class="flex flex-wrap gap-1 mb-2">
            <button
              v-for="(filled, i) in seq1" :key="i"
              class="flex h-7 w-7 items-center justify-center rounded border-2 text-[10px] font-bold transition-all"
              :class="filled
                ? 'border-amber-500 bg-amber-900/40 text-amber-200'
                : 'border-zinc-700 bg-zinc-800/60 text-zinc-600'"
              @click="toggleSeq1(i)"
            >{{ i + 1 }}</button>
          </div>
          <button
            class="w-full rounded border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[9px] font-semibold text-zinc-500
                   hover:border-zinc-500 hover:text-zinc-300 transition-colors"
            @click="resetSeq1"
          >Reset</button>
        </div>

        <!-- Sequence Two -->
        <div>
          <div class="mb-1.5 flex items-center justify-between">
            <div class="text-[10px] font-semibold text-zinc-500">Sequence Two</div>
            <span
              v-if="seq2Locked"
              class="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-600/40"
            >LOCKED</span>
          </div>
          <div class="flex flex-wrap gap-1 mb-2">
            <button
              v-for="(filled, i) in seq2" :key="i"
              class="flex h-7 w-7 items-center justify-center rounded border-2 text-[10px] font-bold transition-all"
              :class="filled
                ? 'border-amber-500 bg-amber-900/40 text-amber-200'
                : 'border-zinc-700 bg-zinc-800/60 text-zinc-600'"
              @click="toggleSeq2(i)"
            >{{ i + 1 }}</button>
          </div>
          <button
            class="w-full rounded border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[9px] font-semibold text-zinc-500
                   hover:border-zinc-500 hover:text-zinc-300 transition-colors"
            @click="resetSeq2"
          >Reset</button>
        </div>
      </div>
    </div>

    <!-- ─── Tracker image ─────────────────────────────────────────────────── -->
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
        alt="Jailbreak Dashboard"
      />
    </div>

  </div>
</template>
