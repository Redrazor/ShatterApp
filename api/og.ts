import type { IncomingMessage, ServerResponse } from 'http'
import { readFileSync } from 'fs'
import { join } from 'path'

const chars = JSON.parse(readFileSync(join(process.cwd(), 'public/data/characters.json'), 'utf-8')) as { id: number; name: string }[]
const charMap = new Map(chars.map(c => [c.id, c.name]))

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    const sharp = (await import('sharp')).default
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#111318"/><text x="10" y="60" font-family="sans-serif" font-size="20" fill="#c9a227">test ${charMap.size}</text></svg>`
    const buf = await sharp(Buffer.from(svg)).png().toBuffer()
    res.setHeader('Content-Type', 'image/png')
    res.end(buf)
  } catch (err) {
    res.setHeader('Content-Type', 'text/plain')
    res.end('sharp error: ' + String(err))
  }
}
