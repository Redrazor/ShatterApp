<script setup lang="ts">
import { ref, computed } from 'vue'

// 3 Security Tiers, each starts with 5 Momentum tokens
const momentum = ref([5, 5, 5])
const TIER_LABELS = ['Tier 1', 'Tier 2', 'Tier 3']
const MAX = 5

function remove(tier: number) {
  if (momentum.value[tier] > 0) momentum.value[tier]--
}
function add(tier: number) {
  if (momentum.value[tier] < MAX) momentum.value[tier]++
}
function reset(tier: number) {
  momentum.value[tier] = MAX
}

const allCleared = computed(() => momentum.value.every(m => m === 0))
const tiersCleared = computed(() => momentum.value.map(m => m === 0))
</script>

<template>
  <div class="space-y-3">

    <!-- Sabotage the Supplies — Security Tier Momentum -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
      <div class="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
        Security Tiers — Momentum
      </div>
      <p class="mb-3 text-[10px] leading-relaxed text-zinc-600">
        End of each GL Turn: for each objective cadre controls, remove 1 token from that tier.
        Tier cleared → remove its objectives from the battlefield.
      </p>

      <!-- Cadre wins banner -->
      <div
        v-if="allCleared"
        class="mb-3 rounded-lg border border-emerald-600/40 bg-emerald-950/50 px-3 py-2 text-center"
      >
        <div class="text-sm font-bold text-emerald-400">Cadre Wins!</div>
        <div class="text-[10px] text-emerald-600">All Momentum removed — plan thwarted.</div>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="(m, i) in momentum"
          :key="i"
          class="flex flex-col items-center gap-2 rounded-lg border p-2.5 transition-colors"
          :class="tiersCleared[i]
            ? 'border-emerald-700/40 bg-emerald-950/30'
            : 'border-zinc-700/40 bg-zinc-800/40'"
        >
          <div
            class="text-[9px] font-bold uppercase tracking-wider"
            :class="tiersCleared[i] ? 'text-emerald-400' : 'text-zinc-400'"
          >{{ TIER_LABELS[i] }}</div>

          <!-- Momentum token pips -->
          <div class="flex flex-wrap justify-center gap-1">
            <div
              v-for="pip in MAX"
              :key="pip"
              class="h-3 w-3 rounded-full border transition-colors"
              :class="pip <= m
                ? 'bg-amber-400 border-amber-300/50 shadow-[0_0_4px_rgba(251,191,36,0.4)]'
                : 'bg-zinc-700 border-zinc-600/40'"
            />
          </div>

          <!-- Count -->
          <div
            class="text-lg font-bold tabular-nums"
            :class="tiersCleared[i] ? 'text-emerald-400' : 'text-zinc-300'"
          >
            <span v-if="tiersCleared[i]">✓</span>
            <span v-else>{{ m }}</span>
          </div>

          <!-- Controls -->
          <div v-if="!tiersCleared[i]" class="flex gap-1">
            <button
              class="rounded bg-zinc-800 px-2 py-0.5 text-sm font-bold text-amber-400
                     border border-zinc-700/50 transition-colors hover:bg-zinc-700 active:scale-95
                     disabled:opacity-30 disabled:cursor-not-allowed"
              :disabled="m <= 0"
              @click="remove(i)"
            >−</button>
            <button
              class="rounded bg-zinc-800 px-2 py-0.5 text-sm font-bold text-zinc-400
                     border border-zinc-700/50 transition-colors hover:bg-zinc-700 active:scale-95
                     disabled:opacity-30 disabled:cursor-not-allowed"
              :disabled="m >= MAX"
              @click="add(i)"
            >+</button>
          </div>
          <button
            v-else
            class="text-[9px] font-medium text-zinc-600 hover:text-zinc-400 transition-colors"
            @click="reset(i)"
          >restore</button>
        </div>
      </div>
    </div>

    <!-- Tracking the Struggle reminder -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
      <div class="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
        Tracking the Struggle
      </div>
      <div class="space-y-1 text-[11px] text-zinc-500">
        <div class="flex items-start gap-2">
          <span class="mt-0.5 text-sky-400">→</span>
          <span><span class="text-zinc-300">Cadre unit Wounded</span> → Struggle Token advances right (toward GL win)</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="mt-0.5 text-amber-400">←</span>
          <span><span class="text-zinc-300">GL Unit Wounded</span> → Struggle Token advances left</span>
        </div>
      </div>
    </div>

    <!-- Victory conditions -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
      <div class="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
        Victory Conditions
      </div>
      <div class="space-y-1 text-[11px] text-zinc-500">
        <div class="flex items-start gap-2">
          <span class="text-red-400">⚡</span>
          <span><span class="text-zinc-300">GL wins</span> if Struggle Token reaches space 8 after GL Turn</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-emerald-400">✓</span>
          <span><span class="text-zinc-300">Cadre wins</span> if all Momentum removed from all 3 tiers after GL Turn</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-emerald-400">✓</span>
          <span><span class="text-zinc-300">Cadre wins</span> if GL Unit is Defeated</span>
        </div>
      </div>
    </div>

  </div>
</template>
