import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LegendaryMission, GalacticLegend } from '../types/index.ts'

export const useLegendaryStore = defineStore(
  'legendary',
  () => {
    const selectedMission = ref<LegendaryMission | null>(null)
    const selectedGalacticLegend = ref<GalacticLegend | null>(null)

    // Victory Tracker: 0 = not started, 1–9 = current position
    const victoryPosition = ref(0)

    // GL Order Deck — track which cards have been used (by id)
    const usedOrderCardIds = ref<string[]>([])
    const shatterpointRevealed = ref(false)

    // Force pools
    const cadre1Force = ref(0)
    const cadre2Force = ref(0)
    const legendForce = ref(0)

    // Turn tracking
    const turnPhase = ref<'cadre1' | 'cadre2' | 'legend'>('cadre1')
    const roundNumber = ref(1)

    // ── Computed ──────────────────────────────────────────────
    const alertLevel = computed<'green' | 'yellow' | 'red'>(() => {
      if (victoryPosition.value <= 2) return 'green'
      if (victoryPosition.value <= 5) return 'yellow'
      return 'red'
    })

    const cadreForceRefresh = computed(() => {
      if (alertLevel.value === 'green') return 0
      if (alertLevel.value === 'yellow') return 1
      return 2
    })

    const remainingOrderCards = computed(() => {
      if (!selectedGalacticLegend.value) return []
      return selectedGalacticLegend.value.orderCards.filter(
        (c) => !usedOrderCardIds.value.includes(c.id),
      )
    })

    const legendaryOver = computed(() => victoryPosition.value >= 8)

    const legendaryInGame = computed(
      () => !!selectedMission.value && !!selectedGalacticLegend.value,
    )

    // ── Actions ──────────────────────────────────────────────
    function selectMission(m: LegendaryMission) {
      selectedMission.value = m
      cadre1Force.value = m.cadreForce
      cadre2Force.value = m.cadreForce
    }

    function selectGalacticLegend(gl: GalacticLegend) {
      selectedGalacticLegend.value = gl
      legendForce.value = gl.force
      usedOrderCardIds.value = []
      shatterpointRevealed.value = false
    }

    function advanceVictory(n = 1) {
      victoryPosition.value = Math.min(8, victoryPosition.value + n)
    }

    function retreatVictory(n = 1) {
      victoryPosition.value = Math.max(0, victoryPosition.value - n)
    }

    function useOrderCard(id: string) {
      if (!usedOrderCardIds.value.includes(id)) {
        usedOrderCardIds.value.push(id)
      }
    }

    function restoreOrderCard(id: string) {
      usedOrderCardIds.value = usedOrderCardIds.value.filter((i) => i !== id)
    }

    function refreshOrderDeck() {
      usedOrderCardIds.value = []
      shatterpointRevealed.value = false
    }

    function nextTurnPhase(incrementRound = false) {
      if (turnPhase.value === 'cadre1') turnPhase.value = 'cadre2'
      else if (turnPhase.value === 'cadre2') turnPhase.value = 'legend'
      else {
        turnPhase.value = 'cadre1'
        if (incrementRound) roundNumber.value++
      }
    }

    function adjustForce(player: 'cadre1' | 'cadre2' | 'legend', delta: number) {
      if (player === 'cadre1') cadre1Force.value = Math.max(0, cadre1Force.value + delta)
      else if (player === 'cadre2') cadre2Force.value = Math.max(0, cadre2Force.value + delta)
      else legendForce.value = Math.max(0, legendForce.value + delta)
    }

    function resetLegendary() {
      selectedMission.value = null
      selectedGalacticLegend.value = null
      victoryPosition.value = 0
      usedOrderCardIds.value = []
      shatterpointRevealed.value = false
      cadre1Force.value = 0
      cadre2Force.value = 0
      legendForce.value = 0
      turnPhase.value = 'cadre1'
      roundNumber.value = 1
    }

    return {
      selectedMission,
      selectedGalacticLegend,
      victoryPosition,
      usedOrderCardIds,
      shatterpointRevealed,
      cadre1Force,
      cadre2Force,
      legendForce,
      turnPhase,
      roundNumber,
      alertLevel,
      cadreForceRefresh,
      remainingOrderCards,
      legendaryOver,
      legendaryInGame,
      selectMission,
      selectGalacticLegend,
      advanceVictory,
      retreatVictory,
      useOrderCard,
      restoreOrderCard,
      refreshOrderDeck,
      nextTurnPhase,
      adjustForce,
      resetLegendary,
    }
  },
  { persist: true },
)
