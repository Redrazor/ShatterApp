import { computed } from 'vue'
import { useCharactersStore } from '../stores/characters.ts'
import { usePublishedProfilesStore } from '../stores/publishedProfiles.ts'
import type { Character } from '../types/index.ts'

export function useAllCharacters() {
  const charStore = useCharactersStore()
  const publishedStore = usePublishedProfilesStore()

  const allCharacters = computed<Character[]>(() => [
    ...charStore.characters,
    ...publishedStore.visibleProfiles,
  ])

  return { allCharacters }
}
