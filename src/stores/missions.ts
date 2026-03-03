import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Mission } from '../types/index.ts'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export const useMissionsStore = defineStore('missions', () => {
  const missions = ref<Mission[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    if (missions.value.length > 0) return
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/missions`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      missions.value = await res.json()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  return { missions, loading, error, load }
})
