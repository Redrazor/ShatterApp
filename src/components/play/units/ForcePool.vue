<script setup lang="ts">
import { usePlayUnitsStore } from '../../../stores/playUnits.ts'

const store = usePlayUnitsStore()
</script>

<template>
  <div
    v-if="store.totalFp > 0"
    class="rounded-2xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3"
  >
    <!-- Header row: label left, button+counter right -->
    <div class="flex items-start justify-between mb-3">
      <span class="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 pt-1">Force Pool</span>

      <!-- Right side: button with spent count underneath -->
      <div class="flex flex-col items-end gap-1">
        <button
          class="rounded-lg border border-zinc-700/40 bg-zinc-800/60 px-2.5 py-1 text-[10px] font-semibold text-zinc-500
                 transition-all hover:border-zinc-500 hover:text-zinc-300 active:scale-95"
          @click="store.refreshForcePool()"
        >Refresh Force Pool</button>
        <span class="text-[10px] text-zinc-600">
          {{ (store.spentTokens ?? []).filter(Boolean).length }} / {{ store.totalFp }} spent
        </span>
      </div>
    </div>

    <!-- Token grid -->
    <div class="flex flex-wrap gap-2.5">
      <button
        v-for="i in store.totalFp"
        :key="i"
        class="relative h-12 w-12 rounded-full flex items-center justify-center transition-all active:scale-90 select-none"
        :class="(store.spentTokens ?? [])[i - 1]
          ? 'opacity-40'
          : 'shadow-[0_0_10px_rgba(251,191,36,0.25)]'"
        :title="store.spentTokens[i - 1] ? 'Spent — tap to restore' : 'Unspent — tap to spend'"
        @click="store.toggleForceToken(i - 1)"
      >
        <!-- Force starburst SVG — matches the card symbol -->
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="h-full w-full">
          <!-- Outer dark ring -->
          <circle cx="50" cy="50" r="49" fill="#1c1917"/>
          <!-- White inner circle -->
          <circle cx="50" cy="50" r="43" fill="#fef9c3"/>
          <!-- 8-pointed starburst: 4 long cardinal + 4 shorter diagonal -->
          <polygon
            points="50,10 54,40 74,26 60,46 90,50 60,54 74,74 54,60 50,90 46,60 26,74 40,54 10,50 40,46 26,26 46,40"
            :fill="(store.spentTokens ?? [])[i - 1] ? '#71717a' : '#f97316'"
          />
          <!-- Center white circle -->
          <circle cx="50" cy="50" r="9" fill="#fef9c3"/>
          <!-- Tiny center dot -->
          <circle cx="50" cy="50" r="3.5" :fill="(store.spentTokens ?? [])[i - 1] ? '#52525b' : '#c2410c'"/>
        </svg>
      </button>
    </div>
  </div>
</template>
