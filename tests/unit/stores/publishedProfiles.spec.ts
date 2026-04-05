import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePublishedProfilesStore } from '../../../src/stores/publishedProfiles.ts'
import type { HomebrewProfile } from '../../../src/types/index.ts'
import type { PublishCardImages } from '../../../src/utils/homebrewToCharacter.ts'

function makeProfile(id = 'profile-1', name = 'Test Unit'): HomebrewProfile {
  return {
    id,
    name,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    faction: 'rebel',
    frontCard: {
      unitType: 'Primary',
      name,
      title: '',
      imageData: null,
      imageOffsetX: 0,
      imageOffsetY: 0,
      imageScale: 1,
      cost: 10,
      fp: 2,
      era: 'Clone Wars',
    },
    stats: { stamina: 5, durability: 3, tags: ['Leader'], imageOffsetX: 0, imageOffsetY: 0, imageScale: 1 },
    abilities: { blocks: [{ iconType: 'active', title: 'Ability', forceCost: 1, text: 'Do something.' }] },
    stances: {
      stance1: { title: 'Stance A', range: 2, rangeAttack: 3, rangeDefense: 2, meleeAttack: 4, meleeDefense: 3, rangedWeapon: '', meleeWeapon: '', defensiveEquipment: '', expertise: null, combatTree: null },
      stance2: null,
      portraitOffsetX: 0,
      portraitOffsetY: 0,
      portraitScale: 1,
    },
  }
}

const images: PublishCardImages = {
  front: 'data:image/jpeg;base64,front',
  abilities: 'data:image/jpeg;base64,abilities',
  stance1: 'data:image/jpeg;base64,stance1',
  stance2: null,
  orderFront: 'data:image/jpeg;base64,order',
}

describe('usePublishedProfilesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with empty state', () => {
    const store = usePublishedProfilesStore()
    expect(store.profiles).toHaveLength(0)
    expect(Object.keys(store.abilities)).toHaveLength(0)
  })

  describe('publish', () => {
    it('adds a character to profiles', () => {
      const store = usePublishedProfilesStore()
      store.publish(makeProfile(), images)
      expect(store.profiles).toHaveLength(1)
      expect(store.profiles[0].name).toBe('Test Unit')
    })

    it('assigns a negative ID', () => {
      const store = usePublishedProfilesStore()
      const char = store.publish(makeProfile(), images)
      expect(char.id).toBeLessThan(0)
    })

    it('adds ability entry to abilities', () => {
      const store = usePublishedProfilesStore()
      const char = store.publish(makeProfile(), images)
      expect(store.abilities[char.id]).toBeDefined()
      expect(store.abilities[char.id].name).toBe('Test Unit')
    })

    it('marks the profile as visible by default', () => {
      const store = usePublishedProfilesStore()
      store.publish(makeProfile('p1'), images)
      expect(store.isPublished('p1')).toBe(true)
      expect(store.isVisible('p1')).toBe(true)
    })

    it('re-publishes without duplicating (removes old entry first)', () => {
      const store = usePublishedProfilesStore()
      store.publish(makeProfile('p1'), images)
      store.publish(makeProfile('p1', 'Updated Name'), images)
      expect(store.profiles).toHaveLength(1)
      expect(store.profiles[0].name).toBe('Updated Name')
    })

    it('tracks multiple independent profiles', () => {
      const store = usePublishedProfilesStore()
      store.publish(makeProfile('p1', 'Unit A'), images)
      store.publish(makeProfile('p2', 'Unit B'), images)
      expect(store.profiles).toHaveLength(2)
    })
  })

  describe('unpublish', () => {
    it('removes character by character ID', () => {
      const store = usePublishedProfilesStore()
      const char = store.publish(makeProfile('p1'), images)
      store.unpublish(char.id)
      expect(store.profiles).toHaveLength(0)
      expect(store.abilities[char.id]).toBeUndefined()
      expect(store.isPublished('p1')).toBe(false)
    })

    it('unpublishByHomebrewId removes by homebrew profile ID', () => {
      const store = usePublishedProfilesStore()
      const char = store.publish(makeProfile('p1'), images)
      store.unpublishByHomebrewId('p1')
      expect(store.profiles).toHaveLength(0)
      expect(store.abilities[char.id]).toBeUndefined()
    })

    it('is a no-op for unknown homebrew IDs', () => {
      const store = usePublishedProfilesStore()
      expect(() => store.unpublishByHomebrewId('unknown')).not.toThrow()
    })
  })

  describe('visibility', () => {
    it('setVisibility hides a profile', () => {
      const store = usePublishedProfilesStore()
      const char = store.publish(makeProfile('p1'), images)
      store.setVisibility(char.id, false)
      expect(store.isVisible('p1')).toBe(false)
    })

    it('visibleProfiles excludes hidden profiles', () => {
      const store = usePublishedProfilesStore()
      const char = store.publish(makeProfile('p1'), images)
      store.setVisibility(char.id, false)
      expect(store.visibleProfiles).toHaveLength(0)
    })

    it('setVisibility re-shows a hidden profile', () => {
      const store = usePublishedProfilesStore()
      const char = store.publish(makeProfile('p1'), images)
      store.setVisibility(char.id, false)
      store.setVisibility(char.id, true)
      expect(store.isVisible('p1')).toBe(true)
      expect(store.visibleProfiles).toHaveLength(1)
    })
  })

  describe('isPublished / getPublishedId', () => {
    it('isPublished returns false for unpublished profiles', () => {
      const store = usePublishedProfilesStore()
      expect(store.isPublished('nonexistent')).toBe(false)
    })

    it('isVisible returns false for unpublished profiles', () => {
      const store = usePublishedProfilesStore()
      expect(store.isVisible('nonexistent')).toBe(false)
    })

    it('getPublishedId returns the assigned ID', () => {
      const store = usePublishedProfilesStore()
      const char = store.publish(makeProfile('p1'), images)
      expect(store.getPublishedId('p1')).toBe(char.id)
    })

    it('getPublishedId returns undefined for unpublished', () => {
      const store = usePublishedProfilesStore()
      expect(store.getPublishedId('unknown')).toBeUndefined()
    })
  })
})
