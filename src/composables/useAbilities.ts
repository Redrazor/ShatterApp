import { ref } from 'vue'

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

  function getAbilities(id: number): AbilityEntry | null {
    return abilitiesCache.value[String(id)] ?? null
  }

  return { getAbilities }
}
