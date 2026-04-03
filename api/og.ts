import type { IncomingMessage, ServerResponse } from 'http'
import { readFileSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'

const IMAGE_BASE = 'https://shatterapp-images.web.app'

function cardImageUrl(cardFront: string): string {
  const stripped = cardFront.replace(/^\/images\//, '/')
  const webp = stripped.replace(/\.(png|jpe?g|gif)$/i, '.webp')
  return `${IMAGE_BASE}${webp}`
}

const chars = JSON.parse(readFileSync(join(process.cwd(), 'public/data/characters.json'), 'utf-8')) as { id: number; name: string; cardFront: string }[]
const charMap = new Map(chars.map(c => [c.id, { name: c.name, cardFront: c.cardFront }]))

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

    type Unit = { name: string; cardFront: string }

    const getUnits = (ids?: [number, number, number]): (Unit | null)[] =>
      [0, 1, 2].map(i => {
        const id = ids?.[i]
        return id != null ? (charMap.get(id) ?? null) : null
      })

    const sq0 = getUnits(build?.s?.[0])
    const sq1 = getUnits(build?.s?.[1])

    // Card: 173px wide × 242px tall (≈ 2.5:3.5 ratio)
    const CARD_W = 173
    const CARD_H = 242

    // Pre-fetch all card images as base64 data URIs so Satori doesn't
    // need to make external network calls during rendering.
    // Satori doesn't support webp, so convert to PNG via sharp first.
    const allUnits = [...sq0, ...sq1].filter((u): u is Unit => u !== null)
    const fetched = await Promise.all(
      allUnits.map(async u => {
        try {
          const r = await fetch(cardImageUrl(u.cardFront))
          if (!r.ok) return [u.cardFront, null] as const
          const buf = await r.arrayBuffer()
          const pngBuf = await sharp(Buffer.from(buf)).resize(CARD_W, CARD_H, { fit: 'cover' }).png().toBuffer()
          const b64 = pngBuf.toString('base64')
          return [u.cardFront, `data:image/png;base64,${b64}`] as const
        } catch { return [u.cardFront, null] as const }
      })
    )
    const imgData = new Map(fetched)

    const { ImageResponse } = await import('@vercel/og')
    const { createElement: h } = await import('react')
    const BORDER = `${GOLD}33`

    const cardEl = (unit: Unit | null) =>
      unit
        ? h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 } },
            h('img', {
              src: imgData.get(unit.cardFront) ?? cardImageUrl(unit.cardFront),
              width: CARD_W, height: CARD_H,
              style: {
                borderRadius: 8,
                border: `1px solid ${BORDER}`,
                objectFit: 'cover',
              },
            }),
            h('span', {
              style: { color: NAME, fontSize: 11, textAlign: 'center' as const, lineHeight: 1.3, display: 'flex' },
            }, unit.name.length > 22 ? unit.name.slice(0, 20) + '…' : unit.name)
          )
        : h('div', {
            style: {
              flex: 1, width: CARD_W, height: CARD_H, borderRadius: 8,
              border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.03)', display: 'flex',
            }
          })

    const squadEl = (label: string, units: (Unit | null)[]) =>
      h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, gap: 8 } },
        h('div', { style: { color: DIM, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, display: 'flex' } }, label),
        h('div', { style: { display: 'flex', flexDirection: 'row', gap: 10 } },
          cardEl(units[0]), cardEl(units[1]), cardEl(units[2])
        )
      )

    const imageResponse = new ImageResponse(
      h('div', {
        style: {
          background: DARK, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          padding: '32px 48px', fontFamily: 'sans-serif', boxSizing: 'border-box',
        }
      },
        // Header
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
          h('span', { style: { color: GOLD, fontSize: 12, letterSpacing: 3, textTransform: 'uppercase' as const, opacity: 0.7, display: 'flex' } }, 'ShatterApp'),
          h('span', { style: { color: GOLD, fontSize: 11, opacity: 0.3, display: 'flex' } }, 'Star Wars: Shatterpoint'),
        ),
        // Rule
        h('div', { style: { height: 1, background: `${GOLD}35`, marginBottom: 16, display: 'flex' } }),
        // List name
        h('div', { style: { color: GOLD, fontSize: 38, fontWeight: 700, marginBottom: 18, display: 'flex', lineHeight: 1.1 } }, listName),
        // Squads
        h('div', { style: { display: 'flex', flexDirection: 'row', gap: 40, flex: 1 } },
          squadEl('Squad 1', sq0),
          squadEl('Squad 2', sq1),
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
