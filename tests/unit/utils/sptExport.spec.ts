import { describe, it, expect } from 'vitest'
import { encodeSPT } from '../../../src/utils/sptExport.ts'
import type { Character, Mission, Squad } from '../../../src/types/index.ts'

function makeChar(id: number, spt: string, unitType: 'Primary' | 'Secondary' | 'Support' = 'Primary'): Character {
  return {
    id,
    slug: `char-${id}`,
    name: `Char ${id}`,
    characterType: `Type${id}`,
    unitType,
    pc: 4,
    sp: 10,
    durability: 2,
    stamina: 8,
    fp: 0,
    era: 'Test',
    tags: [],
    swp: 'SWP01',
    swpCode: 'SWP01',
    spt,
    thumbnail: '',
    cardFront: '',
    cardBack: '',
    stances: [],
    releaseDate: '',
  }
}

function makeSquad(primary: Character | null, secondary: Character | null, support: Character | null): Squad {
  return { primary, secondary, support }
}

const mission: Mission = {
  id: 1,
  name: 'Test Mission',
  card: '',
  swp: 'SWP45',
  spt: '00450201',
  struggles: {},
}

describe('encodeSPT', () => {
  it('encodes a standard list with mission', () => {
    const c1 = makeChar(1, '00010101', 'Primary')
    const c2 = makeChar(2, '00010102', 'Secondary')
    const c3 = makeChar(3, '00010103', 'Support')
    const squads = [makeSquad(c1, c2, c3), makeSquad(null, null, null)]
    const result = encodeSPT(squads, [], mission, [c1, c2, c3])
    expect(result).toBe('spt[00450201,00010101,00010102,00010103]')
  })

  it('encodes without a mission', () => {
    const c1 = makeChar(1, '00010101', 'Primary')
    const c2 = makeChar(2, '00010102', 'Secondary')
    const c3 = makeChar(3, '00010103', 'Support')
    const squads = [makeSquad(c1, c2, c3), makeSquad(null, null, null)]
    const result = encodeSPT(squads, [], null, [c1, c2, c3])
    expect(result).toBe('spt[00010101,00010102,00010103]')
  })

  it('skips empty squad slots', () => {
    const c1 = makeChar(1, '00010101', 'Primary')
    const squads = [makeSquad(c1, null, null), makeSquad(null, null, null)]
    const result = encodeSPT(squads, [], null, [c1])
    expect(result).toBe('spt[00010101]')
  })

  it('includes extra squads for premiere format', () => {
    const c1 = makeChar(1, '00010101', 'Primary')
    const c2 = makeChar(2, '00010102', 'Secondary')
    const c3 = makeChar(3, '00010103', 'Support')
    const c4 = makeChar(4, '00010104', 'Primary')
    const squads = [makeSquad(c1, null, null), makeSquad(null, null, null)]
    const extra = [makeSquad(c2, c3, c4), makeSquad(null, null, null)]
    const result = encodeSPT(squads, extra, null, [c1, c2, c3, c4])
    expect(result).toBe('spt[00010101,00010102,00010103,00010104]')
  })

  it('skips units with no spt field', () => {
    const c1 = makeChar(1, '00010101', 'Primary')
    const c2 = { ...makeChar(2, '', 'Secondary'), spt: undefined }
    const squads = [makeSquad(c1, c2, null), makeSquad(null, null, null)]
    const result = encodeSPT(squads, [], null, [c1, c2])
    expect(result).toBe('spt[00010101]')
  })

  it('produces empty spt[] when no units or mission', () => {
    const squads = [makeSquad(null, null, null), makeSquad(null, null, null)]
    const result = encodeSPT(squads, [], null, [])
    expect(result).toBe('spt[]')
  })
})
