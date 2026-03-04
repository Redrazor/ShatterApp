export type AttackFace = 'crit' | 'strike' | 'expertise' | 'failure'
export type DefenseFace = 'block' | 'expertise' | 'failure'
export type DieType = 'attack' | 'defense'

// Attack d8: 1×Crit, 3×Strike, 2×Expertise, 2×Failure
const ATTACK_TABLE: AttackFace[] = ['crit', 'strike', 'strike', 'strike', 'expertise', 'expertise', 'failure', 'failure']
// Defense d6: 2×Block, 2×Expertise, 2×Failure
const DEFENSE_TABLE: DefenseFace[] = ['block', 'block', 'expertise', 'expertise', 'failure', 'failure']

export function rollAttack(): AttackFace {
  return ATTACK_TABLE[Math.floor(Math.random() * 8)]
}

export function rollDefense(): DefenseFace {
  return DEFENSE_TABLE[Math.floor(Math.random() * 6)]
}

export const ATTACK_FACES: AttackFace[] = ['crit', 'strike', 'expertise', 'failure']
export const DEFENSE_FACES: DefenseFace[] = ['block', 'expertise', 'failure']

export interface DieState {
  id: number
  type: DieType
  face: AttackFace | DefenseFace
  locked: boolean
  isBonus: boolean
}
