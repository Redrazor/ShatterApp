import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStrikeForceStore, migrateStrikeForceState } from '../../../src/stores/strikeForce.ts'
import { hasStrikeForceConflict } from '../../../src/types/index.ts'
import type { Character, Mission, Squad } from '../../../src/types/index.ts'

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

  it('starts with empty savedLists and activeIndex -1', () => {
    const store = useStrikeForceStore()
    expect(store.savedLists).toEqual([])
    expect(store.activeIndex).toBe(-1)
  })

  it('strikeForce computed reflects current draft state', () => {
    const store = useStrikeForceStore()
    const mission = makeMission()
    store.setName('Test SF')
    store.setMission(mission)
    const sf = store.strikeForce
    expect(sf.name).toBe('Test SF')
    expect(sf.mission?.name).toBe('Test Mission')
    expect(sf.squads).toHaveLength(2)
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

  it('isSquad0Valid is false when units have incompatible eras', () => {
    const store = useStrikeForceStore()
    store.setUnit(0, 'primary', makeChar({ id: 1, unitType: 'Primary', sp: 5, pc: null, era: 'GCW' }))
    store.setUnit(0, 'secondary', makeChar({ id: 2, unitType: 'Secondary', sp: null, pc: 2, era: 'Clone Wars' }))
    store.setUnit(0, 'support', makeChar({ id: 3, unitType: 'Support', sp: null, pc: 2, era: 'GCW' }))
    expect(store.isSquad0Valid).toBe(false)
  })

  it('isSquad0Valid is true when units share a common era via multi-era string', () => {
    const store = useStrikeForceStore()
    store.setUnit(0, 'primary', makeChar({ id: 1, unitType: 'Primary', sp: 5, pc: null, era: 'GCW;Clone Wars' }))
    store.setUnit(0, 'secondary', makeChar({ id: 2, unitType: 'Secondary', sp: null, pc: 2, era: 'Clone Wars' }))
    store.setUnit(0, 'support', makeChar({ id: 3, unitType: 'Support', sp: null, pc: 2, era: 'Clone Wars' }))
    expect(store.isSquad0Valid).toBe(true)
  })

  it('squad0Result.reason contains meaningful text when squad has incompatible eras', () => {
    const store = useStrikeForceStore()
    store.setUnit(0, 'primary', makeChar({ id: 1, unitType: 'Primary', sp: 5, pc: null, era: 'GCW' }))
    store.setUnit(0, 'secondary', makeChar({ id: 2, unitType: 'Secondary', sp: null, pc: 2, era: 'Clone Wars' }))
    store.setUnit(0, 'support', makeChar({ id: 3, unitType: 'Support', sp: null, pc: 2, era: 'GCW' }))
    expect(store.squad0Result.reason).toBe('Units come from incompatible eras')
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
    store.setUnit(0, 'primary', makeChar({ id: 1, name: 'Unit A', characterType: 'Alpha', unitType: 'Primary', sp: 5, pc: null }))
    store.setUnit(0, 'secondary', makeChar({ id: 2, name: 'Unit B', characterType: 'Beta', unitType: 'Secondary', sp: null, pc: 2 }))
    store.setUnit(0, 'support', makeChar({ id: 3, name: 'Unit C', characterType: 'Gamma', unitType: 'Support', sp: null, pc: 2 }))
    store.setUnit(1, 'primary', makeChar({ id: 4, name: 'Unit D', characterType: 'Delta', unitType: 'Primary', sp: 6, pc: null }))
    store.setUnit(1, 'secondary', makeChar({ id: 5, name: 'Unit E', characterType: 'Epsilon', unitType: 'Secondary', sp: null, pc: 3 }))
    store.setUnit(1, 'support', makeChar({ id: 6, name: 'Unit F', characterType: 'Zeta', unitType: 'Support', sp: null, pc: 2 }))
    expect(store.isStrikeForceComplete).toBe(true)
  })

  // ---------- hasUniqueConflict / unit uniqueness ----------

  it('hasUniqueConflict is false when all units have distinct names and characterTypes', () => {
    const store = useStrikeForceStore()
    store.setUnit(0, 'primary', makeChar({ id: 1, name: 'Unit A', characterType: 'Alpha', unitType: 'Primary', sp: 5, pc: null }))
    store.setUnit(0, 'secondary', makeChar({ id: 2, name: 'Unit B', characterType: 'Beta', unitType: 'Secondary', sp: null, pc: 2 }))
    store.setUnit(1, 'primary', makeChar({ id: 3, name: 'Unit C', characterType: 'Gamma', unitType: 'Primary', sp: 5, pc: null }))
    expect(store.hasUniqueConflict).toBe(false)
  })

  it('hasUniqueConflict is true when two units share the same name', () => {
    const store = useStrikeForceStore()
    store.setUnit(0, 'primary', makeChar({ id: 1, name: 'Darth Vader', characterType: 'Alpha', unitType: 'Primary', sp: 5, pc: null }))
    store.setUnit(1, 'primary', makeChar({ id: 2, name: 'Darth Vader', characterType: 'Beta', unitType: 'Primary', sp: 5, pc: null }))
    expect(store.hasUniqueConflict).toBe(true)
  })

  it('hasUniqueConflict is true when two units share the same characterType', () => {
    const store = useStrikeForceStore()
    store.setUnit(0, 'primary', makeChar({ id: 1, name: 'Anakin - Chosen One', characterType: 'Anakin Skywalker', unitType: 'Primary', sp: 5, pc: null }))
    store.setUnit(1, 'primary', makeChar({ id: 2, name: 'Anakin - The Hero', characterType: 'Anakin Skywalker', unitType: 'Primary', sp: 5, pc: null }))
    expect(store.hasUniqueConflict).toBe(true)
  })

  it('isStrikeForceComplete is false when two units share the same name across squads', () => {
    const store = useStrikeForceStore()
    store.setUnit(0, 'primary', makeChar({ id: 1, name: 'Darth Vader', characterType: 'Alpha', unitType: 'Primary', sp: 5, pc: null }))
    store.setUnit(0, 'secondary', makeChar({ id: 2, name: 'Unit B', characterType: 'Beta', unitType: 'Secondary', sp: null, pc: 2 }))
    store.setUnit(0, 'support', makeChar({ id: 3, name: 'Unit C', characterType: 'Gamma', unitType: 'Support', sp: null, pc: 2 }))
    store.setUnit(1, 'primary', makeChar({ id: 4, name: 'Darth Vader', characterType: 'Delta', unitType: 'Primary', sp: 6, pc: null }))
    store.setUnit(1, 'secondary', makeChar({ id: 5, name: 'Unit E', characterType: 'Epsilon', unitType: 'Secondary', sp: null, pc: 3 }))
    store.setUnit(1, 'support', makeChar({ id: 6, name: 'Unit F', characterType: 'Zeta', unitType: 'Support', sp: null, pc: 2 }))
    expect(store.isStrikeForceComplete).toBe(false)
  })

  it('isStrikeForceComplete is false when two units share the same characterType across squads', () => {
    const store = useStrikeForceStore()
    store.setUnit(0, 'primary', makeChar({ id: 1, name: 'Anakin - Chosen One', characterType: 'Anakin Skywalker', unitType: 'Primary', sp: 5, pc: null }))
    store.setUnit(0, 'secondary', makeChar({ id: 2, name: 'Unit B', characterType: 'Beta', unitType: 'Secondary', sp: null, pc: 2 }))
    store.setUnit(0, 'support', makeChar({ id: 3, name: 'Unit C', characterType: 'Gamma', unitType: 'Support', sp: null, pc: 2 }))
    store.setUnit(1, 'primary', makeChar({ id: 4, name: 'Anakin - Hero', characterType: 'Anakin Skywalker', unitType: 'Primary', sp: 6, pc: null }))
    store.setUnit(1, 'secondary', makeChar({ id: 5, name: 'Unit E', characterType: 'Epsilon', unitType: 'Secondary', sp: null, pc: 3 }))
    store.setUnit(1, 'support', makeChar({ id: 6, name: 'Unit F', characterType: 'Zeta', unitType: 'Support', sp: null, pc: 2 }))
    expect(store.isStrikeForceComplete).toBe(false)
  })

  // ---------- hasStrikeForceConflict (pure function) ----------

  it('hasStrikeForceConflict returns false for empty squads', () => {
    const squads: [Squad, Squad] = [
      { primary: null, secondary: null, support: null },
      { primary: null, secondary: null, support: null },
    ]
    expect(hasStrikeForceConflict(squads)).toBe(false)
  })

  it('hasStrikeForceConflict returns false when units have empty characterType', () => {
    const u1 = makeChar({ id: 1, name: 'Unit A', characterType: '' })
    const u2 = makeChar({ id: 2, name: 'Unit B', characterType: '' })
    const squads: [Squad, Squad] = [
      { primary: u1, secondary: null, support: null },
      { primary: u2, secondary: null, support: null },
    ]
    expect(hasStrikeForceConflict(squads)).toBe(false)
  })

  it('hasStrikeForceConflict returns true for duplicate names in same squad', () => {
    const u1 = makeChar({ id: 1, name: 'Vader', characterType: 'Alpha' })
    const u2 = makeChar({ id: 2, name: 'Vader', characterType: 'Beta', unitType: 'Secondary', pc: 2, sp: null })
    const squads: [Squad, Squad] = [
      { primary: u1, secondary: u2, support: null },
      { primary: null, secondary: null, support: null },
    ]
    expect(hasStrikeForceConflict(squads)).toBe(true)
  })

  it('resetStrikeForce clears name, mission, squads', () => {
    const store = useStrikeForceStore()
    store.setName('My List')
    store.setMission(makeMission())
    store.setUnit(0, 'primary', makeChar())
    store.resetStrikeForce()
    expect(store.name).toBe('')
    expect(store.mission).toBeNull()
    expect(store.squads[0].primary).toBeNull()
  })

  // ---------- saveCurrentList ----------

  it('saveCurrentList pushes new entry when activeIndex is -1', () => {
    const store = useStrikeForceStore()
    store.setName('Build A')
    store.saveCurrentList()
    expect(store.savedLists).toHaveLength(1)
    expect(store.savedLists[0].name).toBe('Build A')
    expect(store.activeIndex).toBe(0)
  })

  it('saveCurrentList updates existing entry when activeIndex is set', () => {
    const store = useStrikeForceStore()
    store.setName('Build A')
    store.saveCurrentList()
    store.setName('Build A Updated')
    store.saveCurrentList()
    expect(store.savedLists).toHaveLength(1)
    expect(store.savedLists[0].name).toBe('Build A Updated')
    expect(store.activeIndex).toBe(0)
  })

  it('saveCurrentList saves mission id', () => {
    const store = useStrikeForceStore()
    store.setName('Mission Build')
    store.setMission(makeMission())
    store.saveCurrentList()
    expect(store.savedLists[0].mid).toBe(1)
    expect(store.savedLists[0].pre).toBe(false)
  })

  it('saveCurrentList stores unit IDs in compact format', () => {
    const store = useStrikeForceStore()
    store.setName('Units')
    store.setUnit(0, 'primary', makeChar({ id: 10 }))
    store.setUnit(0, 'secondary', makeChar({ id: 11 }))
    store.setUnit(0, 'support', makeChar({ id: 12 }))
    store.saveCurrentList()
    expect(store.savedLists[0].s[0]).toEqual([10, 11, 12])
  })

  it('saveCurrentList stores both squad 0 and squad 1 unit IDs in compact format', () => {
    const store = useStrikeForceStore()
    store.setName('Full Build')
    store.setUnit(0, 'primary', makeChar({ id: 10 }))
    store.setUnit(0, 'secondary', makeChar({ id: 11 }))
    store.setUnit(0, 'support', makeChar({ id: 12 }))
    store.setUnit(1, 'primary', makeChar({ id: 20 }))
    store.setUnit(1, 'secondary', makeChar({ id: 21 }))
    store.setUnit(1, 'support', makeChar({ id: 22 }))
    store.saveCurrentList()
    expect(store.savedLists[0].s[0]).toEqual([10, 11, 12])
    expect(store.savedLists[0].s[1]).toEqual([20, 21, 22])
  })

  it('saveCurrentList uses Unnamed when name is empty', () => {
    const store = useStrikeForceStore()
    store.saveCurrentList()
    expect(store.savedLists[0].name).toBe('Unnamed')
  })

  // ---------- loadList ----------

  it('loadList restores name from saved build', () => {
    const store = useStrikeForceStore()
    store.setName('Alpha')
    store.saveCurrentList()
    store.newList()
    store.loadList(0, [], [])
    expect(store.name).toBe('Alpha')
    expect(store.activeIndex).toBe(0)
  })

  it('loadList resolves character IDs to full objects', () => {
    const store = useStrikeForceStore()
    const primary = makeChar({ id: 10, name: 'Luke' })
    const secondary = makeChar({ id: 11, name: 'Leia', unitType: 'Secondary', pc: 2 })
    const support = makeChar({ id: 12, name: 'Han', unitType: 'Support', pc: 3 })
    store.setUnit(0, 'primary', primary)
    store.setUnit(0, 'secondary', secondary)
    store.setUnit(0, 'support', support)
    store.setName('Rebels')
    store.saveCurrentList()
    store.newList()
    store.loadList(0, [primary, secondary, support], [])
    expect(store.squads[0].primary?.name).toBe('Luke')
    expect(store.squads[0].secondary?.name).toBe('Leia')
    expect(store.squads[0].support?.name).toBe('Han')
  })

  it('loadList resolves mission ID to full object', () => {
    const store = useStrikeForceStore()
    const mission = makeMission()
    store.setMission(mission)
    store.setName('With Mission')
    store.saveCurrentList()
    store.newList()
    store.loadList(0, [], [mission])
    expect(store.mission?.name).toBe('Test Mission')
  })

  it('loadList sets mission to null when mid is null', () => {
    const store = useStrikeForceStore()
    store.setName('No Mission')
    store.saveCurrentList()
    store.newList()
    store.loadList(0, [], [])
    expect(store.mission).toBeNull()
  })

  it('loadList sets unit to null when id is 0', () => {
    const store = useStrikeForceStore()
    store.setName('Empty Squads')
    store.saveCurrentList()
    store.newList()
    store.loadList(0, [], [])
    expect(store.squads[0].primary).toBeNull()
  })

  it('loadList does nothing for out-of-range index', () => {
    const store = useStrikeForceStore()
    store.setName('Current')
    store.loadList(99, [], [])
    expect(store.name).toBe('Current')
  })

  // ---------- deleteList ----------

  it('deleteList removes the entry', () => {
    const store = useStrikeForceStore()
    store.setName('Build A')
    store.saveCurrentList()
    store.newList()
    store.setName('Build B')
    store.saveCurrentList()
    expect(store.savedLists).toHaveLength(2)
    store.deleteList(0)
    expect(store.savedLists).toHaveLength(1)
    expect(store.savedLists[0].name).toBe('Build B')
  })

  it('deleteList resets draft and activeIndex when deleting active list', () => {
    const store = useStrikeForceStore()
    store.setName('Active Build')
    store.saveCurrentList()
    expect(store.activeIndex).toBe(0)
    store.deleteList(0)
    expect(store.savedLists).toHaveLength(0)
    expect(store.activeIndex).toBe(-1)
    expect(store.name).toBe('')
  })

  it('deleteList adjusts activeIndex when deleting before active', () => {
    const store = useStrikeForceStore()
    store.setName('A')
    store.saveCurrentList()
    store.newList()
    store.setName('B')
    store.saveCurrentList()
    // activeIndex is now 1 (Build B)
    store.deleteList(0)
    expect(store.activeIndex).toBe(0)
    expect(store.savedLists[0].name).toBe('B')
  })

  it('deleteList does not change activeIndex when deleting after active', () => {
    const store = useStrikeForceStore()
    store.setName('A')
    store.saveCurrentList()
    store.newList()
    store.setName('B')
    store.saveCurrentList()
    // Load A back (index 0)
    store.loadList(0, [], [])
    expect(store.activeIndex).toBe(0)
    store.deleteList(1)
    expect(store.activeIndex).toBe(0)
    expect(store.savedLists).toHaveLength(1)
  })

  // ---------- newList ----------

  it('newList clears draft and sets activeIndex to -1', () => {
    const store = useStrikeForceStore()
    store.setName('Build A')
    store.setMission(makeMission())
    store.setUnit(0, 'primary', makeChar())
    store.saveCurrentList()
    store.newList()
    expect(store.name).toBe('')
    expect(store.mission).toBeNull()
    expect(store.squads[0].primary).toBeNull()
    expect(store.activeIndex).toBe(-1)
  })

  it('newList does not remove saved lists', () => {
    const store = useStrikeForceStore()
    store.setName('Build A')
    store.saveCurrentList()
    store.newList()
    expect(store.savedLists).toHaveLength(1)
  })

  // ---------- importLists ----------

  it('importLists appends compact builds', () => {
    const store = useStrikeForceStore()
    store.importLists([
      { name: 'Imported A', mid: null, pre: false, s: [[0, 0, 0], [0, 0, 0]] },
      { name: 'Imported B', mid: 5, pre: true, s: [[1, 2, 3], [4, 5, 6]] },
    ])
    expect(store.savedLists).toHaveLength(2)
    expect(store.savedLists[0].name).toBe('Imported A')
    expect(store.savedLists[1].name).toBe('Imported B')
  })

  it('importLists appends to existing lists', () => {
    const store = useStrikeForceStore()
    store.setName('Existing')
    store.saveCurrentList()
    store.importLists([
      { name: 'Imported', mid: null, pre: false, s: [[0, 0, 0], [0, 0, 0]] },
    ])
    expect(store.savedLists).toHaveLength(2)
    expect(store.savedLists[1].name).toBe('Imported')
  })

  // ---------- multiple saved lists ----------

  it('can save and retrieve three distinct lists', () => {
    const store = useStrikeForceStore()
    store.setName('List 1')
    store.saveCurrentList()
    store.newList()
    store.setName('List 2')
    store.saveCurrentList()
    store.newList()
    store.setName('List 3')
    store.saveCurrentList()
    expect(store.savedLists).toHaveLength(3)
    expect(store.savedLists[0].name).toBe('List 1')
    expect(store.savedLists[1].name).toBe('List 2')
    expect(store.savedLists[2].name).toBe('List 3')
  })
})

describe('migrateStrikeForceState', () => {
  it('migrates old flat format to savedLists', () => {
    const state: any = {
      name: 'Old Build',
      mission: { id: 1 },
      premiere: true,
      squads: [
        { primary: { id: 10 }, secondary: { id: 11 }, support: { id: 12 } },
        { primary: { id: 20 }, secondary: { id: 21 }, support: { id: 22 } },
      ],
      savedLists: [],
      activeIndex: -1,
    }
    migrateStrikeForceState(state)
    expect(state.savedLists).toHaveLength(1)
    expect(state.savedLists[0].name).toBe('Old Build')
    expect(state.savedLists[0].mid).toBe(1)
    expect(state.savedLists[0].pre).toBe(true) // preserved from old state during migration
    expect(state.savedLists[0].s[0]).toEqual([10, 11, 12])
    expect(state.savedLists[0].s[1]).toEqual([20, 21, 22])
    expect(state.activeIndex).toBe(0)
  })

  it('does not migrate when savedLists is not empty', () => {
    const state: any = {
      name: 'Old Build',
      savedLists: [{ name: 'Existing', mid: null, pre: false, s: [[0, 0, 0], [0, 0, 0]] }],
      activeIndex: 0,
    }
    migrateStrikeForceState(state)
    expect(state.savedLists).toHaveLength(1)
    expect(state.savedLists[0].name).toBe('Existing')
  })

  it('does not migrate when name is empty', () => {
    const state: any = {
      name: '',
      savedLists: [],
      activeIndex: -1,
    }
    migrateStrikeForceState(state)
    expect(state.savedLists).toHaveLength(0)
  })
})
