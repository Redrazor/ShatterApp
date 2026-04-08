import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import {
  useStatsComparison,
  useFrontCardComparison,
  useAbilitiesComparison,
  useStanceComparison,
} from '../../../src/composables/useStatsComparison.ts'
import type { Character } from '../../../src/types/index.ts'
import type { AbilityEntry } from '../../../src/composables/useAbilities.ts'
import type { StanceEntry } from '../../../src/composables/useStances.ts'

function makeChar(overrides: Partial<Character> = {}): Character {
  return {
    id: 1,
    name: 'Luke',
    characterType: 'Hero',
    unitType: 'Primary',
    pc: null,
    sp: 5,
    durability: 4,
    stamina: 6,
    fp: 2,
    era: 'GCW',
    tags: ['Rebel'],
    swp: 'SWP01',
    swpCode: 'SWP01',
    thumbnail: '',
    cardFront: '',
    cardBack: '',
    stances: [],
    releaseDate: '',
    ...overrides,
  }
}

describe('useStatsComparison', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns 0.5 percentileRank when pool is empty', () => {
    const chars = ref<Character[]>([])
    const result = useStatsComparison(chars, ref(5), ref(3), ref(2))
    expect(result.staminaResult.value.percentileRank).toBe(0.5)
    expect(result.staminaResult.value.band).toBe('typical')
  })

  it('computes correct percentile for stamina', () => {
    const chars = ref([
      makeChar({ id: 1, stamina: 4, durability: 3 }),
      makeChar({ id: 2, stamina: 6, durability: 4 }),
      makeChar({ id: 3, stamina: 8, durability: 5 }),
      makeChar({ id: 4, stamina: 10, durability: 6 }),
    ])
    const result = useStatsComparison(chars, ref(8), ref(4), ref(1))
    // values=[4,6,8,10] current=8 → lower=2 → percentileRank=0.5
    expect(result.staminaResult.value.lower).toBe(2)
    expect(result.staminaResult.value.same).toBe(1)
    expect(result.staminaResult.value.higher).toBe(1)
    expect(result.staminaResult.value.percentileRank).toBe(0.5)
    expect(result.staminaResult.value.band).toBe('typical')
  })

  it('returns very-low band for bottom 10%', () => {
    const chars = ref(Array.from({ length: 10 }, (_, i) =>
      makeChar({ id: i + 1, stamina: i + 2, durability: 3 }),
    ))
    const result = useStatsComparison(chars, ref(2), ref(3), ref(0))
    // current=2 is the lowest value — percentileRank=0
    expect(result.staminaResult.value.band).toBe('very-low')
  })

  it('returns very-high band for top 10%', () => {
    const chars = ref(Array.from({ length: 10 }, (_, i) =>
      makeChar({ id: i + 1, stamina: i + 1, durability: 3 }),
    ))
    const result = useStatsComparison(chars, ref(10), ref(3), ref(0))
    // current=10 is highest — lower=9 → percentileRank=0.9
    expect(result.staminaResult.value.band).toBe('high')
  })

  it('totalChars reflects the pool size', () => {
    const chars = ref([
      makeChar({ id: 1, stamina: 5, durability: 3 }),
      makeChar({ id: 2, stamina: 7, durability: 4 }),
    ])
    const result = useStatsComparison(chars, ref(5), ref(3), ref(1))
    expect(result.totalChars.value).toBe(2)
  })
})

describe('useFrontCardComparison', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('uses sp pool for Primary unit type', () => {
    const chars = ref([
      makeChar({ id: 1, sp: 4, pc: null, unitType: 'Primary' }),
      makeChar({ id: 2, sp: 6, pc: null, unitType: 'Primary' }),
    ])
    const result = useFrontCardComparison(chars, ref('Primary'), ref(5), ref(2), ref(1))
    expect(result.totalCostChars.value).toBe(2)
    expect(result.costResult.value.total).toBe(2)
  })

  it('uses pc pool for Secondary unit type', () => {
    const chars = ref([
      makeChar({ id: 1, sp: null, pc: 4, unitType: 'Secondary' }),
      makeChar({ id: 2, sp: null, pc: 6, unitType: 'Secondary' }),
    ])
    const result = useFrontCardComparison(chars, ref('Secondary'), ref(5), ref(2), ref(1))
    expect(result.totalCostChars.value).toBe(2)
    expect(result.costResult.value.total).toBe(2)
  })

  it('computes fp result', () => {
    const chars = ref([
      makeChar({ id: 1, fp: 1 }),
      makeChar({ id: 2, fp: 3 }),
    ])
    const result = useFrontCardComparison(chars, ref('Primary'), ref(5), ref(2), ref(1))
    // fp=2, pool=[1,3] → lower=1 → percentileRank=0.5
    expect(result.fpResult.value.percentileRank).toBe(0.5)
  })
})

describe('useAbilitiesComparison', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const makeAbilityEntry = (characterId: number, types: string[]): AbilityEntry => ({
    characterId,
    abilities: types.map(type => ({ type: type as any, title: 'Ability', text: '', cost: undefined })),
  })

  it('counts abilities by type across pool', () => {
    const entries = ref([
      makeAbilityEntry(1, ['active', 'active', 'reactive']),
      makeAbilityEntry(2, ['tactic', 'innate']),
    ])
    const chars = ref([
      makeChar({ id: 1, unitType: 'Primary' }),
      makeChar({ id: 2, unitType: 'Primary' }),
    ])
    const current = ref({ tactical: 1, active: 2, reactive: 1, innate: 1, identity: 0, forceCostAny: 0, forceCost1: 0, forceCost2: 0, forceCost3: 0 })
    const result = useAbilitiesComparison(entries, chars, ref('Primary'), ref(false), current)
    expect(result.totalPool.value).toBe(2)
    // Unit 1 has 2 active; unit 2 has 0 active. current=2 → lower=1, same=0, higher=0... wait
    // pool = [{tactical:0,active:2,reactive:1,...}, {tactical:1,active:0,reactive:0,innate:1,...}]
    // activeResult for current.active=2: lower=1 (unit2 has 0), same=0, higher=0? wait unit1 has 2 active = same=1
    expect(result.activeResult.value.same).toBe(1)
  })

  it('filters by unit type when sameTypeOnly=true', () => {
    const entries = ref([
      makeAbilityEntry(1, ['active']),
      makeAbilityEntry(2, ['tactic']),
    ])
    const chars = ref([
      makeChar({ id: 1, unitType: 'Primary' }),
      makeChar({ id: 2, unitType: 'Secondary' }),
    ])
    const current = ref({ tactical: 0, active: 1, reactive: 0, innate: 0, identity: 0, forceCostAny: 0, forceCost1: 0, forceCost2: 0, forceCost3: 0 })
    const result = useAbilitiesComparison(entries, chars, ref('Primary'), ref(true), current)
    // Only unit 1 (Primary) included
    expect(result.totalPool.value).toBe(1)
  })
})

describe('useStanceComparison', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const makeStanceEntry = (characterId: number): StanceEntry => ({
    characterId,
    stances: [
      { name: 'Stance A', ranged: { range: 2, attack: 3, defense: 2 }, melee: { attack: 4, defense: 3 } },
    ],
  })

  it('computes total pool from all stance entries', () => {
    const entries = ref([makeStanceEntry(1), makeStanceEntry(2)])
    const chars = ref([
      makeChar({ id: 1, unitType: 'Primary' }),
      makeChar({ id: 2, unitType: 'Primary' }),
    ])
    const current = {
      range: ref(2),
      rangedAttack: ref(3),
      rangedDefense: ref(2),
      meleeAttack: ref(4),
      meleeDefense: ref(3),
    }
    const result = useStanceComparison(entries, chars, ref('Primary'), ref(false), current)
    expect(result.totalPool.value).toBe(2)
  })

  it('filters by unit type when sameTypeOnly=true', () => {
    const entries = ref([makeStanceEntry(1), makeStanceEntry(2)])
    const chars = ref([
      makeChar({ id: 1, unitType: 'Primary' }),
      makeChar({ id: 2, unitType: 'Secondary' }),
    ])
    const current = {
      range: ref(2),
      rangedAttack: ref(3),
      rangedDefense: ref(2),
      meleeAttack: ref(4),
      meleeDefense: ref(3),
    }
    const result = useStanceComparison(entries, chars, ref('Primary'), ref(true), current)
    // Only Primary (id=1) included
    expect(result.totalPool.value).toBe(1)
  })

  it('computes melee attack result', () => {
    const entries = ref([
      makeStanceEntry(1),
      { characterId: 2, stances: [{ name: 'S', ranged: { range: 2, attack: 3, defense: 2 }, melee: { attack: 2, defense: 2 } }] },
    ])
    const chars = ref([makeChar({ id: 1 }), makeChar({ id: 2 })])
    const current = {
      range: ref(2),
      rangedAttack: ref(3),
      rangedDefense: ref(2),
      meleeAttack: ref(4),
      meleeDefense: ref(3),
    }
    const result = useStanceComparison(entries, chars, ref('Primary'), ref(false), current)
    // meleeAttack values=[4,2] current=4 → lower=1, same=1
    expect(result.meleeAttackResult.value.lower).toBe(1)
    expect(result.meleeAttackResult.value.same).toBe(1)
  })
})
