import type { IncomingMessage, ServerResponse } from 'http'
import { readFileSync } from 'fs'
import { join } from 'path'

const chars = JSON.parse(readFileSync(join(process.cwd(), 'public/data/characters.json'), 'utf-8')) as { id: number; name: string }[]
const charMap = new Map(chars.map(c => [c.id, c.name]))

function fromBase64url(s: string): string {
  try {
    return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
  } catch { return '' }
}

function decodeBuild(sf: string): { name: string; s: [[number, number, number], [number, number, number]] } | null {
  try {
    const raw = fromBase64url(sf)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

const GOLD  = '#c9a227'
const DARK  = '#111318'
const DIM   = 'rgba(107,114,128,1)'
const NAME  = '#d4c08a'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const url   = new URL(req.url!, `https://${req.headers.host}`)
    const sf    = url.searchParams.get('sf')
    const build = sf ? decodeBuild(sf) : null
    const listName = build?.name ?? 'Strike Force'

    const getNames = (ids?: [number, number, number]): string[] =>
      (ids ?? []).map(id => charMap.get(id) ?? '').filter(Boolean)

    const sq0 = getNames(build?.s?.[0])
    const sq1 = getNames(build?.s?.[1])

    const { ImageResponse } = await import('@vercel/og')
    const { createElement: h } = await import('react')

    const squad = (label: string, names: string[]) =>
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, flex: 1 } },
        h('div', { style: { color: DIM, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, display: 'flex' } }, label),
        ...names.map(name =>
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
            h('div', { style: { width: 6, height: 6, borderRadius: 9999, background: GOLD, opacity: 0.7, flexShrink: 0 } }),
            h('span', { style: { color: NAME, fontSize: 26 } }, name)
          )
        )
      )

    const imageResponse = new ImageResponse(
      h('div', {
        style: {
          background: DARK, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          padding: '52px 64px', fontFamily: 'sans-serif', boxSizing: 'border-box',
        }
      },
        // Header
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
          h('span', { style: { color: GOLD, fontSize: 13, letterSpacing: 3, textTransform: 'uppercase' as const, opacity: 0.7, display: 'flex' } }, 'ShatterApp'),
          h('span', { style: { color: GOLD, fontSize: 11, opacity: 0.3, display: 'flex' } }, 'Star Wars: Shatterpoint'),
        ),
        // Rule
        h('div', { style: { height: 1, background: `${GOLD}35`, marginBottom: 36, display: 'flex' } }),
        // List name
        h('div', { style: { color: GOLD, fontSize: 52, fontWeight: 700, marginBottom: 48, display: 'flex', lineHeight: 1.1 } }, listName),
        // Squads
        h('div', { style: { display: 'flex', gap: 64 } },
          squad('Squad 1', sq0),
          squad('Squad 2', sq1),
        )
      ),
      { width: 1200, height: 630 }
    )

    const buffer = Buffer.from(await imageResponse.arrayBuffer())
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
