import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHomebrewStore } from '../../../src/stores/homebrew.ts'
import type { ExpertiseTables } from '../../../src/types/index.ts'

describe('homebrew store — expertise tables', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function setupPrimary() {
    const store = useHomebrewStore()
    const profile = store.addProfile('Test')
    store.updateFrontCard(profile.id, { unitType: 'Primary', name: 'Test', title: '', cost: 5, fp: 0, era: 'Clone Wars' })
    store.initStances(profile.id)
    return { store, id: profile.id }
  }

  // ── initStances ─────────────────────────────────────────────────────────────

  it('initStances populates expertise tables on stance1 with 3 sections', () => {
    const { store, id } = setupPrimary()
    const expertise = store.profiles[0].stances!.stance1.expertise!
    expect(expertise.ranged).toBeDefined()
    expect(expertise.melee).toBeDefined()
    expect(expertise.defense).toBeDefined()
  })

  it('initStances sets default colors (blue/red/grey)', () => {
    const { store } = setupPrimary()
    const expertise = store.profiles[0].stances!.stance1.expertise!
    expect(expertise.ranged.color).toBe('blue')
    expect(expertise.melee.color).toBe('red')
    expect(expertise.defense.color).toBe('grey')
  })

  it('initStances creates 3 default entries per section', () => {
    const { store } = setupPrimary()
    const expertise = store.profiles[0].stances!.stance1.expertise!
    expect(expertise.ranged.entries).toHaveLength(3)
    expect(expertise.melee.entries).toHaveLength(3)
    expect(expertise.defense.entries).toHaveLength(3)
  })

  it('initStances default entries have correct thresholds (1-2, 3, 4+)', () => {
    const { store } = setupPrimary()
    const entries = store.profiles[0].stances!.stance1.expertise!.ranged.entries
    expect(entries[0]).toMatchObject({ from: 1, to: 2, isPlus: false })
    expect(entries[1]).toMatchObject({ from: 3, to: 3, isPlus: false })
    expect(entries[2]).toMatchObject({ from: 4, to: null, isPlus: true })
  })

  it('initStances expertise on stance1 and stance2 are independent objects', () => {
    const { store } = setupPrimary()
    const stance1exp = store.profiles[0].stances!.stance1.expertise!
    const stance2exp = store.profiles[0].stances!.stance2!.expertise!
    // Modify one — should not affect the other
    stance1exp.ranged.color = 'purple'
    expect(stance2exp.ranged.color).toBe('blue')
  })

  // ── updateStance with expertise patch ────────────────────────────────────────

  it('updateStance shallow-merges expertise field into StanceData', () => {
    const { store, id } = setupPrimary()
    const newExpertise: ExpertiseTables = {
      ranged:  { color: 'purple', entries: [{ from: 1, to: null, isPlus: true, icons: [] }] },
      melee:   { color: 'red',    entries: [{ from: 1, to: 2, isPlus: false, icons: [] }] },
      defense: { color: 'grey',   entries: [{ from: 1, to: 3, isPlus: false, icons: [] }] },
    }
    store.updateStance(id, 1, { expertise: newExpertise })
    const result = store.profiles[0].stances!.stance1.expertise!
    expect(result.ranged.color).toBe('purple')
    expect(result.ranged.entries).toHaveLength(1)
  })

  it('updateStance preserves other StanceData fields when only expertise is patched', () => {
    const { store, id } = setupPrimary()
    store.updateStance(id, 1, { title: 'AGGRESSIVE' })
    store.updateStance(id, 1, { expertise: {
      ranged:  { color: 'red',    entries: [] },
      melee:   { color: 'blue',   entries: [] },
      defense: { color: 'purple', entries: [] },
    } })
    expect(store.profiles[0].stances!.stance1.title).toBe('AGGRESSIVE')
  })

  // ── ExpertiseEntry shape ──────────────────────────────────────────────────────

  it('default entries start with empty icons arrays', () => {
    const { store } = setupPrimary()
    const entries = store.profiles[0].stances!.stance1.expertise!.ranged.entries
    entries.forEach(e => expect(e.icons).toEqual([]))
  })

  it('expertise icons can hold multiple icon+label pairs', () => {
    const { store, id } = setupPrimary()
    const newExpertise: ExpertiseTables = {
      ranged: {
        color: 'blue',
        entries: [{
          from: 1, to: 2, isPlus: false,
          icons: [
            { iconFile: 'strike_crop.png', label: '+1 Strike' },
            { iconFile: 'damage_crop.png', label: '+1 Damage' },
          ],
        }],
      },
      melee:   { color: 'red',  entries: [] },
      defense: { color: 'grey', entries: [] },
    }
    store.updateStance(id, 1, { expertise: newExpertise })
    const icons = store.profiles[0].stances!.stance1.expertise!.ranged.entries[0].icons
    expect(icons).toHaveLength(2)
    expect(icons[0]).toEqual({ iconFile: 'strike_crop.png', label: '+1 Strike' })
    expect(icons[1]).toEqual({ iconFile: 'damage_crop.png', label: '+1 Damage' })
  })
})
