import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOrderDeckStore } from '../../../src/stores/orderDeck.ts'
import type { PlayUnit } from '../../../src/types/index.ts'

function makeUnit(overrides: Partial<PlayUnit> = {}): PlayUnit {
  return {
    id: 1,
    name: 'Test Unit',
    thumbnail: '',
    unitType: 'Primary',
    stamina: 3,
    durability: 2,
    fp: 1,
    activeStance: 1,
    damage: 0,
    wounds: 0,
    conditions: [],
    tags: [],
    orderCard: '/images/order1.png',
    ...overrides,
  }
}

describe('orderDeck store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('buildDeck', () => {
    it('creates N unit cards + 1 Shatterpoint card', () => {
      const store = useOrderDeckStore()
      const units = [makeUnit({ id: 1 }), makeUnit({ id: 2 }), makeUnit({ id: 3 })]
      store.buildDeck(units)
      expect(store.deck.length).toBe(4) // 3 units + 1 Shatterpoint
    })

    it('includes a Shatterpoint wild card', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 })])
      const shatterpoint = store.deck.find(c => c.isShatterpoint)
      expect(shatterpoint).toBeDefined()
      expect(shatterpoint?.id).toBe(-1)
    })

    it('skips units without an orderCard', () => {
      const store = useOrderDeckStore()
      const units = [makeUnit({ id: 1, orderCard: '' }), makeUnit({ id: 2 })]
      store.buildDeck(units)
      // 1 valid unit + 1 Shatterpoint
      expect(store.deck.length).toBe(2)
    })

    it('clears previous state on rebuild', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 })])
      store.flip()
      store.buildDeck([makeUnit({ id: 1 })])
      expect(store.revealed).toBeNull()
      expect(store.activatedIds.length).toBe(0)
    })
  })

  describe('flip', () => {
    it('moves top card from deck to revealed', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 })])
      const initialLength = store.deck.length
      store.flip()
      expect(store.revealed).not.toBeNull()
      expect(store.deck.length).toBe(initialLength - 1)
    })

    it('does nothing if deck is empty', () => {
      const store = useOrderDeckStore()
      store.flip()
      expect(store.revealed).toBeNull()
    })

    it('does nothing if a card is already revealed', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 }), makeUnit({ id: 2 })])
      store.flip()
      const firstRevealed = store.revealed
      store.flip()
      expect(store.revealed).toBe(firstRevealed)
    })

    it('sets playedFromReserve to false', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 })])
      store.playedFromReserve = true
      store.flip()
      expect(store.playedFromReserve).toBe(false)
    })
  })

  describe('endActivation', () => {
    it('pushes revealed id to activatedIds', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 42 })])
      store.flip()
      const revealedId = store.revealed!.id
      store.endActivation()
      expect(store.activatedIds).toContain(revealedId)
    })

    it('clears revealed', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 })])
      store.flip()
      store.endActivation()
      expect(store.revealed).toBeNull()
    })

    it('does nothing if no card revealed', () => {
      const store = useOrderDeckStore()
      store.endActivation()
      expect(store.activatedIds.length).toBe(0)
    })
  })

  describe('endActivationAs', () => {
    it('pushes the given unitId (not the revealed card id)', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 })])
      // Simulate Shatterpoint drawn, then pick unit 99
      store.flip()
      store.endActivationAs(99)
      expect(store.activatedIds).toContain(99)
      expect(store.revealed).toBeNull()
    })

    it('clears shatterpointPendingId', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 })])
      store.selectShatterpointUnit(42)
      store.endActivationAs(42)
      expect(store.shatterpointPendingId).toBeNull()
    })
  })

  describe('selectShatterpointUnit', () => {
    it('sets shatterpointPendingId and clears revealed', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 })])
      store.deck.unshift({ id: -1, name: 'Shatterpoint', orderCard: '/images/shatterpoint-order.png', isShatterpoint: true })
      store.flip()
      store.selectShatterpointUnit(42)
      expect(store.shatterpointPendingId).toBe(42)
      expect(store.revealed).toBeNull()
    })

    it('makes currentActiveId return the pending unit', () => {
      const store = useOrderDeckStore()
      store.selectShatterpointUnit(77)
      expect(store.currentActiveId).toBe(77)
    })
  })

  describe('reserve', () => {
    it('moves revealed to reserved', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 })])
      store.flip()
      const card = store.revealed
      store.reserve()
      expect(store.reserved).toBe(card)
      expect(store.revealed).toBeNull()
    })

    it('does nothing if no card revealed', () => {
      const store = useOrderDeckStore()
      store.reserve()
      expect(store.reserved).toBeNull()
    })
  })

  describe('sendToBottom', () => {
    it('moves revealed to back of deck', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 }), makeUnit({ id: 2 })])
      store.flip()
      const card = store.revealed!
      const deckLengthBefore = store.deck.length
      store.sendToBottom()
      expect(store.deck.at(-1)).toEqual(card)
      expect(store.deck.length).toBe(deckLengthBefore + 1)
      expect(store.revealed).toBeNull()
    })
  })

  describe('swapReservedTo', () => {
    it('moves reserved to top, revealed to reserved', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 }), makeUnit({ id: 2 })])
      store.flip()
      store.reserve()
      store.flip()
      const newRevealed = store.revealed!
      const oldReserved = store.reserved!
      store.swapReservedTo('top')
      expect(store.deck[0]).toEqual(oldReserved)
      expect(store.reserved).toEqual(newRevealed)
      expect(store.revealed).toBeNull()
    })

    it('moves reserved to bottom, revealed to reserved', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 }), makeUnit({ id: 2 })])
      store.flip()
      store.reserve()
      store.flip()
      const oldReserved = store.reserved!
      store.swapReservedTo('bottom')
      expect(store.deck.at(-1)).toEqual(oldReserved)
    })
  })

  describe('playReserved', () => {
    it('moves reserved to revealed and sets playedFromReserve', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 })])
      store.flip()
      store.reserve()
      store.playReserved()
      expect(store.revealed).not.toBeNull()
      expect(store.reserved).toBeNull()
      expect(store.playedFromReserve).toBe(true)
    })
  })

  describe('peek', () => {
    it('returns top card without mutating deck', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 })])
      const topCard = store.deck[0]
      const peeked = store.peek()
      expect(peeked).toEqual(topCard)
      expect(store.deck.length).toBe(store.deck.length) // unchanged
      expect(store.revealed).toBeNull()
    })

    it('returns null when deck is empty', () => {
      const store = useOrderDeckStore()
      expect(store.peek()).toBeNull()
    })
  })

  describe('reshuffle', () => {
    it('rebuilds deck from units + Shatterpoint', () => {
      const store = useOrderDeckStore()
      const units = [makeUnit({ id: 1 }), makeUnit({ id: 2 })]
      store.buildDeck(units)
      store.flip()
      store.endActivation()
      store.reshuffle(units)
      expect(store.deck.length).toBe(3) // 2 units + 1 Shatterpoint
      expect(store.revealed).toBeNull()
    })

    it('clears activatedIds so activated ribbons reset', () => {
      const store = useOrderDeckStore()
      const units = [makeUnit({ id: 1 }), makeUnit({ id: 2 })]
      store.buildDeck(units)
      store.flip()
      store.endActivation()
      expect(store.activatedIds.length).toBeGreaterThan(0)
      store.reshuffle(units)
      expect(store.activatedIds.length).toBe(0)
    })
  })

  describe('reset', () => {
    it('clears all state including deckBuilt', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 })])
      store.flip()
      store.reset()
      expect(store.deck.length).toBe(0)
      expect(store.revealed).toBeNull()
      expect(store.reserved).toBeNull()
      expect(store.activatedIds.length).toBe(0)
      expect(store.deckBuilt).toBe(false)
    })
  })

  describe('deckBuilt flag', () => {
    it('is false initially', () => {
      const store = useOrderDeckStore()
      expect(store.deckBuilt).toBe(false)
    })

    it('is true after buildDeck', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 })])
      expect(store.deckBuilt).toBe(true)
    })

    it('stays true when deck is emptied via flip + endActivation (Shatterpoint last card scenario)', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 })])
      // Drain all cards
      while (!store.deckEmpty || store.revealed) {
        if (!store.revealed) store.flip()
        else store.endActivation()
      }
      // Deck is now empty but deckBuilt should remain true
      expect(store.deckBuilt).toBe(true)
    })
  })

  describe('computed', () => {
    it('deckEmpty is true when deck has no cards', () => {
      const store = useOrderDeckStore()
      expect(store.deckEmpty).toBe(true)
    })

    it('currentActiveId returns last activatedId', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 }), makeUnit({ id: 2 })])
      store.flip()
      store.endActivation()
      store.flip()
      store.endActivation()
      expect(store.currentActiveId).toBe(store.activatedIds.at(-1))
    })

    it('currentActiveId is null when no activations', () => {
      const store = useOrderDeckStore()
      expect(store.currentActiveId).toBeNull()
    })

    it('activatedSet excludes the current active unit', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 }), makeUnit({ id: 2 })])
      store.flip()
      store.endActivation()
      store.flip()
      store.endActivation()
      const lastId = store.activatedIds.at(-1)!
      expect(store.activatedSet.has(lastId)).toBe(false)
    })

    it('isShatterpointPicking is true when revealed is Shatterpoint', () => {
      const store = useOrderDeckStore()
      store.buildDeck([makeUnit({ id: 1 })])
      // Force a Shatterpoint reveal by manipulating deck directly
      store.deck.unshift({ id: -1, name: 'Shatterpoint', orderCard: '/images/shatterpoint-order.png', isShatterpoint: true })
      store.flip()
      expect(store.isShatterpointPicking).toBe(true)
    })
  })
})
