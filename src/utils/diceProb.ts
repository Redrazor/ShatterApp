// Attack d8: 1×Crit, 3×Strike, 2×Expertise, 2×Failure
// Defense d6: 2×Block, 2×Expertise, 2×Failure
// Hits = crits + max(0, strikes − blocks)
// Expertise is treated as failure (not modelled as optimal play)

export interface SimResult {
  distribution: number[]  // index = hit count, value = number of runs with that result
  cumulative: number[]    // index = hit count, value = P(hits >= i)
  mean: number
  runs: number
}

export function simulate(atkDice: number, defDice: number, runs = 50_000): SimResult {
  const maxHits = Math.max(atkDice, 0)
  const dist = new Array<number>(maxHits + 1).fill(0)

  for (let r = 0; r < runs; r++) {
    let crits = 0
    let strikes = 0
    for (let a = 0; a < atkDice; a++) {
      const roll = Math.floor(Math.random() * 8)
      if (roll === 0) crits++
      else if (roll <= 3) strikes++
      // rolls 4-7: expertise(4-5) and failure(6-7) — both treated as 0
    }
    let blocks = 0
    for (let d = 0; d < defDice; d++) {
      const roll = Math.floor(Math.random() * 6)
      if (roll <= 1) blocks++
      // rolls 2-5: expertise(2-3) and failure(4-5) — both treated as 0
    }
    const hits = Math.min(crits + Math.max(0, strikes - blocks), maxHits)
    dist[hits]++
  }

  // Cumulative P(>= i): walk from max hits down
  const cumulative = new Array<number>(maxHits + 1).fill(0)
  let running = 0
  for (let i = maxHits; i >= 0; i--) {
    running += dist[i]
    cumulative[i] = running / runs
  }

  const mean = dist.reduce((sum, count, hits) => sum + count * hits, 0) / runs

  return { distribution: dist, cumulative, mean, runs }
}
