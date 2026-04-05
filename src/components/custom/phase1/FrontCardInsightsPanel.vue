<script setup lang="ts">
import { computed, toRef } from 'vue'
import type { Character, HomebrewUnitType } from '../../../types/index.ts'
import { useFrontCardComparison, type StatBand, type StatResult } from '../../../composables/useStatsComparison.ts'

const props = defineProps<{
  characters: Character[]
  unitType: HomebrewUnitType
  cost: number
  fp: number
  eraCount: number
}>()

const { costResult, fpResult, eraCountResult, totalCostChars, totalAllChars } = useFrontCardComparison(
  toRef(props, 'characters'),
  toRef(props, 'unitType'),
  toRef(props, 'cost'),
  toRef(props, 'fp'),
  toRef(props, 'eraCount'),
)

// ── Band colour palette (shared with StatsInsightsPanel) ─────────────────────

const BAND_LABEL: Record<StatBand, string> = {
  'very-low':  'Very Low',
  'low':       'Low',
  'typical':   'Typical',
  'high':      'High',
  'very-high': 'Very High',
}

const BAND_BADGE: Record<StatBand, string> = {
  'very-low':  'bg-blue-400/15 text-blue-400 border border-blue-400/30',
  'low':       'bg-cyan-400/15 text-cyan-400 border border-cyan-400/30',
  'typical':   'bg-green-400/15 text-green-400 border border-green-400/30',
  'high':      'bg-orange-400/15 text-orange-400 border border-orange-400/30',
  'very-high': 'bg-red-400/15 text-red-400 border border-red-400/30',
}

const BAND_BAR_SAME: Record<StatBand, string> = {
  'very-low':  'bg-blue-400',
  'low':       'bg-cyan-400',
  'typical':   'bg-green-400',
  'high':      'bg-orange-400',
  'very-high': 'bg-red-400',
}

const BAND_TEXT: Record<StatBand, string> = {
  'very-low':  'text-blue-400',
  'low':       'text-cyan-400',
  'typical':   'text-green-400',
  'high':      'text-orange-400',
  'very-high': 'text-red-400',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function barSegments(r: StatResult) {
  const MIN_VIS = 1
  let lower = r.lowerPct
  let same = r.samePct
  let higher = r.higherPct
  if (r.lower > 0 && lower < MIN_VIS) lower = MIN_VIS
  if (r.same > 0 && same < MIN_VIS) same = MIN_VIS
  if (r.higher > 0 && higher < MIN_VIS) higher = MIN_VIS
  const total = lower + same + higher || 100
  return { lower: (lower / total) * 100, same: (same / total) * 100, higher: (higher / total) * 100 }
}

function formatFraction(pct: number, count: number): string {
  return `${pct}% (${count})`
}

const costLabel = computed(() => props.unitType === 'Primary' ? 'SP' : 'PC')

const rows = computed(() => [
  {
    label: costLabel.value,
    value: props.cost,
    result: costResult.value,
    total: totalCostChars.value,
    note: props.unitType === 'Primary' ? 'Primary units only' : 'Secondary & Support only',
  },
  {
    label: 'Force Points',
    value: props.fp,
    result: fpResult.value,
    total: totalAllChars.value,
    note: 'All units',
  },
  {
    label: 'Eras',
    value: props.eraCount,
    result: eraCountResult.value,
    total: totalAllChars.value,
    note: 'All units',
  },
])
</script>

<template>
  <div class="rounded-xl border border-sw-gold/15 bg-sw-card/40 overflow-hidden">

    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2.5 border-b border-sw-gold/10">
      <span class="text-[11px] font-bold uppercase tracking-widest text-sw-text/50">Stat Insights</span>
      <span class="text-[11px] text-sw-text/30">{{ totalAllChars }} official units</span>
    </div>

    <!-- Rows -->
    <div class="divide-y divide-sw-gold/10">
      <div
        v-for="row in rows"
        :key="row.label"
        class="px-4 py-3 space-y-2"
      >

        <!-- Label + value badge + band label -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-sw-text/60">{{ row.label }}</span>
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums"
              :class="BAND_BADGE[row.result.band]"
            >
              {{ row.value }}
            </span>
            <span class="text-[10px] text-sw-text/25">{{ row.note }}</span>
          </div>
          <span class="text-[10px] font-semibold uppercase tracking-wider" :class="BAND_TEXT[row.result.band]">
            {{ BAND_LABEL[row.result.band] }}
          </span>
        </div>

        <!-- Stacked bar -->
        <div class="flex h-2 w-full rounded-full overflow-hidden bg-sw-dark/60 gap-px">
          <div
            v-if="row.result.lower > 0"
            class="h-full rounded-l-full bg-blue-500/40 transition-all duration-300"
            :style="`width: ${barSegments(row.result).lower}%`"
          />
          <div
            v-if="row.result.same > 0"
            class="h-full transition-all duration-300"
            :class="BAND_BAR_SAME[row.result.band]"
            :style="`width: ${barSegments(row.result).same}%`"
          />
          <div
            v-if="row.result.higher > 0"
            class="h-full rounded-r-full bg-sw-text/15 transition-all duration-300"
            :style="`width: ${barSegments(row.result).higher}%`"
          />
        </div>

        <!-- Text breakdown -->
        <div class="flex items-center gap-2 text-[11px] tabular-nums">
          <span class="text-blue-400/80">↓ {{ formatFraction(row.result.lowerPct, row.result.lower) }} lower</span>
          <span class="text-sw-text/20">·</span>
          <span :class="BAND_TEXT[row.result.band]">= {{ formatFraction(row.result.samePct, row.result.same) }} same</span>
          <span class="text-sw-text/20">·</span>
          <span class="text-sw-text/40">↑ {{ formatFraction(row.result.higherPct, row.result.higher) }} higher</span>
        </div>

      </div>
    </div>

    <!-- Footer legend -->
    <div class="px-4 py-2 border-t border-sw-gold/10 flex items-center gap-3 flex-wrap">
      <span class="text-[10px] text-sw-text/25 shrink-0">Bands:</span>
      <div class="flex items-center gap-2 flex-wrap">
        <span
          v-for="(label, band) in BAND_LABEL"
          :key="band"
          class="text-[10px] rounded-full px-1.5 py-0.5"
          :class="BAND_BADGE[band as StatBand]"
        >
          {{ label }}
        </span>
      </div>
      <span class="text-[10px] text-sw-text/25 ml-auto">p10 · p25 · p75 · p90</span>
    </div>

  </div>
</template>
