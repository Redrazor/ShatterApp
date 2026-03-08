import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LegendaryMission } from '../types/index.ts'

export const useLegendaryMissionsStore = defineStore('legendaryMissions', () => {
  const missions = ref<LegendaryMission[]>([])
  const loading = ref(false)

  async function load() {
    if (missions.value.length > 0) return
    loading.value = true
    try {
      const res = await fetch('/data/legendary-missions.json')
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
