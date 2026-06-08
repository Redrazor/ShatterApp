import type { Character, Squad } from '../types/index.ts'

/**
 * Cohesion spectrum (Feature #1):
 *   0   Locked      — all units from one random pack (swpCode); fallback to Pack-Loyal.
 *   25  Pack-Loyal  — 5× weight for units sharing the anchor primary's swpCode.
 *   50  Tag-Aligned — 3× weight for units sharing a tag with the anchor (~legacy behaviour).
 *   75  Loose       — 1.5× weight for tag-sharing units.
 *   100 Chaos       — no cohesion weighting.
 */
export type CohesionLevel = 0 | 25 | 50 | 75 | 100

export interface RandomBuildOptions {
  ownedSwpCodes?: Set<string>
  /** Number of squads to generate (1–4). Defaults to 2. Used by generateRandomForce. */
  squadCount?: 1 | 2 | 3 | 4
  /** Cohesion weighting level. Defaults to 50 (Tag-Aligned). Used by generateRandomForce. */
  cohesion?: CohesionLevel
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const emptySquad = (): Squad => ({ primary: null, secondary: null, support: null })

/** Weighted random selection; falls back to uniform if all weights are non-positive. */
function weightedPick<T>(items: T[], weightFn: (item: T) => number): T {
  const weights = items.map(weightFn)
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0)
  if (total <= 0) return pickRandom(items)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= Math.max(0, weights[i])
    if (r < 0) return items[i]
  }
  return items[items.length - 1]
}

/** Relative weight of a candidate given the squad's anchor primary and the cohesion level. */
function cohesionWeight(
  candidate: Character,
  anchor: Character | null,
  cohesion: CohesionLevel,
): number {
  if (!anchor || cohesion >= 100) return 1
  switch (cohesion) {
    case 25: // Pack-Loyal — strongly prefer same pack
      return candidate.swpCode && candidate.swpCode === anchor.swpCode ? 5 : 1
    case 50: // Tag-Aligned
      return sharesTag(candidate, anchor) ? 3 : 1
    case 75: // Loose
      return sharesTag(candidate, anchor) ? 1.5 : 1
    default: // 0 (Locked) is handled by pool pre-filtering; treat as neutral here
      return 1
  }
}

function eraSet(c: Character): Set<string> {
  return new Set(c.era.split(';').map(e => e.trim()).filter(Boolean))
}

// A unit with no era (e.g. custom homebrew) is era-universal
function eraCompatible(candidate: Character, requiredEras: Set<string>): boolean {
  const eras = eraSet(candidate)
  if (eras.size === 0) return true
  return [...eras].some(e => requiredEras.has(e))
}

function sharesTag(a: Character, b: Character): boolean {
  return a.tags.length > 0 && b.tags.length > 0 && a.tags.some(t => b.tags.includes(t))
}

export function generateRandomStrikeForce(
  characters: Character[],
  currentSquads: [Squad, Squad],
  options: RandomBuildOptions = {}
): [Squad, Squad] | null {
  const pool = options.ownedSwpCodes
    ? characters.filter(c => c.swpCode && options.ownedSwpCodes!.has(c.swpCode))
    : [...characters]

  const MAX_RETRIES = 50

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const squads: [Squad, Squad] = [
      { ...currentSquads[0] },
      { ...currentSquads[1] },
    ]
    const usedTypes = new Set<string>()
    const usedNames = new Set<string>()

    // Register already-placed units so we don't replace or duplicate them
    for (const sq of squads) {
      for (const role of ['primary', 'secondary', 'support'] as const) {
        const u = sq[role]
        if (u) {
          if (u.characterType) usedTypes.add(u.characterType)
          usedNames.add(u.name)
        }
      }
    }

    let success = true

    for (let si = 0; si < 2; si++) {
      const sq = squads[si]
      const otherPrimary = squads[si === 0 ? 1 : 0].primary

      // --- Primary ---
      if (!sq.primary) {
        const eligibles = pool.filter(c =>
          c.unitType === 'Primary' &&
          !usedTypes.has(c.characterType) &&
          !usedNames.has(c.name)
        )
        if (eligibles.length === 0) { success = false; break }

        // Cross-squad synergy: prefer tags overlapping with the other squad's primary
        const synergy = otherPrimary ? eligibles.filter(c => sharesTag(c, otherPrimary)) : []
        sq.primary = pickRandom(synergy.length > 0 ? synergy : eligibles)
        usedTypes.add(sq.primary.characterType)
        usedNames.add(sq.primary.name)
      }

      // --- Secondary ---
      if (!sq.secondary) {
        const primaryEras = eraSet(sq.primary)
        const budget = sq.primary.sp!

        const eligibles = pool.filter(c =>
          c.unitType === 'Secondary' &&
          !usedTypes.has(c.characterType) &&
          !usedNames.has(c.name) &&
          c.pc !== null && c.pc <= budget &&
          (eraSet(sq.primary!).size === 0 || eraCompatible(c, primaryEras))
        )
        if (eligibles.length === 0) { success = false; break }

        const synergy = eligibles.filter(c => sharesTag(c, sq.primary!))
        sq.secondary = pickRandom(synergy.length > 0 ? synergy : eligibles)
        usedTypes.add(sq.secondary.characterType)
        usedNames.add(sq.secondary.name)
      }

      // --- Support ---
      if (!sq.support) {
        const primaryEras = eraSet(sq.primary)
        const secondaryEras = eraSet(sq.secondary)
        // If either anchor is era-universal, use whichever has eras; both empty → any era is fine
        const commonEras = primaryEras.size === 0 && secondaryEras.size === 0
          ? new Set<string>()
          : primaryEras.size === 0
            ? secondaryEras
            : secondaryEras.size === 0
              ? primaryEras
              : new Set([...primaryEras].filter(e => secondaryEras.has(e)))
        const remainingBudget = sq.primary.sp! - (sq.secondary.pc ?? 0)

        const eligibles = pool.filter(c =>
          c.unitType === 'Support' &&
          !usedTypes.has(c.characterType) &&
          !usedNames.has(c.name) &&
          c.pc !== null && c.pc <= remainingBudget &&
          (commonEras.size === 0 || eraCompatible(c, commonEras))
        )
        if (eligibles.length === 0) { success = false; break }

        const synergy = eligibles.filter(c => sharesTag(c, sq.primary!))
        sq.support = pickRandom(synergy.length > 0 ? synergy : eligibles)
        usedTypes.add(sq.support.characterType)
        usedNames.add(sq.support.name)
      }

      squads[si] = sq
    }

    if (success) return squads
  }

  return null
}

/** Common eras shared by two anchors, treating an era-universal anchor as a wildcard. */
function commonEras(primary: Character, secondary: Character): Set<string> {
  const p = eraSet(primary)
  const s = eraSet(secondary)
  if (p.size === 0 && s.size === 0) return new Set<string>()
  if (p.size === 0) return s
  if (s.size === 0) return p
  return new Set([...p].filter(e => s.has(e)))
}

/** Fill `count` fresh squads from `pool` in a single pass. Returns null if any slot can't be filled. */
function tryFillSquads(
  pool: Character[],
  count: number,
  cohesion: CohesionLevel,
): Squad[] | null {
  const squads: Squad[] = Array.from({ length: count }, emptySquad)
  const usedTypes = new Set<string>()
  const usedNames = new Set<string>()
  let anchorPrimary: Character | null = null

  const eligible = (unitType: Character['unitType'], extra: (c: Character) => boolean) =>
    pool.filter(c =>
      c.unitType === unitType &&
      !usedTypes.has(c.characterType) &&
      !usedNames.has(c.name) &&
      extra(c),
    )

  const claim = (sq: Squad, role: keyof Squad, unit: Character) => {
    sq[role] = unit
    if (unit.characterType) usedTypes.add(unit.characterType)
    usedNames.add(unit.name)
  }

  for (const sq of squads) {
    // --- Primary --- (first squad's primary becomes the cross-squad anchor)
    const primaries = eligible('Primary', () => true)
    if (primaries.length === 0) return null
    claim(sq, 'primary', weightedPick(primaries, c => cohesionWeight(c, anchorPrimary, cohesion)))
    if (!anchorPrimary) anchorPrimary = sq.primary

    const primaryEras = eraSet(sq.primary!)
    const budget = sq.primary!.sp!

    // --- Secondary ---
    const secondaries = eligible('Secondary', c =>
      c.pc !== null && c.pc <= budget &&
      (primaryEras.size === 0 || eraCompatible(c, primaryEras)),
    )
    if (secondaries.length === 0) return null
    claim(sq, 'secondary', weightedPick(secondaries, c => cohesionWeight(c, sq.primary!, cohesion)))

    // --- Support ---
    const shared = commonEras(sq.primary!, sq.secondary!)
    const remaining = budget - (sq.secondary!.pc ?? 0)
    const supports = eligible('Support', c =>
      c.pc !== null && c.pc <= remaining &&
      (shared.size === 0 || eraCompatible(c, shared)),
    )
    if (supports.length === 0) return null
    claim(sq, 'support', weightedPick(supports, c => cohesionWeight(c, sq.primary!, cohesion)))
  }

  return squads
}

/**
 * Generate a fresh strike force of `squadCount` squads (1–4) with cohesion weighting.
 * Hard constraints (era compatibility, PC ≤ SP budget, character-type + name uniqueness)
 * are always enforced. Returns null if no valid force can be assembled.
 */
export function generateRandomForce(
  characters: Character[],
  options: RandomBuildOptions = {},
): Squad[] | null {
  const count = options.squadCount ?? 2
  const cohesion = options.cohesion ?? 50
  const basePool = options.ownedSwpCodes
    ? characters.filter(c => c.swpCode && options.ownedSwpCodes!.has(c.swpCode))
    : [...characters]

  const MAX_RETRIES = 50

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (cohesion === 0) {
      // Locked: confine the whole force to one random pack.
      const packs = [...new Set(basePool.map(c => c.swpCode).filter(Boolean))] as string[]
      if (packs.length > 0) {
        const packPool = basePool.filter(c => c.swpCode === pickRandom(packs))
        const locked = tryFillSquads(packPool, count, 25)
        if (locked) return locked
      }
      // Fallback to Pack-Loyal weighting on the full pool if no single pack can fill.
      const fallback = tryFillSquads(basePool, count, 25)
      if (fallback) return fallback
      continue
    }

    const result = tryFillSquads(basePool, count, cohesion)
    if (result) return result
  }

  return null
}
