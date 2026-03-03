import { describe, it, expect } from 'vitest'
import {
  encodeBuild,
  decodeBuild,
  encodeProfile,
  decodeProfile,
} from '../../../src/utils/profileShare.ts'
import type { CompactBuild, CompactProfile } from '../../../src/types/index.ts'

const sampleBuild: CompactBuild = {
  name: 'Test Build',
  mid: 42,
  pre: true,
  s: [
    [1, 2, 3],
    [4, 5, 6],
  ],
}

const emptyBuild: CompactBuild = {
  name: 'Empty',
  mid: null,
  pre: false,
  s: [
    [0, 0, 0],
    [0, 0, 0],
  ],
}

describe('encodeBuild / decodeBuild', () => {
  it('roundtrip with full data', () => {
    const encoded = encodeBuild('Test Build', 42, true, [[1, 2, 3], [4, 5, 6]])
    const decoded = decodeBuild(encoded)
    expect(decoded).toEqual(sampleBuild)
  })

  it('roundtrip with null mission and zeros', () => {
    const encoded = encodeBuild('Empty', null, false, [[0, 0, 0], [0, 0, 0]])
    const decoded = decodeBuild(encoded)
    expect(decoded).toEqual(emptyBuild)
  })

  it('produces a URL-safe string (no +, /, =)', () => {
    const encoded = encodeBuild('Test Build', 42, true, [[1, 2, 3], [4, 5, 6]])
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
    const bad = btoa(JSON.stringify({ name: 'x', mid: null, pre: false, s: [[1, 2, 3]] }))
    expect(decodeBuild(bad)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(decodeBuild('')).toBeNull()
  })
})

describe('encodeProfile / decodeProfile', () => {
  it('roundtrip with full profile', () => {
    const lists: CompactBuild[] = [sampleBuild, emptyBuild]
    const encoded = encodeProfile(['SWP01', 'SWP03'], [7, 12], lists)
    const decoded = decodeProfile(encoded)
    expect(decoded).toEqual({
      v: 1,
      owned: ['SWP01', 'SWP03'],
      fav: [7, 12],
      lists,
    })
  })

  it('roundtrip with empty arrays', () => {
    const encoded = encodeProfile([], [], [])
    const decoded = decodeProfile(encoded)
    expect(decoded).toEqual({ v: 1, owned: [], fav: [], lists: [] })
  })

  it('produces a URL-safe string', () => {
    const encoded = encodeProfile(['SWP01'], [], [])
    expect(encoded).not.toMatch(/[+/=]/)
  })

  it('returns null for invalid base64', () => {
    expect(decodeProfile('!!!bad!!!')).toBeNull()
  })

  it('returns null when v is not 1', () => {
    const bad = btoa(JSON.stringify({ v: 2, owned: [], fav: [], lists: [] }))
    expect(decodeProfile(bad)).toBeNull()
  })

  it('returns null when owned is not an array', () => {
    const bad = btoa(JSON.stringify({ v: 1, owned: 'bad', fav: [], lists: [] }))
    expect(decodeProfile(bad)).toBeNull()
  })

  it('returns null when lists is missing', () => {
    const bad = btoa(JSON.stringify({ v: 1, owned: [], fav: [] }))
    expect(decodeProfile(bad)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(decodeProfile('')).toBeNull()
  })
})
