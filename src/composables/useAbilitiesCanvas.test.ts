import { describe, it, expect } from 'vitest'
import { computeTotalChars, getTierIndexForBlocks } from './useAbilitiesCanvas'
import type { AbilityBlock } from '../types/index'

function makeBlock(title: string, text: string, forceCost = 0): AbilityBlock {
  return { iconType: 'active', title, text, forceCost }
}

describe('computeTotalChars', () => {
  it('returns 0 for empty blocks array', () => {
    expect(computeTotalChars([])).toBe(0)
  })

  it('counts title characters correctly', () => {
    expect(computeTotalChars([makeBlock('Hello', '')])).toBe(5)
  })

  it('counts body text characters with no tokens', () => {
    expect(computeTotalChars([makeBlock('', 'Deal damage now')])).toBe(15)
  })

  it('[icon] token of any length counts as 1 character', () => {
    // '[damage]' is 8 raw chars but should count as 1
    expect(computeTotalChars([makeBlock('', '[damage]')])).toBe(1)
    // '[attack_expertise]' is 18 raw chars but should count as 1
    expect(computeTotalChars([makeBlock('', '[attack_expertise]')])).toBe(1)
  })

  it('multiple [icon] tokens each count as 1 char', () => {
    // '[damage][damage][damage]' = 3 tokens = 3 chars
    expect(computeTotalChars([makeBlock('', '[damage][damage][damage]')])).toBe(3)
  })

  it('mixes plain text and tokens correctly', () => {
    // 'Deal [damage] now' => 'Deal X now' = 10 chars
    expect(computeTotalChars([makeBlock('', 'Deal [damage] now')])).toBe(10)
  })

  it('handles block with title but empty text', () => {
    expect(computeTotalChars([makeBlock('Strike', '')])).toBe(6)
  })

  it('handles block with text but empty title', () => {
    expect(computeTotalChars([makeBlock('', 'Attack')])).toBe(6)
  })

  it('sums across multiple blocks', () => {
    const blocks = [
      makeBlock('Title1', 'Body one'),   // 6 + 8 = 14
      makeBlock('Title2', 'Body two'),   // 6 + 8 = 14
    ]
    expect(computeTotalChars(blocks)).toBe(28)
  })

  it('whitespace in title and text is counted', () => {
    // 'A B' = 3 chars, 'C D' = 3 chars
    expect(computeTotalChars([makeBlock('A B', 'C D')])).toBe(6)
  })

  it('newlines in body text are counted', () => {
    expect(computeTotalChars([makeBlock('', 'line1\nline2')])).toBe(11)
  })

  it('forceCost field is not included in char count', () => {
    // forceCost is numeric, not text — should not affect count
    expect(computeTotalChars([makeBlock('A', 'B', 3)])).toBe(2)
  })
})

describe('getTierIndexForBlocks', () => {
  function blocksWithChars(n: number): AbilityBlock[] {
    return [makeBlock('', 'x'.repeat(n))]
  }

  it('returns 0 for 0 chars (empty blocks)', () => {
    expect(getTierIndexForBlocks([])).toBe(0)
  })

  it('returns 0 for 1 char', () => {
    expect(getTierIndexForBlocks(blocksWithChars(1))).toBe(0)
  })

  it('returns 0 for 299 stripped chars', () => {
    expect(getTierIndexForBlocks(blocksWithChars(299))).toBe(0)
  })

  it('returns 1 for exactly 300 stripped chars', () => {
    expect(getTierIndexForBlocks(blocksWithChars(300))).toBe(1)
  })

  it('returns 1 for 419 stripped chars', () => {
    expect(getTierIndexForBlocks(blocksWithChars(419))).toBe(1)
  })

  it('returns 2 for exactly 420 stripped chars', () => {
    expect(getTierIndexForBlocks(blocksWithChars(420))).toBe(2)
  })

  it('returns 2 for 649 stripped chars', () => {
    expect(getTierIndexForBlocks(blocksWithChars(649))).toBe(2)
  })

  it('returns 3 for exactly 650 stripped chars', () => {
    expect(getTierIndexForBlocks(blocksWithChars(650))).toBe(3)
  })

  it('returns 3 for large char counts (1000+)', () => {
    expect(getTierIndexForBlocks(blocksWithChars(1000))).toBe(3)
  })
})

describe('SIZE_TIERS contract', () => {
  // Import tier data indirectly by verifying tier 0 via getTierIndexForBlocks
  // and checking that our exported functions produce consistent results.
  // Direct tier constant validation is done through boundary behavior.

  it('tier 0 baseline: 0 chars produces tier 0', () => {
    expect(getTierIndexForBlocks([])).toBe(0)
  })

  it('computeTotalChars is monotonically non-decreasing as text is added', () => {
    const base = [makeBlock('A', 'B')]
    const more = [makeBlock('A', 'B longer text here')]
    expect(computeTotalChars(more)).toBeGreaterThan(computeTotalChars(base))
  })

  it('tier index is non-decreasing as total chars increases', () => {
    const chars = [0, 100, 200, 299, 300, 350, 419, 420, 500, 649, 650, 800, 1200]
    let prevTier = 0
    for (const n of chars) {
      const blocks = n === 0 ? [] : [makeBlock('', 'x'.repeat(n))]
      const tier = getTierIndexForBlocks(blocks)
      expect(tier).toBeGreaterThanOrEqual(prevTier)
      prevTier = tier
    }
  })
})
