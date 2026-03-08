import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// useKeywords.ts has a module-level `loaded` flag, so we must reset modules
// between tests to get a fresh instance with `loaded = false`.

const mockKeywords = {
  Enrage: 'When this unit is wounded, it gains +2 to attack.',
  Arsenal: 'This unit may make additional attacks.',
  Cover: 'Reduce incoming ranged damage by 1.',
}

describe('useKeywords', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockKeywords),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('triggers fetch on first call', async () => {
    const { useKeywords } = await import('../../../src/composables/useKeywords.ts')
    useKeywords()
    // flush microtask queue so the fetch promise resolves
    await Promise.resolve()
    await Promise.resolve()
    expect(fetch).toHaveBeenCalledWith('/data/keywords.json')
  })

  it('does not re-fetch on subsequent calls', async () => {
    const { useKeywords } = await import('../../../src/composables/useKeywords.ts')
    useKeywords()
    useKeywords()
    useKeywords()
    await Promise.resolve()
    await Promise.resolve()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('getDefinition returns the correct definition after load', async () => {
    const { useKeywords } = await import('../../../src/composables/useKeywords.ts')
    const { getDefinition } = useKeywords()
    // Wait for fetch + json to resolve
    await new Promise(r => setTimeout(r, 0))
    expect(getDefinition('Enrage')).toBe(mockKeywords.Enrage)
    expect(getDefinition('Cover')).toBe(mockKeywords.Cover)
  })

  it('getDefinition returns undefined for an unknown keyword', async () => {
    const { useKeywords } = await import('../../../src/composables/useKeywords.ts')
    const { getDefinition } = useKeywords()
    await new Promise(r => setTimeout(r, 0))
    expect(getDefinition('UnknownKeyword')).toBeUndefined()
  })

  it('keywords ref is populated after load', async () => {
    const { useKeywords } = await import('../../../src/composables/useKeywords.ts')
    const { keywords } = useKeywords()
    await new Promise(r => setTimeout(r, 0))
    expect(keywords.value).toMatchObject(mockKeywords)
  })

  it('silently ignores a failed fetch', async () => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    const { useKeywords } = await import('../../../src/composables/useKeywords.ts')
    const { keywords, getDefinition } = useKeywords()
    await new Promise(r => setTimeout(r, 0))
    expect(keywords.value).toEqual({})
    expect(getDefinition('Enrage')).toBeUndefined()
  })

  it('silently ignores a non-ok HTTP response', async () => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }))
    const { useKeywords } = await import('../../../src/composables/useKeywords.ts')
    const { keywords } = useKeywords()
    await new Promise(r => setTimeout(r, 0))
    expect(keywords.value).toEqual({})
  })
})
