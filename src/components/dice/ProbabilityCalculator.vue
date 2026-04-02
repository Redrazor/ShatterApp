<script setup lang="ts">
import { ref, watch } from 'vue'
import { simulate, type SimResult } from '../../utils/diceProb.ts'

const atkDice = ref(6)
const defDice = ref(4)
const result = ref<SimResult | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function runSim() {
  result.value = simulate(atkDice.value, defDice.value)
}

watch([atkDice, defDice], () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(runSim, 300)
}, { immediate: true })

function pct(v: number): string {
  return (v * 100).toFixed(1) + '%'
}

function rowClass(prob: number): string {
  if (prob >= 0.5) return 'text-green-400'
  if (prob >= 0.25) return 'text-sw-gold'
  return 'text-red-400'
}

</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-sw-gold">Probability</h1>

    <!-- Dice steppers -->
    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="side in ([
          { label: 'Attack Dice', model: atkDice, set: (v: number) => (atkDice = v), max: 14 },
          { label: 'Defense Dice', model: defDice, set: (v: number) => (defDice = v), max: 12 },
        ] as const)"
        :key="side.label"
        class="rounded-xl border border-white/8 bg-black/20 p-4 text-center"
      >
        <p class="mb-3 text-[10px] uppercase tracking-widest text-sw-text/40">{{ side.label }}</p>
        <div class="flex items-center justify-center gap-4">
          <button
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-sw-dark border border-sw-gold/20 text-lg font-bold text-sw-text hover:border-sw-gold/50 transition-colors disabled:opacity-30"
            :disabled="side.model <= 0"
            @click="side.set(side.model - 1)"
          >−</button>
          <span class="w-8 text-3xl font-bold text-sw-text">{{ side.model }}</span>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-sw-dark border border-sw-gold/20 text-lg font-bold text-sw-text hover:border-sw-gold/50 transition-colors disabled:opacity-30"
            :disabled="side.model >= side.max"
            @click="side.set(side.model + 1)"
          >+</button>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="result" class="rounded-xl border border-white/8 bg-black/20 overflow-hidden">
      <!-- Mean hits summary -->
      <div class="flex items-baseline gap-2 border-b border-white/8 px-4 py-3">
        <span class="text-[10px] uppercase tracking-widest text-sw-text/40">Avg Hits</span>
        <span class="text-2xl font-bold text-sw-gold">{{ result.mean.toFixed(2) }}</span>
      </div>

      <!-- Distribution table -->
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-white/8">
            <th class="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-sw-text/40">Hits</th>
            <th class="px-4 py-2 text-right text-[10px] uppercase tracking-widest text-sw-text/40" title="Probability of rolling at least this many hits">P(≥ n) at least</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr v-for="(count, i) in result.distribution" v-show="i > 0" :key="i">
            <td class="px-4 py-2 font-mono font-bold text-sw-text">{{ i }}</td>
            <td :class="['px-4 py-2 text-right font-mono text-xs', rowClass(result!.cumulative[i])]">
              {{ pct(result!.cumulative[i]) }}
            </td>
          </tr>
        </tbody>
      </table>

      <p class="px-4 py-2.5 text-[10px] text-sw-text/25 border-t border-white/5">
        Expertise treated as failure · {{ result.runs.toLocaleString() }} simulated rolls
      </p>
    </div>
  </div>
</template>
