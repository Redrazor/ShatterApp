/** @jsxImportSource react */
import { ImageResponse } from '@vercel/og'
import type { IncomingMessage, ServerResponse } from 'http'

// Minimal character lookup bundled at build time
import chars from '../public/data/characters.json'

type CharEntry = { name: string; thumbnail: string }
const charMap = new Map<number, CharEntry>(
  (chars as { id: number; name: string; thumbnail: string }[]).map(c => [
    c.id,
    { name: c.name, thumbnail: c.thumbnail },
  ])
)

const IMAGE_BASE = 'https://shatterapp-images.web.app'

function thumbUrl(path: string): string {
  if (!path) return ''
  const stripped = path.replace(/^\/images\//, '/')
  const webp = stripped.replace(/\.(png|jpe?g|gif)$/i, '.webp')
  return `${IMAGE_BASE}${webp}`
}

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

const GOLD = '#c9a227'
const DARK = '#111318'
const CARD_BG = '#1a1f2e'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url!, `https://${req.headers.host}`)
  const sf = url.searchParams.get('sf')
  const build = sf ? decodeBuild(sf) : null
  const listName = build?.name ?? 'Strike Force'

  const getSquad = (ids?: [number, number, number]): (CharEntry | null)[] =>
    (ids ?? [0, 0, 0]).map(id => (id ? (charMap.get(id) ?? null) : null))

  const sq0 = getSquad(build?.s?.[0])
  const sq1 = getSquad(build?.s?.[1])

  const squads = [
    { label: 'Squad 1', units: sq0 },
    { label: 'Squad 2', units: sq1 },
  ]

  const imageResponse = new ImageResponse(
    <div
      style={{
        background: DARK,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 56px',
        fontFamily: 'sans-serif',
        boxSizing: 'border-box',
      }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ color: GOLD, fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.8, display: 'flex' }}>
          ShatterApp
        </span>
        <span style={{ color: GOLD, fontSize: '11px', opacity: 0.35, display: 'flex' }}>
          Star Wars: Shatterpoint
        </span>
      </div>

      {/* Gold rule */}
      <div style={{ height: '1px', background: `${GOLD}40`, marginBottom: '28px', display: 'flex' }} />

      {/* List name */}
      <div style={{ color: GOLD, fontSize: '40px', fontWeight: 'bold', marginBottom: '36px', display: 'flex' }}>
        {listName}
      </div>

      {/* Squad rows */}
      {squads.map((squad, si) => (
        <div
          key={si}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: si === 0 ? '24px' : '0',
          }}
        >
          {/* Squad label */}
          <div style={{
            color: `${GOLD}80`,
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            width: '52px',
            flexShrink: 0,
            display: 'flex',
          }}>
            {squad.label}
          </div>

          {/* Unit slots */}
          {squad.units.map((unit, ui) => (
            <div key={ui} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '160px' }}>
              {/* Thumbnail circle */}
              <div style={{
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: `2px solid ${GOLD}50`,
                background: CARD_BG,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {unit?.thumbnail ? (
                  <img
                    src={thumbUrl(unit.thumbnail)}
                    width={88}
                    height={88}
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ color: `${GOLD}30`, fontSize: '20px', display: 'flex' }}>?</div>
                )}
              </div>
              {/* Name */}
              <span style={{
                color: '#d4c08a',
                fontSize: '12px',
                textAlign: 'center',
                lineHeight: '1.3',
                display: 'flex',
                maxWidth: '150px',
              }}>
                {unit?.name ?? '—'}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>,
    { width: 1200, height: 630 }
  )

  const buffer = Buffer.from(await imageResponse.arrayBuffer())
  res.setHeader('Content-Type', 'image/png')
  res.setHeader('Cache-Control', 'public, max-age=86400, immutable')
  res.end(buffer)
}
