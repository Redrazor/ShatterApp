import type { IncomingMessage, ServerResponse } from 'http'
import { readFileSync } from 'fs'
import { join } from 'path'

const chars = JSON.parse(readFileSync(join(process.cwd(), 'public/data/characters.json'), 'utf-8')) as { id: number; name: string }[]
const charMap = new Map(chars.map(c => [c.id, c.name]))

function fromBase64url(s: string): string {
  try {
    return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
  } catch {
    return ''
  }
}

function decodeBuild(sf: string): { name: string; s: [[number, number, number], [number, number, number]] } | null {
  try {
    const raw = fromBase64url(sf)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const GOLD = '#c9a227'
const DARK = '#111318'
const DIM  = '#6b7280'
const NAME = '#d4c08a'
const W = 1200
const H = 630

function buildSvg(listName: string, sq0: string[], sq1: string[]): string {
  const squads = [
    { label: 'SQUAD 1', names: sq0 },
    { label: 'SQUAD 2', names: sq1 },
  ]
  const cols = squads.map((squad, si) => {
    const x = 64 + si * 560
    const label = `<text x="${x}" y="318" font-family="sans-serif" font-size="12" font-weight="bold" letter-spacing="2" fill="${DIM}">${esc(squad.label)}</text>`
    const names = squad.names.map((name, ni) => {
      const y = 354 + ni * 40
      return `<circle cx="${x + 7}" cy="${y - 6}" r="3" fill="${GOLD}aa"/>
        <text x="${x + 22}" y="${y}" font-family="sans-serif" font-size="26" fill="${NAME}">${esc(name)}</text>`
    }).join('\n')
    return label + '\n' + names
  }).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${DARK}"/>
  <text x="64" y="78" font-family="sans-serif" font-size="13" letter-spacing="3" fill="${GOLD}" opacity="0.7">SHATTERAPP</text>
  <text x="${W - 64}" y="78" font-family="sans-serif" font-size="12" text-anchor="end" fill="${GOLD}" opacity="0.3">Star Wars: Shatterpoint</text>
  <line x1="64" y1="98" x2="${W - 64}" y2="98" stroke="${GOLD}" stroke-opacity="0.2" stroke-width="1"/>
  <text x="64" y="220" font-family="sans-serif" font-size="60" font-weight="bold" fill="${GOLD}">${esc(listName)}</text>
  ${cols}
</svg>`
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = new URL(req.url!, `https://${req.headers.host}`)
    const sf = url.searchParams.get('sf')
    const build = sf ? decodeBuild(sf) : null
    const listName = build?.name ?? 'Strike Force'

    const getNames = (ids?: [number, number, number]): string[] =>
      (ids ?? []).map(id => charMap.get(id) ?? '').filter(Boolean)

    const sq0 = getNames(build?.s?.[0])
    const sq1 = getNames(build?.s?.[1])

    const svg = buildSvg(listName, sq0, sq1)
    const sharp = (await import('sharp')).default
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer()

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable')
    res.end(buffer)
  } catch (err) {
    console.error('[og] error:', err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain')
    res.end('Failed to generate image: ' + String(err))
  }
}
