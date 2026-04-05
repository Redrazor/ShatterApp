import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAllCharacters } from '../../../src/composables/useAllCharacters.ts'
import { useCharactersStore } from '../../../src/stores/characters.ts'
import { usePublishedProfilesStore } from '../../../src/stores/publishedProfiles.ts'
import type { Character } from '../../../src/types/index.ts'
import type { HomebrewProfile } from '../../../src/types/index.ts'
import type { PublishCardImages } from '../../../src/utils/homebrewToCharacter.ts'

function makeCharacter(id: number, name: string): Character {
  return {
    id,
    slug: name.toLowerCase().replace(/\s/g, '-'),
    name,
    characterType: name,
    unitType: 'Primary',
    pc: null,
    sp: 10,
    durability: 3,
    stamina: 5,
    fp: 2,
    era: 'Clone Wars',
    tags: [],
    swp: 'SWP01',
    swpCode: 'SWP01',
    thumbnail: '/images/thumb.png',
    cardFront: '/images/front.png',
    cardBack: '/images/back.png',
    stances: [],
    releaseDate: '2026-01-01',
  }
}

function makeHomebrewProfile(id = 'hb-1', name = 'Custom Hero'): HomebrewProfile {
  return {
    id,
    name,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    faction: 'rebel',
    frontCard: {
      unitType: 'Support',
      name,
      title: '',
      imageData: null,
      imageOffsetX: 0,
      imageOffsetY: 0,
      imageScale: 1,
      cost: 5,
      fp: 1,
      era: 'Clone Wars',
    },
    stats: { stamina: 4, durability: 2, tags: [], imageOffsetX: 0, imageOffsetY: 0, imageScale: 1 },
    abilities: { blocks: [] },
    stances: {
      stance1: { title: 'Ready', range: 2, rangeAttack: 2, rangeDefense: 2, meleeAttack: 2, meleeDefense: 2, rangedWeapon: '', meleeWeapon: '', defensiveEquipment: '', expertise: null, combatTree: null },
      stance2: null,
      portraitOffsetX: 0,
      portraitOffsetY: 0,
      portraitScale: 1,
    },
  }
}

const publishImages: PublishCardImages = {
  front: 'data:image/jpeg;base64,f',
  abilities: 'data:image/jpeg;base64,a',
  stance1: 'data:image/jpeg;base64,s1',
  stance2: null,
  orderFront: 'data:image/jpeg;base64,o',
}

describe('useAllCharacters', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns empty array when both stores are empty', () => {
    const { allCharacters } = useAllCharacters()
    expect(allCharacters.value).toHaveLength(0)
  })

  it('returns official characters only when no custom profiles published', () => {
    const charStore = useCharactersStore()
    charStore.characters.push(makeCharacter(1, 'Luke Skywalker'))
    charStore.characters.push(makeCharacter(2, 'Darth Vader'))

    const { allCharacters } = useAllCharacters()
    expect(allCharacters.value).toHaveLength(2)
    expect(allCharacters.value.map(c => c.name)).toEqual(['Luke Skywalker', 'Darth Vader'])
  })

  it('returns published custom profiles when no official characters', () => {
    const publishedStore = usePublishedProfilesStore()
    publishedStore.publish(makeHomebrewProfile('h1', 'Custom Hero'), publishImages)

    const { allCharacters } = useAllCharacters()
    expect(allCharacters.value).toHaveLength(1)
    expect(allCharacters.value[0].name).toBe('Custom Hero')
  })

  it('merges official and published custom characters', () => {
    const charStore = useCharactersStore()
    charStore.characters.push(makeCharacter(1, 'Luke Skywalker'))

    const publishedStore = usePublishedProfilesStore()
    publishedStore.publish(makeHomebrewProfile('h1', 'Custom Hero'), publishImages)

    const { allCharacters } = useAllCharacters()
    expect(allCharacters.value).toHaveLength(2)
    expect(allCharacters.value.map(c => c.name)).toContain('Luke Skywalker')
    expect(allCharacters.value.map(c => c.name)).toContain('Custom Hero')
  })

  it('excludes hidden custom profiles', () => {
    const charStore = useCharactersStore()
    charStore.characters.push(makeCharacter(1, 'Luke Skywalker'))

    const publishedStore = usePublishedProfilesStore()
    const char = publishedStore.publish(makeHomebrewProfile('h1', 'Custom Hero'), publishImages)
    publishedStore.setVisibility(char.id, false)

    const { allCharacters } = useAllCharacters()
    expect(allCharacters.value).toHaveLength(1)
    expect(allCharacters.value[0].name).toBe('Luke Skywalker')
  })

  it('is reactive — updates when a new profile is published', () => {
    const { allCharacters } = useAllCharacters()
    expect(allCharacters.value).toHaveLength(0)

    const publishedStore = usePublishedProfilesStore()
    publishedStore.publish(makeHomebrewProfile('h1', 'Custom Hero'), publishImages)

    expect(allCharacters.value).toHaveLength(1)
  })

  it('official characters come before custom in the list', () => {
    const charStore = useCharactersStore()
    charStore.characters.push(makeCharacter(1, 'Official Unit'))

    const publishedStore = usePublishedProfilesStore()
    publishedStore.publish(makeHomebrewProfile('h1', 'Custom Unit'), publishImages)

    const { allCharacters } = useAllCharacters()
    expect(allCharacters.value[0].name).toBe('Official Unit')
    expect(allCharacters.value[1].name).toBe('Custom Unit')
  })
})
