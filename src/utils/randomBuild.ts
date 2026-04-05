import type { Character, Squad } from '../types/index.ts'

export interface RandomBuildOptions {
  ownedSwpCodes?: Set<string>
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
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
