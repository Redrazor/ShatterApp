/**
 * One-time migration: adds `slug` field to every entry in characters.json.
 * Safe to re-run — existing slugs are overwritten with a freshly derived value.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { toSlug } from '../src/utils/slug.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const file = path.resolve(__dirname, '../public/data/characters.json')

interface RawCharacter { id: number; name: string; slug?: string; [k: string]: unknown }

const chars: RawCharacter[] = JSON.parse(fs.readFileSync(file, 'utf-8'))

// Check for slug collisions
const slugMap = new Map<string, number>()
for (const c of chars) {
  c.slug = toSlug(c.name)
  if (slugMap.has(c.slug)) {
    console.warn(`⚠ Slug collision: "${c.slug}" for id=${c.id} (${c.name}) and id=${slugMap.get(c.slug)} — appending id`)
    c.slug = `${c.slug}-${c.id}`
  }
  slugMap.set(c.slug, c.id)
}

fs.writeFileSync(file, JSON.stringify(chars, null, 2), 'utf-8')
console.log(`✓ Slugs added to ${chars.length} characters in characters.json`)
