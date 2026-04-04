<script setup lang="ts">
import { ref, toRef } from 'vue'
import type { StanceData, Character, HomebrewUnitType } from '../../../types/index.ts'
import { useStances } from '../../../composables/useStances.ts'
import { useStanceComparison, type StatBand, type StatResult } from '../../../composables/useStatsComparison.ts'

const props = defineProps<{
  stanceData: StanceData | null
  characters: Character[]
  unitType: HomebrewUnitType
}>()

const { allEntries } = useStances()

const sameTypeOnly = ref(true)

const {
  totalPool,
  rangeResult,
  rangedAttackResult,
  rangedDefenseResult,
  meleeAttackResult,
  meleeDefenseResult,
  rangePoolSize,
  rangedAttackPoolSize,
  rangedDefensePoolSize,
  meleePoolSize,
} = useStanceComparison(
  allEntries,
  toRef(props, 'characters'),
  toRef(props, 'unitType'),
  sameTypeOnly,
  {
    range:         toRef(() => props.stanceData?.range         ?? 0),
    rangedAttack:  toRef(() => props.stanceData?.rangeAttack   ?? 0),
    rangedDefense: toRef(() => props.stanceData?.rangeDefense  ?? 0),
    meleeAttack:   toRef(() => props.stanceData?.meleeAttack   ?? 0),
    meleeDefense:  toRef(() => props.stanceData?.meleeDefense  ?? 0),
  },
)

// ── Band palette ──────────────────────────────────────────────────────────────

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
  let lower = r.lowerPct, same = r.samePct, higher = r.higherPct
  if (r.lower  > 0 && lower  < MIN_VIS) lower  = MIN_VIS
  if (r.same   > 0 && same   < MIN_VIS) same   = MIN_VIS
  if (r.higher > 0 && higher < MIN_VIS) higher = MIN_VIS
  const total = lower + same + higher || 100
  return { lower: (lower / total) * 100, same: (same / total) * 100, higher: (higher / total) * 100 }
}

function fmt(pct: number, count: number) { return `${pct}% (${count})` }
</script>

<template>
  <div v-if="stanceData" class="rounded-xl border border-sw-gold/15 bg-sw-card/40 overflow-hidden">

    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2.5 border-b border-sw-gold/10">
      <span class="text-[11px] font-bold uppercase tracking-widest text-sw-text/50">Stat Insights</span>
      <label class="flex items-center gap-1.5 cursor-pointer select-none group">
        <span class="text-[11px] text-sw-text/40 group-hover:text-sw-text/60 transition-colors">Same type only</span>
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
        <span class="text-[11px] text-sw-text/30">{{ totalPool }} stances</span>
      </label>
    </div>

    <!-- Two-column grid -->
    <div class="grid grid-cols-2 divide-x divide-sw-gold/10">

      <!-- ── Left: Ranged ───────────────────────────────────────────────────── -->
      <div class="divide-y divide-sw-gold/10">
        <div class="px-3 pt-2.5 pb-1">
          <p class="text-[10px] font-bold uppercase tracking-widest text-sw-blue/60">Ranged</p>
          <p class="text-[10px] text-sw-text/25">{{ rangePoolSize }} stances w/ range</p>
        </div>

        <!-- Range -->
        <div class="px-3 py-2.5 space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-sw-text/60">Range</span>
            <div class="flex items-center gap-1">
              <span class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums" :class="BAND_BADGE[rangeResult.band]">{{ stanceData.range }}</span>
              <span class="text-[9px] font-semibold uppercase tracking-wider" :class="BAND_TEXT[rangeResult.band]">{{ BAND_LABEL[rangeResult.band] }}</span>
            </div>
          </div>
          <div class="flex h-1.5 w-full rounded-full overflow-hidden bg-sw-dark/60 gap-px">
            <div v-if="rangeResult.lower  > 0" class="h-full rounded-l-full bg-blue-500/40 transition-all duration-300" :style="`width:${barSegments(rangeResult).lower}%`" />
            <div v-if="rangeResult.same   > 0" class="h-full transition-all duration-300" :class="BAND_BAR_SAME[rangeResult.band]" :style="`width:${barSegments(rangeResult).same}%`" />
            <div v-if="rangeResult.higher > 0" class="h-full rounded-r-full bg-sw-text/15 transition-all duration-300" :style="`width:${barSegments(rangeResult).higher}%`" />
          </div>
          <div class="flex flex-wrap gap-x-2 text-[10px] tabular-nums">
            <span class="text-blue-400/80">↓ {{ fmt(rangeResult.lowerPct, rangeResult.lower) }}</span>
            <span :class="BAND_TEXT[rangeResult.band]">= {{ fmt(rangeResult.samePct, rangeResult.same) }}</span>
            <span class="text-sw-text/40">↑ {{ fmt(rangeResult.higherPct, rangeResult.higher) }}</span>
          </div>
        </div>

        <!-- Ranged Attack -->
        <div class="px-3 py-2.5 space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-sw-text/60">Attack</span>
            <div class="flex items-center gap-1">
              <span class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums" :class="BAND_BADGE[rangedAttackResult.band]">{{ stanceData.rangeAttack }}</span>
              <span class="text-[9px] font-semibold uppercase tracking-wider" :class="BAND_TEXT[rangedAttackResult.band]">{{ BAND_LABEL[rangedAttackResult.band] }}</span>
            </div>
          </div>
          <div class="flex h-1.5 w-full rounded-full overflow-hidden bg-sw-dark/60 gap-px">
            <div v-if="rangedAttackResult.lower  > 0" class="h-full rounded-l-full bg-blue-500/40 transition-all duration-300" :style="`width:${barSegments(rangedAttackResult).lower}%`" />
            <div v-if="rangedAttackResult.same   > 0" class="h-full transition-all duration-300" :class="BAND_BAR_SAME[rangedAttackResult.band]" :style="`width:${barSegments(rangedAttackResult).same}%`" />
            <div v-if="rangedAttackResult.higher > 0" class="h-full rounded-r-full bg-sw-text/15 transition-all duration-300" :style="`width:${barSegments(rangedAttackResult).higher}%`" />
          </div>
          <div class="flex flex-wrap gap-x-2 text-[10px] tabular-nums">
            <span class="text-blue-400/80">↓ {{ fmt(rangedAttackResult.lowerPct, rangedAttackResult.lower) }}</span>
            <span :class="BAND_TEXT[rangedAttackResult.band]">= {{ fmt(rangedAttackResult.samePct, rangedAttackResult.same) }}</span>
            <span class="text-sw-text/40">↑ {{ fmt(rangedAttackResult.higherPct, rangedAttackResult.higher) }}</span>
          </div>
        </div>

        <!-- Ranged Defense -->
        <div class="px-3 py-2.5 space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-sw-text/60">Defense</span>
            <div class="flex items-center gap-1">
              <span class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums" :class="BAND_BADGE[rangedDefenseResult.band]">{{ stanceData.rangeDefense }}</span>
              <span class="text-[9px] font-semibold uppercase tracking-wider" :class="BAND_TEXT[rangedDefenseResult.band]">{{ BAND_LABEL[rangedDefenseResult.band] }}</span>
            </div>
          </div>
          <div class="flex h-1.5 w-full rounded-full overflow-hidden bg-sw-dark/60 gap-px">
            <div v-if="rangedDefenseResult.lower  > 0" class="h-full rounded-l-full bg-blue-500/40 transition-all duration-300" :style="`width:${barSegments(rangedDefenseResult).lower}%`" />
            <div v-if="rangedDefenseResult.same   > 0" class="h-full transition-all duration-300" :class="BAND_BAR_SAME[rangedDefenseResult.band]" :style="`width:${barSegments(rangedDefenseResult).same}%`" />
            <div v-if="rangedDefenseResult.higher > 0" class="h-full rounded-r-full bg-sw-text/15 transition-all duration-300" :style="`width:${barSegments(rangedDefenseResult).higher}%`" />
          </div>
          <div class="flex flex-wrap gap-x-2 text-[10px] tabular-nums">
            <span class="text-blue-400/80">↓ {{ fmt(rangedDefenseResult.lowerPct, rangedDefenseResult.lower) }}</span>
            <span :class="BAND_TEXT[rangedDefenseResult.band]">= {{ fmt(rangedDefenseResult.samePct, rangedDefenseResult.same) }}</span>
            <span class="text-sw-text/40">↑ {{ fmt(rangedDefenseResult.higherPct, rangedDefenseResult.higher) }}</span>
          </div>
        </div>
      </div>

      <!-- ── Right: Melee ───────────────────────────────────────────────────── -->
      <div class="divide-y divide-sw-gold/10">
        <div class="px-3 pt-2.5 pb-1">
          <p class="text-[10px] font-bold uppercase tracking-widest text-red-400/60">Melee</p>
          <p class="text-[10px] text-sw-text/25">{{ meleePoolSize }} stances</p>
        </div>

        <!-- Melee Attack -->
        <div class="px-3 py-2.5 space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-sw-text/60">Attack</span>
            <div class="flex items-center gap-1">
              <span class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums" :class="BAND_BADGE[meleeAttackResult.band]">{{ stanceData.meleeAttack }}</span>
              <span class="text-[9px] font-semibold uppercase tracking-wider" :class="BAND_TEXT[meleeAttackResult.band]">{{ BAND_LABEL[meleeAttackResult.band] }}</span>
            </div>
          </div>
          <div class="flex h-1.5 w-full rounded-full overflow-hidden bg-sw-dark/60 gap-px">
            <div v-if="meleeAttackResult.lower  > 0" class="h-full rounded-l-full bg-blue-500/40 transition-all duration-300" :style="`width:${barSegments(meleeAttackResult).lower}%`" />
            <div v-if="meleeAttackResult.same   > 0" class="h-full transition-all duration-300" :class="BAND_BAR_SAME[meleeAttackResult.band]" :style="`width:${barSegments(meleeAttackResult).same}%`" />
            <div v-if="meleeAttackResult.higher > 0" class="h-full rounded-r-full bg-sw-text/15 transition-all duration-300" :style="`width:${barSegments(meleeAttackResult).higher}%`" />
          </div>
          <div class="flex flex-wrap gap-x-2 text-[10px] tabular-nums">
            <span class="text-blue-400/80">↓ {{ fmt(meleeAttackResult.lowerPct, meleeAttackResult.lower) }}</span>
            <span :class="BAND_TEXT[meleeAttackResult.band]">= {{ fmt(meleeAttackResult.samePct, meleeAttackResult.same) }}</span>
            <span class="text-sw-text/40">↑ {{ fmt(meleeAttackResult.higherPct, meleeAttackResult.higher) }}</span>
          </div>
        </div>

        <!-- Melee Defense -->
        <div class="px-3 py-2.5 space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-sw-text/60">Defense</span>
            <div class="flex items-center gap-1">
              <span class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums" :class="BAND_BADGE[meleeDefenseResult.band]">{{ stanceData.meleeDefense }}</span>
              <span class="text-[9px] font-semibold uppercase tracking-wider" :class="BAND_TEXT[meleeDefenseResult.band]">{{ BAND_LABEL[meleeDefenseResult.band] }}</span>
            </div>
          </div>
          <div class="flex h-1.5 w-full rounded-full overflow-hidden bg-sw-dark/60 gap-px">
            <div v-if="meleeDefenseResult.lower  > 0" class="h-full rounded-l-full bg-blue-500/40 transition-all duration-300" :style="`width:${barSegments(meleeDefenseResult).lower}%`" />
            <div v-if="meleeDefenseResult.same   > 0" class="h-full transition-all duration-300" :class="BAND_BAR_SAME[meleeDefenseResult.band]" :style="`width:${barSegments(meleeDefenseResult).same}%`" />
            <div v-if="meleeDefenseResult.higher > 0" class="h-full rounded-r-full bg-sw-text/15 transition-all duration-300" :style="`width:${barSegments(meleeDefenseResult).higher}%`" />
          </div>
          <div class="flex flex-wrap gap-x-2 text-[10px] tabular-nums">
            <span class="text-blue-400/80">↓ {{ fmt(meleeDefenseResult.lowerPct, meleeDefenseResult.lower) }}</span>
            <span :class="BAND_TEXT[meleeDefenseResult.band]">= {{ fmt(meleeDefenseResult.samePct, meleeDefenseResult.same) }}</span>
            <span class="text-sw-text/40">↑ {{ fmt(meleeDefenseResult.higherPct, meleeDefenseResult.higher) }}</span>
          </div>
        </div>

        <!-- Empty spacer to vertically align with ranged's 3 rows -->
        <div class="px-3 py-2.5 flex items-center">
          <span class="text-[10px] text-sw-text/20 italic">Melee stances always have attack &amp; defense</span>
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
        >{{ label }}</span>
      </div>
      <span class="text-[10px] text-sw-text/25 ml-auto">p10 · p25 · p75 · p90</span>
    </div>

  </div>
</template>
