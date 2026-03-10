import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Character } from '../types/index.ts'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export const useCharactersStore = defineStore('characters', () => {
  const characters = ref<Character[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    if (characters.value.length > 0) return
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/characters`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      characters.value = await res.json()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  function charactersBySwp(swpCode: string): Character[] {
    return characters.value.filter(c => c.swpCode === swpCode)
  }

  return { characters, loading, error, load, charactersBySwp }
})
