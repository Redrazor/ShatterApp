<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import type { AbilitiesData, Character, HomebrewUnitType } from '../../../types/index.ts'
import { useAbilities } from '../../../composables/useAbilities.ts'
import {
  useAbilitiesComparison,
  type StatBand,
  type StatResult,
  type UnitAbilityCounts,
} from '../../../composables/useStatsComparison.ts'

const props = defineProps<{
  characters: Character[]
  abilities: AbilitiesData | null
  unitType: HomebrewUnitType
}>()

const { allEntries } = useAbilities()

const sameTypeOnly = ref(true)

// ── Derive current counts from the homebrew profile's ability blocks ──────────

const currentCounts = computed<UnitAbilityCounts>(() => {
  const blocks = props.abilities?.blocks ?? []
  return {
    tactical:     blocks.filter(b => b.iconType === 'tactic').length,
    active:       blocks.filter(b => b.iconType === 'active').length,
    reactive:     blocks.filter(b => b.iconType === 'reactive').length,
    innate:       blocks.filter(b => b.iconType === 'innate').length,
    identity:     blocks.filter(b => b.iconType === 'identity').length,
    forceCostAny: blocks.filter(b => b.forceCost > 0).length,
    forceCost1:   blocks.filter(b => b.forceCost === 1).length,
    forceCost2:   blocks.filter(b => b.forceCost === 2).length,
    forceCost3:   blocks.filter(b => b.forceCost === 3).length,
  }
})

const {
  totalPool,
  tacticalResult,
  activeResult,
  reactiveResult,
  innateResult,
  identityResult,
  forceCostAnyResult,
  forceCost1Result,
  forceCost2Result,
  forceCost3Result,
} = useAbilitiesComparison(
  allEntries,
  toRef(props, 'characters'),
  toRef(props, 'unitType'),
  sameTypeOnly,
  currentCounts,
)

// ── Band colour palette ───────────────────────────────────────────────────────

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
  let same  = r.samePct
  let higher = r.higherPct
  if (r.lower > 0  && lower  < MIN_VIS) lower  = MIN_VIS
  if (r.same > 0   && same   < MIN_VIS) same   = MIN_VIS
  if (r.higher > 0 && higher < MIN_VIS) higher = MIN_VIS
  const total = lower + same + higher || 100
  return { lower: (lower / total) * 100, same: (same / total) * 100, higher: (higher / total) * 100 }
}

function fmt(pct: number, count: number) {
  return `${pct}% (${count})`
}

const typeRows = computed(() => [
  { label: 'Tactical',    value: currentCounts.value.tactical,  result: tacticalResult.value },
  { label: 'Active',      value: currentCounts.value.active,    result: activeResult.value },
  { label: 'Reactive',    value: currentCounts.value.reactive,  result: reactiveResult.value },
  { label: 'Innate',      value: currentCounts.value.innate,    result: innateResult.value },
  { label: 'Personality', value: currentCounts.value.identity,  result: identityResult.value },
])

const forceRows = computed(() => [
  { label: 'Any Force Cost', value: currentCounts.value.forceCostAny, result: forceCostAnyResult.value },
  { label: 'Cost 1 ◆',       value: currentCounts.value.forceCost1,   result: forceCost1Result.value },
  { label: 'Cost 2 ◆◆',      value: currentCounts.value.forceCost2,   result: forceCost2Result.value },
  { label: 'Cost 3 ◆◆◆',     value: currentCounts.value.forceCost3,   result: forceCost3Result.value },
])
</script>

<template>
  <div class="rounded-xl border border-sw-gold/15 bg-sw-card/40 overflow-hidden">

    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2.5 border-b border-sw-gold/10">
      <span class="text-[11px] font-bold uppercase tracking-widest text-sw-text/50">Stat Insights</span>

      <!-- Same-type toggle -->
      <label class="flex items-center gap-1.5 cursor-pointer select-none group">
        <span class="text-[11px] text-sw-text/40 group-hover:text-sw-text/60 transition-colors">
          Same type only
        </span>
        <button
          type="button"
          role="switch"
          :aria-checked="sameTypeOnly"
          class="relative h-4 w-7 rounded-full transition-colors shrink-0"
          :class="sameTypeOnly ? 'bg-sw-gold' : 'bg-sw-dark border border-sw-gold/20'"
          @click="sameTypeOnly = !sameTypeOnly"
        >
          <span
            class="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all duration-200"
            :class="sameTypeOnly ? 'right-0.5' : 'left-0.5'"
          />
        </button>
        <span class="text-[11px] text-sw-text/30">{{ totalPool }} units</span>
      </label>
    </div>

    <!-- Ability Types section -->
    <div class="px-4 pt-3 pb-1">
      <p class="text-[10px] font-bold uppercase tracking-widest text-sw-text/25 mb-2">Ability Types</p>
    </div>

    <div class="divide-y divide-sw-gold/10">
      <div
        v-for="row in typeRows"
        :key="row.label"
        class="px-4 py-2.5 space-y-1.5"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-sw-text/60">{{ row.label }}</span>
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums"
              :class="BAND_BADGE[row.result.band]"
            >
              {{ row.value }}
            </span>
          </div>
          <span class="text-[10px] font-semibold uppercase tracking-wider" :class="BAND_TEXT[row.result.band]">
            {{ BAND_LABEL[row.result.band] }}
          </span>
        </div>

        <div class="flex h-1.5 w-full rounded-full overflow-hidden bg-sw-dark/60 gap-px">
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

        <div class="flex items-center gap-2 text-[11px] tabular-nums">
          <span class="text-blue-400/80">↓ {{ fmt(row.result.lowerPct, row.result.lower) }}</span>
          <span class="text-sw-text/20">·</span>
          <span :class="BAND_TEXT[row.result.band]">= {{ fmt(row.result.samePct, row.result.same) }}</span>
          <span class="text-sw-text/20">·</span>
          <span class="text-sw-text/40">↑ {{ fmt(row.result.higherPct, row.result.higher) }}</span>
        </div>
      </div>
    </div>

    <!-- Force Cost section -->
    <div class="px-4 pt-3 pb-1 border-t border-sw-gold/10 mt-1">
      <p class="text-[10px] font-bold uppercase tracking-widest text-sw-text/25 mb-2">Force Cost</p>
    </div>

    <div class="divide-y divide-sw-gold/10">
      <div
        v-for="row in forceRows"
        :key="row.label"
        class="px-4 py-2.5 space-y-1.5"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-sw-text/60">{{ row.label }}</span>
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums"
              :class="BAND_BADGE[row.result.band]"
            >
              {{ row.value }}
            </span>
          </div>
          <span class="text-[10px] font-semibold uppercase tracking-wider" :class="BAND_TEXT[row.result.band]">
            {{ BAND_LABEL[row.result.band] }}
          </span>
        </div>

        <div class="flex h-1.5 w-full rounded-full overflow-hidden bg-sw-dark/60 gap-px">
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

        <div class="flex items-center gap-2 text-[11px] tabular-nums">
          <span class="text-blue-400/80">↓ {{ fmt(row.result.lowerPct, row.result.lower) }}</span>
          <span class="text-sw-text/20">·</span>
          <span :class="BAND_TEXT[row.result.band]">= {{ fmt(row.result.samePct, row.result.same) }}</span>
          <span class="text-sw-text/20">·</span>
          <span class="text-sw-text/40">↑ {{ fmt(row.result.higherPct, row.result.higher) }}</span>
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
