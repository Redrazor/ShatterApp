import { ref, computed } from 'vue'
import { usePublishedProfilesStore } from '../stores/publishedProfiles.ts'

export interface Ability {
  name: string
  type: string
  cost: number | null
  description: string
}

export interface AbilityEntry {
  characterId: number
  name: string
  swpCode: string
  abilities: Ability[]
}

const abilitiesCache = ref<Record<string, AbilityEntry>>({})
let loaded = false

export function useAbilities() {
  if (!loaded) {
    loaded = true
    fetch('/data/abilities.json')
      .then(r => r.ok ? r.json() : {})
      .then(data => { abilitiesCache.value = data })
      .catch(() => {})
  }

  const publishedStore = usePublishedProfilesStore()

  function getAbilities(id: number): AbilityEntry | null {
    // Check official abilities first, then custom published abilities
    return abilitiesCache.value[String(id)] ?? publishedStore.abilities[id] ?? null
  }

  const allEntries = computed(() => [
    ...Object.values(abilitiesCache.value),
    ...Object.values(publishedStore.abilities),
  ])

  return { getAbilities, allEntries }
}
