import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockAbilities = {
  '1': {
    characterId: 1,
    name: 'General Anakin Skywalker',
    swpCode: 'SWP01',
    abilities: [
      { name: 'Chosen One', type: 'innate', description: 'This unit ignores the effects of Strained.' },
      { name: 'Reckless Assault', type: 'active', description: 'Spend [force] to make an extra attack.' },
    ],
  },
  '2': {
    characterId: 2,
    name: 'Ahsoka Tano',
    swpCode: 'SWP01',
    abilities: [
      { name: 'Jar\'Kai', type: 'innate', description: 'This unit may reroll one attack die.' },
    ],
  },
}

describe('useAbilities', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAbilities),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('triggers fetch on first call', async () => {
    const { useAbilities } = await import('../../../src/composables/useAbilities.ts')
    useAbilities()
    await Promise.resolve()
    await Promise.resolve()
    expect(fetch).toHaveBeenCalledWith('/data/abilities.json')
  })

  it('does not re-fetch on subsequent calls', async () => {
    const { useAbilities } = await import('../../../src/composables/useAbilities.ts')
    useAbilities()
    useAbilities()
    useAbilities()
    await Promise.resolve()
    await Promise.resolve()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('getAbilities returns the correct entry after load', async () => {
    const { useAbilities } = await import('../../../src/composables/useAbilities.ts')
    const { getAbilities } = useAbilities()
    await new Promise(r => setTimeout(r, 0))
    const entry = getAbilities(1)
    expect(entry).not.toBeNull()
    expect(entry!.name).toBe('General Anakin Skywalker')
    expect(entry!.abilities).toHaveLength(2)
  })

  it('getAbilities returns correct ability fields', async () => {
    const { useAbilities } = await import('../../../src/composables/useAbilities.ts')
    const { getAbilities } = useAbilities()
    await new Promise(r => setTimeout(r, 0))
    const entry = getAbilities(1)
    expect(entry!.abilities[0]).toEqual({
      name: 'Chosen One',
      type: 'innate',
      description: 'This unit ignores the effects of Strained.',
    })
  })

  it('getAbilities returns null for unknown character id', async () => {
    const { useAbilities } = await import('../../../src/composables/useAbilities.ts')
    const { getAbilities } = useAbilities()
    await new Promise(r => setTimeout(r, 0))
    expect(getAbilities(9999)).toBeNull()
  })

  it('silently ignores a failed fetch', async () => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    const { useAbilities } = await import('../../../src/composables/useAbilities.ts')
    const { getAbilities } = useAbilities()
    await new Promise(r => setTimeout(r, 0))
    expect(getAbilities(1)).toBeNull()
  })

  it('silently ignores a non-ok HTTP response', async () => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }))
    const { useAbilities } = await import('../../../src/composables/useAbilities.ts')
    const { getAbilities } = useAbilities()
    await new Promise(r => setTimeout(r, 0))
    expect(getAbilities(1)).toBeNull()
  })

  it('getAbilities returns custom published ability when not found in official data', async () => {
    const { usePublishedProfilesStore } = await import('../../../src/stores/publishedProfiles.ts')
    const publishedStore = usePublishedProfilesStore()
    // Directly inject a custom ability entry (negative ID)
    publishedStore.abilities[-1000] = {
      characterId: -1000,
      name: 'Custom Unit',
      swpCode: 'CUSTOM',
      abilities: [{ name: 'Custom Ability', type: 'active', cost: 1, description: 'Do custom thing.' }],
    }

    const { useAbilities } = await import('../../../src/composables/useAbilities.ts')
    const { getAbilities } = useAbilities()
    await new Promise(r => setTimeout(r, 0))

    const entry = getAbilities(-1000)
    expect(entry).not.toBeNull()
    expect(entry!.name).toBe('Custom Unit')
    expect(entry!.swpCode).toBe('CUSTOM')
    expect(entry!.abilities[0].name).toBe('Custom Ability')
  })

  it('allEntries includes both official and custom abilities', async () => {
    const { usePublishedProfilesStore } = await import('../../../src/stores/publishedProfiles.ts')
    const publishedStore = usePublishedProfilesStore()
    publishedStore.abilities[-1000] = {
      characterId: -1000,
      name: 'Custom Unit',
      swpCode: 'CUSTOM',
      abilities: [],
    }

    const { useAbilities } = await import('../../../src/composables/useAbilities.ts')
    const { allEntries } = useAbilities()
    await new Promise(r => setTimeout(r, 0))

    // 2 official (from mockAbilities) + 1 custom
    expect(allEntries.value.length).toBe(3)
    const customEntry = allEntries.value.find(e => e.swpCode === 'CUSTOM')
    expect(customEntry).toBeDefined()
  })
})
