/** @jsxImportSource react */
import { ImageResponse } from '@vercel/og'
import type { IncomingMessage, ServerResponse } from 'http'

import chars from '../public/data/characters.json'

type CharEntry = { name: string }
const charMap = new Map<number, CharEntry>(
  (chars as { id: number; name: string }[]).map(c => [c.id, { name: c.name }])
)

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
const DIM = '#6b7280'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
  const url = new URL(req.url!, `https://${req.headers.host}`)
  const sf = url.searchParams.get('sf')
  const build = sf ? decodeBuild(sf) : null
  const listName = build?.name ?? 'Strike Force'

  const getNames = (ids?: [number, number, number]): string[] =>
    (ids ?? []).map(id => charMap.get(id)?.name ?? '').filter(Boolean)

  const sq0 = getNames(build?.s?.[0])
  const sq1 = getNames(build?.s?.[1])

  const imageResponse = new ImageResponse(
    <div
      style={{
        background: DARK,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '56px 64px',
        fontFamily: 'sans-serif',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ color: GOLD, fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.7, display: 'flex' }}>
          ShatterApp
        </span>
        <span style={{ color: GOLD, fontSize: '11px', opacity: 0.3, display: 'flex' }}>
          Star Wars: Shatterpoint
        </span>
      </div>

      {/* Gold rule */}
      <div style={{ height: '1px', background: `${GOLD}35`, marginBottom: '36px', display: 'flex' }} />

      {/* List name */}
      <div style={{ color: GOLD, fontSize: '52px', fontWeight: 'bold', marginBottom: '48px', display: 'flex', lineHeight: '1.1' }}>
        {listName}
      </div>

      {/* Squads */}
      <div style={{ display: 'flex', gap: '64px' }}>
        {[{ label: 'Squad 1', names: sq0 }, { label: 'Squad 2', names: sq1 }].map((squad, si) => (
          <div key={si} style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            <div style={{ color: DIM, fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', marginBottom: '4px' }}>
              {squad.label}
            </div>
            {squad.names.map((name, ni) => (
              <div key={ni} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: `${GOLD}80`, flexShrink: 0, display: 'flex' }} />
                <span style={{ color: '#d4c08a', fontSize: '22px', display: 'flex' }}>{name}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>,
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
