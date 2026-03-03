import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useSearch, type SearchFilters } from '../../../src/composables/useSearch.ts'
import type { Character } from '../../../src/types/index.ts'

function makeChar(overrides: Partial<Character> = {}): Character {
  return {
    id: 1,
    name: 'Luke Skywalker',
    characterType: 'Hero',
    unitType: 'Primary',
    pc: null,
    sp: 5,
    durability: 4,
    stamina: 6,
    fp: 2,
    era: 'Galactic Civil War',
    tags: ['Rebel', 'Jedi'],
    swp: 'SWP01: Starter Set',
    swpCode: 'SWP01',
    thumbnail: '/images/luke.png',
    cardFront: '',
    cardBack: '',
    stances: [],
    releaseDate: '',
    ...overrides,
  }
}

function defaultFilters(overrides: Partial<SearchFilters> = {}): SearchFilters {
  return {
    query: '',
    type: '',
    era: '',
    tags: [],
    swpFilter: '',
    ownedOnly: false,
    favoritesOnly: false,
    favoritedSet: new Set(),
    ownedSwpSet: new Set(),
    ...overrides,
  }
}

describe('useSearch', () => {
  it('returns all characters with empty filters', () => {
    const chars = ref([makeChar(), makeChar({ id: 2, name: 'Darth Vader' })])
    const filters = ref(defaultFilters())
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(2)
  })

  // ---------- query ----------
  it('filters by name query (case-insensitive)', () => {
    const chars = ref([
      makeChar({ name: 'Luke Skywalker' }),
      makeChar({ id: 2, name: 'Darth Vader' }),
    ])
    const filters = ref(defaultFilters({ query: 'luke' }))
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(1)
    expect(results.value[0].name).toBe('Luke Skywalker')
  })

  it('filters by tag query (case-insensitive)', () => {
    const chars = ref([
      makeChar({ tags: ['Rebel', 'Jedi'] }),
      makeChar({ id: 2, name: 'Storm Trooper', tags: ['Imperial'] }),
    ])
    const filters = ref(defaultFilters({ query: 'rebel' }))
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(1)
    expect(results.value[0].name).toBe('Luke Skywalker')
  })

  it('returns no results when query matches nothing', () => {
    const chars = ref([makeChar()])
    const filters = ref(defaultFilters({ query: 'xyznonexistent' }))
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(0)
  })

  it('empty query returns all', () => {
    const chars = ref([makeChar(), makeChar({ id: 2 })])
    const filters = ref(defaultFilters({ query: '' }))
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(2)
  })

  // ---------- type ----------
  it('filters by unitType Primary', () => {
    const chars = ref([
      makeChar({ unitType: 'Primary' }),
      makeChar({ id: 2, unitType: 'Secondary', pc: 3, sp: null }),
      makeChar({ id: 3, unitType: 'Support', pc: 2, sp: null }),
    ])
    const filters = ref(defaultFilters({ type: 'Primary' }))
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(1)
    expect(results.value[0].unitType).toBe('Primary')
  })

  it('filters by unitType Secondary', () => {
    const chars = ref([
      makeChar({ unitType: 'Primary' }),
      makeChar({ id: 2, unitType: 'Secondary', pc: 3, sp: null }),
    ])
    const filters = ref(defaultFilters({ type: 'Secondary' }))
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(1)
    expect(results.value[0].unitType).toBe('Secondary')
  })

  it('empty type returns all unit types', () => {
    const chars = ref([
      makeChar({ unitType: 'Primary' }),
      makeChar({ id: 2, unitType: 'Secondary', pc: 3, sp: null }),
      makeChar({ id: 3, unitType: 'Support', pc: 2, sp: null }),
    ])
    const filters = ref(defaultFilters({ type: '' }))
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(3)
  })

  // ---------- era ----------
  it('filters by era', () => {
    const chars = ref([
      makeChar({ era: 'Galactic Civil War' }),
      makeChar({ id: 2, era: 'Clone Wars' }),
    ])
    const filters = ref(defaultFilters({ era: 'Clone Wars' }))
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(1)
    expect(results.value[0].era).toBe('Clone Wars')
  })

  it('empty era returns all eras', () => {
    const chars = ref([
      makeChar({ era: 'Galactic Civil War' }),
      makeChar({ id: 2, era: 'Clone Wars' }),
    ])
    const filters = ref(defaultFilters({ era: '' }))
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(2)
  })

  // ---------- tags ----------
  it('filters by single tag', () => {
    const chars = ref([
      makeChar({ tags: ['Rebel', 'Jedi'] }),
      makeChar({ id: 2, name: 'Vader', tags: ['Imperial', 'Sith'] }),
    ])
    const filters = ref(defaultFilters({ tags: ['Jedi'] }))
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(1)
    expect(results.value[0].name).toBe('Luke Skywalker')
  })

  it('requires all selected tags to be present (AND logic)', () => {
    const chars = ref([
      makeChar({ tags: ['Rebel', 'Jedi', 'Hero'] }),
      makeChar({ id: 2, name: 'Han', tags: ['Rebel', 'Scoundrel'] }),
    ])
    const filters = ref(defaultFilters({ tags: ['Rebel', 'Jedi'] }))
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(1)
    expect(results.value[0].name).toBe('Luke Skywalker')
  })

  // ---------- ownedOnly ----------
  it('ownedOnly filters to owned swps', () => {
    // Characters have full swp string; collection store uses short swpCode
    const chars = ref([
      makeChar({ swp: 'SWP01: Starter Set', swpCode: 'SWP01' }),
      makeChar({ id: 2, name: 'Vader', swp: 'SWP02: Another Pack', swpCode: 'SWP02' }),
    ])
    const filters = ref(defaultFilters({ ownedOnly: true, ownedSwpSet: new Set(['SWP01']) }))
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(1)
    expect(results.value[0].swpCode).toBe('SWP01')
  })

  it('ownedOnly false returns all regardless of ownership', () => {
    const chars = ref([
      makeChar({ swp: 'SWP01: Starter Set', swpCode: 'SWP01' }),
      makeChar({ id: 2, name: 'Vader', swp: 'SWP02: Another Pack', swpCode: 'SWP02' }),
    ])
    const filters = ref(defaultFilters({ ownedOnly: false, ownedSwpSet: new Set(['SWP01']) }))
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(2)
  })

  // ---------- swpFilter ----------
  it('swpFilter filters by swpCode', () => {
    const chars = ref([
      makeChar({ swpCode: 'SWP01' }),
      makeChar({ id: 2, name: 'Vader', swpCode: 'SWP02' }),
    ])
    const filters = ref(defaultFilters({ swpFilter: 'SWP01' }))
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(1)
    expect(results.value[0].swpCode).toBe('SWP01')
  })

  // ---------- favoritesOnly ----------
  it('favoritesOnly filters to favorited character ids', () => {
    const chars = ref([
      makeChar({ id: 1 }),
      makeChar({ id: 2, name: 'Vader' }),
    ])
    const filters = ref(defaultFilters({ favoritesOnly: true, favoritedSet: new Set([1]) }))
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(1)
    expect(results.value[0].id).toBe(1)
  })

  // ---------- multi-era ----------
  it('era filter matches character with semicolon-delimited multi-era', () => {
    const chars = ref([
      makeChar({ id: 1, era: 'GCW;Clone Wars' }),
      makeChar({ id: 2, name: 'Vader', era: 'GCW' }),
    ])
    const filters = ref(defaultFilters({ era: 'Clone Wars' }))
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(1)
    expect(results.value[0].id).toBe(1)
  })

  // ---------- combinations ----------
  it('combines query + type filters', () => {
    const chars = ref([
      makeChar({ name: 'Luke', unitType: 'Primary' }),
      makeChar({ id: 2, name: 'Luke Clone', unitType: 'Secondary', pc: 3, sp: null }),
    ])
    const filters = ref(defaultFilters({ query: 'luke', type: 'Secondary' }))
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(1)
    expect(results.value[0].unitType).toBe('Secondary')
  })

  it('reacts to filter changes', () => {
    const chars = ref([makeChar(), makeChar({ id: 2, name: 'Vader' })])
    const filters = ref(defaultFilters())
    const { results } = useSearch(chars, filters)
    expect(results.value).toHaveLength(2)
    filters.value = { ...filters.value, query: 'vader' }
    expect(results.value).toHaveLength(1)
  })
})
