import type { Character } from '../types/index.ts'
import type { HomebrewProfile } from '../types/index.ts'
import type { AbilityEntry, Ability } from '../composables/useAbilities.ts'

export interface PublishCardImages {
  front: string
  abilities: string
  stance1: string
  stance2: string | null
  orderFront: string
  thumbnail: string
}

export function homebrewToCharacter(
  profile: HomebrewProfile,
  id: number,
  images: PublishCardImages,
): Character {
  const fc = profile.frontCard
  const st = profile.stats
  const stances = profile.stances

  const unitType = fc?.unitType ?? 'Primary'
  const isPrimary = unitType === 'Primary'
  const cost = fc?.cost ?? 0

  const stanceNames: string[] = []
  if (stances?.stance1?.title) stanceNames.push(stances.stance1.title)
  if (stances?.stance2?.title) stanceNames.push(stances.stance2.title)

  return {
    id,
    slug: `custom-${profile.id}`,
    name: profile.name,
    characterType: profile.name,
    unitType,
    pc: isPrimary ? null : cost,
    sp: isPrimary ? cost : null,
    durability: st?.durability ?? 3,
    stamina: st?.stamina ?? 4,
    fp: fc?.fp ?? 0,
    era: fc?.era ?? '',
    tags: st?.tags ?? [],
    swp: 'Homebrew',
    swpCode: 'CUSTOM',
    thumbnail: images.thumbnail || images.front,
    cardFront: images.front,
    cardBack: images.abilities,
    orderCard: images.orderFront,
    stance1: images.stance1,
    stance2: images.stance2 ?? undefined,
    stances: stanceNames,
    releaseDate: profile.createdAt,
  }
}

export function homebrewToAbilityEntry(
  profile: HomebrewProfile,
  characterId: number,
): AbilityEntry {
  const blocks = profile.abilities?.blocks ?? []

  const abilities: Ability[] = blocks.map(block => ({
    name: block.title,
    type: block.iconType,
    cost: block.forceCost === 0 ? null : block.forceCost,
    description: block.text,
  }))

  return {
    characterId,
    name: profile.name,
    swpCode: 'CUSTOM',
    abilities,
  }
}
