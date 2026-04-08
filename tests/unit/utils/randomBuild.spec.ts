import { describe, it, expect } from 'vitest'
import { generateRandomStrikeForce } from '../../../src/utils/randomBuild.ts'
import { isSquadValid, hasStrikeForceConflict } from '../../../src/types/index.ts'
import type { Character, Squad } from '../../../src/types/index.ts'

function makeChar(
  id: number,
  unitType: 'Primary' | 'Secondary' | 'Support',
  overrides: Partial<Character> = {}
): Character {
  return {
    id,
    slug: `char-${id}`,
    name: `Char ${id}`,
    characterType: `Type${id}`,
    unitType,
    pc: unitType === 'Primary' ? null : 4,
    sp: unitType === 'Primary' ? 10 : null,
    durability: 2,
    stamina: 8,
    fp: 0,
    era: 'Clone Wars',
    tags: [],
    swp: `SWP0${id}`,
    swpCode: `SWP0${id}`,
    thumbnail: '',
    cardFront: '',
    cardBack: '',
    stances: [],
    releaseDate: '2024-01-01',
    ...overrides,
  }
}

const emptySquads: [Squad, Squad] = [
  { primary: null, secondary: null, support: null },
  { primary: null, secondary: null, support: null },
]

describe('generateRandomStrikeForce', () => {
  it('returns a valid two-squad build from a basic pool', () => {
    const characters: Character[] = [
      makeChar(1, 'Primary'),
      makeChar(2, 'Primary'),
      makeChar(3, 'Secondary'),
      makeChar(4, 'Secondary'),
      makeChar(5, 'Support'),
      makeChar(6, 'Support'),
    ]
    const result = generateRandomStrikeForce(characters, emptySquads)
    expect(result).not.toBeNull()
    const [sq0, sq1] = result!
    expect(isSquadValid(sq0).valid).toBe(true)
    expect(isSquadValid(sq1).valid).toBe(true)
    expect(hasStrikeForceConflict(result!)).toBe(false)
  })

  it('respects the ownedSwpCodes filter', () => {
    const characters: Character[] = [
      makeChar(1, 'Primary', { swpCode: 'SWP01' }),
      makeChar(2, 'Primary', { swpCode: 'SWP01' }),
      makeChar(3, 'Secondary', { swpCode: 'SWP01' }),
      makeChar(4, 'Secondary', { swpCode: 'SWP01' }),
      makeChar(5, 'Support', { swpCode: 'SWP01' }),
      makeChar(6, 'Support', { swpCode: 'SWP01' }),
      // Unowned units that should never appear in the result
      makeChar(7, 'Primary', { swpCode: 'SWP99' }),
      makeChar(8, 'Secondary', { swpCode: 'SWP99' }),
      makeChar(9, 'Support', { swpCode: 'SWP99' }),
    ]
    const result = generateRandomStrikeForce(characters, emptySquads, {
      ownedSwpCodes: new Set(['SWP01']),
    })
    expect(result).not.toBeNull()
    for (const sq of result!) {
      for (const role of ['primary', 'secondary', 'support'] as const) {
        expect(sq[role]!.swpCode).toBe('SWP01')
      }
    }
  })

  it('leaves already-placed units untouched', () => {
    const placed = makeChar(1, 'Primary')
    const characters: Character[] = [
      placed,
      makeChar(2, 'Primary'),
      makeChar(3, 'Secondary'),
      makeChar(4, 'Secondary'),
      makeChar(5, 'Support'),
      makeChar(6, 'Support'),
    ]
    const currentSquads: [Squad, Squad] = [
      { primary: placed, secondary: null, support: null },
      { primary: null, secondary: null, support: null },
    ]
    const result = generateRandomStrikeForce(characters, currentSquads)
    expect(result).not.toBeNull()
    expect(result![0].primary).toBe(placed)
  })

  it('returns null when pool is too small to fill both squads', () => {
    // Only one of each — can't fill two squads without duplicates
    const characters: Character[] = [
      makeChar(1, 'Primary'),
      makeChar(2, 'Secondary'),
      makeChar(3, 'Support'),
    ]
    const result = generateRandomStrikeForce(characters, emptySquads)
    expect(result).toBeNull()
  })

  it('returns null when ownedOnly pool is too small', () => {
    const characters: Character[] = [
      makeChar(1, 'Primary', { swpCode: 'SWP01' }),
      makeChar(2, 'Primary', { swpCode: 'SWP99' }),
      makeChar(3, 'Secondary', { swpCode: 'SWP01' }),
      makeChar(4, 'Secondary', { swpCode: 'SWP99' }),
      makeChar(5, 'Support', { swpCode: 'SWP01' }),
      makeChar(6, 'Support', { swpCode: 'SWP99' }),
    ]
    // Only 1 primary owned — can't fill 2 squads
    const result = generateRandomStrikeForce(characters, emptySquads, {
      ownedSwpCodes: new Set(['SWP01']),
    })
    expect(result).toBeNull()
  })

  it('no duplicate characterTypes across both squads', () => {
    const characters: Character[] = [
      makeChar(1, 'Primary'),
      makeChar(2, 'Primary'),
      makeChar(3, 'Secondary'),
      makeChar(4, 'Secondary'),
      makeChar(5, 'Support'),
      makeChar(6, 'Support'),
    ]
    const result = generateRandomStrikeForce(characters, emptySquads)
    expect(result).not.toBeNull()
    expect(hasStrikeForceConflict(result!)).toBe(false)
  })

  it('respects PC budget — secondary + support <= primary.sp', () => {
    const characters: Character[] = [
      makeChar(1, 'Primary', { sp: 6 }),
      makeChar(2, 'Primary', { sp: 6 }),
      makeChar(3, 'Secondary', { pc: 4 }),
      makeChar(4, 'Secondary', { pc: 4 }),
      makeChar(5, 'Support', { pc: 2 }),
      makeChar(6, 'Support', { pc: 2 }),
    ]
    const result = generateRandomStrikeForce(characters, emptySquads)
    expect(result).not.toBeNull()
    for (const sq of result!) {
      expect(isSquadValid(sq).valid).toBe(true)
    }
  })

  it('prefers tag-synergy secondaries over random when available', () => {
    // Run many times to check synergy is preferred statistically
    const characters: Character[] = [
      makeChar(1, 'Primary', { tags: ['Galactic Republic'] }),
      makeChar(2, 'Primary', { tags: ['Galactic Republic'] }),
      // Synergy secondary
      makeChar(3, 'Secondary', { tags: ['Galactic Republic'] }),
      makeChar(4, 'Secondary', { tags: ['Galactic Republic'] }),
      // Off-faction secondary (fallback)
      makeChar(5, 'Secondary', { tags: ['Separatist'] }),
      makeChar(6, 'Secondary', { tags: ['Separatist'] }),
      makeChar(7, 'Support', { tags: ['Galactic Republic'] }),
      makeChar(8, 'Support', { tags: ['Galactic Republic'] }),
    ]
    const synergyCounts: Record<string, number> = { '3': 0, '4': 0, '5': 0, '6': 0 }
    for (let i = 0; i < 50; i++) {
      const result = generateRandomStrikeForce(characters, emptySquads)
      if (result) {
        const secId = String(result[0].secondary!.id)
        if (secId in synergyCounts) synergyCounts[secId]++
      }
    }
    const synergyTotal = synergyCounts['3'] + synergyCounts['4']
    const fallbackTotal = synergyCounts['5'] + synergyCounts['6']
    expect(synergyTotal).toBeGreaterThan(fallbackTotal)
  })
})

// ---- starWarsNames ----
import { randomSwName, SW_NAMES } from '../../../src/utils/starWarsNames.ts'

describe('randomSwName', () => {
  it('returns a string from SW_NAMES', () => {
    const name = randomSwName()
    expect(typeof name).toBe('string')
    expect(SW_NAMES).toContain(name)
  })
})
