import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useLegendaryStore } from '../../../src/stores/legendary.ts'
import type { LegendaryMission, GalacticLegend } from '../../../src/types/index.ts'

const mockMission: LegendaryMission = {
  id: 1,
  name: 'Test Mission',
  cadreForce: 3,
  squadPointLimit: 10,
}

const mockGL: GalacticLegend = {
  id: 'maul',
  name: 'Maul',
  force: 5,
  orderCards: [
    { id: 'card-1', name: 'Relentless', forceRefresh: 2, effect: 'Move twice.', legendAbility: 'Rage' },
    { id: 'card-2', name: 'Strike', forceRefresh: 0, effect: 'Attack.', legendAbility: 'Fury' },
  ],
}

describe('useLegendaryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ── Initial state ──────────────────────────────────────────────────────────

  it('starts with no mission or GL selected', () => {
    const store = useLegendaryStore()
    expect(store.selectedMission).toBeNull()
    expect(store.selectedGalacticLegend).toBeNull()
  })

  it('starts with victoryPosition at 0', () => {
    const store = useLegendaryStore()
    expect(store.victoryPosition).toBe(0)
  })

  it('starts with alertLevel green', () => {
    const store = useLegendaryStore()
    expect(store.alertLevel).toBe('green')
  })

  it('starts with cadreForceRefresh 0 (Condition Green)', () => {
    const store = useLegendaryStore()
    expect(store.cadreForceRefresh).toBe(0)
  })

  it('starts with turnPhase cadre1', () => {
    const store = useLegendaryStore()
    expect(store.turnPhase).toBe('cadre1')
  })

  it('starts at round 1', () => {
    const store = useLegendaryStore()
    expect(store.roundNumber).toBe(1)
  })

  it('legendaryInGame is false without selection', () => {
    const store = useLegendaryStore()
    expect(store.legendaryInGame).toBe(false)
  })

  // ── selectMission ──────────────────────────────────────────────────────────

  it('selectMission stores the mission', () => {
    const store = useLegendaryStore()
    store.selectMission(mockMission)
    expect(store.selectedMission).toEqual(mockMission)
  })

  it('selectMission initialises cadre force pools from mission', () => {
    const store = useLegendaryStore()
    store.selectMission(mockMission)
    expect(store.cadre1Force).toBe(3)
    expect(store.cadre2Force).toBe(3)
  })

  // ── selectGalacticLegend ───────────────────────────────────────────────────

  it('selectGalacticLegend stores the GL', () => {
    const store = useLegendaryStore()
    store.selectGalacticLegend(mockGL)
    expect(store.selectedGalacticLegend).toEqual(mockGL)
  })

  it('selectGalacticLegend initialises legend force from GL', () => {
    const store = useLegendaryStore()
    store.selectGalacticLegend(mockGL)
    expect(store.legendForce).toBe(5)
  })

  it('legendaryInGame is true when both mission and GL are selected', () => {
    const store = useLegendaryStore()
    store.selectMission(mockMission)
    store.selectGalacticLegend(mockGL)
    expect(store.legendaryInGame).toBe(true)
  })

  // ── Victory Tracker ────────────────────────────────────────────────────────

  it('advanceVictory increments position', () => {
    const store = useLegendaryStore()
    store.advanceVictory()
    expect(store.victoryPosition).toBe(1)
  })

  it('advanceVictory does not exceed 9', () => {
    const store = useLegendaryStore()
    for (let i = 0; i < 15; i++) store.advanceVictory()
    expect(store.victoryPosition).toBe(9)
  })

  it('retreatVictory decrements position', () => {
    const store = useLegendaryStore()
    store.advanceVictory(5)
    store.retreatVictory()
    expect(store.victoryPosition).toBe(4)
  })

  it('retreatVictory does not go below 0', () => {
    const store = useLegendaryStore()
    store.retreatVictory()
    expect(store.victoryPosition).toBe(0)
  })

  it('legendaryOver is true at position 9', () => {
    const store = useLegendaryStore()
    store.advanceVictory(9)
    expect(store.legendaryOver).toBe(true)
  })

  it('legendaryOver is false below position 9', () => {
    const store = useLegendaryStore()
    store.advanceVictory(8)
    expect(store.legendaryOver).toBe(false)
  })

  // ── Alert Levels ───────────────────────────────────────────────────────────

  it('alertLevel is green at positions 0–3', () => {
    const store = useLegendaryStore()
    for (const pos of [0, 1, 2, 3]) {
      store.victoryPosition = pos
      expect(store.alertLevel).toBe('green')
    }
  })

  it('alertLevel is yellow at positions 4–6', () => {
    const store = useLegendaryStore()
    for (const pos of [4, 5, 6]) {
      store.victoryPosition = pos
      expect(store.alertLevel).toBe('yellow')
    }
  })

  it('alertLevel is red at positions 7–9', () => {
    const store = useLegendaryStore()
    for (const pos of [7, 8, 9]) {
      store.victoryPosition = pos
      expect(store.alertLevel).toBe('red')
    }
  })

  it('cadreForceRefresh is 0 in green', () => {
    const store = useLegendaryStore()
    store.victoryPosition = 2
    expect(store.cadreForceRefresh).toBe(0)
  })

  it('cadreForceRefresh is 1 in yellow', () => {
    const store = useLegendaryStore()
    store.victoryPosition = 5
    expect(store.cadreForceRefresh).toBe(1)
  })

  it('cadreForceRefresh is 2 in red', () => {
    const store = useLegendaryStore()
    store.victoryPosition = 8
    expect(store.cadreForceRefresh).toBe(2)
  })

  // ── Order Deck ─────────────────────────────────────────────────────────────

  it('useOrderCard adds id to usedOrderCardIds', () => {
    const store = useLegendaryStore()
    store.useOrderCard('card-1')
    expect(store.usedOrderCardIds).toContain('card-1')
  })

  it('useOrderCard does not add duplicates', () => {
    const store = useLegendaryStore()
    store.useOrderCard('card-1')
    store.useOrderCard('card-1')
    expect(store.usedOrderCardIds.filter(id => id === 'card-1')).toHaveLength(1)
  })

  it('restoreOrderCard removes id from usedOrderCardIds', () => {
    const store = useLegendaryStore()
    store.useOrderCard('card-1')
    store.restoreOrderCard('card-1')
    expect(store.usedOrderCardIds).not.toContain('card-1')
  })

  it('refreshOrderDeck clears all used ids', () => {
    const store = useLegendaryStore()
    store.useOrderCard('card-1')
    store.useOrderCard('card-2')
    store.refreshOrderDeck()
    expect(store.usedOrderCardIds).toHaveLength(0)
  })

  it('remainingOrderCards excludes used cards', () => {
    const store = useLegendaryStore()
    store.selectGalacticLegend(mockGL)
    store.useOrderCard('card-1')
    expect(store.remainingOrderCards).toHaveLength(1)
    expect(store.remainingOrderCards[0].id).toBe('card-2')
  })

  // ── Turn Phase ─────────────────────────────────────────────────────────────

  it('nextTurnPhase advances cadre1 → cadre2', () => {
    const store = useLegendaryStore()
    store.nextTurnPhase(false)
    expect(store.turnPhase).toBe('cadre2')
  })

  it('nextTurnPhase advances cadre2 → legend', () => {
    const store = useLegendaryStore()
    store.nextTurnPhase(false)
    store.nextTurnPhase(false)
    expect(store.turnPhase).toBe('legend')
  })

  it('nextTurnPhase wraps legend → cadre1', () => {
    const store = useLegendaryStore()
    store.nextTurnPhase(false)
    store.nextTurnPhase(false)
    store.nextTurnPhase(false)
    expect(store.turnPhase).toBe('cadre1')
  })

  it('nextTurnPhase increments round on legend → cadre1 with flag', () => {
    const store = useLegendaryStore()
    store.nextTurnPhase(false)
    store.nextTurnPhase(false)
    store.nextTurnPhase(true)
    expect(store.roundNumber).toBe(2)
  })

  it('nextTurnPhase does not increment round without flag', () => {
    const store = useLegendaryStore()
    store.nextTurnPhase(false)
    store.nextTurnPhase(false)
    store.nextTurnPhase(false)
    expect(store.roundNumber).toBe(1)
  })

  // ── Force Pools ────────────────────────────────────────────────────────────

  it('adjustForce increments cadre1 force', () => {
    const store = useLegendaryStore()
    store.cadre1Force = 3
    store.adjustForce('cadre1', 2)
    expect(store.cadre1Force).toBe(5)
  })

  it('adjustForce decrements cadre2 force', () => {
    const store = useLegendaryStore()
    store.cadre2Force = 3
    store.adjustForce('cadre2', -1)
    expect(store.cadre2Force).toBe(2)
  })

  it('adjustForce does not let force go below 0', () => {
    const store = useLegendaryStore()
    store.adjustForce('legend', -10)
    expect(store.legendForce).toBe(0)
  })

  // ── Reset ──────────────────────────────────────────────────────────────────

  it('resetLegendary clears all state', () => {
    const store = useLegendaryStore()
    store.selectMission(mockMission)
    store.selectGalacticLegend(mockGL)
    store.advanceVictory(5)
    store.useOrderCard('card-1')
    store.nextTurnPhase(false)
    store.adjustForce('cadre1', 3)

    store.resetLegendary()

    expect(store.selectedMission).toBeNull()
    expect(store.selectedGalacticLegend).toBeNull()
    expect(store.victoryPosition).toBe(0)
    expect(store.usedOrderCardIds).toHaveLength(0)
    expect(store.turnPhase).toBe('cadre1')
    expect(store.roundNumber).toBe(1)
    expect(store.cadre1Force).toBe(0)
    expect(store.cadre2Force).toBe(0)
    expect(store.legendForce).toBe(0)
  })
})
