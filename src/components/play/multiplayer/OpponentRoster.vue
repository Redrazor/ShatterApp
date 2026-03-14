<script setup lang="ts">
import type { PlayUnit, ConditionKey } from '../../../types/index.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'
import { useStances } from '../../../composables/useStances.ts'
import { useRollSessionStore } from '../../../stores/rollSession.ts'

defineProps<{ units: PlayUnit[] }>()

const { getStances } = useStances()
const session = useRollSessionStore()

function stanceName(unit: PlayUnit): string | null {
  const data = getStances(unit.id)
  if (!data) return null
  const s = data.stances[unit.activeStance - 1]
  return s?.stanceName ?? null
}

const CONDITION_LABELS: Record<ConditionKey, string> = {
  hunker: '🛡 Hunker',
  disarmed: '⚔ Disarmed',
  strained: '⚡ Strained',
  exposed: '👁 Exposed',
  pinned: '📌 Pinned',
}
</script>

<template>
  <div class="space-y-2">
    <div class="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 pt-1">
      {{ session.opponentName ? `${session.opponentName}'s Team` : "Opponent's Team" }}
    </div>

    <!-- Opponent's force pool -->
    <div
      v-if="session.opponentForcePool && session.opponentForcePool.total > 0"
      class="flex items-center gap-1.5 rounded-lg border border-zinc-700/30 bg-zinc-900/40 px-3 py-2"
    >
      <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mr-1">Force</span>
      <div
        v-for="(_, i) in Array.from({ length: session.opponentForcePool.total })"
        :key="i"
        class="flex h-5 w-5 items-center justify-center rounded-full border transition-all"
        :class="session.opponentForcePool.spentTokens[i]
          ? 'border-zinc-700 bg-zinc-800 opacity-40'
          : 'border-amber-500/60 bg-amber-950/40'"
      >
        <svg viewBox="0 0 20 20" class="h-3 w-3" :class="session.opponentForcePool.spentTokens[i] ? 'fill-zinc-600' : 'fill-amber-400'">
          <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" />
        </svg>
      </div>
      <span class="ml-1 text-[10px] text-zinc-500">
        {{ session.opponentForcePool.spentTokens.filter(Boolean).length }}/{{ session.opponentForcePool.total }} spent
      </span>
    </div>

    <div v-if="units.length === 0"
      class="rounded-xl border border-zinc-700/30 bg-zinc-900/40 px-4 py-5 text-center text-xs text-zinc-600"
    >
      Waiting for opponent…
    </div>

    <template v-else>
      <div
        v-for="unit in units"
        :key="unit.id"
        class="rounded-xl border border-zinc-700/30 bg-zinc-900/60 px-3 py-2.5 space-y-1.5"
        :class="{ 'opacity-50': unit.wounds >= unit.durability }"
      >
        <!-- Header row: thumbnail + name + OUT badge -->
        <div class="flex items-center gap-3">
          <img
            :src="imageUrl(unit.thumbnail)"
            :alt="unit.name"
            class="h-10 w-10 rounded-full border border-zinc-700 object-cover flex-shrink-0"
          />
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-zinc-200 truncate">{{ unit.name }}</div>
            <div class="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500">
              <span>
                DMG
                <span :class="unit.damage > 0 ? 'text-amber-400 font-bold' : ''">{{ unit.damage }}</span>/{{ unit.stamina }}
              </span>
              <span v-if="unit.wounds > 0" class="text-red-400">{{ unit.wounds }} wound{{ unit.wounds !== 1 ? 's' : '' }}</span>
              <span v-if="stanceName(unit)" class="text-amber-500/80">{{ stanceName(unit) }}</span>
            </div>
          </div>
          <div
            v-if="unit.wounds >= unit.durability"
            class="rounded-full bg-red-900/60 border border-red-700/40 px-2 py-0.5 text-[9px] font-bold text-red-400 flex-shrink-0"
          >OUT</div>
        </div>

        <!-- Conditions -->
        <div v-if="unit.conditions.length > 0" class="flex flex-wrap gap-1">
          <span
            v-for="c in unit.conditions"
            :key="c"
            class="rounded-full border border-zinc-600/50 bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400"
          >{{ CONDITION_LABELS[c] }}</span>
        </div>
      </div>
    </template>
  </div>
</template>
