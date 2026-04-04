import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    // Collection
    const autoMarkUnitsOwned = ref(false)
    const showPaintedToggle = ref(false)
    const showBasedToggle = ref(false)

    // Custom tab
    const showCustomTab = ref(true)

    // Roll tab
    const showRollTab = ref(true)
    const showProbabilityRoller = ref(false)

    // Play view sections
    const playShowRoster = ref(true)
    const playShowTracker = ref(true)
    const playShowDice = ref(true)
    const playShowOrderDeck = ref(true)

    watch(showRollTab, (enabled) => {
      if (!enabled) showProbabilityRoller.value = false
    })

    return {
      showCustomTab,
      autoMarkUnitsOwned,
      showPaintedToggle,
      showBasedToggle,
      showRollTab,
      showProbabilityRoller,
      playShowRoster,
      playShowTracker,
      playShowDice,
      playShowOrderDeck,
    }
  },
  { persist: true },
)
