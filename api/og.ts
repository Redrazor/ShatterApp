import type { IncomingMessage, ServerResponse } from 'http'
import chars from '../public/data/characters.json'

const charMap = new Map(
  (chars as { id: number; name: string }[]).map(c => [c.id, c.name])
)

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'text/plain')
  res.end(`og alive — ${charMap.size} chars loaded`)
}
