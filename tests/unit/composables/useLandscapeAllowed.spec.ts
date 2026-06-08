import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const STORAGE_KEY = 'shatterapp:allowLandscape'

// happy-dom 17's Storage proxy does not expose working getItem/setItem/clear
// methods, so the composable's localStorage access silently no-ops in tests.
// Install a minimal in-memory localStorage to exercise the real read/write path.
function createLocalStorageMock(): Storage {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => { store[key] = String(value) },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length },
  } as Storage
}

async function freshComposable() {
  vi.resetModules()
  const mod = await import('../../../src/composables/useLandscapeAllowed.ts')
  return mod.useLandscapeAllowed()
}

describe('useLandscapeAllowed', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
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
