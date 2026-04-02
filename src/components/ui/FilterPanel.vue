<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SearchFilters } from '../../composables/useSearch.ts'
import KeywordChip from './KeywordChip.vue'

const advancedOpen = ref(false)

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

function parseNum(val: string): number | null {
  const n = parseInt(val, 10)
  return isNaN(n) ? null : n
}

function toggleForce(v: number) {
  const current = props.filters.forceValues
  const next = current.includes(v) ? current.filter(x => x !== v) : [...current, v]
  update({ forceValues: next })
}

const hasAdvancedFilters = computed(() =>
  props.filters.pcMin !== null || props.filters.pcMax !== null ||
  props.filters.forceValues.length > 0 ||
  props.filters.staminaMin !== null || props.filters.staminaMax !== null ||
  props.filters.durabilityMin !== null || props.filters.durabilityMax !== null
)

function clearAdvanced() {
  update({ pcMin: null, pcMax: null, forceValues: [], staminaMin: null, staminaMax: null, durabilityMin: null, durabilityMax: null })
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

  <!-- Advanced filters toggle -->
  <div>
    <button
      class="flex items-center gap-1 text-xs transition-colors"
      :class="hasAdvancedFilters ? 'text-sw-gold' : 'text-sw-text/40 hover:text-sw-text/70'"
      @click="advancedOpen = !advancedOpen"
    >
      <span>{{ advancedOpen ? '▾' : '▸' }}</span>
      <span>Advanced filters</span>
      <span v-if="hasAdvancedFilters" class="ml-1 rounded-full bg-sw-gold/20 px-1.5 py-0.5 text-[10px] text-sw-gold">active</span>
    </button>

    <div v-if="advancedOpen" class="mt-2 space-y-3 rounded-lg border border-sw-gold/15 bg-sw-dark/50 p-3">

      <!-- PC range -->
      <div>
        <label class="mb-1 block text-xs text-sw-text/50">Squad Points (PC)</label>
        <div class="flex items-center gap-2">
          <input
            type="number"
            min="1" max="20"
            placeholder="Min"
            :value="filters.pcMin ?? ''"
            class="w-20 rounded border border-sw-gold/20 bg-sw-dark px-2 py-1 text-xs text-sw-text placeholder-sw-text/30 focus:border-sw-gold focus:outline-none"
            @input="update({ pcMin: parseNum(($event.target as HTMLInputElement).value) })"
          />
          <span class="text-xs text-sw-text/30">–</span>
          <input
            type="number"
            min="1" max="20"
            placeholder="Max"
            :value="filters.pcMax ?? ''"
            class="w-20 rounded border border-sw-gold/20 bg-sw-dark px-2 py-1 text-xs text-sw-text placeholder-sw-text/30 focus:border-sw-gold focus:outline-none"
            @input="update({ pcMax: parseNum(($event.target as HTMLInputElement).value) })"
          />
        </div>
      </div>

      <!-- Force value -->
      <div>
        <label class="mb-1 block text-xs text-sw-text/50">Force</label>
        <div class="flex gap-1">
          <button
            v-for="v in [0, 1, 2, 3, 4]"
            :key="v"
            class="rounded px-2.5 py-1 text-xs font-medium transition-colors"
            :class="filters.forceValues.includes(v)
              ? 'bg-sw-blue/30 text-sw-blue border border-sw-blue/50'
              : 'border border-sw-gold/20 text-sw-text/50 hover:border-sw-gold/40 hover:text-sw-text/80'"
            @click="toggleForce(v)"
          >
            {{ v }}
          </button>
        </div>
      </div>

      <!-- Stamina range -->
      <div>
        <label class="mb-1 block text-xs text-sw-text/50">Stamina</label>
        <div class="flex items-center gap-2">
          <input
            type="number"
            min="1" max="20"
            placeholder="Min"
            :value="filters.staminaMin ?? ''"
            class="w-20 rounded border border-sw-gold/20 bg-sw-dark px-2 py-1 text-xs text-sw-text placeholder-sw-text/30 focus:border-sw-gold focus:outline-none"
            @input="update({ staminaMin: parseNum(($event.target as HTMLInputElement).value) })"
          />
          <span class="text-xs text-sw-text/30">–</span>
          <input
            type="number"
            min="1" max="20"
            placeholder="Max"
            :value="filters.staminaMax ?? ''"
            class="w-20 rounded border border-sw-gold/20 bg-sw-dark px-2 py-1 text-xs text-sw-text placeholder-sw-text/30 focus:border-sw-gold focus:outline-none"
            @input="update({ staminaMax: parseNum(($event.target as HTMLInputElement).value) })"
          />
        </div>
      </div>

      <!-- Durability range -->
      <div>
        <label class="mb-1 block text-xs text-sw-text/50">Durability</label>
        <div class="flex items-center gap-2">
          <input
            type="number"
            min="1" max="10"
            placeholder="Min"
            :value="filters.durabilityMin ?? ''"
            class="w-20 rounded border border-sw-gold/20 bg-sw-dark px-2 py-1 text-xs text-sw-text placeholder-sw-text/30 focus:border-sw-gold focus:outline-none"
            @input="update({ durabilityMin: parseNum(($event.target as HTMLInputElement).value) })"
          />
          <span class="text-xs text-sw-text/30">–</span>
          <input
            type="number"
            min="1" max="10"
            placeholder="Max"
            :value="filters.durabilityMax ?? ''"
            class="w-20 rounded border border-sw-gold/20 bg-sw-dark px-2 py-1 text-xs text-sw-text placeholder-sw-text/30 focus:border-sw-gold focus:outline-none"
            @input="update({ durabilityMax: parseNum(($event.target as HTMLInputElement).value) })"
          />
        </div>
      </div>

      <!-- Clear advanced -->
      <button
        v-if="hasAdvancedFilters"
        class="text-xs text-sw-text/40 hover:text-red-400 transition-colors"
        @click="clearAdvanced"
      >
        Clear advanced filters
      </button>
    </div>
  </div>

  </div>
</template>
