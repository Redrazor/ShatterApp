import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// imageUrl.ts reads import.meta.env.VITE_IMAGE_BASE at module load time,
// so each test that needs a different env must reset modules and re-import.

describe('imageUrl — local dev (no IMAGE_BASE)', () => {
  let imageUrl: (path: string | null | undefined) => string

  beforeEach(async () => {
    vi.resetModules()
    // Ensure VITE_IMAGE_BASE is not set
    vi.stubEnv('VITE_IMAGE_BASE', '')
    const mod = await import('../../../src/utils/imageUrl.ts')
    imageUrl = mod.imageUrl
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns empty string for null', () => {
    expect(imageUrl(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(imageUrl(undefined)).toBe('')
  })

  it('returns path as-is when no IMAGE_BASE', () => {
    expect(imageUrl('/images/characters/luke.png')).toBe('/images/characters/luke.png')
  })

  it('returns absolute http URLs unchanged', () => {
    const url = 'https://cdn.example.com/image.webp'
    expect(imageUrl(url)).toBe(url)
  })
})

describe('imageUrl — production CDN (IMAGE_BASE set)', () => {
  let imageUrl: (path: string | null | undefined) => string

  beforeEach(async () => {
    vi.resetModules()
    vi.stubEnv('VITE_IMAGE_BASE', 'https://cdn.example.com')
    const mod = await import('../../../src/utils/imageUrl.ts')
    imageUrl = mod.imageUrl
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('strips /images/ prefix and converts .png to .webp', () => {
    expect(imageUrl('/images/characters/luke.png')).toBe('https://cdn.example.com/characters/luke.webp')
  })

  it('converts .jpg to .webp', () => {
    expect(imageUrl('/images/ko/mission-front.jpg')).toBe('https://cdn.example.com/ko/mission-front.webp')
  })

  it('converts .jpeg to .webp', () => {
    expect(imageUrl('/images/foo.jpeg')).toBe('https://cdn.example.com/foo.webp')
  })

  it('converts .gif to .webp', () => {
    expect(imageUrl('/images/anim.gif')).toBe('https://cdn.example.com/anim.webp')
  })

  it('passes through absolute http URLs even with IMAGE_BASE set', () => {
    const url = 'https://other.example.com/image.webp'
    expect(imageUrl(url)).toBe(url)
  })

  it('returns empty string for null even with IMAGE_BASE set', () => {
    expect(imageUrl(null)).toBe('')
  })
})
