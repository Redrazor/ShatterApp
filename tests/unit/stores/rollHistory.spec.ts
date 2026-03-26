import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRollHistoryStore } from '../../../src/stores/rollHistory.ts'

describe('useRollHistoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with empty entries', () => {
    const store = useRollHistoryStore()
    expect(store.entries).toEqual([])
  })

  it('push adds an entry at the front', () => {
    const store = useRollHistoryStore()
    store.push({ crit: 1 }, { block: 2 }, 3)
    expect(store.entries).toHaveLength(1)
    expect(store.entries[0].atk).toEqual({ crit: 1 })
    expect(store.entries[0].def).toEqual({ block: 2 })
    expect(store.entries[0].hits).toBe(3)
  })

  it('push limits entries to 20', () => {
    const store = useRollHistoryStore()
    for (let i = 0; i < 25; i++) {
      store.push({ hit: i }, {}, i)
    }
    expect(store.entries).toHaveLength(20)
  })

  it('updateCurrent modifies the most recent entry', () => {
    const store = useRollHistoryStore()
    store.push({ hit: 1 }, { block: 1 }, 0)
    store.updateCurrent({ hit: 2 }, { block: 0 }, 2)
    expect(store.entries[0].atk).toEqual({ hit: 2 })
    expect(store.entries[0].hits).toBe(2)
  })

  it('updateCurrent does nothing when entries is empty', () => {
    const store = useRollHistoryStore()
    store.updateCurrent({ hit: 1 }, {}, 1)
    expect(store.entries).toHaveLength(0)
  })

  it('clear removes all entries', () => {
    const store = useRollHistoryStore()
    store.push({ hit: 1 }, {}, 1)
    store.push({ hit: 2 }, {}, 2)
    store.clear()
    expect(store.entries).toEqual([])
  })
})
