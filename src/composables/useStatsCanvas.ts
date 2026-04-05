import { ref, watch, watchEffect, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { FrontCardData, StatsData, HomebrewFaction } from '../types/index.ts'

// Landscape canvas — 3:2
export const BACK_CANVAS_W = 900
export const BACK_CANVAS_H = 600

function getTemplatePath(faction: HomebrewFaction): string {
  return `/images/custom_cards/custom_abilities_back_${faction}.png`
}
function getPillsPath(faction: HomebrewFaction): string {
  return `/images/custom_cards/custom_abilities_back_pills_${faction}.png`
}

// Image cache shared with front-card composable (same Map is fine)
const imgCache = new Map<string, HTMLImageElement>()

function loadImage(src: string): Promise<HTMLImageElement> {
  if (imgCache.has(src)) return Promise.resolve(imgCache.get(src)!)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => { imgCache.set(src, img); resolve(img) }
    img.onerror = reject
    img.src = src
  })
}

async function ensureFontLoaded(): Promise<void> {
  try {
    await document.fonts.load('bold 32px Oswald')
  } catch { /* fallback */ }
}

export function useStatsCanvas(
  canvasRef: Ref<HTMLCanvasElement | null>,
  frontCard: Ref<FrontCardData | null>,
  stats: Ref<StatsData | null>,
  faction: Ref<HomebrewFaction>,
) {
  const fontReady = ref(false)
  let rafId: number | null = null

  async function preload() {
    const f = faction.value
    await Promise.allSettled([loadImage(getTemplatePath(f)), loadImage(getPillsPath(f))])
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

    ctx.clearRect(0, 0, BACK_CANVAS_W, BACK_CANVAS_H)

    // 1. White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, BACK_CANVAS_W, BACK_CANVAS_H)

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

    // 4. Pills overlay — faction-colored pill graphics, on top of artwork
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
  }

  // Image occupies the right ~38% of the grey body area
  // Grey body: y from ~110 to ~570, full width. Right portion: x from ~560 to 900.
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
    // Black bar runs from left edge to ~78% of width, centred vertically at ~7.5% down
    ctx.fillText(barText.toUpperCase(), 28, BACK_CANVAS_H * 0.075 + 10)
    ctx.restore()
  }

  function drawStats(ctx: CanvasRenderingContext2D, st: StatsData) {
    const font = fontReady.value ? 'Oswald' : 'Impact, Arial Black, sans-serif'

    // Orange pill positions — measured from template image, scaled to BACK_CANVAS_W×H
    // Top pill (Stamina): right side, ~78% from top centre
    const staminaX = BACK_CANVAS_W * 0.895 + 30
    const staminaY = BACK_CANVAS_H * 0.765 + 10

    // Bottom pill (Durability): ~88% from top centre
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

    // Join tags with black dot separator
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

  watch(faction, async () => {
    await preload()
    scheduleRender()
  })

  watchEffect(() => {
    const fc = frontCard.value
    const st = stats.value
    if (fc) void `${fc.name}${fc.title}${fc.imageData}`
    if (st) void `${st.stamina}${st.durability}${st.tags.join()}${st.imageScale}${st.imageOffsetX}${st.imageOffsetY}`
    void faction.value
    scheduleRender()
  })

  function toDataURL(type = 'image/png'): string {
    return canvasRef.value?.toDataURL(type) ?? ''
  }

  return { scheduleRender, fontReady, toDataURL }
}
