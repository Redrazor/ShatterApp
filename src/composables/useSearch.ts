import { computed, type Ref } from 'vue'
import type { Character } from '../types/index.ts'

export interface SearchFilters {
  query: string
  type: 'Primary' | 'Secondary' | 'Support' | ''
  era: string
  tags: string[]
  swpFilter: string
  ownedOnly: boolean
  favoritesOnly: boolean
  favoritedSet: Set<number>
  ownedSwpSet: Set<string>
}

export function useSearch(characters: Ref<Character[]>, filters: Ref<SearchFilters>) {
  const results = computed<Character[]>(() => {
    const { query, type, era, tags, swpFilter, ownedOnly, favoritesOnly, favoritedSet, ownedSwpSet } = filters.value
    const q = query.toLowerCase().trim()

    return characters.value.filter((char) => {
      if (q) {
        const nameMatch = char.name.toLowerCase().includes(q)
        const tagMatch = char.tags.some((t) => t.toLowerCase().includes(q))
        if (!nameMatch && !tagMatch) return false
      }

      if (type && char.unitType !== type) return false

      if (era && !char.era.split(';').map((e) => e.trim()).includes(era)) return false

      if (tags.length > 0) {
        const charTagSet = new Set(char.tags.map((t) => t.toLowerCase()))
        const allTagsMatch = tags.every((t) => charTagSet.has(t.toLowerCase()))
        if (!allTagsMatch) return false
      }

      if (swpFilter && char.swpCode !== swpFilter) return false

      if (ownedOnly && !ownedSwpSet.has(char.swpCode ?? '')) return false

      if (favoritesOnly && !favoritedSet.has(char.id)) return false

      return true
    })
  })

  return { results }
}
