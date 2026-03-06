import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useKoMissionsStore } from '../../../src/stores/koMissions.ts'
import type { KoMission } from '../../../src/types/index.ts'

const mockMissions: KoMission[] = [
  {
    id: 1,
    name: 'Explore the Ruins',
    missionFront: '/images/ko/explore-front.png',
    missionBack: '/images/ko/explore-back.png',
    stages: [
      { front: '/images/ko/stage-1-front.png', back: '/images/ko/stage-1-back.png' },
    ],
    tracker: '/images/ko/tracker.png',
  },
  {
    id: 2,
    name: 'Foil the Heist',
    stages: [],
  },
]

describe('useKoMissionsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  // ── Initial state ─────────────────────────────────────────────────────────

  it('starts with empty missions array', () => {
    const store = useKoMissionsStore()
    expect(store.missions).toEqual([])
  })

  it('starts with loading false', () => {
    const store = useKoMissionsStore()
    expect(store.loading).toBe(false)
  })

  // ── load() success ────────────────────────────────────────────────────────

  it('load() fetches and stores missions on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMissions),
    }))
    const store = useKoMissionsStore()
    await store.load()
    expect(store.missions).toEqual(mockMissions)
    expect(store.loading).toBe(false)
  })

  it('load() sets loading to false after success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMissions),
    }))
    const store = useKoMissionsStore()
    await store.load()
    expect(store.loading).toBe(false)
  })

  // ── load() error handling ─────────────────────────────────────────────────

  it('load() silently handles HTTP error, missions stays empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }))
    const store = useKoMissionsStore()
    await store.load()
    expect(store.missions).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('load() silently handles network error, missions stays empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const store = useKoMissionsStore()
    await store.load()
    expect(store.missions).toEqual([])
    expect(store.loading).toBe(false)
  })

  // ── load() idempotency ────────────────────────────────────────────────────

  it('load() does not fetch again if missions already loaded', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMissions),
    })
    vi.stubGlobal('fetch', fetchMock)
    const store = useKoMissionsStore()
    await store.load()
    await store.load()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
