import { describe, it, expect } from 'vitest'
import { simulate } from '../../../src/utils/diceProb.ts'

describe('simulate', () => {
  it('distribution sums to runs', () => {
    const result = simulate(4, 3, 10_000)
    const total = result.distribution.reduce((s, c) => s + c, 0)
    expect(total).toBe(10_000)
  })

  it('distribution length equals atkDice + 1', () => {
    const result = simulate(5, 2, 1_000)
    expect(result.distribution.length).toBe(6)
  })

  it('distribution length is 1 when atkDice is 0', () => {
    const result = simulate(0, 3, 1_000)
    expect(result.distribution.length).toBe(1)
    expect(result.distribution[0]).toBe(1_000)
  })

  it('cumulative[0] is always 1.0 (always >= 0 hits)', () => {
    const result = simulate(4, 3, 10_000)
    expect(result.cumulative[0]).toBeCloseTo(1.0, 5)
  })

  it('cumulative is monotonically non-increasing', () => {
    const result = simulate(6, 4, 10_000)
    for (let i = 1; i < result.cumulative.length; i++) {
      expect(result.cumulative[i]).toBeLessThanOrEqual(result.cumulative[i - 1])
    }
  })

  it('mean is within distribution bounds', () => {
    const result = simulate(4, 3, 10_000)
    expect(result.mean).toBeGreaterThanOrEqual(0)
    expect(result.mean).toBeLessThanOrEqual(4)
  })

  it('mean is statistically reasonable: 6 atk / 0 def ≈ 3.0 hits', () => {
    // 6 atk, 0 def: expected hits = 6 * (1/8 + 3/8) = 6 * 0.5 = 3.0
    const result = simulate(6, 0, 100_000)
    expect(result.mean).toBeGreaterThan(2.7)
    expect(result.mean).toBeLessThan(3.3)
  })

  it('mean decreases as defense dice increase', () => {
    const low = simulate(5, 1, 50_000)
    const high = simulate(5, 5, 50_000)
    expect(low.mean).toBeGreaterThan(high.mean)
  })

  it('0 attack dice always yields 0 hits', () => {
    const result = simulate(0, 5, 1_000)
    expect(result.mean).toBe(0)
    expect(result.distribution[0]).toBe(1_000)
  })

  it('returns the run count in the result', () => {
    const result = simulate(3, 2, 7_777)
    expect(result.runs).toBe(7_777)
  })

  it('cumulative last entry equals distribution last entry / runs', () => {
    const result = simulate(4, 1, 10_000)
    const last = result.distribution.length - 1
    expect(result.cumulative[last]).toBeCloseTo(result.distribution[last] / 10_000, 5)
  })
})
