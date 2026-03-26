import { describe, it, expect } from 'vitest'
import {
  encodeBuild,
  decodeBuild,
} from '../../../src/utils/profileShare.ts'
import type { CompactBuild } from '../../../src/types/index.ts'

const sampleBuild: CompactBuild = {
  name: 'Test Build',
  mid: 42,
  mode: 'premiere',
  s: [
    [1, 2, 3],
    [4, 5, 6],
  ],
}

const emptyBuild: CompactBuild = {
  name: 'Empty',
  mid: null,
  mode: 'standard',
  s: [
    [0, 0, 0],
    [0, 0, 0],
  ],
}

describe('encodeBuild / decodeBuild', () => {
  it('roundtrip with full data', () => {
    const encoded = encodeBuild('Test Build', 42, 'premiere', [[1, 2, 3], [4, 5, 6]])
    const decoded = decodeBuild(encoded)
    expect(decoded).toEqual(sampleBuild)
  })

  it('roundtrip with null mission and zeros', () => {
    const encoded = encodeBuild('Empty', null, 'standard', [[0, 0, 0], [0, 0, 0]])
    const decoded = decodeBuild(encoded)
    expect(decoded).toEqual(emptyBuild)
  })

  it('produces a URL-safe string (no +, /, =)', () => {
    const encoded = encodeBuild('Test Build', 42, 'premiere', [[1, 2, 3], [4, 5, 6]])
    expect(encoded).not.toMatch(/[+/=]/)
  })

  it('returns null for invalid base64', () => {
    expect(decodeBuild('!!!invalid!!!')).toBeNull()
  })

  it('returns null for valid base64 but wrong structure', () => {
    const bad = btoa(JSON.stringify({ foo: 'bar' }))
    expect(decodeBuild(bad)).toBeNull()
  })

  it('returns null for build with wrong s length', () => {
    const bad = btoa(JSON.stringify({ name: 'x', mid: null, mode: 'standard', s: [[1, 2, 3]] }))
    expect(decodeBuild(bad)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(decodeBuild('')).toBeNull()
  })

  // ---------- build mode / ex field ----------

  it('roundtrip with ex field (premiere build)', () => {
    const encoded = encodeBuild('Premiere Build', 1, 'premiere', [[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]])
    const decoded = decodeBuild(encoded)
    expect(decoded).not.toBeNull()
    expect(decoded!.mode).toBe('premiere')
    expect(decoded!.ex).toEqual([[7, 8, 9], [10, 11, 12]])
    expect(decoded!.s).toEqual([[1, 2, 3], [4, 5, 6]])
  })

  it('roundtrip with ex field (threemiere build)', () => {
    const encoded = encodeBuild('Threemiere Build', 1, 'threemiere', [[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [0, 0, 0]])
    const decoded = decodeBuild(encoded)
    expect(decoded).not.toBeNull()
    expect(decoded!.mode).toBe('threemiere')
    expect(decoded!.ex).toEqual([[7, 8, 9], [0, 0, 0]])
  })

  it('ex is not included when mode is standard', () => {
    const encoded = encodeBuild('Normal', null, 'standard', [[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]])
    const decoded = decodeBuild(encoded)
    expect(decoded).not.toBeNull()
    expect(decoded!.ex).toBeUndefined()
  })

  it('ex is not included when mode is premiere but no ex provided', () => {
    const encoded = encodeBuild('Premiere No Ex', null, 'premiere', [[1, 2, 3], [4, 5, 6]])
    const decoded = decodeBuild(encoded)
    expect(decoded).not.toBeNull()
    expect(decoded!.ex).toBeUndefined()
  })

  it('old builds with pre:boolean decode via backward compat', () => {
    const legacyBuild = { name: 'Legacy', mid: null, pre: true, s: [[1, 2, 3], [4, 5, 6]] }
    const encoded = btoa(JSON.stringify(legacyBuild)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const decoded = decodeBuild(encoded)
    expect(decoded).not.toBeNull()
    expect(decoded!.mode).toBe('premiere')
    expect(decoded!.ex).toBeUndefined()
  })

  it('old builds with pre:false decode as standard', () => {
    const legacyBuild = { name: 'Legacy Std', mid: null, pre: false, s: [[1, 2, 3], [4, 5, 6]] }
    const encoded = btoa(JSON.stringify(legacyBuild)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const decoded = decodeBuild(encoded)
    expect(decoded).not.toBeNull()
    expect(decoded!.mode).toBe('standard')
  })

  it('returns null when ex has wrong length', () => {
    const bad = btoa(JSON.stringify({
      name: 'x', mid: null, mode: 'premiere',
      s: [[1, 2, 3], [4, 5, 6]],
      ex: [[1, 2, 3]],
    }))
    expect(decodeBuild(bad)).toBeNull()
  })

  it('returns null when ex[0] has wrong length', () => {
    const bad = btoa(JSON.stringify({
      name: 'x', mid: null, mode: 'premiere',
      s: [[1, 2, 3], [4, 5, 6]],
      ex: [[1, 2], [3, 4, 5]],
    }))
    expect(decodeBuild(bad)).toBeNull()
  })

  it('falls back to standard for unknown mode value', () => {
    const bad = btoa(JSON.stringify({
      name: 'x', mid: null, mode: 'bogus',
      s: [[1, 2, 3], [4, 5, 6]],
    }))
    const decoded = decodeBuild(bad)
    expect(decoded).not.toBeNull()
    expect(decoded!.mode).toBe('standard')
  })
})

