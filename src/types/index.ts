export interface Character {
  id: number
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

export interface CompactBuild {
  name: string
  mid: number | null
  pre: boolean
  s: [[number, number, number], [number, number, number]]
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
