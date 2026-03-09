import { describe, it, expect } from 'vitest'
import {
  rollAttack,
  rollDefense,
  ATTACK_FACES,
  DEFENSE_FACES,
} from '../../../src/utils/dice.ts'

describe('rollAttack', () => {
  it('returns a valid AttackFace on every call', () => {
    for (let i = 0; i < 50; i++) {
      expect(ATTACK_FACES).toContain(rollAttack())
    }
  })

  it('can return every possible attack face over many rolls', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 500; i++) seen.add(rollAttack())
    for (const face of ATTACK_FACES) expect(seen).toContain(face)
  })
})

describe('rollDefense', () => {
  it('returns a valid DefenseFace on every call', () => {
    for (let i = 0; i < 50; i++) {
      expect(DEFENSE_FACES).toContain(rollDefense())
    }
  })

  it('can return every possible defense face over many rolls', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 500; i++) seen.add(rollDefense())
    for (const face of DEFENSE_FACES) expect(seen).toContain(face)
  })
})

describe('face constants', () => {
  it('ATTACK_FACES contains exactly crit, strike, expertise, failure', () => {
    expect(ATTACK_FACES).toEqual(['crit', 'strike', 'expertise', 'failure'])
  })

  it('DEFENSE_FACES contains exactly block, expertise, failure', () => {
    expect(DEFENSE_FACES).toEqual(['block', 'expertise', 'failure'])
  })
})
