export type ConditionKey = 'hunker' | 'disarmed' | 'strained' | 'exposed' | 'pinned'

export interface PlayUnit {
  id: number
  name: string
  thumbnail: string
  unitType: string
  stamina: number
  durability: number
  fp: number
  stance1?: string
  stance2?: string
  activeStance: 1 | 2
  damage: number
  wounds: number
  wounded: boolean
  defeated: boolean
  conditions: ConditionKey[]
  tags: string[]
  orderCard?: string
}

export interface Character {
  id: number
  slug: string
  name: string
  characterType: string
  unitType: 'Primary' | 'Secondary' | 'Support'
  unitTypeName?: string
  pc: number | null
  sp: number | null
  durability: number
  stamina: number
  fp: number
  era: string
  tags: string[]
  swp: string
  swpCode?: string
  spt?: string
  thumbnail: string
  cardFront: string
  cardBack: string
  orderCard?: string
  stance1?: string
  stance2?: string
  model?: string
  modelCount?: number
  characterExclusion?: string
  extraCards?: string
  stances: string[]
  releaseDate: string
}

export interface Mission {
  id: number
  name: string
  card: string
  swp: string
  spt?: string
  struggles: Record<string, string[]>
}

export interface KoStageCard {
  front?: string
  back?: string
  cards?: string[]  // multi-face override (e.g. 4-page Stage II); supersedes front/back
}

export interface KoMission {
  id: number
  name: string
  missionFront?: string
  missionBack?: string
  missionCards?: string[]
  stages: KoStageCard[]
  tracker?: string
}

export interface LegendaryOrderCard {
  id: string
  name: string
  forceRefresh: number  // 0 = none
  effect: string
  legendAbility: string
}

export interface LegendaryMission {
  id: number
  name: string
  missionCard?: string
  missionCards?: string[]
  cadreForce: number
  squadPointLimit: number
  dashboardImage?: string
}

export interface GalacticLegend {
  id: string
  name: string
  force: number
  orderCards: LegendaryOrderCard[]
  statCard?: string
  stanceCard?: string
}

export interface Product {
  id: number
  name: string
  swp: string
  number?: string
  era: string
  thumbnail: string
  mainImage?: string
  images: string[]
  models: string[]
  description: string
  assemblyUrl: string
  storeLink: string
}

export interface Squad {
  primary: Character | null
  secondary: Character | null
  support: Character | null
}

export interface StrikeForce {
  name: string
  mission: Mission | null
  squads: [Squad, Squad]
}

export type BuildMode = 'standard' | 'threemiere' | 'premiere'

export interface CompactBuild {
  name: string
  mid: number | null
  mode: BuildMode
  pre?: boolean  // backward compat for old persisted data
  s: [[number, number, number], [number, number, number]]
  ex?: [[number, number, number], [number, number, number]]
}


export interface TrackerSnapshot {
  mode: 'standard' | 'ko' | 'legendary'
  // standard + ko
  strugglePosition?: number
  p1Momentum?: number
  p2Momentum?: number
  p1Wins?: number
  p2Wins?: number
  selectedMissionId?: number | null
  struggleCards?: [string, string, string] | null
  missionOwner?: 'host' | 'guest' | null
  // legendary
  victoryPosition?: number
  cadre1Force?: number
  cadre2Force?: number
  legendForce?: number
}

export interface DiceRollResult {
  atkPool: import('../utils/dice').DieState[]
  defPool: import('../utils/dice').DieState[]
  hits: number
  timestamp: number
}

export type DiceRole = 'attacker' | 'defender' | null

export interface DuelRow {
  atkPool: import('../utils/dice').DieState[]
  defPool: import('../utils/dice').DieState[]
  atkName: string
  defName: string
  netHits: number
  timestamp: number
}

export interface ForcePoolPayload {
  spentTokens: boolean[]
  total: number
}

export interface AbilityBlock {
  iconType: string    // icon name prefix, e.g. 'active', 'reactive', 'innate'
  title: string       // bold ability name shown on card
  forceCost: number   // 0 = no force icons; 1+ = that many force icons shown before title
  text: string        // description text with [symbolname] markers e.g. [damage], [advance]
}

export interface AbilitiesData {
  blocks: AbilityBlock[]
}

export type HomebrewUnitType = 'Primary' | 'Secondary' | 'Support'
export type BuilderPhase = 1 | 2 | 3 | 4

export interface FrontCardData {
  unitType: HomebrewUnitType
  name: string
  title: string                  // unit title — combined with name on the black bar
  imageData: string | null       // base64 data URL
  imageOffsetX: number           // normalized pan (-0.5 to 0.5)
  imageOffsetY: number
  imageScale: number             // 1.0 = fit, up to 3.0
  cost: number                   // SP for Primary, PC for Secondary/Support
  fp: number                     // force points (0 valid)
  era: string                    // semicolon-delimited, e.g. "Clone Wars;Empire"
}

export interface StatsData {
  stamina: number       // total stamina boxes, 1–10
  durability: number    // 0–5
  tags: string[]
  imageOffsetX: number  // independent back-card pan/zoom
  imageOffsetY: number
  imageScale: number
}

export interface HomebrewProfile {
  id: string
  name: string                   // display name, synced from frontCard.name
  createdAt: string              // ISO date
  updatedAt: string              // ISO date
  frontCard: FrontCardData | null
  stats: StatsData | null        // Phase 2
  abilities: AbilitiesData | null  // Phase 3
  stances: null                  // Phase 4 — future
}

export function hasStrikeForceConflict(squads: [Squad, Squad]): boolean {
  const units: Character[] = []
  for (const squad of squads) {
    for (const role of ['primary', 'secondary', 'support'] as const) {
      const u = squad[role]
      if (u) units.push(u)
    }
  }
  const names = units.map(u => u.name)
  if (new Set(names).size < names.length) return true
  const charTypes = units.map(u => u.characterType).filter(Boolean)
  if (new Set(charTypes).size < charTypes.length) return true
  return false
}

export function isSquadValid(squad: Squad): { valid: boolean; reason: string } {
  const { primary, secondary, support } = squad
  if (!primary || !secondary || !support) {
    return { valid: false, reason: 'Squad incomplete' }
  }

  const pcSum = secondary.pc! + support.pc!
  if (pcSum > primary.sp!) {
    return {
      valid: false,
      reason: `PC total (${pcSum}) exceeds Primary SP (${primary.sp})`,
    }
  }

  const unitEras = [primary, secondary, support].map(u =>
    new Set(u.era.split(';').map(e => e.trim()).filter(Boolean))
  )
  const commonEras = [...unitEras[0]].filter(e => unitEras[1].has(e) && unitEras[2].has(e))
  if (commonEras.length === 0) {
    return { valid: false, reason: 'Units come from incompatible eras' }
  }

  return { valid: true, reason: '' }
}
