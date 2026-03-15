import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outFile = path.resolve(__dirname, '../public/icons/og-image.png')

// 1200 × 630 — standard OG image dimensions
const W = 1200
const H = 630

const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0f1117"/>
      <stop offset="100%" stop-color="#1a1f2e"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#f5d76e"/>
    </linearGradient>
    <!-- subtle star-field dots -->
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#d4af37" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#0f1117" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Glow behind logo area -->
  <ellipse cx="${W / 2}" cy="${H / 2}" rx="420" ry="260" fill="url(#glow)"/>

  <!-- Top border line -->
  <rect x="0" y="0" width="${W}" height="4" fill="url(#gold)"/>
  <!-- Bottom border line -->
  <rect x="0" y="${H - 4}" width="${W}" height="4" fill="url(#gold)"/>

  <!-- Decorative corner brackets -->
  <!-- top-left -->
  <polyline points="60,40 40,40 40,60" fill="none" stroke="#d4af37" stroke-width="3" stroke-opacity="0.6"/>
  <!-- top-right -->
  <polyline points="${W - 60},40 ${W - 40},40 ${W - 40},60" fill="none" stroke="#d4af37" stroke-width="3" stroke-opacity="0.6"/>
  <!-- bottom-left -->
  <polyline points="60,${H - 40} 40,${H - 40} 40,${H - 60}" fill="none" stroke="#d4af37" stroke-width="3" stroke-opacity="0.6"/>
  <!-- bottom-right -->
  <polyline points="${W - 60},${H - 40} ${W - 40},${H - 40} ${W - 40},${H - 60}" fill="none" stroke="#d4af37" stroke-width="3" stroke-opacity="0.6"/>

  <!-- ⚔ icon -->
  <text
    x="${W / 2}" y="230"
    font-family="Arial, sans-serif"
    font-size="80"
    text-anchor="middle"
    dominant-baseline="middle"
    fill="#d4af37"
    opacity="0.9"
  >⚔</text>

  <!-- App name -->
  <text
    x="${W / 2}" y="330"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="96"
    letter-spacing="4"
    text-anchor="middle"
    dominant-baseline="middle"
    fill="url(#gold)"
  >ShatterApp</text>

  <!-- Divider -->
  <line x1="${W / 2 - 180}" y1="388" x2="${W / 2 + 180}" y2="388" stroke="#d4af37" stroke-width="1.5" stroke-opacity="0.5"/>

  <!-- Tagline -->
  <text
    x="${W / 2}" y="430"
    font-family="Arial, sans-serif"
    font-size="28"
    letter-spacing="2"
    text-anchor="middle"
    dominant-baseline="middle"
    fill="#ffffff"
    opacity="0.65"
  >Star Wars: Shatterpoint Companion</text>

  <!-- Sub-tagline -->
  <text
    x="${W / 2}" y="490"
    font-family="Arial, sans-serif"
    font-size="20"
    letter-spacing="1"
    text-anchor="middle"
    dominant-baseline="middle"
    fill="#ffffff"
    opacity="0.35"
  >Browse · Build · Play · Collect</text>
</svg>
`.trim()

await sharp(Buffer.from(svg))
  .png()
  .toFile(outFile)

console.log(`✓ og-image.png generated → ${outFile}`)
