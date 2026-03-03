import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStrikeForceStore } from '../../../src/stores/strikeForce.ts'
import type { Character, Mission } from '../../../src/types/index.ts'

function makeChar(overrides: Partial<Character> = {}): Character {
  return {
    id: 1,
    name: 'Test Unit',
    characterType: 'Hero',
    unitType: 'Primary',
    pc: null,
    sp: 5,
    durability: 4,
    stamina: 6,
    fp: 2,
    era: 'GCW',
    tags: [],
    swp: 'SWP01',
    thumbnail: '',
    cardFront: '',
    cardBack: '',
    stances: [],
    releaseDate: '',
    ...overrides,
  }
}

function makeMission(): Mission {
  return {
    id: 1,
    name: 'Test Mission',
    card: '/images/test.png',
    swp: 'SWP01',
    struggles: {},
  }
}

describe('useStrikeForceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with empty squads', () => {
    const store = useStrikeForceStore()
    expect(store.squads[0].primary).toBeNull()
    expect(store.squads[0].secondary).toBeNull()
    expect(store.squads[0].support).toBeNull()
  })

  it('setUnit assigns unit to correct squad+role', () => {
    const store = useStrikeForceStore()
    const char = makeChar()
    store.setUnit(0, 'primary', char)
    expect(store.squads[0].primary).toEqual(char)
  })

  it('setUnit assigns to squad 1 independently', () => {
    const store = useStrikeForceStore()
    const char = makeChar({ id: 2, name: 'Squad1 Primary' })
    store.setUnit(1, 'primary', char)
    expect(store.squads[1].primary).toEqual(char)
    expect(store.squads[0].primary).toBeNull()
  })

  it('clearUnit removes a unit', () => {
    const store = useStrikeForceStore()
    const char = makeChar()
    store.setUnit(0, 'primary', char)
    store.clearUnit(0, 'primary')
    expect(store.squads[0].primary).toBeNull()
  })

  it('setMission stores the mission', () => {
    const store = useStrikeForceStore()
    const mission = makeMission()
    store.setMission(mission)
    expect(store.mission?.name).toBe('Test Mission')
  })

  it('setName stores the name', () => {
    const store = useStrikeForceStore()
    store.setName('My List')
    expect(store.name).toBe('My List')
  })

  it('setPremiere stores the premiere flag', () => {
    const store = useStrikeForceStore()
    store.setPremiere(true)
    expect(store.premiere).toBe(true)
  })

  // ---------- isSquad0Valid / isSquadValid ----------

  it('isSquad0Valid is false when squad is empty', () => {
    const store = useStrikeForceStore()
    expect(store.isSquad0Valid).toBe(false)
  })

  it('isSquad0Valid is false when only primary is set', () => {
    const store = useStrikeForceStore()
    store.setUnit(0, 'primary', makeChar({ unitType: 'Primary', sp: 5 }))
    expect(store.isSquad0Valid).toBe(false)
  })

  it('isSquad0Valid is true when pc sum ≤ sp', () => {
    const store = useStrikeForceStore()
    store.setUnit(0, 'primary', makeChar({ unitType: 'Primary', sp: 5, pc: null }))
    store.setUnit(0, 'secondary', makeChar({ id: 2, unitType: 'Secondary', sp: null, pc: 2 }))
    store.setUnit(0, 'support', makeChar({ id: 3, unitType: 'Support', sp: null, pc: 2 }))
    expect(store.isSquad0Valid).toBe(true)
  })

  it('isSquad0Valid is true when pc sum equals sp exactly', () => {
    const store = useStrikeForceStore()
    store.setUnit(0, 'primary', makeChar({ unitType: 'Primary', sp: 5, pc: null }))
    store.setUnit(0, 'secondary', makeChar({ id: 2, unitType: 'Secondary', sp: null, pc: 3 }))
    store.setUnit(0, 'support', makeChar({ id: 3, unitType: 'Support', sp: null, pc: 2 }))
    expect(store.isSquad0Valid).toBe(true)
  })

  it('isSquad0Valid is false when pc sum > sp', () => {
    const store = useStrikeForceStore()
    store.setUnit(0, 'primary', makeChar({ unitType: 'Primary', sp: 4, pc: null }))
    store.setUnit(0, 'secondary', makeChar({ id: 2, unitType: 'Secondary', sp: null, pc: 3 }))
    store.setUnit(0, 'support', makeChar({ id: 3, unitType: 'Support', sp: null, pc: 3 }))
    expect(store.isSquad0Valid).toBe(false)
  })

  it('isSquad1Valid works independently', () => {
    const store = useStrikeForceStore()
    store.setUnit(1, 'primary', makeChar({ unitType: 'Primary', sp: 6, pc: null }))
    store.setUnit(1, 'secondary', makeChar({ id: 2, unitType: 'Secondary', sp: null, pc: 2 }))
    store.setUnit(1, 'support', makeChar({ id: 3, unitType: 'Support', sp: null, pc: 3 }))
    expect(store.isSquad1Valid).toBe(true)
    expect(store.isSquad0Valid).toBe(false) // squad 0 is still empty
  })

  // ---------- isStrikeForceComplete ----------

  it('isStrikeForceComplete is false when squads are empty', () => {
    const store = useStrikeForceStore()
    expect(store.isStrikeForceComplete).toBe(false)
  })

  it('isStrikeForceComplete is false if one squad is invalid', () => {
    const store = useStrikeForceStore()
    // Valid squad 0
    store.setUnit(0, 'primary', makeChar({ unitType: 'Primary', sp: 5, pc: null }))
    store.setUnit(0, 'secondary', makeChar({ id: 2, unitType: 'Secondary', sp: null, pc: 2 }))
    store.setUnit(0, 'support', makeChar({ id: 3, unitType: 'Support', sp: null, pc: 2 }))
    // Invalid squad 1 (pc > sp)
    store.setUnit(1, 'primary', makeChar({ id: 4, unitType: 'Primary', sp: 3, pc: null }))
    store.setUnit(1, 'secondary', makeChar({ id: 5, unitType: 'Secondary', sp: null, pc: 3 }))
    store.setUnit(1, 'support', makeChar({ id: 6, unitType: 'Support', sp: null, pc: 3 }))
    expect(store.isStrikeForceComplete).toBe(false)
  })

  it('isStrikeForceComplete is true when both squads are valid and fully filled', () => {
    const store = useStrikeForceStore()
    store.setUnit(0, 'primary', makeChar({ unitType: 'Primary', sp: 5, pc: null }))
    store.setUnit(0, 'secondary', makeChar({ id: 2, unitType: 'Secondary', sp: null, pc: 2 }))
    store.setUnit(0, 'support', makeChar({ id: 3, unitType: 'Support', sp: null, pc: 2 }))
    store.setUnit(1, 'primary', makeChar({ id: 4, unitType: 'Primary', sp: 6, pc: null }))
    store.setUnit(1, 'secondary', makeChar({ id: 5, unitType: 'Secondary', sp: null, pc: 3 }))
    store.setUnit(1, 'support', makeChar({ id: 6, unitType: 'Support', sp: null, pc: 2 }))
    expect(store.isStrikeForceComplete).toBe(true)
  })

  it('resetStrikeForce clears everything', () => {
    const store = useStrikeForceStore()
    store.setName('My List')
    store.setMission(makeMission())
    store.setUnit(0, 'primary', makeChar())
    store.resetStrikeForce()
    expect(store.name).toBe('')
    expect(store.mission).toBeNull()
    expect(store.squads[0].primary).toBeNull()
  })
})
