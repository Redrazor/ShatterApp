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

  describe('individual character ownership', () => {
    it('starts with empty ownedCharacterIds', () => {
      const store = useCollectionStore()
      expect(store.ownedCharacterIds).toEqual([])
    })

    it('toggleCharacterOwned adds a character id', () => {
      const store = useCollectionStore()
      store.toggleCharacterOwned(42)
      expect(store.ownedCharacterIds).toContain(42)
    })

    it('toggleCharacterOwned removes an already-owned character id', () => {
      const store = useCollectionStore()
      store.toggleCharacterOwned(42)
      store.toggleCharacterOwned(42)
      expect(store.ownedCharacterIds).not.toContain(42)
    })

    it('isCharacterOwned returns true for owned id', () => {
      const store = useCollectionStore()
      store.toggleCharacterOwned(7)
      expect(store.isCharacterOwned(7)).toBe(true)
    })

    it('isCharacterOwned returns false for non-owned id', () => {
      const store = useCollectionStore()
      expect(store.isCharacterOwned(999)).toBe(false)
    })

    it('ownedCharacterSet reflects current state', () => {
      const store = useCollectionStore()
      store.toggleCharacterOwned(1)
      store.toggleCharacterOwned(2)
      expect(store.ownedCharacterSet.has(1)).toBe(true)
      expect(store.ownedCharacterSet.has(2)).toBe(true)
      expect(store.ownedCharacterSet.has(3)).toBe(false)
    })

    it('importCharacterOwned replaces current ownedCharacterIds', () => {
      const store = useCollectionStore()
      store.toggleCharacterOwned(1)
      store.toggleCharacterOwned(2)
      store.importCharacterOwned([10, 20, 30])
      expect(store.ownedCharacterIds).toEqual([10, 20, 30])
    })

    it('importCharacterOwned clears ids when passed empty array', () => {
      const store = useCollectionStore()
      store.toggleCharacterOwned(5)
      store.importCharacterOwned([])
      expect(store.ownedCharacterIds).toEqual([])
    })

    it('ownedCharacterSet updates after removal', () => {
      const store = useCollectionStore()
      store.toggleCharacterOwned(5)
      store.toggleCharacterOwned(5)
      expect(store.ownedCharacterSet.has(5)).toBe(false)
    })
  })

  describe('auto-mark character ids via toggleOwned', () => {
    it('toggleOwned with characterIds marks them owned when adding', () => {
      const store = useCollectionStore()
      store.toggleOwned('SWP01', [1, 2, 3])
      expect(store.ownedCharacterIds).toEqual([1, 2, 3])
    })

    it('toggleOwned with characterIds removes them when removing pack', () => {
      const store = useCollectionStore()
      store.toggleOwned('SWP01', [1, 2, 3])
      store.toggleOwned('SWP01', [1, 2, 3])
      expect(store.ownedCharacterIds).toEqual([])
    })

    it('toggleOwned without characterIds does not affect ownedCharacterIds', () => {
      const store = useCollectionStore()
      store.toggleCharacterOwned(99)
      store.toggleOwned('SWP01')
      expect(store.ownedCharacterIds).toContain(99)
    })

    it('toggleOwned does not duplicate already-owned character ids', () => {
      const store = useCollectionStore()
      store.toggleCharacterOwned(1)
      store.toggleOwned('SWP01', [1, 2])
      expect(store.ownedCharacterIds.filter(id => id === 1)).toHaveLength(1)
    })
  })

  describe('painted character tracking', () => {
    it('starts with empty paintedCharacterIds', () => {
      const store = useCollectionStore()
      expect(store.paintedCharacterIds).toEqual([])
    })

    it('toggleCharacterPainted adds a character id', () => {
      const store = useCollectionStore()
      store.toggleCharacterPainted(10)
      expect(store.paintedCharacterIds).toContain(10)
    })

    it('toggleCharacterPainted removes an already-painted id', () => {
      const store = useCollectionStore()
      store.toggleCharacterPainted(10)
      store.toggleCharacterPainted(10)
      expect(store.paintedCharacterIds).not.toContain(10)
    })

    it('isPainted returns true for painted id', () => {
      const store = useCollectionStore()
      store.toggleCharacterPainted(5)
      expect(store.isPainted(5)).toBe(true)
    })

    it('isPainted returns false for non-painted id', () => {
      const store = useCollectionStore()
      expect(store.isPainted(999)).toBe(false)
    })

    it('paintedCharacterSet reflects current state', () => {
      const store = useCollectionStore()
      store.toggleCharacterPainted(1)
      store.toggleCharacterPainted(2)
      expect(store.paintedCharacterSet.has(1)).toBe(true)
      expect(store.paintedCharacterSet.has(3)).toBe(false)
    })

    it('importPainted replaces paintedCharacterIds', () => {
      const store = useCollectionStore()
      store.toggleCharacterPainted(1)
      store.importPainted([10, 20])
      expect(store.paintedCharacterIds).toEqual([10, 20])
    })
  })

  describe('based character tracking', () => {
    it('starts with empty basedCharacterIds', () => {
      const store = useCollectionStore()
      expect(store.basedCharacterIds).toEqual([])
    })

    it('toggleCharacterBased adds a character id', () => {
      const store = useCollectionStore()
      store.toggleCharacterBased(7)
      expect(store.basedCharacterIds).toContain(7)
    })

    it('toggleCharacterBased removes an already-based id', () => {
      const store = useCollectionStore()
      store.toggleCharacterBased(7)
      store.toggleCharacterBased(7)
      expect(store.basedCharacterIds).not.toContain(7)
    })

    it('isBased returns true for based id', () => {
      const store = useCollectionStore()
      store.toggleCharacterBased(3)
      expect(store.isBased(3)).toBe(true)
    })

    it('isBased returns false for non-based id', () => {
      const store = useCollectionStore()
      expect(store.isBased(999)).toBe(false)
    })

    it('basedCharacterSet reflects current state', () => {
      const store = useCollectionStore()
      store.toggleCharacterBased(4)
      expect(store.basedCharacterSet.has(4)).toBe(true)
      expect(store.basedCharacterSet.has(5)).toBe(false)
    })

    it('importBased replaces basedCharacterIds', () => {
      const store = useCollectionStore()
      store.toggleCharacterBased(1)
      store.importBased([30, 40])
      expect(store.basedCharacterIds).toEqual([30, 40])
    })
  })
})
