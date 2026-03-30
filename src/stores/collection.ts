import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCollectionStore = defineStore(
  'collection',
  () => {
    const owned = ref<string[]>([])
    const ownedCharacterIds = ref<number[]>([])
    const paintedCharacterIds = ref<number[]>([])
    const basedCharacterIds = ref<number[]>([])

    const ownedSwpSet = computed(() => new Set(owned.value))
    const ownedCharacterSet = computed(() => new Set(ownedCharacterIds.value))
    const paintedCharacterSet = computed(() => new Set(paintedCharacterIds.value))
    const basedCharacterSet = computed(() => new Set(basedCharacterIds.value))

    function isOwned(swp: string): boolean {
      return ownedSwpSet.value.has(swp)
    }

    function toggleOwned(swp: string, characterIds?: number[]): void {
      const idx = owned.value.indexOf(swp)
      if (idx === -1) {
        owned.value.push(swp)
        if (characterIds) {
          for (const id of characterIds) {
            if (!ownedCharacterIds.value.includes(id)) {
              ownedCharacterIds.value.push(id)
            }
          }
        }
      } else {
        owned.value.splice(idx, 1)
        if (characterIds) {
          for (const id of characterIds) {
            const cidx = ownedCharacterIds.value.indexOf(id)
            if (cidx !== -1) ownedCharacterIds.value.splice(cidx, 1)
          }
        }
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

    function isPainted(id: number): boolean {
      return paintedCharacterSet.value.has(id)
    }

    function toggleCharacterPainted(id: number): void {
      const idx = paintedCharacterIds.value.indexOf(id)
      if (idx === -1) {
        paintedCharacterIds.value.push(id)
      } else {
        paintedCharacterIds.value.splice(idx, 1)
      }
    }

    function isBased(id: number): boolean {
      return basedCharacterSet.value.has(id)
    }

    function toggleCharacterBased(id: number): void {
      const idx = basedCharacterIds.value.indexOf(id)
      if (idx === -1) {
        basedCharacterIds.value.push(id)
      } else {
        basedCharacterIds.value.splice(idx, 1)
      }
    }

    function importOwned(newOwned: string[]): void {
      owned.value = [...newOwned]
    }

    function importCharacterOwned(ids: number[]): void {
      ownedCharacterIds.value = [...ids]
    }

    function importPainted(ids: number[]): void {
      paintedCharacterIds.value = [...ids]
    }

    function importBased(ids: number[]): void {
      basedCharacterIds.value = [...ids]
    }

    return {
      owned,
      ownedSwpSet,
      ownedCharacterIds,
      ownedCharacterSet,
      paintedCharacterIds,
      paintedCharacterSet,
      basedCharacterIds,
      basedCharacterSet,
      isOwned,
      toggleOwned,
      isCharacterOwned,
      toggleCharacterOwned,
      isPainted,
      toggleCharacterPainted,
      isBased,
      toggleCharacterBased,
      importOwned,
      importCharacterOwned,
      importPainted,
      importBased,
    }
  },
  { persist: true },
)
