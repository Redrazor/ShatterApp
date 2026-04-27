import { describe, it, expect, beforeEach, vi } from 'vitest'

const STORAGE_KEY = 'shatterapp:allowLandscape'

async function freshComposable() {
  vi.resetModules()
  const mod = await import('../../../src/composables/useLandscapeAllowed.ts')
  return mod.useLandscapeAllowed()
}

describe('useLandscapeAllowed', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to false when no stored value exists', async () => {
    const ref = await freshComposable()
    expect(ref.value).toBe(false)
  })

  it('initialises to true when localStorage has "true"', async () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    const ref = await freshComposable()
    expect(ref.value).toBe(true)
  })

  it('initialises to false when localStorage has anything other than "true"', async () => {
    localStorage.setItem(STORAGE_KEY, 'false')
    const ref = await freshComposable()
    expect(ref.value).toBe(false)
  })

  it('writes "true" to localStorage when toggled on', async () => {
    const ref = await freshComposable()
    ref.value = true
    await new Promise(r => setTimeout(r, 0))
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true')
  })

  it('writes "false" to localStorage when toggled off', async () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    const ref = await freshComposable()
    ref.value = false
    await new Promise(r => setTimeout(r, 0))
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false')
  })

  it('returns the same ref across multiple calls (singleton)', async () => {
    vi.resetModules()
    const mod = await import('../../../src/composables/useLandscapeAllowed.ts')
    const a = mod.useLandscapeAllowed()
    const b = mod.useLandscapeAllowed()
    expect(a).toBe(b)
  })
})
