import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayUnitsStore } from '../../../src/stores/playUnits.ts'
import type { Character } from '../../../src/types/index.ts'

vi.mock('../../../src/composables/useDiceRoom.ts', () => ({
  useDiceRoom: () => ({ sendUnits: vi.fn() }),
}))
vi.mock('../../../src/stores/rollSession.ts', () => ({
  useRollSessionStore: () => ({ isConnected: false }),
}))

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 1,
    slug: 'test',
    name: 'Test Unit',
    characterType: 'test',
    unitType: 'Primary',
    pc: null,
    sp: 4,
    durability: 2,
    stamina: 3,
    fp: 2,
    era: 'GCW',
    tags: [],
    swp: 'SWP01',
    swpCode: 'SWP01',
    thumbnail: '',
    cardFront: '',
    cardBack: '',
    stances: [],
    releaseDate: '',
    ...overrides,
  }
}

describe('playUnitsStore — spendOneForce', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns false when no units (totalFp = 0)', () => {
    const store = usePlayUnitsStore()
    expect(store.spendOneForce()).toBe(false)
  })

  it('returns true and marks first token as spent', () => {
    const store = usePlayUnitsStore()
    store.addUnit(makeCharacter({ fp: 3 }))
    const result = store.spendOneForce()
    expect(result).toBe(true)
    expect(store.spentTokens[0]).toBe(true)
  })

  it('spends tokens sequentially', () => {
    const store = usePlayUnitsStore()
    store.addUnit(makeCharacter({ fp: 2 }))
    store.spendOneForce()
    store.spendOneForce()
    expect(store.spentTokens[0]).toBe(true)
    expect(store.spentTokens[1]).toBe(true)
  })

  it('returns false when all tokens are spent', () => {
    const store = usePlayUnitsStore()
    store.addUnit(makeCharacter({ fp: 1 }))
    store.spendOneForce() // spend the only token
    const result = store.spendOneForce()
    expect(result).toBe(false)
  })

  it('skips already-spent tokens', () => {
    const store = usePlayUnitsStore()
    store.addUnit(makeCharacter({ fp: 3 }))
    store.spentTokens = [true, false, false]
    store.spendOneForce()
    expect(store.spentTokens[1]).toBe(true) // second token spent, not first
  })
})

describe('playUnitsStore — clearRoster / syncNow / setStance / reset', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('clearRoster removes all units and resets rosterComplete', () => {
    const store = usePlayUnitsStore()
    store.addUnit(makeCharacter({ id: 1 }))
    store.rosterComplete = true
    store.clearRoster()
    expect(store.units).toHaveLength(0)
    expect(store.rosterComplete).toBe(false)
  })

  it('clearRoster preserves locked state', () => {
    const store = usePlayUnitsStore()
    store.addUnit(makeCharacter({ id: 1 }))
    store.lock()
    store.clearRoster()
    expect(store.locked).toBe(true)
  })

  it('syncNow does not throw', () => {
    const store = usePlayUnitsStore()
    store.addUnit(makeCharacter({ id: 1, fp: 2 }))
    expect(() => store.syncNow()).not.toThrow()
  })

  it('setStance updates the unit stance', () => {
    const store = usePlayUnitsStore()
    store.addUnit(makeCharacter({ id: 1 }))
    store.setStance(1, 2)
    expect(store.units[0].activeStance).toBe(2)
  })

  it('reset clears all state including locked', () => {
    const store = usePlayUnitsStore()
    store.addUnit(makeCharacter({ id: 1 }))
    store.lock()
    store.reset()
    expect(store.units).toHaveLength(0)
    expect(store.locked).toBe(false)
  })
})
