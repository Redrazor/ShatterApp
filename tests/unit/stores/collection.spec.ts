import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCollectionStore } from '../../../src/stores/collection.ts'

describe('useCollectionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with empty owned array', () => {
    const store = useCollectionStore()
    expect(store.owned).toEqual([])
  })

  it('toggleOwned adds a swp code', () => {
    const store = useCollectionStore()
    store.toggleOwned('SWP01')
    expect(store.owned).toContain('SWP01')
  })

  it('toggleOwned removes already-owned swp', () => {
    const store = useCollectionStore()
    store.toggleOwned('SWP01')
    store.toggleOwned('SWP01')
    expect(store.owned).not.toContain('SWP01')
  })

  it('isOwned returns true for owned swp', () => {
    const store = useCollectionStore()
    store.toggleOwned('SWP02')
    expect(store.isOwned('SWP02')).toBe(true)
  })

  it('isOwned returns false for non-owned swp', () => {
    const store = useCollectionStore()
    expect(store.isOwned('SWP99')).toBe(false)
  })

  it('ownedSwpSet reflects current owned state', () => {
    const store = useCollectionStore()
    store.toggleOwned('SWP03')
    store.toggleOwned('SWP04')
    expect(store.ownedSwpSet.has('SWP03')).toBe(true)
    expect(store.ownedSwpSet.has('SWP04')).toBe(true)
    expect(store.ownedSwpSet.has('SWP99')).toBe(false)
  })

  it('ownedSwpSet updates after toggle', () => {
    const store = useCollectionStore()
    store.toggleOwned('SWP05')
    expect(store.ownedSwpSet.has('SWP05')).toBe(true)
    store.toggleOwned('SWP05')
    expect(store.ownedSwpSet.has('SWP05')).toBe(false)
  })

  it('can own multiple swp codes', () => {
    const store = useCollectionStore()
    ;['SWP01', 'SWP02', 'SWP03'].forEach((swp) => store.toggleOwned(swp))
    expect(store.owned).toHaveLength(3)
    expect(store.owned).toContain('SWP02')
  })

  it('importOwned replaces current owned array', () => {
    const store = useCollectionStore()
    store.toggleOwned('SWP01')
    store.toggleOwned('SWP02')
    store.importOwned(['SWP10', 'SWP11', 'SWP12'])
    expect(store.owned).toEqual(['SWP10', 'SWP11', 'SWP12'])
  })

  it('importOwned clears owned when passed empty array', () => {
    const store = useCollectionStore()
    store.toggleOwned('SWP01')
    store.importOwned([])
    expect(store.owned).toEqual([])
  })
})
