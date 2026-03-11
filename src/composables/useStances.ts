import { ref } from 'vue'

export interface StanceStat {
  stanceNumber: number
  stanceName: string
  ranged: { range: number | null; attack: number | null; defense: number } | null
  melee: { attack: number | null; defense: number } | null
}

export interface StanceEntry {
  characterId: number
  name: string
  swpCode: string
  stances: StanceStat[]
}

const stancesCache = ref<Record<string, StanceEntry>>({})
let loaded = false

export function useStances() {
  if (!loaded) {
    loaded = true
    fetch('/data/stances.json')
      .then(r => r.ok ? r.json() : {})
      .then(data => { stancesCache.value = data })
      .catch(() => {})
  }

  function getStances(id: number): StanceEntry | null {
    return stancesCache.value[String(id)] ?? null
  }

  return { getStances }
}
