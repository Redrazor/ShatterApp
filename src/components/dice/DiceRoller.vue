<script setup lang="ts">
import { ref, computed } from 'vue'
import DiceColumn from './DiceColumn.vue'
import DieFace from './DieFace.vue'

const atkSummary = ref<Record<string, number>>({})
const defSummary = ref<Record<string, number>>({})

const hits = computed(() => {
  const crits   = atkSummary.value['crit']   ?? 0
  const strikes = atkSummary.value['strike'] ?? 0
  const blocks  = defSummary.value['block']  ?? 0
  return crits + Math.max(0, strikes - blocks)
})

const hasRolled = computed(() =>
  Object.values(atkSummary.value).some(v => v > 0) ||
  Object.values(defSummary.value).some(v => v > 0)
)
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-sw-gold">Dice Roller</h1>
    <div class="grid grid-cols-2 gap-6 md:gap-10">
      <DiceColumn type="attack"  @update:summary="atkSummary = $event" />
      <DiceColumn type="defense" @update:summary="defSummary = $event" />
    </div>

    <!-- Duel Result -->
    <div v-if="hasRolled" class="rounded-xl border border-white/8 bg-black/20 p-3">
      <p class="mb-2 text-[10px] uppercase tracking-widest text-sw-text/40">Duel Result</p>
      <div class="flex items-center gap-2">
        <DieFace type="attack" face="strike" :size="22" />
        <span class="text-2xl font-bold text-sw-text">{{ hits }}</span>
        <span class="text-sm text-sw-text/50">Hit{{ hits !== 1 ? 's' : '' }}</span>
      </div>
    </div>
  </div>
</template>
