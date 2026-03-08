import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useErrataStore } from '../../../src/stores/errata.ts'
import type { ErrataEntry } from '../../../src/stores/errata.ts'

const mockData: Record<string, ErrataEntry[]> = {
  '1': [
    { version: '1.1', date: '2024-01-15', cardArtCurrent: false, changes: ['Reduced Force by 1', 'Updated ability text'] },
    { version: '1.0', date: '2023-06-01', cardArtCurrent: true,  changes: ['Initial release'] },
  ],
  '2': [
    { version: '1.2', date: '2024-03-01', cardArtCurrent: true, changes: ['Fixed typo'] },
  ],
}

describe('useErrataStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockData),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ── load ────────────────────────────────────────────────────────────────────

  it('load populates data and sets loaded flag', async () => {
    const store = useErrataStore()
    await store.load()
    expect(fetch).toHaveBeenCalledWith('/data/errata.json')
    expect(store.getErrata(1)).toHaveLength(2)
  })

  it('load is idempotent — only fetches once', async () => {
    const store = useErrataStore()
    await store.load()
    await store.load()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  // ── getErrata ───────────────────────────────────────────────────────────────

  it('getErrata returns entries for a known character id', async () => {
    const store = useErrataStore()
    await store.load()
    const entries = store.getErrata(1)
    expect(entries).toHaveLength(2)
    expect(entries[0].version).toBe('1.1')
  })

  it('getErrata returns empty array for an unknown character id', async () => {
    const store = useErrataStore()
    await store.load()
    expect(store.getErrata(999)).toEqual([])
  })

  it('getErrata returns empty array before data is loaded', () => {
    const store = useErrataStore()
    expect(store.getErrata(1)).toEqual([])
  })

  // ── isCardArtCurrent ────────────────────────────────────────────────────────

  it('isCardArtCurrent returns true when there are no errata entries', async () => {
    const store = useErrataStore()
    await store.load()
    expect(store.isCardArtCurrent(999)).toBe(true)
  })

  it('isCardArtCurrent returns the cardArtCurrent flag of the first entry', async () => {
    const store = useErrataStore()
    await store.load()
    // Character 1: first entry has cardArtCurrent = false
    expect(store.isCardArtCurrent(1)).toBe(false)
    // Character 2: first entry has cardArtCurrent = true
    expect(store.isCardArtCurrent(2)).toBe(true)
  })
})
