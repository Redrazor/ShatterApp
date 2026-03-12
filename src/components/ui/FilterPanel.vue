<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SearchFilters } from '../../composables/useSearch.ts'
import KeywordChip from './KeywordChip.vue'

const props = defineProps<{
  filters: SearchFilters
  eras: string[]
  allTags?: string[]
}>()

const emit = defineEmits<{
  (e: 'update:filters', val: SearchFilters): void
}>()

function update(partial: Partial<SearchFilters>) {
  emit('update:filters', { ...props.filters, ...partial })
}

function removeTag(tag: string) {
  update({ tags: props.filters.tags.filter(t => t !== tag) })
}

// Tag type-ahead
const tagInput = ref('')
const tagSuggestions = computed(() => {
  const q = tagInput.value.toLowerCase().trim()
  if (!q) return []
  const selected = new Set(props.filters.tags.map(t => t.toLowerCase()))
  return (props.allTags ?? [])
    .filter(t => t.toLowerCase().includes(q) && !selected.has(t.toLowerCase()))
    .slice(0, 8)
})

function addTag(tag: string) {
  if (!props.filters.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())) {
    update({ tags: [...props.filters.tags, tag] })
  }
  tagInput.value = ''
}
</script>

<template>
  <div class="space-y-2">
  <div class="flex flex-wrap gap-3">
    <!-- Unit type -->
    <div class="flex gap-1">
      <button
        v-for="t in ['', 'Primary', 'Secondary', 'Support']"
        :key="t"
        :class="[
          'rounded px-3 py-1 text-sm font-medium transition-colors',
          filters.type === t
            ? 'bg-sw-gold text-sw-dark'
            : 'border border-sw-gold/30 text-sw-text hover:border-sw-gold',
        ]"
        @click="update({ type: t as SearchFilters['type'] })"
      >
        {{ t || 'All' }}
      </button>
    </div>

    <!-- Era -->
    <select
      class="rounded border border-sw-gold/30 bg-sw-dark px-2 py-1 text-sm text-sw-text focus:border-sw-gold focus:outline-none"
      :value="filters.era"
      @change="update({ era: ($event.target as HTMLSelectElement).value })"
    >
      <option value="">All Eras</option>
      <option v-for="era in eras" :key="era" :value="era">{{ era }}</option>
    </select>

    <!-- Owned only -->
    <button
      class="rounded-full border px-3 py-1.5 text-sm font-semibold transition-all active:scale-95"
      :class="filters.ownedOnly
        ? 'border-sw-gold bg-sw-gold/20 text-sw-gold'
        : 'border-sw-gold/30 text-sw-text/60 hover:border-sw-gold/60 hover:text-sw-text'"
      @click="update({ ownedOnly: !filters.ownedOnly })"
    >✓ Owned only</button>

    <!-- Favorites only -->
    <button
      class="rounded-full border px-3 py-1.5 text-sm font-semibold transition-all active:scale-95"
      :class="filters.favoritesOnly
        ? 'border-red-400 bg-red-400/20 text-red-400'
        : 'border-sw-gold/30 text-sw-text/60 hover:border-sw-gold/60 hover:text-sw-text'"
      @click="update({ favoritesOnly: !filters.favoritesOnly })"
    >♥ Favorites</button>
  </div>

  <!-- Tag type-ahead input -->
  <div v-if="allTags && allTags.length > 0" class="relative">
    <input
      v-model="tagInput"
      type="text"
      placeholder="Filter by tag…"
      class="w-full rounded border border-sw-gold/30 bg-sw-dark px-2 py-1 text-sm text-sw-text placeholder-sw-text/30 focus:border-sw-gold focus:outline-none"
    />
    <ul
      v-if="tagSuggestions.length > 0"
      class="absolute z-20 mt-1 w-full rounded border border-sw-gold/30 bg-sw-card shadow-lg"
    >
      <li
        v-for="tag in tagSuggestions"
        :key="tag"
        class="cursor-pointer px-3 py-1.5 text-sm text-sw-text hover:bg-sw-gold/10"
        @click="addTag(tag)"
      >
        {{ tag }}
      </li>
    </ul>
  </div>

  <!-- Active tag chips -->
  <div v-if="filters.tags.length > 0" class="flex flex-wrap gap-1">
    <KeywordChip
      v-for="tag in filters.tags"
      :key="tag"
      :tag="tag"
      variant="filter"
      @remove="removeTag"
    />
  </div>
  </div>
</template>
