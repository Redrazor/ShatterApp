<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCharactersStore } from '../stores/characters.ts'
import { useCollectionStore } from '../stores/collection.ts'
import { useFavoritesStore } from '../stores/favorites.ts'
import { useSearch } from '../composables/useSearch.ts'
import type { SearchFilters } from '../composables/useSearch.ts'
import SearchBar from '../components/ui/SearchBar.vue'
import FilterPanel from '../components/ui/FilterPanel.vue'
import BrowseGrid from '../components/browse/BrowseGrid.vue'
import CompareModal from '../components/browse/CompareModal.vue'
import type { Character } from '../types/index.ts'

const router = useRouter()
const route  = useRoute()
const characterStore = useCharactersStore()
const collectionStore = useCollectionStore()
const favoritesStore = useFavoritesStore()

onMounted(() => characterStore.load())

const filters = ref<SearchFilters>({
  query: '',
  type: '',
  era: '',
  tags: [],
  swpFilter: '',
  ownedOnly: false,
  favoritesOnly: false,
  favoritedSet: new Set(),
  ownedSwpSet: collectionStore.ownedSwpSet,
})

const liveFilters = computed<SearchFilters>(() => ({
  ...filters.value,
  ownedSwpSet: collectionStore.ownedSwpSet,
  favoritedSet: favoritesStore.favoritedSet,
}))

const { results } = useSearch(computed(() => characterStore.characters), liveFilters)

const eras = computed(() => {
  const set = new Set(
    characterStore.characters.flatMap((c) => c.era.split(';').map((e) => e.trim())).filter(Boolean)
  )
  return [...set].sort()
})

const allTags = computed(() => {
  const set = new Set(characterStore.characters.flatMap((c) => c.tags))
  return [...set].sort()
})

const panelOpen = computed(() => !!route.params.id)

function openProfile(char: { id: number }) {
  router.push(`/browse/${char.id}`)
}

function closePanel() {
  router.push('/browse')
}

// Compare
const compareMode = ref(false)
const compareIds = ref(new Set<number>())
const showCompareModal = ref(false)

function toggleCompareMode() {
  compareMode.value = !compareMode.value
  if (!compareMode.value) {
    compareIds.value = new Set()
    showCompareModal.value = false
  }
}

function toggleCompare(char: { id: number }) {
  const next = new Set(compareIds.value)
  if (next.has(char.id)) {
    next.delete(char.id)
  } else {
    if (next.size >= 3) next.clear()
    next.add(char.id)
  }
  compareIds.value = next
}

function handleSelect(char: { id: number }) {
  if (compareMode.value) {
    toggleCompare(char)
  } else {
    openProfile(char)
  }
}

const compareChars = computed(() =>
  [...compareIds.value].map(id => characterStore.characters.find(c => c.id === id)).filter(Boolean)
)

watch(
  () => route.query.tag,
  (tag) => {
    filters.value.tags = tag ? [tag as string] : []
  },
  { immediate: true }
)

watch(
  () => route.query.swp,
  (swp) => {
    filters.value.swpFilter = swp ? (swp as string) : ''
  },
  { immediate: true }
)

function updateFilters(newFilters: SearchFilters) {
  filters.value = newFilters
  const query: Record<string, string> = {}
  if (newFilters.tags.length > 0) query.tag = newFilters.tags[0]
  if (newFilters.swpFilter) query.swp = newFilters.swpFilter
  router.replace({ query })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-bold text-sw-gold">Units</h1>
      <span class="text-sm text-sw-text/50">({{ results.length }})</span>
      <div class="flex-1" />
      <button
        :class="['rounded-lg px-3 py-1 text-xs font-semibold transition-colors',
          compareMode
            ? 'bg-sw-gold text-sw-dark'
            : 'border border-sw-gold/30 text-sw-text/60 hover:border-sw-gold hover:text-sw-text']"
        @click="toggleCompareMode"
      >⚖ Compare</button>
    </div>
    <!-- Compare mode hint -->
    <div v-if="compareMode" class="flex items-center gap-3 rounded-lg border border-sw-gold/20 bg-sw-gold/5 px-3 py-2 text-xs text-sw-text/60">
      <span>{{ compareIds.size === 0 ? 'Select 2 or 3 units to compare.' : compareIds.size === 1 ? 'Select 1 or 2 more units.' : `${compareIds.size} units selected.` }}</span>
      <button
        v-if="compareIds.size >= 2"
        class="ml-auto rounded-lg bg-sw-gold px-3 py-1 text-xs font-semibold text-sw-dark"
        @click="showCompareModal = true"
      >Compare</button>
    </div>

    <!-- Loading / Error -->
    <div v-if="characterStore.loading" class="py-16 text-center text-sw-text/50">Loading…</div>
    <div v-else-if="characterStore.error" class="py-8 text-center text-red-400">{{ characterStore.error }}</div>

    <template v-else>
      <div class="space-y-3">
        <SearchBar v-model="filters.query" />
        <FilterPanel :filters="filters" :eras="eras" :all-tags="allTags" @update:filters="updateFilters" />
      </div>
      <BrowseGrid
        :characters="results"
        :owned-swp-set="collectionStore.ownedSwpSet"
        :favorited-set="favoritesStore.favoritedSet"
        :compare-ids="compareIds"
        @select="handleSelect"
        @toggle-favorite="(char: Character) => favoritesStore.toggleFavorite(char.id)"
        @toggle-compare="toggleCompare"
      />
    </template>
  </div>

  <!-- Overlay (click outside to close) — desktop only, panel fills screen on mobile -->
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="panelOpen"
        class="fixed inset-0 z-40 hidden bg-black/50 backdrop-blur-sm md:block"
        @click="closePanel"
      />
    </Transition>

    <!-- Slide-in panel -->
    <RouterView v-slot="{ Component }">
      <Transition name="slide">
        <component :is="Component" :key="String(route.params.id)" />
      </Transition>
    </RouterView>

    <!-- Compare modal -->
    <CompareModal
      v-if="showCompareModal && compareChars.length >= 2"
      :chars="compareChars as Character[]"
      @close="showCompareModal = false"
    />
  </Teleport>
</template>

<style scoped>
/* Overlay fade */
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.25s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }

/* Panel slides in from the left */
.slide-enter-active, .slide-leave-active { transition: transform 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(-100%); }
</style>
