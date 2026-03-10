<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PlayUnit, ConditionKey } from '../../../types/index.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'
import ConditionPicker from './ConditionPicker.vue'

const props = defineProps<{
  unit: PlayUnit
  removed: boolean
  canRemove: boolean
  activeTag: string | null
}>()

const emit = defineEmits<{
  (e: 'tap-damage', position: number): void
  (e: 'adjust-wounds', delta: number): void
  (e: 'toggle-condition', condition: ConditionKey): void
  (e: 'set-stance', stance: 1 | 2): void
  (e: 'remove'): void
  (e: 'open-profile'): void
  (e: 'tag-press', tag: string): void
}>()

const showConditionPicker = ref(false)

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
      !removed && !isHighlighted && !isDimmed ? 'border-zinc-700/50' : '',
    ]"
  >
    <!-- Removed overlay -->
    <div
      v-if="removed"
      class="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-[2px]"
    >
      <span class="rounded-full border border-red-500/60 bg-red-950/80 px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-red-400 shadow-lg">
        Removed
      </span>
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
          class="rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-2 py-1 text-[10px] font-semibold text-zinc-500 transition-all hover:border-zinc-500 hover:text-zinc-300 active:scale-95"
          @click="showConditionPicker = true"
        >Conditions</button>
        <button
          v-if="canRemove"
          class="rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-2 py-1 text-[10px] font-semibold text-red-600 transition-all hover:border-red-700 hover:text-red-400 active:scale-95"
          @click="emit('remove')"
        >✕</button>
      </div>
    </div>

    <!-- Stats row -->
    <div class="flex items-center gap-3 mb-2.5 px-0.5">
      <div class="flex items-center gap-1 text-[10px] text-zinc-500">
        <span class="text-zinc-600">HP</span>
        <span class="font-bold text-zinc-300">{{ unit.stamina }}</span>
      </div>
      <div class="flex items-center gap-1 text-[10px] text-zinc-500">
        <span class="text-zinc-600">Dur</span>
        <span class="font-bold text-zinc-300">{{ unit.durability }}</span>
      </div>

      <!-- Stance switcher -->
      <div v-if="unit.stance1 && unit.stance2" class="ml-auto flex rounded-lg border border-zinc-700/50 overflow-hidden">
        <button
          class="px-2 py-0.5 text-[10px] font-bold transition-colors"
          :class="unit.activeStance === 1 ? 'bg-amber-500/80 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'"
          @click="emit('set-stance', 1)"
        >S1</button>
        <button
          class="px-2 py-0.5 text-[10px] font-bold transition-colors border-l border-zinc-700/50"
          :class="unit.activeStance === 2 ? 'bg-amber-500/80 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'"
          @click="emit('set-stance', 2)"
        >S2</button>
      </div>
      <div v-else-if="unit.stance1" class="ml-auto text-[10px] text-zinc-600">Stance 1</div>
    </div>

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
      <div class="flex gap-1.5">
        <button
          v-for="i in unit.stamina"
          :key="i"
          class="flex-1 rounded h-4 transition-all active:scale-95"
          :class="i <= unit.damage
            ? 'bg-red-500 border border-red-400/40 shadow-[0_0_6px_rgba(239,68,68,0.4)]'
            : 'bg-zinc-800 border border-zinc-700/40 hover:border-zinc-500'"
          @click="emit('tap-damage', i)"
        />
      </div>
    </div>

    <!-- Wounds track -->
    <div class="flex items-center justify-between mb-2.5">
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600">Wounds</span>
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
          class="h-6 w-6 rounded border border-zinc-700/50 bg-zinc-800 text-sm font-bold text-zinc-400 transition-all hover:border-zinc-500 hover:text-zinc-200 active:scale-95 flex items-center justify-center"
          @click="emit('adjust-wounds', -1)"
        >−</button>
        <span class="w-5 text-center text-xs font-bold text-zinc-300">{{ unit.wounds }}</span>
        <button
          class="h-6 w-6 rounded border border-zinc-700/50 bg-zinc-800 text-sm font-bold text-zinc-400 transition-all hover:border-zinc-500 hover:text-zinc-200 active:scale-95 flex items-center justify-center"
          @click="emit('adjust-wounds', 1)"
        >+</button>
      </div>
    </div>

    <!-- Tags -->
    <div v-if="tags.length > 0" class="flex flex-wrap gap-1">
      <button
        v-for="tag in tags"
        :key="tag"
        class="rounded-full px-2 py-0.5 text-[9px] font-semibold transition-all active:scale-95"
        :class="activeTag === tag
          ? 'border border-amber-400/60 bg-amber-500/20 text-amber-300'
          : 'border border-zinc-700/40 bg-zinc-800/50 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400'"
        @click="emit('tag-press', tag)"
      >{{ tag }}</button>
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
