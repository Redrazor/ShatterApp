import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCollectionStore = defineStore(
  'collection',
  () => {
    const owned = ref<string[]>([])

    const ownedSwpSet = computed(() => new Set(owned.value))

    function isOwned(swp: string): boolean {
      return ownedSwpSet.value.has(swp)
    }

    function toggleOwned(swp: string): void {
      const idx = owned.value.indexOf(swp)
      if (idx === -1) {
        owned.value.push(swp)
      } else {
        owned.value.splice(idx, 1)
      }
    }

    function importOwned(newOwned: string[]): void {
      owned.value = [...newOwned]
    }

    return { owned, ownedSwpSet, isOwned, toggleOwned, importOwned }
  },
  { persist: true },
)
