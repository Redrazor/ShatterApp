<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import DiceColumn from './DiceColumn.vue'
import DieFace from './DieFace.vue'
import { useRollHistoryStore } from '../../stores/rollHistory.ts'

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

const history = useRollHistoryStore()
const logOpen = ref(false)

// Track whether each side has had a fresh deliberate roll since the last entry
const pendingAtk = ref(false)
const pendingDef = ref(false)

function onAtkRolled() {
  pendingAtk.value = true
  maybePushEntry()
}

function onDefRolled() {
  pendingDef.value = true
  maybePushEntry()
}

function maybePushEntry() {
  if (!pendingAtk.value || !pendingDef.value) return
  // Wait for animation to settle then push new duel entry
  setTimeout(() => {
    history.push(atkSummary.value, defSummary.value, hits.value)
    pendingAtk.value = false
    pendingDef.value = false
  }, 600)
}

// Real-time update of the most recent entry as faces are changed
watch([atkSummary, defSummary, hits], () => {
  history.updateCurrent(atkSummary.value, defSummary.value, hits.value)
}, { deep: true })

function summaryLine(summary: Record<string, number>): string {
  return Object.entries(summary)
    .filter(([, v]) => v > 0)
    .map(([f, v]) => `${v}× ${f}`)
    .join(', ') || '—'
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-sw-gold">Dice Roller</h1>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-10">
      <DiceColumn type="attack"  @update:summary="atkSummary = $event" @rolled="onAtkRolled" />
      <DiceColumn type="defense" @update:summary="defSummary = $event" @rolled="onDefRolled" />
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

    <!-- Roll history -->
    <div v-if="history.entries.length > 0" class="rounded-xl border border-white/8 bg-black/20">
      <button
        class="flex w-full items-center justify-between px-3 py-2.5 text-left"
        @click="logOpen = !logOpen"
      >
        <span class="text-[10px] uppercase tracking-widest text-sw-text/40">Roll History ({{ history.entries.length }})</span>
        <div class="flex items-center gap-2">
          <button
            class="text-[10px] text-sw-text/30 hover:text-sw-text transition-colors"
            @click.stop="history.clear()"
          >Clear</button>
          <span class="text-[10px] text-sw-text/30">{{ logOpen ? '▲' : '▼' }}</span>
        </div>
      </button>

      <div v-if="logOpen" class="border-t border-white/8 divide-y divide-white/5">
        <div
          v-for="(entry, i) in history.entries"
          :key="entry.id"
          class="flex items-start justify-between gap-3 px-3 py-2"
        >
          <div class="flex-1 min-w-0">
            <div class="text-[10px] text-sw-text/30 mb-0.5">
              Atk: {{ summaryLine(entry.atk) }}
            </div>
            <div class="text-[10px] text-sw-text/30">
              Def: {{ summaryLine(entry.def) }}
            </div>
          </div>
          <div class="flex flex-col items-end gap-0.5 flex-shrink-0">
            <span class="text-sm font-bold text-sw-text">{{ entry.hits }} <span class="text-xs font-normal text-sw-text/50">hit{{ entry.hits !== 1 ? 's' : '' }}</span></span>
            <div class="flex items-center gap-1">
              <span v-if="i === 0" class="h-1.5 w-1.5 rounded-full bg-sw-gold animate-pulse" title="Live" />
              <span class="text-[10px] text-sw-text/20">{{ entry.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
