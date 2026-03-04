import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ErrataEntry {
  version: string
  date: string
  cardArtCurrent: boolean
  changes: string[]
}

export const useErrataStore = defineStore('errata', () => {
  const data = ref<Record<string, ErrataEntry[]>>({})
  const loaded = ref(false)

  async function load() {
    if (loaded.value) return
    const res = await fetch('/data/errata.json')
    data.value = await res.json()
    loaded.value = true
  }

  function getErrata(characterId: number): ErrataEntry[] {
    return data.value[String(characterId)] ?? []
  }

  function isCardArtCurrent(characterId: number): boolean | null {
    const entries = getErrata(characterId)
    if (entries.length === 0) return null
    return entries[0].cardArtCurrent
  }

  return { load, getErrata, isCardArtCurrent }
})
