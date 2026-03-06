import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { KoMission } from '../types/index.ts'

export const useKoMissionsStore = defineStore('koMissions', () => {
  const missions = ref<KoMission[]>([])
  const loading = ref(false)

  async function load() {
    if (missions.value.length > 0) return
    loading.value = true
    try {
      const res = await fetch('/data/ko-missions.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      missions.value = await res.json()
    } catch {
      // silently ignore — store remains empty
    } finally {
      loading.value = false
    }
  }

  return { missions, loading, load }
})
