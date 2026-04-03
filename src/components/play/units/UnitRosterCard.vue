<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PlayUnit, ConditionKey } from '../../../types/index.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'
import ConditionPicker from './ConditionPicker.vue'
import AbilityRow from './AbilityRow.vue'
import { useStances } from '../../../composables/useStances.ts'
import { useAbilities } from '../../../composables/useAbilities.ts'
import { useKeywords } from '../../../composables/useKeywords.ts'

const props = defineProps<{
  unit: PlayUnit
  removed: boolean
  canRemove: boolean
  activeTag: string | null
  isCurrentActive?: boolean
  isActivated?: boolean
}>()

const emit = defineEmits<{
  (e: 'tap-damage', position: number): void
  (e: 'adjust-wounds', delta: number): void
  (e: 'toggle-condition', condition: ConditionKey): void
  (e: 'set-stance', stance: 1 | 2): void
  (e: 'remove'): void
  (e: 'open-profile'): void
  (e: 'tag-press', tag: string): void
  (e: 'roll-stat', payload: { unitId: number; role: 'attacker' | 'defender'; diceCount: number }): void
  (e: 'flip-wounded'): void
  (e: 'defeat-unit'): void
}>()

const showConditionPicker = ref(false)
const showAbilities = ref(false)

const { getStances } = useStances()
const { getAbilities } = useAbilities()
const { keywords } = useKeywords()

const stanceData = computed(() => getStances(props.unit.id))
const activeStanceStat = computed(() => {
  const s = stanceData.value
  if (!s) return null
  return s.stances[props.unit.activeStance - 1] ?? null
})
const stance1Name = computed(() => stanceData.value?.stances[0]?.stanceName ?? 'S1')
const stance2Name = computed(() => stanceData.value?.stances[1]?.stanceName ?? 'S2')
const abilities = computed(() => getAbilities(props.unit.id)?.abilities ?? [])

const CONDITION_LABELS: Record<ConditionKey, string> = {
  hunker: '🛡 Hunker',
  disarmed: '⚔ Disarmed',
  strained: '⚡ Strained',
  exposed: '👁 Exposed',
  pinned: '📌 Pinned',
}

const tags = computed(() => props.unit.tags ?? [])
const isHighlighted = computed(() =>
  props.activeTag !== null && tags.value.includes(props.activeTag)
)
const isDimmed = computed(() =>
  props.activeTag !== null && !tags.value.includes(props.activeTag)
)
</script>

<template>
  <div
    class="relative rounded-2xl border bg-zinc-900 p-3 transition-all duration-300"
    :class="[
      removed ? 'border-red-900/60 opacity-60' : '',
      isHighlighted ? 'border-amber-400/70 shadow-[0_0_12px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/30' : '',
      isDimmed ? 'opacity-40' : '',
      isCurrentActive && !removed && !isHighlighted ? 'border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20' : '',
      !removed && !isHighlighted && !isDimmed && !isCurrentActive ? 'border-zinc-700/50' : '',
    ]"
  >
    <!-- Removed overlay -->
    <div
      v-if="removed"
      class="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-[2px]"
    >
      <span class="rounded-full border border-red-500/60 bg-red-950/80 px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-red-400 shadow-lg">
        Defeated
      </span>
    </div>

    <!-- Wounded ribbon (priority over Done) -->
    <div
      v-if="unit.wounded"
      class="absolute top-0 left-0 bottom-0 z-10 w-5 flex items-center justify-center rounded-l-2xl bg-red-900/60 pointer-events-none overflow-hidden"
    >
      <span class="text-[7px] font-bold uppercase tracking-widest text-red-300 -rotate-90 whitespace-nowrap">Wounded</span>
    </div>

    <!-- Activated left-side ribbon -->
    <div
      v-else-if="isActivated"
      class="absolute top-0 left-0 bottom-0 z-10 w-5 flex items-center justify-center rounded-l-2xl bg-zinc-700/60 pointer-events-none overflow-hidden"
    >
      <span class="text-[7px] font-bold uppercase tracking-widest text-zinc-400 -rotate-90 whitespace-nowrap">Done</span>
    </div>

    <!-- Header row (tappable → open profile) -->
    <div
      class="flex items-center gap-2.5 mb-2 cursor-pointer active:opacity-70 transition-opacity"
      @click="emit('open-profile')"
    >
      <!-- Thumbnail -->
      <img
        v-if="unit.thumbnail"
        :src="imageUrl(unit.thumbnail)"
        class="h-11 w-11 rounded-full border border-zinc-700/60 object-cover flex-shrink-0"
        :alt="unit.name"
      />
      <div v-else class="h-11 w-11 rounded-full border border-zinc-700/60 bg-zinc-800 flex-shrink-0" />

      <!-- Name + type -->
      <div class="flex-1 min-w-0">
        <div class="text-sm font-bold text-zinc-200 leading-tight truncate">{{ unit.name }}</div>
        <div class="text-[10px] text-zinc-600 mt-0.5">{{ unit.unitType }}</div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1.5 flex-shrink-0" @click.stop>
        <button
          class="rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-3 py-2 text-[11px] font-semibold text-zinc-500 transition-all hover:border-zinc-500 hover:text-zinc-300 active:scale-95"
          @click="showConditionPicker = true"
        >Conditions</button>
        <button
          v-if="unit.wounded && unit.wounds < unit.durability"
          class="rounded-lg border border-red-700/60 bg-red-950/40 px-3 py-2 text-[11px] font-semibold text-red-300 transition-all hover:border-red-500 hover:text-red-200 active:scale-95"
          @click="emit('flip-wounded')"
        >Flip Wounded</button>
        <button
          v-else-if="unit.wounded && unit.wounds >= unit.durability"
          class="rounded-lg border border-red-600/50 bg-red-900/40 px-3 py-2 text-[11px] font-bold text-red-400 transition-all hover:border-red-400 hover:text-red-200 active:scale-95"
          @click="emit('defeat-unit')"
        >Defeat Unit</button>
        <button
          v-if="canRemove"
          class="rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-2.5 py-2 text-[11px] font-semibold text-red-600 transition-all hover:border-red-700 hover:text-red-400 active:scale-95"
          @click="emit('remove')"
        >✕</button>
      </div>
    </div>

    <!-- HP / Dur summary -->
    <div class="flex items-center gap-3 mb-2 px-0.5">
      <div class="flex items-center gap-1 text-[10px] text-zinc-500">
        <span class="text-zinc-600">HP</span>
        <span class="font-bold text-zinc-300">{{ unit.stamina }}</span>
      </div>
      <div class="flex items-center gap-1 text-[10px] text-zinc-500">
        <span class="text-zinc-600">Dur</span>
        <span class="font-bold text-zinc-300">{{ unit.durability }}</span>
      </div>
    </div>

    <!-- Stance switcher (full-width) + combat stats block -->
    <div v-if="activeStanceStat" class="mb-2.5 rounded-xl border border-zinc-700/50 overflow-hidden">
      <!-- Stance tabs — full width, easy tap targets -->
      <div v-if="unit.stance1 && unit.stance2" class="flex">
        <button
          class="flex-1 py-2 sm:py-1.5 text-xs font-bold transition-colors leading-tight text-center"
          :class="unit.activeStance === 1 ? 'bg-amber-500/80 text-zinc-900' : 'text-zinc-500 bg-zinc-800/60 hover:text-zinc-300'"
          @click="emit('set-stance', 1)"
        >{{ stance1Name }}</button>
        <button
          class="flex-1 py-2 sm:py-1.5 text-xs font-bold transition-colors border-l border-zinc-700/50 leading-tight text-center"
          :class="unit.activeStance === 2 ? 'bg-amber-500/80 text-zinc-900' : 'text-zinc-500 bg-zinc-800/60 hover:text-zinc-300'"
          @click="emit('set-stance', 2)"
        >{{ stance2Name }}</button>
      </div>
      <div v-else-if="unit.stance1" class="py-2 px-3 text-xs font-bold text-zinc-500 bg-zinc-800/60">{{ stance1Name }}</div>

      <!-- Combat stat buttons — full-width on mobile, compact on desktop -->
      <div class="flex flex-col gap-1.5 px-2 py-2 bg-zinc-900/60">
        <!-- Ranged row (show if any ranged stat is non-null) -->
        <div v-if="activeStanceStat.ranged && (activeStanceStat.ranged.attack !== null || activeStanceStat.ranged.defense !== null)" class="flex items-center gap-1.5">
          <span class="text-[8px] font-bold uppercase tracking-wider text-zinc-600 w-9 shrink-0">Ranged</span>
          <template v-if="activeStanceStat.ranged.attack !== null">
            <button class="flex-1 sm:flex-none sm:px-3 rounded-lg border border-zinc-700/50 bg-zinc-800 py-2 sm:py-1.5 text-xs font-bold text-zinc-400 active:scale-95" title="Range">{{ activeStanceStat.ranged.range ?? '—' }}</button>
            <button class="flex-1 sm:flex-none sm:px-3 rounded-lg border border-zinc-700/50 bg-zinc-800 py-2 sm:py-1.5 text-xs font-bold text-zinc-300 active:scale-95 hover:border-amber-500/60 hover:text-amber-300" title="Roll attack dice"
              @click.stop="emit('roll-stat', { unitId: unit.id, role: 'attacker', diceCount: activeStanceStat.ranged.attack! })">{{ activeStanceStat.ranged.attack }}⚔</button>
          </template>
          <button v-if="activeStanceStat.ranged.defense !== null" class="flex-1 sm:flex-none sm:px-3 rounded-lg border border-zinc-700/50 bg-zinc-800 py-2 sm:py-1.5 text-xs font-bold text-zinc-300 active:scale-95 hover:border-blue-500/60 hover:text-blue-300" title="Roll defense dice"
            @click.stop="emit('roll-stat', { unitId: unit.id, role: 'defender', diceCount: activeStanceStat.ranged.defense! })">{{ activeStanceStat.ranged.defense }}🛡</button>
        </div>
        <!-- Melee row -->
        <div v-if="activeStanceStat.melee && activeStanceStat.melee.attack !== null" class="flex items-center gap-1.5">
          <span class="text-[8px] font-bold uppercase tracking-wider text-zinc-600 w-9 shrink-0">Melee</span>
          <button class="flex-1 sm:flex-none sm:px-3 rounded-lg border border-amber-900/40 bg-zinc-800 py-2 sm:py-1.5 text-xs font-bold text-zinc-300 active:scale-95 hover:border-amber-500/60 hover:text-amber-300" title="Roll attack dice"
            @click.stop="emit('roll-stat', { unitId: unit.id, role: 'attacker', diceCount: activeStanceStat.melee.attack! })">{{ activeStanceStat.melee.attack }}⚔</button>
          <button class="flex-1 sm:flex-none sm:px-3 rounded-lg border border-amber-900/40 bg-zinc-800 py-2 sm:py-1.5 text-xs font-bold text-zinc-300 active:scale-95 hover:border-blue-500/60 hover:text-blue-300" title="Roll defense dice"
            @click.stop="emit('roll-stat', { unitId: unit.id, role: 'defender', diceCount: activeStanceStat.melee.defense! })">{{ activeStanceStat.melee.defense }}🛡</button>
        </div>
      </div>
    </div>

    <!-- Stance label only (no stats available) -->
    <div v-else-if="unit.stance1 && !unit.stance2" class="mb-2.5 text-[10px] text-zinc-600 px-0.5">{{ stance1Name }}</div>

    <!-- Active condition chips (clickable to remove) -->
    <div v-if="unit.conditions.length > 0" class="flex flex-wrap gap-1 mb-2.5">
      <button
        v-for="c in unit.conditions"
        :key="c"
        class="rounded-full border border-zinc-600/50 bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400
               transition-all hover:border-red-700/60 hover:bg-red-950/40 hover:text-red-400 active:scale-95"
        :title="`Remove ${CONDITION_LABELS[c]}`"
        @click="emit('toggle-condition', c)"
      >{{ CONDITION_LABELS[c] }} ✕</button>
    </div>

    <!-- Damage track -->
    <div class="mb-2.5">
      <div class="mb-1 flex items-center justify-between">
        <span class="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600">Damage</span>
        <span class="text-[10px] text-zinc-600">{{ unit.damage }} / {{ unit.stamina }}</span>
      </div>
      <div class="flex gap-1.5" :class="{ 'pointer-events-none': unit.wounded }">
        <button
          v-for="i in unit.stamina"
          :key="i"
          class="flex-1 rounded h-7 transition-all active:scale-95"
          :class="i <= unit.damage
            ? unit.wounded
              ? 'bg-red-800/70 border border-red-700/40'
              : 'bg-red-500 border border-red-400/40 shadow-[0_0_6px_rgba(239,68,68,0.4)]'
            : 'bg-zinc-800 border border-zinc-700/40 hover:border-zinc-500'"
          @click="emit('tap-damage', i)"
        />
      </div>
    </div>

    <!-- Injured track -->
    <div class="flex items-center justify-between mb-2.5">
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600">Injured</span>
        <div class="flex gap-1">
          <span
            v-for="i in unit.durability"
            :key="i"
            class="h-3 w-3 rounded-full border transition-colors"
            :class="i <= unit.wounds
              ? 'bg-amber-500 border-amber-400/50'
              : 'bg-zinc-800 border-zinc-700/40'"
          />
        </div>
      </div>
      <div class="flex items-center gap-1">
        <button
          class="h-10 w-10 rounded-lg border border-zinc-700/50 bg-zinc-800 text-base font-bold text-zinc-400 transition-all hover:border-zinc-500 hover:text-zinc-200 active:scale-95 flex items-center justify-center"
          @click="emit('adjust-wounds', -1)"
        >−</button>
        <span class="w-6 text-center text-sm font-bold text-zinc-300">{{ unit.wounds }}</span>
        <button
          class="h-10 w-10 rounded-lg border border-zinc-700/50 bg-zinc-800 text-base font-bold text-zinc-400 transition-all hover:border-zinc-500 hover:text-zinc-200 active:scale-95 flex items-center justify-center"
          @click="emit('adjust-wounds', 1)"
        >+</button>
      </div>
    </div>

    <!-- Tags -->
    <div v-if="tags.length > 0" class="flex flex-wrap gap-1">
      <button
        v-for="tag in tags"
        :key="tag"
        class="rounded-full px-2 py-0.5 text-[11px] font-semibold transition-all active:scale-95"
        :class="activeTag === tag
          ? 'border border-amber-400/60 bg-amber-500/20 text-amber-300'
          : 'border border-zinc-700/40 bg-zinc-800/50 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400'"
        @click="emit('tag-press', tag)"
      >{{ tag }}</button>
    </div>

    <!-- Abilities section (collapsible) -->
    <div v-if="abilities.length > 0" class="mt-2.5 border-t border-zinc-800 pt-2.5">
      <button
        class="flex w-full items-center justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600 hover:text-zinc-400 transition-colors"
        @click="showAbilities = !showAbilities"
      >
        <span>Abilities ({{ abilities.length }})</span>
        <span>{{ showAbilities ? '▲' : '▼' }}</span>
      </button>
      <div v-if="showAbilities" class="mt-2.5 space-y-3">
        <AbilityRow
          v-for="ab in abilities"
          :key="ab.name"
          :ability="ab"
          :unit-tags="unit.tags"
          :keywords="keywords"
          :active-tag="activeTag"
        />
      </div>
    </div>

    <!-- Condition picker -->
    <ConditionPicker
      v-if="showConditionPicker"
      :active="unit.conditions"
      @toggle="(c) => emit('toggle-condition', c)"
      @close="showConditionPicker = false"
    />
  </div>
</template>
