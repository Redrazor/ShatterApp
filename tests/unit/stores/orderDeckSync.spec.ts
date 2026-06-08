import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { PlayUnit } from '../../../src/types/index.ts'

// Capture the deck-sync emitter and force a "connected" session.
const { sendOrderDeck } = vi.hoisted(() => ({ sendOrderDeck: vi.fn() }))
vi.mock('../../../src/composables/useDiceRoom.ts', () => ({
  useDiceRoom: () => ({ sendOrderDeck }),
}))
vi.mock('../../../src/stores/rollSession.ts', () => ({
  useRollSessionStore: () => ({ isConnected: true }),
}))

import { useOrderDeckStore } from '../../../src/stores/orderDeck.ts'

function unit(id: number, name: string): PlayUnit {
  return {
    id, name, thumbnail: '', unitType: 'Primary', stamina: 5, durability: 2, fp: 1,
    activeStance: 1, damage: 0, wounds: 0, wounded: false, defeated: false,
    conditions: [], tags: [], orderCard: `/images/oc-${id}.png`,
  } as PlayUnit
}

describe('orderDeck networked sync', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sendOrderDeck.mockClear()
  })

  it('buildDeck syncs revealed=null and the full remaining count', () => {
    const store = useOrderDeckStore()
    store.buildDeck([unit(1, 'Rex'), unit(2, 'Cody')])
    // 2 unit cards + 1 Shatterpoint card
    expect(sendOrderDeck).toHaveBeenLastCalledWith({ revealed: null, deckCount: 3, activatedCount: 0 })
  })

  it('flip syncs the revealed card and a decremented count', () => {
    const store = useOrderDeckStore()
    store.buildDeck([unit(1, 'Rex'), unit(2, 'Cody')])
    sendOrderDeck.mockClear()
    store.flip()
    const payload = sendOrderDeck.mock.calls.at(-1)![0]
    expect(payload.revealed).not.toBeNull()
    expect(payload.deckCount).toBe(2)
  })

  it('endActivation keeps the count and increments activatedCount', () => {
    const store = useOrderDeckStore()
    store.buildDeck([unit(1, 'Rex'), unit(2, 'Cody')])
    store.flip()
    sendOrderDeck.mockClear()
    store.endActivation()
    const payload = sendOrderDeck.mock.calls.at(-1)![0]
    expect(payload.revealed).toBeNull()
    expect(payload.deckCount).toBe(2)
    expect(payload.activatedCount).toBe(1)
  })

  it('emptying the deck reports deckCount 0', () => {
    const store = useOrderDeckStore()
    store.buildDeck([unit(1, 'Rex')]) // 1 unit + Shatterpoint = 2 cards
    store.flip(); store.endActivation()
    store.flip(); store.endActivation()
    expect(sendOrderDeck.mock.calls.at(-1)![0].deckCount).toBe(0)
  })
})
