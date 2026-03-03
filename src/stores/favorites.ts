import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFavoritesStore = defineStore(
  'favorites',
  () => {
    const favoritedIds = ref<number[]>([])

    const favoritedSet = computed(() => new Set(favoritedIds.value))

    function isFavorited(id: number): boolean {
      return favoritedSet.value.has(id)
    }

    function toggleFavorite(id: number): void {
      const idx = favoritedIds.value.indexOf(id)
      if (idx === -1) {
        favoritedIds.value.push(id)
      } else {
        favoritedIds.value.splice(idx, 1)
      }
    }

    return { favoritedIds, favoritedSet, isFavorited, toggleFavorite }
  },
  { persist: true },
)
