import type { IncomingMessage, ServerResponse } from 'http'
import { readFileSync } from 'fs'
import { join } from 'path'

const chars = JSON.parse(readFileSync(join(process.cwd(), 'public/data/characters.json'), 'utf-8')) as { id: number; name: string }[]
const charMap = new Map(chars.map(c => [c.id, c.name]))

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'text/plain')
  res.end(`og alive — ${charMap.size} chars loaded`)
}
