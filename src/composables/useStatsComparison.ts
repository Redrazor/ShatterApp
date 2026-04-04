import { computed } from 'vue'
import type { Ref } from 'vue'
import type { Character, HomebrewUnitType } from '../types/index.ts'
import type { AbilityEntry } from './useAbilities.ts'
import type { StanceEntry } from './useStances.ts'

export type StatBand = 'very-low' | 'low' | 'typical' | 'high' | 'very-high'

export interface StatResult {
  total: number
  lower: number
  same: number
  higher: number
  lowerPct: number
  samePct: number
  higherPct: number
  /** Fraction 0–1: how many units score strictly below this value */
  percentileRank: number
  band: StatBand
}

function toBand(percentileRank: number): StatBand {
  if (percentileRank <= 0.10) return 'very-low'
  if (percentileRank <= 0.25) return 'low'
  if (percentileRank <= 0.75) return 'typical'
  if (percentileRank <= 0.90) return 'high'
  return 'very-high'
}

function computeStat(values: number[], current: number): StatResult {
  const total = values.length
  if (total === 0) {
    return { total: 0, lower: 0, same: 0, higher: 0, lowerPct: 0, samePct: 0, higherPct: 0, percentileRank: 0.5, band: 'typical' }
  }
  const lower = values.filter(v => v < current).length
  const same = values.filter(v => v === current).length
  const higher = values.filter(v => v > current).length
  const percentileRank = lower / total

  return {
    total,
    lower, same, higher,
    lowerPct: Math.round((lower / total) * 100),
    samePct: Math.round((same / total) * 100),
    higherPct: Math.round((higher / total) * 100),
    percentileRank,
    band: toBand(percentileRank),
  }
}

export function useStatsComparison(
  characters: Ref<Character[]>,
  stamina: Ref<number>,
  durability: Ref<number>,
  tagCount: Ref<number>,
) {
  const validChars = computed(() =>
    characters.value.filter(c => c.stamina != null && c.durability != null),
  )

  const staminaResult = computed(() =>
    computeStat(validChars.value.map(c => c.stamina), stamina.value),
  )

  const durabilityResult = computed(() =>
    computeStat(validChars.value.map(c => c.durability), durability.value),
  )

  const tagCountResult = computed(() =>
    computeStat(validChars.value.map(c => (c.tags ?? []).length), tagCount.value),
  )

  const totalChars = computed(() => validChars.value.length)

  return { staminaResult, durabilityResult, tagCountResult, totalChars }
}

export function useFrontCardComparison(
  characters: Ref<Character[]>,
  unitType: Ref<HomebrewUnitType>,
  cost: Ref<number>,
  fp: Ref<number>,
  eraCount: Ref<number>,
) {
  // Cost pool: SP for Primary, PC for Secondary/Support
  const costPool = computed(() => {
    if (unitType.value === 'Primary') {
      return characters.value.filter(c => c.sp != null).map(c => c.sp as number)
    }
    return characters.value.filter(c => c.pc != null).map(c => c.pc as number)
  })

  const fpPool = computed(() =>
    characters.value.filter(c => c.fp != null).map(c => c.fp),
  )

  const eraPool = computed(() =>
    characters.value.map(c => (c.era ?? '').split(';').filter(Boolean).length),
  )

  const costResult = computed(() => computeStat(costPool.value, cost.value))
  const fpResult = computed(() => computeStat(fpPool.value, fp.value))
  const eraCountResult = computed(() => computeStat(eraPool.value, eraCount.value))

  const totalCostChars = computed(() => costPool.value.length)
  const totalAllChars = computed(() => fpPool.value.length)

  return { costResult, fpResult, eraCountResult, totalCostChars, totalAllChars }
}

export interface UnitAbilityCounts {
  tactical: number
  active: number
  reactive: number
  innate: number
  identity: number
  forceCostAny: number
  forceCost1: number
  forceCost2: number
  forceCost3: number
}

function toAbilityCounts(abilities: AbilityEntry['abilities']): UnitAbilityCounts {
  return {
    tactical:     abilities.filter(a => a.type === 'tactic').length,
    active:       abilities.filter(a => a.type === 'active').length,
    reactive:     abilities.filter(a => a.type === 'reactive').length,
    innate:       abilities.filter(a => a.type === 'innate').length,
    identity:     abilities.filter(a => a.type === 'identity').length,
    forceCostAny: abilities.filter(a => (a.cost ?? 0) > 0).length,
    forceCost1:   abilities.filter(a => a.cost === 1).length,
    forceCost2:   abilities.filter(a => a.cost === 2).length,
    forceCost3:   abilities.filter(a => a.cost === 3).length,
  }
}

export function useAbilitiesComparison(
  abilitiesEntries: Ref<AbilityEntry[]>,
  characters: Ref<Character[]>,
  unitType: Ref<HomebrewUnitType>,
  sameTypeOnly: Ref<boolean>,
  current: Ref<UnitAbilityCounts>,
) {
  const charTypeMap = computed(() => {
    const m: Record<number, string> = {}
    for (const c of characters.value) m[c.id] = c.unitType
    return m
  })

  const pool = computed(() => {
    const entries = abilitiesEntries.value
    return entries
      .filter(e => !sameTypeOnly.value || charTypeMap.value[e.characterId] === unitType.value)
      .map(e => toAbilityCounts(e.abilities))
  })

  const totalPool = computed(() => pool.value.length)

  function stat(key: keyof UnitAbilityCounts) {
    return computed(() => computeStat(pool.value.map(u => u[key]), current.value[key]))
  }

  return {
    totalPool,
    tacticalResult:     stat('tactical'),
    activeResult:       stat('active'),
    reactiveResult:     stat('reactive'),
    innateResult:       stat('innate'),
    identityResult:     stat('identity'),
    forceCostAnyResult: stat('forceCostAny'),
    forceCost1Result:   stat('forceCost1'),
    forceCost2Result:   stat('forceCost2'),
    forceCost3Result:   stat('forceCost3'),
  }
}

export function useStanceComparison(
  stanceEntries: Ref<StanceEntry[]>,
  characters: Ref<Character[]>,
  unitType: Ref<HomebrewUnitType>,
  sameTypeOnly: Ref<boolean>,
  current: {
    range: Ref<number>
    rangedAttack: Ref<number>
    rangedDefense: Ref<number>
    meleeAttack: Ref<number>
    meleeDefense: Ref<number>
  },
) {
  const charTypeMap = computed(() => {
    const m: Record<number, string> = {}
    for (const c of characters.value) m[c.id] = c.unitType
    return m
  })

  // Flatten all stances from entries, filtering by unit type when needed
  const flatStances = computed(() =>
    stanceEntries.value
      .filter(e => !sameTypeOnly.value || charTypeMap.value[e.characterId] === unitType.value)
      .flatMap(e => e.stances),
  )

  const totalPool = computed(() => flatStances.value.length)

  // Pools: null values excluded (e.g. melee-only stances have null ranged stats)
  const rangePool        = computed(() => flatStances.value.map(s => s.ranged?.range    ?? null).filter((v): v is number => v !== null))
  const rangedAttackPool = computed(() => flatStances.value.map(s => s.ranged?.attack   ?? null).filter((v): v is number => v !== null))
  const rangedDefensePool = computed(() => flatStances.value.map(s => s.ranged?.defense ?? null).filter((v): v is number => v !== null))
  const meleeAttackPool  = computed(() => flatStances.value.map(s => s.melee?.attack    ?? null).filter((v): v is number => v !== null))
  const meleeDefensePool = computed(() => flatStances.value.map(s => s.melee?.defense   ?? null).filter((v): v is number => v !== null))

  const rangeResult        = computed(() => computeStat(rangePool.value,        current.range.value))
  const rangedAttackResult = computed(() => computeStat(rangedAttackPool.value, current.rangedAttack.value))
  const rangedDefenseResult = computed(() => computeStat(rangedDefensePool.value, current.rangedDefense.value))
  const meleeAttackResult  = computed(() => computeStat(meleeAttackPool.value,  current.meleeAttack.value))
  const meleeDefenseResult = computed(() => computeStat(meleeDefensePool.value, current.meleeDefense.value))

  return {
    totalPool,
    rangeResult,
    rangedAttackResult,
    rangedDefenseResult,
    meleeAttackResult,
    meleeDefenseResult,
    rangePoolSize:        computed(() => rangePool.value.length),
    rangedAttackPoolSize: computed(() => rangedAttackPool.value.length),
    rangedDefensePoolSize: computed(() => rangedDefensePool.value.length),
    meleePoolSize:        computed(() => meleeAttackPool.value.length),
  }
}
