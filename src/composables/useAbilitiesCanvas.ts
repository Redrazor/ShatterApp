import { ref, watch, watchEffect, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { FrontCardData, StatsData, AbilitiesData, AbilityBlock, HomebrewFaction } from '../types/index.ts'
import { imageUrl } from '../utils/imageUrl.ts'

// Landscape canvas — 3:2
export const BACK_CANVAS_W = 900
export const BACK_CANVAS_H = 600

function getTemplatePath(faction: HomebrewFaction): string {
  return imageUrl(`/images/custom_cards/custom_abilities_back_${faction}.png`)
}
function getPillsPath(faction: HomebrewFaction): string {
  return imageUrl(`/images/custom_cards/custom_abilities_back_pills_${faction}.png`)
}

// Ability TYPE icons — all factions have dedicated icons in icons/ability_icons/
const ABILITY_TYPE_NAMES = ['active', 'reactive', 'innate', 'tactic', 'identity']

function typeIconPath(name: string, faction: HomebrewFaction): string {
  return imageUrl(`/images/icons/ability_icons/${faction}_${name}.png`)
}

// Inline iconography (used in ability text like [damage], [advance], etc.)
const INLINE_ICON_NAMES = [
  'active', 'advance', 'attack_expertise', 'block', 'character', 'climb',
  'critical', 'damage', 'dash', 'defense_expertise', 'disarmed', 'exposed',
  'failure', 'force', 'heal', 'hunker', 'identity', 'innate', 'jump',
  'melee', 'pinned', 'range', 'ranged', 'reactive', 'reposition', 'shove',
  'strained', 'strike', 'tactic',
]

function inlineIconPath(name: string): string {
  return imageUrl(`/images/abilities_iconography/${name}_crop.png`)
}

// Image cache shared across composables (same Map is fine)
const imgCache = new Map<string, HTMLImageElement>()

function loadImage(src: string): Promise<HTMLImageElement> {
  if (imgCache.has(src)) return Promise.resolve(imgCache.get(src)!)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { imgCache.set(src, img); resolve(img) }
    img.onerror = reject
    img.src = src
  })
}

// Bypass browser HTTP cache — used for inline icons so file changes are picked up immediately
async function loadImageFresh(src: string): Promise<HTMLImageElement> {
  const resp = await fetch(src, { cache: 'reload' })
  const blob = await resp.blob()
  const url = URL.createObjectURL(blob)
  return new Promise((resolve, reject) => {
    const img = new Image()
    // blob: URLs are same-origin; crossOrigin not needed but harmless
    img.onload = () => { imgCache.set(src, img); URL.revokeObjectURL(url); resolve(img) }
    img.onerror = reject
    img.src = url
  })
}

async function ensureFontLoaded(): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load('bold 32px Oswald'),
      document.fonts.load('400 32px Oswald'),
    ])
  } catch { /* fallback */ }
}

// Ability area bounds
const ABILITY_LEFT = 15          // left margin (matches reference card proportions)
const ABILITY_RIGHT = 524
const ABILITY_TOP = 116          // below name bar with breathing room
const ABILITY_BOTTOM = 490

// Ability rendering constants
const TYPE_ICON_SZ = 38          // large ability type icon
const ICON_TEXT_GAP = 12         // gap between type icon and title/body text
const FORCE_ICON_SZ = 27         // force pip icons (50% bigger than inline)
const INLINE_ICON_SZ = 24        // inline text icons
const TITLE_SIZE = 18            // bold title
const BODY_SIZE = 14             // body text
const BODY_LINE_H = 19           // body line height
const BLOCK_GAP = 18             // gap between blocks

// Body text / title x start — indented past the type icon
const BODY_LEFT = ABILITY_LEFT + TYPE_ICON_SZ + ICON_TEXT_GAP

// drawRichText: renders text with [symbolname] markers inline, returns top-y of last rendered line
function drawRichText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x0: number,
  y0: number,
  maxW: number,
  lineH: number,
  iconSz: number,
): number {
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#333333'

  // Tokenize: split into alternating text/icon segments
  type Segment = { kind: 'text'; value: string } | { kind: 'icon'; name: string }
  const segments: Segment[] = []
  const iconRegex = /\[([^\]]+)\]/g
  let lastIdx = 0
  let match: RegExpExecArray | null
  while ((match = iconRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      segments.push({ kind: 'text', value: text.slice(lastIdx, match.index) })
    }
    segments.push({ kind: 'icon', name: match[1] })
    lastIdx = match.index + match[0].length
  }
  if (lastIdx < text.length) {
    segments.push({ kind: 'text', value: text.slice(lastIdx) })
  }

  let cx = x0
  let cy = y0

  for (const seg of segments) {
    if (seg.kind === 'text') {
      // Normalize line endings, then split on hard newlines first
      const hardLines = seg.value.replace(/\r\n/g, '\n').split('\n')
      for (let li = 0; li < hardLines.length; li++) {
        if (li > 0) {
          // Hard line break
          cy += lineH
          cx = x0
        }
        // Split by whitespace, preserving whitespace tokens
        const parts = hardLines[li].split(/(\s+)/)
        for (const part of parts) {
          if (/^\s+$/.test(part)) {
            // Whitespace: only advance if not at line start
            if (cx > x0) cx += ctx.measureText(' ').width
          } else {
            // Word
            const wordW = ctx.measureText(part).width
            if (cx + wordW > x0 + maxW && cx > x0) {
              cy += lineH
              cx = x0
            }
            ctx.fillText(part, cx, cy)
            cx += wordW
          }
        }
      }
    } else {
      // Icon segment
      let name = seg.name
      if (name === 'fail') name = 'failure'
      const img = imgCache.get(inlineIconPath(name))
      if (img) {
        if (cx + iconSz > x0 + maxW && cx > x0) {
          cy += lineH
          cx = x0
        }
        ctx.drawImage(img, cx, cy + BODY_SIZE / 2 - iconSz / 2, iconSz, iconSz)
        cx += iconSz + 2
      }
    }
  }

  return cy
}

function drawAbilityBlocks(
  ctx: CanvasRenderingContext2D,
  blocks: AbilityBlock[],
  fontReady: boolean,
  faction: HomebrewFaction,
) {
  const font = fontReady ? 'Oswald' : 'Impact, Arial Black, sans-serif'
  let y = ABILITY_TOP
  const bodyMaxW = ABILITY_RIGHT - BODY_LEFT

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (y > ABILITY_BOTTOM) break

    // 1. Draw type icon — faction-specific if available
    const typeImg = imgCache.get(typeIconPath(block.iconType, faction))
    if (typeImg) {
      ctx.drawImage(typeImg, ABILITY_LEFT, y, TYPE_ICON_SZ, TYPE_ICON_SZ)
    }

    // 2. Draw title first (bold, vertically centered with type icon)
    const titleCenterY = y + TYPE_ICON_SZ / 2
    let forceX = BODY_LEFT
    if (block.title) {
      ctx.save()
      ctx.font = `bold ${TITLE_SIZE}px "${font}"`
      ctx.fillStyle = '#111111'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(block.title.toUpperCase(), BODY_LEFT, titleCenterY)
      forceX = BODY_LEFT + ctx.measureText(block.title.toUpperCase()).width + 6
      ctx.restore()
    }

    // 3. Draw force icons after the title
    if (block.forceCost > 0) {
      const forceImg = imgCache.get(inlineIconPath('force'))
      const count = Math.min(block.forceCost, 6)
      const forceY = Math.round(titleCenterY - FORCE_ICON_SZ / 2) - 4
      for (let f = 0; f < count; f++) {
        if (forceImg) {
          ctx.drawImage(forceImg, forceX + f * (FORCE_ICON_SZ + 2), forceY, FORCE_ICON_SZ, FORCE_ICON_SZ)
        }
      }
    }

    // 4. Advance y below the icon row, with small gap before body
    y += TYPE_ICON_SZ - 4

    // 5. Draw body text — indented to BODY_LEFT, same as title
    if (block.text) {
      ctx.save()
      ctx.font = `400 ${BODY_SIZE}px "${font}"`
      const lastLineY = drawRichText(ctx, block.text, BODY_LEFT, y, bodyMaxW, BODY_LINE_H, INLINE_ICON_SZ)
      y = lastLineY + BODY_LINE_H
      ctx.restore()
    }

    y += BLOCK_GAP

    // 6. Draw separator line between blocks (not after last)
    if (i < blocks.length - 1 && y <= ABILITY_BOTTOM) {
      ctx.save()
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'
      ctx.lineWidth = 0.5
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      const sepY = y - BLOCK_GAP / 2
      ctx.moveTo(ABILITY_LEFT, sepY)
      ctx.lineTo(ABILITY_RIGHT, sepY)
      ctx.stroke()
      ctx.restore()
    }
  }
}

export function useAbilitiesCanvas(
  canvasRef: Ref<HTMLCanvasElement | null>,
  frontCard: Ref<FrontCardData | null>,
  stats: Ref<StatsData | null>,
  abilities: Ref<AbilitiesData | null>,
  faction: Ref<HomebrewFaction>,
) {
  const fontReady = ref(false)
  let rafId: number | null = null

  let resolveReady!: () => void
  const readyPromise = new Promise<void>(res => { resolveReady = res })

  async function preload() {
    // Always evict inline icons from cache to pick up any file changes
    INLINE_ICON_NAMES.forEach(name => imgCache.delete(inlineIconPath(name)))
    const f = faction.value
    const typeIconPaths = ABILITY_TYPE_NAMES.map(n => typeIconPath(n, f))
    const inlinePaths = INLINE_ICON_NAMES.map(inlineIconPath)
    await Promise.allSettled([
      loadImage(getTemplatePath(f)),
      loadImage(getPillsPath(f)),
      ...typeIconPaths.map(loadImage),
      ...inlinePaths.map(loadImageFresh),
    ])
    await ensureFontLoaded()
    fontReady.value = true
  }

  function scheduleRender() {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => { rafId = null; render() })
  }

  function render() {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const fc = frontCard.value
    const st = stats.value
    const ab = abilities.value

    ctx.clearRect(0, 0, BACK_CANVAS_W, BACK_CANVAS_H)

    // 2. Template
    const f = faction.value
    const tmpl = imgCache.get(getTemplatePath(f))
    if (tmpl) {
      ctx.drawImage(tmpl, 0, 0, BACK_CANVAS_W, BACK_CANVAS_H)
    }

    // 3. User artwork — drawn after template, clipped to the right art zone
    if (fc?.imageData) {
      const userImg = imgCache.get(fc.imageData) ?? (() => {
        const img = new Image()
        img.onload = () => { imgCache.set(fc.imageData!, img); scheduleRender() }
        img.src = fc.imageData
        return null
      })()
      if (userImg && st) {
        drawUserImage(ctx, userImg, st)
      }
    }

    // 4. Pills overlay — transparent PNG with faction-colored pill graphics, on top of artwork
    const pills = imgCache.get(getPillsPath(f))
    if (pills) {
      ctx.drawImage(pills, 0, 0, BACK_CANVAS_W, BACK_CANVAS_H)
    }

    // 5. Name + title in black bar
    if (fc) {
      drawNameBar(ctx, fc)
    }

    // 6. Stamina + durability numbers in orange pills
    if (st) {
      drawStats(ctx, st)
    }

    // 7. Tags bottom-left
    if (st && st.tags.length > 0) {
      drawTags(ctx, st.tags)
    }

    // 8. Ability blocks
    if (ab && ab.blocks.length > 0) {
      drawAbilityBlocks(ctx, ab.blocks, fontReady.value, faction.value)
    }

    if (fontReady.value) resolveReady()
  }

  // Image occupies the right ~38% of the grey body area
  function drawUserImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, st: StatsData) {
    const artLeft = BACK_CANVAS_W * 0.62
    const artTop = BACK_CANVAS_H * 0.18
    const artRight = BACK_CANVAS_W * 0.99
    const artBottom = BACK_CANVAS_H * 0.99
    const artW = artRight - artLeft
    const artH = artBottom - artTop

    ctx.save()
    ctx.beginPath()
    ctx.rect(artLeft, artTop, artW, artH)
    ctx.clip()

    const fitScale = Math.max(artW / img.naturalWidth, artH / img.naturalHeight)
    const drawW = img.naturalWidth * fitScale * st.imageScale
    const drawH = img.naturalHeight * fitScale * st.imageScale

    const cx = artLeft + artW / 2 + st.imageOffsetX * artW
    const cy = artTop + artH / 2 + st.imageOffsetY * artH

    ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH)
    ctx.restore()
  }

  function drawNameBar(ctx: CanvasRenderingContext2D, fc: FrontCardData) {
    if (!fc.name) return
    const font = fontReady.value ? 'Oswald' : 'Impact, Arial Black, sans-serif'
    const barText = fc.title ? `${fc.name}, ${fc.title}` : fc.name

    ctx.save()
    ctx.font = `bold 28px "${font}"`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = 3
    ctx.fillText(barText.toUpperCase(), 28, BACK_CANVAS_H * 0.075 + 10)
    ctx.restore()
  }

  function drawStats(ctx: CanvasRenderingContext2D, st: StatsData) {
    const font = fontReady.value ? 'Oswald' : 'Impact, Arial Black, sans-serif'

    const staminaX = BACK_CANVAS_W * 0.895 + 30
    const staminaY = BACK_CANVAS_H * 0.765 + 10
    const durabilityX = BACK_CANVAS_W * 0.895 + 30
    const durabilityY = BACK_CANVAS_H * 0.883 + 20

    ctx.save()
    ctx.font = `bold 36px "${font}"`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0,0,0,0.7)'
    ctx.shadowBlur = 3

    ctx.fillText(String(st.stamina), staminaX, staminaY)
    ctx.fillText(String(st.durability), durabilityX, durabilityY)
    ctx.restore()
  }

  function drawTags(ctx: CanvasRenderingContext2D, tags: string[]) {
    const font = fontReady.value ? 'Oswald' : 'Impact, Arial Black, sans-serif'
    const DOT = '\u25CF' // ●

    const text = tags.join(`  ${DOT}  `)

    ctx.save()
    ctx.font = `500 15px "${font}"`
    ctx.fillStyle = '#1a1a1a'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(text, 18, BACK_CANVAS_H * 0.965)
    ctx.restore()
  }

  onMounted(async () => {
    await preload()
    scheduleRender()
  })

  onUnmounted(() => {
    if (rafId !== null) cancelAnimationFrame(rafId)
  })

  // Reload images when faction changes, then re-render
  watch(faction, async () => {
    await preload()
    scheduleRender()
  })

  watchEffect(() => {
    const fc = frontCard.value
    const st = stats.value
    if (fc) void `${fc.name}${fc.title}${fc.imageData}`
    if (st) void `${st.stamina}${st.durability}${st.tags.join()}${st.imageScale}${st.imageOffsetX}${st.imageOffsetY}`
    void JSON.stringify(abilities.value)
    void faction.value
    scheduleRender()
  })

  function toDataURL(type = 'image/png'): string {
    return canvasRef.value?.toDataURL(type) ?? ''
  }

  return { fontReady, readyPromise, toDataURL }
}
