import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharactersStore } from '../../../src/stores/characters.ts'
import { useMissionsStore } from '../../../src/stores/missions.ts'
import { useProductsStore } from '../../../src/stores/products.ts'
import type { Character } from '../../../src/types/index.ts'

const mockCharacters: Character[] = [
  {
    id: 1,
    name: 'Luke Skywalker',
    characterType: 'Hero',
    unitType: 'Primary',
    pc: null,
    sp: 5,
    durability: 4,
    stamina: 6,
    fp: 2,
    era: 'GCW',
    tags: ['Rebel'],
    swp: 'SWP01',
    thumbnail: '/images/luke.png',
    cardFront: '',
    cardBack: '',
    stances: [],
    releaseDate: '',
  },
]

describe('useCharactersStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts with empty characters array', () => {
    const store = useCharactersStore()
    expect(store.characters).toEqual([])
  })

  it('starts with loading=false', () => {
    const store = useCharactersStore()
    expect(store.loading).toBe(false)
  })

  it('load() fetches and populates characters', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCharacters),
    })
    vi.stubGlobal('fetch', mockFetch)

    const store = useCharactersStore()
    await store.load()

    expect(store.characters).toHaveLength(1)
    expect(store.characters[0].name).toBe('Luke Skywalker')
    expect(store.loading).toBe(false)
  })

  it('load() sets error on HTTP failure', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    })
    vi.stubGlobal('fetch', mockFetch)

    const store = useCharactersStore()
    await store.load()

    expect(store.error).toBeTruthy()
    expect(store.characters).toHaveLength(0)
  })

  it('load() sets error on network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
    vi.stubGlobal('fetch', mockFetch)

    const store = useCharactersStore()
    await store.load()

    expect(store.error).toBe('Network error')
  })

  it('load() does not fetch if already loaded', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCharacters),
    })
    vi.stubGlobal('fetch', mockFetch)

    const store = useCharactersStore()
    await store.load()
    await store.load() // second call

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

describe('useMissionsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts empty', () => {
    const store = useMissionsStore()
    expect(store.missions).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('load() fetches missions', async () => {
    const mockMissions = [{ id: 1, name: 'Test Mission', card: '', swp: 'SWP01', struggles: {} }]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMissions),
    }))

    const store = useMissionsStore()
    await store.load()

    expect(store.missions).toHaveLength(1)
    expect(store.missions[0].name).toBe('Test Mission')
  })

  it('load() handles HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    const store = useMissionsStore()
    await store.load()

    expect(store.error).toBeTruthy()
    expect(store.missions).toHaveLength(0)
  })

  it('load() does not re-fetch if already loaded', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 1, name: 'M', card: '', swp: 'SWP01', struggles: {} }]),
    })
    vi.stubGlobal('fetch', fetchMock)

    const store = useMissionsStore()
    await store.load()
    await store.load()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('useProductsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts empty', () => {
    const store = useProductsStore()
    expect(store.products).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('load() fetches products', async () => {
    const mockProducts = [{
      id: 1, name: 'Core Set', swp: 'SWP00', era: 'GCW',
      thumbnail: '', images: [], models: [], description: '',
      assemblyUrl: '', storeLink: '',
    }]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProducts),
    }))

    const store = useProductsStore()
    await store.load()

    expect(store.products).toHaveLength(1)
    expect(store.products[0].name).toBe('Core Set')
  })

  it('load() handles network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')))

    const store = useProductsStore()
    await store.load()

    expect(store.error).toBe('Connection refused')
  })

  it('load() does not re-fetch if already loaded', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 1, name: 'P', swp: 'SWP00', era: '', thumbnail: '', images: [], models: [], description: '', assemblyUrl: '', storeLink: '' }]),
    })
    vi.stubGlobal('fetch', fetchMock)

    const store = useProductsStore()
    await store.load()
    await store.load()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
