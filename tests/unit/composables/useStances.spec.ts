import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const mockStances = {
  '1': {
    characterId: 1,
    name: 'General Anakin Skywalker',
    swpCode: 'SWP01',
    stances: [
      {
        stanceNumber: 1,
        stanceName: 'Form V Djem So',
        ranged: { range: 3, attack: 4, defense: 3 },
        melee: { attack: 5, defense: 3 },
      },
      {
        stanceNumber: 2,
        stanceName: 'Aggressive Assault',
        ranged: null,
        melee: { attack: 6, defense: 2 },
      },
    ],
  },
  '2': {
    characterId: 2,
    name: 'Ahsoka Tano',
    swpCode: 'SWP01',
    stances: [
      {
        stanceNumber: 1,
        stanceName: 'Dual Blades',
        ranged: null,
        melee: { attack: 4, defense: 4 },
      },
    ],
  },
}

describe('useStances', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStances),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('triggers fetch on first call', async () => {
    const { useStances } = await import('../../../src/composables/useStances.ts')
    useStances()
    await Promise.resolve()
    await Promise.resolve()
    expect(fetch).toHaveBeenCalledWith('/data/stances.json')
  })

  it('does not re-fetch on subsequent calls', async () => {
    const { useStances } = await import('../../../src/composables/useStances.ts')
    useStances()
    useStances()
    useStances()
    await Promise.resolve()
    await Promise.resolve()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('getStances returns the correct entry after load', async () => {
    const { useStances } = await import('../../../src/composables/useStances.ts')
    const { getStances } = useStances()
    await new Promise(r => setTimeout(r, 0))
    const entry = getStances(1)
    expect(entry).not.toBeNull()
    expect(entry!.name).toBe('General Anakin Skywalker')
    expect(entry!.stances).toHaveLength(2)
    expect(entry!.stances[0].stanceName).toBe('Form V Djem So')
  })

  it('getStances returns correct ranged stats', async () => {
    const { useStances } = await import('../../../src/composables/useStances.ts')
    const { getStances } = useStances()
    await new Promise(r => setTimeout(r, 0))
    const entry = getStances(1)
    expect(entry!.stances[0].ranged).toEqual({ range: 3, attack: 4, defense: 3 })
  })

  it('getStances returns correct melee stats', async () => {
    const { useStances } = await import('../../../src/composables/useStances.ts')
    const { getStances } = useStances()
    await new Promise(r => setTimeout(r, 0))
    const entry = getStances(1)
    expect(entry!.stances[0].melee).toEqual({ attack: 5, defense: 3 })
  })

  it('getStances returns null ranged when unit has no ranged attack', async () => {
    const { useStances } = await import('../../../src/composables/useStances.ts')
    const { getStances } = useStances()
    await new Promise(r => setTimeout(r, 0))
    const entry = getStances(1)
    expect(entry!.stances[1].ranged).toBeNull()
  })

  it('getStances returns null for unknown character id', async () => {
    const { useStances } = await import('../../../src/composables/useStances.ts')
    const { getStances } = useStances()
    await new Promise(r => setTimeout(r, 0))
    expect(getStances(9999)).toBeNull()
  })

  it('silently ignores a failed fetch', async () => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    const { useStances } = await import('../../../src/composables/useStances.ts')
    const { getStances } = useStances()
    await new Promise(r => setTimeout(r, 0))
    expect(getStances(1)).toBeNull()
  })

  it('silently ignores a non-ok HTTP response', async () => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }))
    const { useStances } = await import('../../../src/composables/useStances.ts')
    const { getStances } = useStances()
    await new Promise(r => setTimeout(r, 0))
    expect(getStances(1)).toBeNull()
  })
})
