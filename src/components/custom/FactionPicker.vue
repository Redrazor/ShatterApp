<script setup lang="ts">
import type { HomebrewFaction } from '../../types/index.ts'

defineProps<{
  faction: HomebrewFaction
}>()

const emit = defineEmits<{
  update: [faction: HomebrewFaction]
}>()

const FACTIONS: { value: HomebrewFaction; label: string; color: string; border: string; text: string }[] = [
  { value: 'rebel',      label: 'Rebel',      color: '#e38525', border: 'border-[#e38525]', text: 'text-white' },
  { value: 'republic',   label: 'Republic',   color: '#24437f', border: 'border-[#24437f]', text: 'text-white' },
  { value: 'separatist', label: 'Separatist', color: '#991e1e', border: 'border-[#991e1e]', text: 'text-white' },
  { value: 'empire',     label: 'Empire',     color: '#2e2735', border: 'border-[#2e2735]', text: 'text-white' },
  { value: 'other',      label: 'Other',      color: '#6d6e71', border: 'border-[#6d6e71]', text: 'text-white' },
]
</script>

<template>
  <div class="space-y-2">
    <label class="text-xs font-semibold text-sw-text/50 uppercase tracking-wider">Faction</label>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="f in FACTIONS"
        :key="f.value"
        type="button"
        class="px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2"
        :class="[
          faction === f.value
            ? [f.border, f.text, 'scale-105 shadow-lg']
            : 'border-transparent opacity-50 hover:opacity-80'
        ]"
        :style="faction === f.value
          ? { backgroundColor: f.color }
          : { backgroundColor: f.color + '55' }"
        @click="emit('update', f.value)"
      >
        {{ f.label }}
      </button>
    </div>
  </div>
</template>
