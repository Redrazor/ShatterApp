import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    // Collection
    const autoMarkUnitsOwned = ref(false)
    const showPaintedToggle = ref(false)
    const showBasedToggle = ref(false)

    // Roll tab
    const showRollTab = ref(true)

    // Play view sections
    const playShowRoster = ref(true)
    const playShowTracker = ref(true)
    const playShowDice = ref(true)

    return {
      autoMarkUnitsOwned,
      showPaintedToggle,
      showBasedToggle,
      showRollTab,
      playShowRoster,
      playShowTracker,
      playShowDice,
    }
  },
  { persist: true },
)
