import { describe, it, expect } from 'vitest'
import { homebrewToCharacter, homebrewToAbilityEntry } from '../../../src/utils/homebrewToCharacter.ts'
import type { HomebrewProfile } from '../../../src/types/index.ts'
import type { PublishCardImages } from '../../../src/utils/homebrewToCharacter.ts'

function makeProfile(overrides: Partial<HomebrewProfile> = {}): HomebrewProfile {
  return {
    id: 'abc-123',
    name: 'Test Unit',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    faction: 'rebel',
    frontCard: {
      unitType: 'Primary',
      name: 'Test Unit',
      title: 'The Legend',
      imageData: null,
      imageOffsetX: 0,
      imageOffsetY: 0,
      imageScale: 1,
      cost: 15,
      fp: 3,
      era: 'Clone Wars;Empire',
    },
    stats: {
      stamina: 8,
      durability: 4,
      tags: ['Leader', 'Force User'],
      imageOffsetX: 0,
      imageOffsetY: 0,
      imageScale: 1,
    },
    abilities: {
      blocks: [
        { iconType: 'active', title: 'Force Push', forceCost: 2, text: 'Push a character [advance].' },
        { iconType: 'tactic', title: 'Battle Meditation', forceCost: 0, text: 'Gain [force].' },
        { iconType: 'innate', title: 'Resilient', forceCost: 0, text: 'This unit is tough.' },
      ],
    },
    stances: {
      stance1: {
        title: 'Aggressive',
        range: 3,
        rangeAttack: 4,
        rangeDefense: 2,
        meleeAttack: 5,
        meleeDefense: 3,
        rangedWeapon: 'Lightsaber Throw',
        meleeWeapon: 'Lightsaber',
        defensiveEquipment: 'Force Shield',
        expertise: null,
        combatTree: null,
      },
      stance2: {
        title: 'Defensive',
        range: 2,
        rangeAttack: 2,
        rangeDefense: 5,
        meleeAttack: 3,
        meleeDefense: 6,
        rangedWeapon: '',
        meleeWeapon: 'Lightsaber',
        defensiveEquipment: 'Force Armor',
        expertise: null,
        combatTree: null,
      },
      portraitOffsetX: 0,
      portraitOffsetY: 0,
      portraitScale: 1,
    },
    ...overrides,
  }
}

const images: PublishCardImages = {
  front: 'data:image/jpeg;base64,front',
  abilities: 'data:image/jpeg;base64,abilities',
  stance1: 'data:image/jpeg;base64,stance1',
  stance2: 'data:image/jpeg;base64,stance2',
  orderFront: 'data:image/jpeg;base64,order',
}

describe('homebrewToCharacter', () => {
  it('maps basic fields correctly', () => {
    const char = homebrewToCharacter(makeProfile(), -1000, images)
    expect(char.id).toBe(-1000)
    expect(char.name).toBe('Test Unit')
    expect(char.slug).toBe('custom-abc-123')
    expect(char.characterType).toBe('Test Unit')
    expect(char.swp).toBe('Homebrew')
    expect(char.swpCode).toBe('CUSTOM')
    expect(char.releaseDate).toBe('2026-01-01T00:00:00.000Z')
  })

  it('maps Primary unit type with sp, no pc', () => {
    const char = homebrewToCharacter(makeProfile(), -1000, images)
    expect(char.unitType).toBe('Primary')
    expect(char.sp).toBe(15)
    expect(char.pc).toBeNull()
  })

  it('maps Secondary unit type with pc, no sp', () => {
    const profile = makeProfile()
    profile.frontCard!.unitType = 'Secondary'
    profile.frontCard!.cost = 8
    const char = homebrewToCharacter(profile, -1001, images)
    expect(char.unitType).toBe('Secondary')
    expect(char.pc).toBe(8)
    expect(char.sp).toBeNull()
  })

  it('maps Support unit type with pc, no sp', () => {
    const profile = makeProfile()
    profile.frontCard!.unitType = 'Support'
    profile.frontCard!.cost = 6
    const char = homebrewToCharacter(profile, -1002, images)
    expect(char.unitType).toBe('Support')
    expect(char.pc).toBe(6)
    expect(char.sp).toBeNull()
  })

  it('maps stats fields', () => {
    const char = homebrewToCharacter(makeProfile(), -1000, images)
    expect(char.stamina).toBe(8)
    expect(char.durability).toBe(4)
    expect(char.fp).toBe(3)
    expect(char.era).toBe('Clone Wars;Empire')
    expect(char.tags).toEqual(['Leader', 'Force User'])
  })

  it('maps card images as data URLs', () => {
    const char = homebrewToCharacter(makeProfile(), -1000, images)
    expect(char.thumbnail).toBe('data:image/jpeg;base64,front')
    expect(char.cardFront).toBe('data:image/jpeg;base64,front')
    expect(char.cardBack).toBe('data:image/jpeg;base64,abilities')
    expect(char.stance1).toBe('data:image/jpeg;base64,stance1')
    expect(char.stance2).toBe('data:image/jpeg;base64,stance2')
    expect(char.orderCard).toBe('data:image/jpeg;base64,order')
  })

  it('omits stance2 when null', () => {
    const imgs = { ...images, stance2: null }
    const char = homebrewToCharacter(makeProfile(), -1000, imgs)
    expect(char.stance2).toBeUndefined()
  })

  it('extracts stance names', () => {
    const char = homebrewToCharacter(makeProfile(), -1000, images)
    expect(char.stances).toEqual(['Aggressive', 'Defensive'])
  })

  it('uses defaults when frontCard is null', () => {
    const profile = makeProfile()
    profile.frontCard = null
    const char = homebrewToCharacter(profile, -1000, images)
    expect(char.unitType).toBe('Primary')
    expect(char.sp).toBe(0)
    expect(char.pc).toBeNull()
    expect(char.fp).toBe(0)
    expect(char.era).toBe('')
  })

  it('uses defaults when stats is null', () => {
    const profile = makeProfile()
    profile.stats = null
    const char = homebrewToCharacter(profile, -1000, images)
    expect(char.stamina).toBe(4)
    expect(char.durability).toBe(3)
    expect(char.tags).toEqual([])
  })
})

describe('homebrewToAbilityEntry', () => {
  it('maps characterId and name', () => {
    const entry = homebrewToAbilityEntry(makeProfile(), -1000)
    expect(entry.characterId).toBe(-1000)
    expect(entry.name).toBe('Test Unit')
    expect(entry.swpCode).toBe('CUSTOM')
  })

  it('converts ability blocks to abilities', () => {
    const entry = homebrewToAbilityEntry(makeProfile(), -1000)
    expect(entry.abilities).toHaveLength(3)
    expect(entry.abilities[0]).toEqual({
      name: 'Force Push',
      type: 'active',
      cost: 2,
      description: 'Push a character [advance].',
    })
  })

  it('converts forceCost 0 to null cost', () => {
    const entry = homebrewToAbilityEntry(makeProfile(), -1000)
    const tactic = entry.abilities.find(a => a.name === 'Battle Meditation')
    expect(tactic?.cost).toBeNull()
  })

  it('preserves non-zero forceCost', () => {
    const entry = homebrewToAbilityEntry(makeProfile(), -1000)
    const active = entry.abilities.find(a => a.name === 'Force Push')
    expect(active?.cost).toBe(2)
  })

  it('returns empty abilities when profile has no abilities', () => {
    const profile = makeProfile()
    profile.abilities = null
    const entry = homebrewToAbilityEntry(profile, -1000)
    expect(entry.abilities).toHaveLength(0)
  })
})
