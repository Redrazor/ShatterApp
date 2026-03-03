<script setup lang="ts">
import type { Character } from '../../types/index.ts'
import UnitCard from '../ui/UnitCard.vue'

defineProps<{
  characters: Character[]
  ownedSwpSet: Set<string>
  favoritedSet?: Set<number>
  compareIds?: Set<number>
}>()

defineEmits<{
  (e: 'select', char: Character): void
  (e: 'toggle-favorite', char: Character): void
  (e: 'toggle-compare', char: Character): void
}>()
</script>

<template>
  <div v-if="characters.length === 0" class="py-16 text-center text-sw-text/40">
    No units match your filters.
  </div>
  <div
    v-else
    class="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-4"
  >
    <UnitCard
      v-for="char in characters"
      :key="char.id"
      :character="char"
      :owned="ownedSwpSet.has(char.swpCode ?? '')"
      :favorited="favoritedSet?.has(char.id)"
      :comparing="compareIds?.has(char.id)"
      @click="$emit('select', char)"
      @toggle-favorite="$emit('toggle-favorite', char)"
      @toggle-compare="$emit('toggle-compare', char)"
    />
  </div>
</template>
