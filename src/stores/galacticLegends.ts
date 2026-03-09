import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GalacticLegend } from '../types/index.ts'

export const useGalacticLegendsStore = defineStore('galacticLegends', () => {
  const legends = ref<GalacticLegend[]>([])
  const loading = ref(false)

  async function load() {
    if (legends.value.length > 0) return
    loading.value = true
    try {
      const res = await fetch('/data/galactic-legends.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      legends.value = await res.json()
    } catch {
      // silently ignore — store remains empty
    } finally {
      loading.value = false
    }
  }

  return { legends, loading, load }
})
