import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHomebrewStore } from '../../../src/stores/homebrew.ts'

describe('useHomebrewStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with empty profiles array', () => {
    const store = useHomebrewStore()
    expect(store.profiles).toEqual([])
  })

  it('addProfile creates a profile with id, name, and createdAt', () => {
    const store = useHomebrewStore()
    const profile = store.addProfile('Test Profile')
    expect(profile.name).toBe('Test Profile')
    expect(profile.id).toBeTruthy()
    expect(profile.createdAt).toBeTruthy()
    expect(new Date(profile.createdAt).toISOString()).toBe(profile.createdAt)
  })

  it('addProfile appends to profiles array', () => {
    const store = useHomebrewStore()
    store.addProfile('Alpha')
    store.addProfile('Beta')
    expect(store.profiles).toHaveLength(2)
    expect(store.profiles[0].name).toBe('Alpha')
    expect(store.profiles[1].name).toBe('Beta')
  })

  it('addProfile generates unique ids', () => {
    const store = useHomebrewStore()
    const a = store.addProfile('A')
    const b = store.addProfile('B')
    expect(a.id).not.toBe(b.id)
  })

  it('deleteProfile removes the matching profile', () => {
    const store = useHomebrewStore()
    store.addProfile('Keep')
    const toDelete = store.addProfile('Remove')
    store.deleteProfile(toDelete.id)
    expect(store.profiles).toHaveLength(1)
    expect(store.profiles[0].name).toBe('Keep')
  })

  it('deleteProfile does nothing when id not found', () => {
    const store = useHomebrewStore()
    store.addProfile('One')
    store.deleteProfile('nonexistent-id')
    expect(store.profiles).toHaveLength(1)
  })

  it('deleteProfile removes from empty store without error', () => {
    const store = useHomebrewStore()
    expect(() => store.deleteProfile('any-id')).not.toThrow()
  })

  it('addProfile defaults name to "New Profile" when no name given', () => {
    const store = useHomebrewStore()
    const profile = store.addProfile()
    expect(profile.name).toBe('New Profile')
  })

  it('addProfile sets activeProfileId to the new profile', () => {
    const store = useHomebrewStore()
    const profile = store.addProfile('Active')
    expect(store.activeProfileId).toBe(profile.id)
  })

  it('deleteProfile clears activeProfileId when active profile is deleted', () => {
    const store = useHomebrewStore()
    const profile = store.addProfile('Active')
    store.deleteProfile(profile.id)
    expect(store.activeProfileId).toBeNull()
  })

  it('deleteProfile does not clear activeProfileId when a different profile is deleted', () => {
    const store = useHomebrewStore()
    const active = store.addProfile('Active')
    const other = store.addProfile('Other')
    store.setActiveProfile(active.id)
    store.deleteProfile(other.id)
    expect(store.activeProfileId).toBe(active.id)
  })

  it('setActiveProfile sets the active profile id', () => {
    const store = useHomebrewStore()
    const p = store.addProfile('Test')
    store.setActiveProfile(null)
    expect(store.activeProfileId).toBeNull()
    store.setActiveProfile(p.id)
    expect(store.activeProfileId).toBe(p.id)
  })

  it('activeProfile computed returns the matching profile', () => {
    const store = useHomebrewStore()
    const p = store.addProfile('Test')
    store.setActiveProfile(p.id)
    expect(store.activeProfile).not.toBeNull()
    expect(store.activeProfile!.id).toBe(p.id)
  })

  it('activeProfile computed returns null when no active profile', () => {
    const store = useHomebrewStore()
    store.addProfile('Test')
    store.setActiveProfile(null)
    expect(store.activeProfile).toBeNull()
  })

  describe('updateFrontCard', () => {
    it('creates frontCard on first call with defaults merged with data', () => {
      const store = useHomebrewStore()
      const p = store.addProfile('Test')
      store.updateFrontCard(p.id, { name: 'Vader', cost: 10 })
      expect(store.profiles[0].frontCard).not.toBeNull()
      expect(store.profiles[0].frontCard!.name).toBe('Vader')
      expect(store.profiles[0].frontCard!.cost).toBe(10)
      expect(store.profiles[0].frontCard!.unitType).toBe('Primary')
    })

    it('merges data into existing frontCard on subsequent calls', () => {
      const store = useHomebrewStore()
      const p = store.addProfile('Test')
      store.updateFrontCard(p.id, { name: 'Vader', cost: 10 })
      store.updateFrontCard(p.id, { cost: 15 })
      expect(store.profiles[0].frontCard!.name).toBe('Vader')
      expect(store.profiles[0].frontCard!.cost).toBe(15)
    })

    it('syncs profile.name from frontCard name when name is provided', () => {
      const store = useHomebrewStore()
      const p = store.addProfile('Test')
      store.updateFrontCard(p.id, { name: 'Anakin' })
      expect(store.profiles[0].name).toBe('Anakin')
    })

    it('resets profile.name to "New Profile" when frontCard name is cleared', () => {
      const store = useHomebrewStore()
      const p = store.addProfile('Test')
      store.updateFrontCard(p.id, { name: 'Anakin' })
      store.updateFrontCard(p.id, { name: '' })
      expect(store.profiles[0].name).toBe('New Profile')
    })

    it('does not change profile.name when name field is not in the update', () => {
      const store = useHomebrewStore()
      const p = store.addProfile('My Name')
      store.updateFrontCard(p.id, { cost: 5 })
      expect(store.profiles[0].name).toBe('My Name')
    })

    it('does nothing when id not found', () => {
      const store = useHomebrewStore()
      expect(() => store.updateFrontCard('nonexistent', { name: 'X' })).not.toThrow()
    })
  })

  describe('resetPhase', () => {
    it('clears frontCard when phase is 1', () => {
      const store = useHomebrewStore()
      const p = store.addProfile('Test')
      store.updateFrontCard(p.id, { name: 'Vader' })
      store.resetPhase(p.id, 1)
      expect(store.profiles[0].frontCard).toBeNull()
    })

    it('does nothing when id not found', () => {
      const store = useHomebrewStore()
      expect(() => store.resetPhase('nonexistent', 1)).not.toThrow()
    })
  })

  describe('resetAll', () => {
    it('clears all fields and resets name to "New Profile"', () => {
      const store = useHomebrewStore()
      const p = store.addProfile('Test')
      store.updateFrontCard(p.id, { name: 'Vader', cost: 10 })
      store.resetAll(p.id)
      const profile = store.profiles[0]
      expect(profile.frontCard).toBeNull()
      expect(profile.stats).toBeNull()
      expect(profile.abilities).toBeNull()
      expect(profile.stances).toBeNull()
      expect(profile.name).toBe('New Profile')
    })

    it('does nothing when id not found', () => {
      const store = useHomebrewStore()
      expect(() => store.resetAll('nonexistent')).not.toThrow()
    })
  })

  describe('isFrontCardComplete', () => {
    function makeProfile(frontCard: Partial<import('../../../src/types/index.ts').FrontCardData> | null = null): import('../../../src/types/index.ts').HomebrewProfile {
      return {
        id: 'test',
        name: 'Test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        frontCard: frontCard ? {
          unitType: 'Primary',
          name: '',
          imageData: null,
          imageOffsetX: 0,
          imageOffsetY: 0,
          imageScale: 1,
          cost: 0,
          fp: 0,
          era: '',
          ...frontCard,
        } : null,
        stats: null,
        abilities: null,
        stances: null,
      }
    }

    it('returns false when frontCard is null', () => {
      const store = useHomebrewStore()
      expect(store.isFrontCardComplete(makeProfile(null))).toBe(false)
    })

    it('returns false when name is empty', () => {
      const store = useHomebrewStore()
      expect(store.isFrontCardComplete(makeProfile({ name: '', era: 'Clone Wars' }))).toBe(false)
    })

    it('returns false when era is empty', () => {
      const store = useHomebrewStore()
      expect(store.isFrontCardComplete(makeProfile({ name: 'Vader', era: '' }))).toBe(false)
    })

    it('returns true when all required fields are present', () => {
      const store = useHomebrewStore()
      expect(store.isFrontCardComplete(makeProfile({ name: 'Vader', era: 'Empire', cost: 12, fp: 1 }))).toBe(true)
    })

    it('returns true when cost and fp are 0 (valid)', () => {
      const store = useHomebrewStore()
      expect(store.isFrontCardComplete(makeProfile({ name: 'Trooper', era: 'Clone Wars', cost: 0, fp: 0 }))).toBe(true)
    })
  })

  describe('updateStats', () => {
    it('creates stats with defaults on first call', () => {
      const store = useHomebrewStore()
      const p = store.addProfile('Test')
      store.updateStats(p.id, { stamina: 5 })
      expect(store.profiles[0].stats).not.toBeNull()
      expect(store.profiles[0].stats!.stamina).toBe(5)
      expect(store.profiles[0].stats!.durability).toBe(3)
      expect(store.profiles[0].stats!.tags).toEqual([])
    })

    it('merges data into existing stats on subsequent calls', () => {
      const store = useHomebrewStore()
      const p = store.addProfile('Test')
      store.updateStats(p.id, { stamina: 5 })
      store.updateStats(p.id, { durability: 4 })
      expect(store.profiles[0].stats!.stamina).toBe(5)
      expect(store.profiles[0].stats!.durability).toBe(4)
    })

    it('updates tags list', () => {
      const store = useHomebrewStore()
      const p = store.addProfile('Test')
      store.updateStats(p.id, { tags: ['Jedi', 'Force User'] })
      expect(store.profiles[0].stats!.tags).toEqual(['Jedi', 'Force User'])
    })

    it('does nothing when id not found', () => {
      const store = useHomebrewStore()
      expect(() => store.updateStats('nonexistent', { stamina: 3 })).not.toThrow()
    })
  })

  describe('isStatsComplete', () => {
    it('returns false when stats is null', () => {
      const store = useHomebrewStore()
      const p = store.addProfile('Test')
      expect(store.isStatsComplete(store.profiles[0])).toBe(false)
    })

    it('returns true when stats is set', () => {
      const store = useHomebrewStore()
      const p = store.addProfile('Test')
      store.updateStats(p.id, {})
      expect(store.isStatsComplete(store.profiles[0])).toBe(true)
    })
  })

  describe('resetPhase phase 2', () => {
    it('clears stats when phase is 2', () => {
      const store = useHomebrewStore()
      const p = store.addProfile('Test')
      store.updateStats(p.id, { stamina: 6 })
      store.resetPhase(p.id, 2)
      expect(store.profiles[0].stats).toBeNull()
    })
  })

  describe('allTags', () => {
    it('returns empty array when no profiles have tags', () => {
      const store = useHomebrewStore()
      store.addProfile('Test')
      expect(store.allTags()).toEqual([])
    })

    it('collects unique tags from all profiles', () => {
      const store = useHomebrewStore()
      const a = store.addProfile('A')
      const b = store.addProfile('B')
      store.updateStats(a.id, { tags: ['Jedi', 'Clone'] })
      store.updateStats(b.id, { tags: ['Jedi', 'Sith'] })
      const tags = store.allTags()
      expect(tags).toContain('Jedi')
      expect(tags).toContain('Clone')
      expect(tags).toContain('Sith')
      expect(tags.filter(t => t === 'Jedi')).toHaveLength(1)
    })

    it('excludes tags from the specified profile id', () => {
      const store = useHomebrewStore()
      const a = store.addProfile('A')
      store.updateStats(a.id, { tags: ['Unique'] })
      expect(store.allTags(a.id)).not.toContain('Unique')
    })
  })

  describe('getProfileStatus', () => {
    it('returns "empty" when frontCard is null', () => {
      const store = useHomebrewStore()
      const p = store.addProfile('Test')
      expect(store.getProfileStatus(store.profiles[0])).toBe('empty')
    })

    it('returns "draft" when frontCard exists but is incomplete', () => {
      const store = useHomebrewStore()
      const p = store.addProfile('Test')
      store.updateFrontCard(p.id, { name: '' })
      expect(store.getProfileStatus(store.profiles[0])).toBe('draft')
    })

    it('returns "draft" when only frontCard is complete (stats and abilities missing)', () => {
      const store = useHomebrewStore()
      const p = store.addProfile('Test')
      store.updateFrontCard(p.id, { name: 'Vader', era: 'Empire', cost: 12, fp: 1 })
      expect(store.getProfileStatus(store.profiles[0])).toBe('draft')
    })

    it('returns "complete" when frontCard, stats, and abilities are all complete', () => {
      const store = useHomebrewStore()
      const p = store.addProfile('Test')
      store.updateFrontCard(p.id, { name: 'Vader', era: 'Empire', cost: 12, fp: 1 })
      store.updateStats(p.id, { stamina: 4, durability: 3, tags: [] })
      store.updateAbilities(p.id, { blocks: [{ iconType: 'active', title: 'Force Choke', forceCost: 1, text: 'Deal [damage].' }] })
      expect(store.getProfileStatus(store.profiles[0])).toBe('complete')
    })
  })
})
