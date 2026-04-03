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

describe('playUnitsStore — wound mechanics', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('tapDamage', () => {
    it('sets wounded flag when damage fills stamina track', () => {
      const store = usePlayUnitsStore()
      store.addUnit(makeCharacter({ stamina: 2 }))
      store.tapDamage(1, 1)
      store.tapDamage(1, 2)
      expect(store.units[0].wounded).toBe(true)
      expect(store.units[0].damage).toBe(2)
      expect(store.units[0].wounds).toBe(0) // no auto-wound
    })

    it('does not auto-reset damage when wound triggers', () => {
      const store = usePlayUnitsStore()
      store.addUnit(makeCharacter({ stamina: 1 }))
      store.tapDamage(1, 1)
      expect(store.units[0].damage).toBe(1)
      expect(store.units[0].wounded).toBe(true)
    })

    it('ignores taps when unit is already wounded', () => {
      const store = usePlayUnitsStore()
      store.addUnit(makeCharacter({ stamina: 2 }))
      store.tapDamage(1, 1)
      store.tapDamage(1, 2) // triggers wounded
      store.tapDamage(1, 1) // should be ignored
      expect(store.units[0].damage).toBe(2)
      expect(store.units[0].wounded).toBe(true)
    })

    it('toggles damage down when tapping the current position', () => {
      const store = usePlayUnitsStore()
      store.addUnit(makeCharacter({ stamina: 3 }))
      store.tapDamage(1, 2) // set to 2
      store.tapDamage(1, 2) // tap same → decrement to 1
      expect(store.units[0].damage).toBe(1)
      expect(store.units[0].wounded).toBe(false)
    })
  })

  describe('flipWounded', () => {
    it('clears damage, removes wounded flag, and increments injuries', () => {
      const store = usePlayUnitsStore()
      store.addUnit(makeCharacter({ stamina: 2, durability: 3 }))
      store.tapDamage(1, 1)
      store.tapDamage(1, 2) // triggers wounded
      store.flipWounded(1)
      const unit = store.units[0]
      expect(unit.damage).toBe(0)
      expect(unit.wounded).toBe(false)
      expect(unit.wounds).toBe(1)
    })

    it('does nothing when unit is not wounded', () => {
      const store = usePlayUnitsStore()
      store.addUnit(makeCharacter({ stamina: 3, durability: 2 }))
      store.tapDamage(1, 1)
      store.flipWounded(1)
      expect(store.units[0].wounds).toBe(0)
    })

    it('does nothing when injuries are already at durability', () => {
      const store = usePlayUnitsStore()
      store.addUnit(makeCharacter({ stamina: 1, durability: 1 }))
      store.tapDamage(1, 1) // wounded + wounds already at durability threshold
      store.units[0].wounds = 1 // manually set injuries to max
      store.flipWounded(1)
      expect(store.units[0].defeated).toBe(false)
      expect(store.units[0].wounds).toBe(1) // unchanged
    })
  })

  describe('defeatUnit', () => {
    it('marks unit as defeated when wounded and injuries fill durability', () => {
      const store = usePlayUnitsStore()
      store.addUnit(makeCharacter({ stamina: 1, durability: 1 }))
      store.tapDamage(1, 1) // sets wounded
      store.units[0].wounds = 1 // injuries at max
      store.defeatUnit(1)
      expect(store.units[0].defeated).toBe(true)
      expect(store.units[0].wounded).toBe(false)
    })

    it('does nothing when unit is not wounded', () => {
      const store = usePlayUnitsStore()
      store.addUnit(makeCharacter({ stamina: 2, durability: 1 }))
      store.units[0].wounds = 1
      store.defeatUnit(1)
      expect(store.units[0].defeated).toBe(false)
    })

    it('does nothing when injuries have not reached durability', () => {
      const store = usePlayUnitsStore()
      store.addUnit(makeCharacter({ stamina: 1, durability: 2 }))
      store.tapDamage(1, 1) // sets wounded, wounds=0 < durability=2
      store.defeatUnit(1)
      expect(store.units[0].defeated).toBe(false)
    })
  })

  describe('isRemoved', () => {
    it('returns false for a fresh unit', () => {
      const store = usePlayUnitsStore()
      store.addUnit(makeCharacter())
      expect(store.isRemoved(store.units[0])).toBe(false)
    })

    it('returns false even when injuries fill durability without explicit defeatUnit', () => {
      const store = usePlayUnitsStore()
      store.addUnit(makeCharacter({ durability: 1 }))
      store.units[0].wounds = 1
      expect(store.isRemoved(store.units[0])).toBe(false)
    })

    it('returns true only after defeatUnit is called', () => {
      const store = usePlayUnitsStore()
      store.addUnit(makeCharacter({ stamina: 1, durability: 1 }))
      store.tapDamage(1, 1)
      store.units[0].wounds = 1
      store.defeatUnit(1)
      expect(store.isRemoved(store.units[0])).toBe(true)
    })
  })
})
