<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKeyopsStore } from '../../../stores/keyops.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'

const koStore = useKeyopsStore()

// ─── Section D: Core Shield Damage Tracker (Stage I) ─────────────────────────
// The Core Shield is an Armored Target. Track damage tokens placed on it.
// Destroyed when all spaces are filled → triggers end of Stage I.
const CORE_SHIELD_MAX = 6

const coreShieldDamage = ref(0)

function addCoreShieldDamage() {
  if (coreShieldDamage.value < CORE_SHIELD_MAX) coreShieldDamage.value++
}
function removeCoreShieldDamage() {
  if (coreShieldDamage.value > 0) coreShieldDamage.value--
}

const coreShieldDestroyed = computed(() => coreShieldDamage.value >= CORE_SHIELD_MAX)

// ─── Section E: Chain Reaction Tracker (Stage II) ────────────────────────────
// 5 nodes along the Chain Reaction path. Aggressor places Damage tokens by
// matching Slicing Spikes rolls to empty spaces. All 5 filled = Aggressor wins.
const CHAIN_NODES = 5

const chainNodes = ref<boolean[]>(Array(CHAIN_NODES).fill(false))

function toggleChainNode(i: number) {
  chainNodes.value = chainNodes.value.map((v, idx) => idx === i ? !v : v)
}

function resetChain() {
  chainNodes.value = Array(CHAIN_NODES).fill(false)
}

const chainComplete = computed(() => chainNodes.value.every(Boolean))
const chainFilled = computed(() => chainNodes.value.filter(Boolean).length)
</script>

<template>
  <div class="space-y-4">

    <!-- ─── Sections D + E: Core Shield + Chain Reaction (2-column) ───────── -->
    <div class="grid grid-cols-2 gap-3">

      <!-- ─── Section D: Core Shield Damage Tracker ─────────────────────── -->
      <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-3 py-3">
        <div class="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          Core Shield
        </div>
        <div class="mb-1 text-[9px] text-zinc-700">Stage I</div>

        <!-- Status badge -->
        <div
          class="mb-2 rounded px-2 py-1 text-xs font-bold transition-colors"
          :class="coreShieldDestroyed
            ? 'bg-green-900/50 border border-green-600/60 text-green-300'
            : 'bg-zinc-800 border border-zinc-600 text-zinc-300'"
        >
          <template v-if="coreShieldDestroyed">
            Destroyed! → Stage II
          </template>
          <template v-else>
            {{ coreShieldDamage }} / {{ CORE_SHIELD_MAX }} damage
          </template>
        </div>

        <!-- Damage pip row -->
        <div class="mb-2 flex flex-wrap gap-1">
          <div
            v-for="n in CORE_SHIELD_MAX"
            :key="n"
            class="h-4 w-4 rounded-sm border transition-colors"
            :class="n <= coreShieldDamage
              ? 'bg-orange-700 border-orange-600'
              : 'bg-zinc-800 border-zinc-700'"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <button
            class="rounded border border-zinc-700 bg-zinc-800/60 px-2 py-1.5 text-[10px] font-semibold text-zinc-400
                   hover:border-zinc-500 hover:text-zinc-200 transition-colors
                   disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="coreShieldDamage === 0"
            @click="removeCoreShieldDamage"
          >− Remove</button>
          <button
            class="rounded border border-orange-800/60 bg-orange-900/30 px-2 py-1.5 text-[10px] font-semibold text-orange-300
                   hover:border-orange-600 hover:bg-orange-800/40 transition-colors
                   disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="coreShieldDestroyed"
            @click="addCoreShieldDamage"
          >+ Damage</button>
        </div>
      </div>

      <!-- ─── Section E: Chain Reaction Tracker ─────────────────────────── -->
      <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-3 py-3">
        <div class="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          Chain Reaction
        </div>
        <div class="mb-1 text-[9px] text-zinc-700">Stage II</div>

        <!-- Status badge -->
        <div
          class="mb-2 rounded px-2 py-1 text-xs font-bold transition-colors"
          :class="chainComplete
            ? 'bg-green-900/50 border border-green-600/60 text-green-300'
            : 'bg-zinc-800 border border-zinc-600 text-zinc-300'"
        >
          <template v-if="chainComplete">
            Triggered! Aggressor wins!
          </template>
          <template v-else>
            {{ chainFilled }} / {{ CHAIN_NODES }} nodes
          </template>
        </div>

        <!-- 5 chain nodes — tap to toggle -->
        <div class="mb-2 flex items-center gap-1 flex-wrap">
          <button
            v-for="(filled, i) in chainNodes"
            :key="i"
            class="flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-all"
            :class="filled
              ? 'border-red-600 bg-red-800/60 text-red-200 ring-1 ring-red-500/40'
              : 'border-zinc-600 bg-zinc-800/60 text-zinc-500 hover:border-zinc-400'"
            :title="filled ? 'Damage placed' : 'Empty space'"
            @click="toggleChainNode(i)"
          >
            {{ filled ? '✕' : i + 1 }}
          </button>
        </div>

        <button
          class="w-full rounded border border-zinc-700 bg-zinc-800/60 px-2 py-1.5 text-[10px] font-semibold text-zinc-500
                 hover:border-zinc-500 hover:text-zinc-300 transition-colors
                 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="chainFilled === 0"
          @click="resetChain"
        >Reset</button>
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
        alt="Trigger a Chain Reaction Dashboard"
      />
    </div>

  </div>
</template>
