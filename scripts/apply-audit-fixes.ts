/**
 * Apply ability audit corrections to abilities.json
 *
 * Usage: npx tsx scripts/apply-audit-fixes.ts <corrections.json>
 *
 * The corrections file format:
 * { "characterId": { "abilityIndex": { "type"?: string, "cost"?: number | null } } }
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const correctionsPath = process.argv[2]
if (!correctionsPath) {
  console.error('Usage: npx tsx scripts/apply-audit-fixes.ts <corrections.json>')
  process.exit(1)
}

const abilitiesPath = resolve(__dirname, '../public/data/abilities.json')

const corrections = JSON.parse(readFileSync(resolve(correctionsPath), 'utf-8'))
const abilities = JSON.parse(readFileSync(abilitiesPath, 'utf-8'))

let applied = 0
for (const [charId, fixes] of Object.entries(corrections) as [string, Record<string, Record<string, unknown>>][]) {
  for (const [idx, fields] of Object.entries(fixes)) {
    const ability = abilities[charId]?.abilities?.[parseInt(idx)]
    if (!ability) {
      console.warn(`Skipped: character ${charId} ability ${idx} not found`)
      continue
    }
    if (fields.type !== undefined) {
      console.log(`${abilities[charId].name} → "${ability.name}": type ${ability.type} → ${fields.type}`)
      ability.type = fields.type
      applied++
    }
    if (fields.cost !== undefined) {
      console.log(`${abilities[charId].name} → "${ability.name}": cost ${ability.cost} → ${fields.cost}`)
      ability.cost = fields.cost
      applied++
    }
  }
}

writeFileSync(abilitiesPath, JSON.stringify(abilities, null, 2) + '\n')
console.log(`\nDone: ${applied} field(s) updated in abilities.json`)
