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
