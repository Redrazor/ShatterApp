<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKeyopsStore } from '../../../stores/keyops.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'

const koStore = useKeyopsStore()

// ─── Stage I: Hurt Tracker ────────────────────────────────────────────────────
// Aggressor chooses one squad; all units in it are Hurt before setup.
// Units recover when no longer Hurt (via Medical Cache activation).
const UNIT_LABELS = ['Primary', 'Secondary', 'Support']
const hurt = ref<boolean[]>([true, true, true]) // all start Hurt

function toggleHurt(i: number) {
  hurt.value = hurt.value.map((v, idx) => idx === i ? !v : v)
}
function resetHurt() { hurt.value = [true, true, true] }

const anyHurt = computed(() => hurt.value.some(Boolean))

// ─── Stage II: Survival Gear ──────────────────────────────────────────────────
// 4 gear types, each tracked by a token that moves down 3 positions:
// 0 = Starting, 1 = middle, 2 = secured (bottom).
// Aggressor rolls to advance the token down each track.
const GEAR_LABELS = ['Supply', 'Medicine', 'Weapon', 'Equipment']
const gearTokens = ref<number[]>([0, 0, 0, 0]) // 0=Starting,1=mid,2=secured

function advanceGear(i: number) {
  if (gearTokens.value[i] < 2) {
    gearTokens.value = gearTokens.value.map((v, idx) => idx === i ? v + 1 : v)
  }
}
function retreatGear(i: number) {
  if (gearTokens.value[i] > 0) {
    gearTokens.value = gearTokens.value.map((v, idx) => idx === i ? v - 1 : v)
  }
}
function resetGear() { gearTokens.value = [0, 0, 0, 0] }

const allGearSecured = computed(() => gearTokens.value.every(v => v >= 2))

// ─── Stage II: Stolen Equipment ───────────────────────────────────────────────
// Sentinel places tokens here (max 4 before trigger).
// When ≥ 5 tokens accumulated → Sentinel may add 1 Momentum, then reset.
const stolenTokens = ref(0)
function addStolen() { stolenTokens.value++ }
function removeStolen() { if (stolenTokens.value > 0) stolenTokens.value-- }

const stolenTrigger = computed(() => stolenTokens.value >= 5)
function resolveStolen() { stolenTokens.value = 0 }
</script>

<template>
  <div class="space-y-4">

    <!-- ─── Stage I: Hurt Tracker ─────────────────────────────────────────── -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
      <div class="mb-2 flex items-center justify-between">
        <div>
          <div class="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
            Hurt Units
          </div>
          <div class="text-[9px] text-zinc-700">Stage I — Aggressor's chosen squad</div>
        </div>
        <button
          class="rounded border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[9px] font-semibold text-zinc-500
                 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
          @click="resetHurt"
        >Reset</button>
      </div>

      <div class="flex gap-2">
        <button
          v-for="(isHurt, i) in hurt"
          :key="i"
          class="flex-1 rounded border-2 py-2 text-[10px] font-bold transition-all"
          :class="isHurt
            ? 'border-red-600 bg-red-900/40 text-red-300'
            : 'border-green-700 bg-green-900/30 text-green-400'"
          @click="toggleHurt(i)"
        >
          <div>{{ UNIT_LABELS[i] }}</div>
          <div class="mt-0.5 text-[9px]">{{ isHurt ? '✦ Hurt' : '✓ OK' }}</div>
        </button>
      </div>
    </div>

    <!-- ─── Stage II: Survival Gear + Stolen Equipment (2-col) ───────────── -->
    <div class="grid grid-cols-2 gap-3">

      <!-- Survival Gear -->
      <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-3 py-3">
        <div class="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          Survival Gear
        </div>
        <div class="mb-2 text-[9px] text-zinc-700">Stage II</div>

        <div
          v-if="allGearSecured"
          class="mb-2 rounded px-2 py-1 text-xs font-bold bg-green-900/50 border border-green-600/60 text-green-300"
        >
          All Secured!
        </div>

        <div class="space-y-2">
          <div
            v-for="(pos, i) in gearTokens"
            :key="i"
          >
            <div class="mb-0.5 text-[9px] text-zinc-500">{{ GEAR_LABELS[i] }}</div>
            <div class="flex items-center gap-1">
              <!-- 3 position slots -->
              <div
                v-for="slot in 3"
                :key="slot"
                class="flex-1 h-4 rounded-sm border transition-colors"
                :class="slot - 1 === pos
                  ? 'bg-amber-500 border-amber-400'
                  : slot - 1 < pos
                    ? 'bg-green-700/60 border-green-600/40'
                    : 'bg-zinc-800 border-zinc-700'"
              />
              <button
                class="h-4 w-4 rounded border border-zinc-700 bg-zinc-800/60 text-[8px] text-zinc-400
                       hover:border-zinc-500 hover:text-zinc-200 transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="pos >= 2"
                @click="advanceGear(i)"
              >▼</button>
              <button
                class="h-4 w-4 rounded border border-zinc-700 bg-zinc-800/60 text-[8px] text-zinc-400
                       hover:border-zinc-500 hover:text-zinc-200 transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="pos <= 0"
                @click="retreatGear(i)"
              >▲</button>
            </div>
          </div>
        </div>

        <button
          class="mt-2 w-full rounded border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[9px] font-semibold text-zinc-500
                 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
          @click="resetGear"
        >Reset</button>
      </div>

      <!-- Stolen Equipment -->
      <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-3 py-3">
        <div class="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          Stolen Equip.
        </div>
        <div class="mb-2 text-[9px] text-zinc-700">Stage II — Sentinel</div>

        <div
          class="mb-2 rounded px-2 py-1 text-xs font-bold transition-colors"
          :class="stolenTrigger
            ? 'bg-red-900/50 border border-red-600/60 text-red-300'
            : 'bg-zinc-800 border border-zinc-600 text-zinc-300'"
        >
          <template v-if="stolenTrigger">+1 Mom! Reset</template>
          <template v-else>{{ stolenTokens }} token{{ stolenTokens !== 1 ? 's' : '' }}</template>
        </div>

        <!-- 5-pip display -->
        <div class="mb-2 flex flex-wrap gap-1">
          <div
            v-for="n in 5" :key="n"
            class="h-4 w-4 rounded-sm border transition-colors"
            :class="n <= stolenTokens
              ? 'bg-red-700 border-red-600'
              : 'bg-zinc-800 border-zinc-700'"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <button
            class="rounded border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-[10px] font-semibold text-zinc-400
                   hover:border-zinc-500 hover:text-zinc-200 transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="stolenTokens === 0"
            @click="removeStolen"
          >− Remove</button>
          <button
            class="rounded border border-red-800/60 bg-red-900/30 px-2 py-1 text-[10px] font-semibold text-red-300
                   hover:border-red-600 transition-colors"
            @click="addStolen"
          >+ Token</button>
          <button
            v-if="stolenTrigger"
            class="rounded border border-green-800/60 bg-green-900/30 px-2 py-1 text-[9px] font-semibold text-green-300
                   hover:border-green-600 transition-colors"
            @click="resolveStolen"
          >Reset Tokens</button>
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
        alt="Crash Landing Dashboard"
      />
    </div>

  </div>
</template>
