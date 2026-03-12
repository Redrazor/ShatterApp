import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCollectionStore = defineStore(
  'collection',
  () => {
    const owned = ref<string[]>([])
    const ownedCharacterIds = ref<number[]>([])

    const ownedSwpSet = computed(() => new Set(owned.value))
    const ownedCharacterSet = computed(() => new Set(ownedCharacterIds.value))

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

    function isCharacterOwned(id: number): boolean {
      return ownedCharacterSet.value.has(id)
    }

    function toggleCharacterOwned(id: number): void {
      const idx = ownedCharacterIds.value.indexOf(id)
      if (idx === -1) {
        ownedCharacterIds.value.push(id)
      } else {
        ownedCharacterIds.value.splice(idx, 1)
      }
    }

    function importOwned(newOwned: string[]): void {
      owned.value = [...newOwned]
    }

    function importCharacterOwned(ids: number[]): void {
      ownedCharacterIds.value = [...ids]
    }

    return {
      owned,
      ownedSwpSet,
      ownedCharacterIds,
      ownedCharacterSet,
      isOwned,
      toggleOwned,
      isCharacterOwned,
      toggleCharacterOwned,
      importOwned,
      importCharacterOwned,
    }
  },
  { persist: true },
)
