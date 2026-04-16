import { ref, watchEffect, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { FrontCardData, HomebrewFaction } from '../types/index.ts'
import { imageUrl } from '../utils/imageUrl.ts'

// Internal canvas resolution (2:3 ratio)
export const CANVAS_W = 600
export const CANVAS_H = 900

// Ordered era names for consistent key generation
const ERA_ORDER = ['Clone Wars', 'Empire', 'Civil War', 'New Republic']
const ERA_SLUG: Record<string, string> = {
  'Clone Wars': 'clone_wars',
  'Empire': 'empire',
  'Civil War': 'civil_war',
  'New Republic': 'new_republic',
}

function getEraIconPath(eraString: string): string {
  if (!eraString.trim()) return ''
  const selected = eraString.split(';').map(e => e.trim()).filter(Boolean)
  const sorted = ERA_ORDER.filter(e => selected.includes(e))
  if (sorted.length === 0) return ''
  // Single-era Civil War uses a differently named file (civil_war_rebel.png)
  if (sorted.length === 1 && sorted[0] === 'Civil War') {
    return imageUrl('/images/custom_era_icons/civil_war_rebel.png')
  }
  const key = sorted.map(e => ERA_SLUG[e]).join('_')
  return imageUrl(`/images/custom_era_icons/${key}.png`)
}

function getTemplatePath(unitType: string, faction: HomebrewFaction): string {
  const typeMap: Record<string, string> = {
    Primary: 'custom_primary_front',
    Secondary: 'custom_secundary_front',
    Support: 'custom_support_front',
  }
  const base = typeMap[unitType] ?? 'custom_primary_front'
  return imageUrl(`/images/custom_cards/${base}_${faction}.png`)
}

// Preload all faction × unit-type combos for instant switching
const ALL_FACTIONS: HomebrewFaction[] = ['rebel', 'republic', 'separatist', 'empire', 'other']
const ALL_UNIT_TYPES = ['Primary', 'Secondary', 'Support']

// Image cache
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

async function ensureFontLoaded(): Promise<void> {
  try {
    await document.fonts.load('bold 32px Oswald')
  } catch {
    // fallback — canvas will use system font
  }
}

export function useCardCanvas(
  canvasRef: Ref<HTMLCanvasElement | null>,
  frontCard: Ref<FrontCardData | null>,
  faction: Ref<HomebrewFaction>,
) {
  const fontReady = ref(false)
  let rafId: number | null = null

  let resolveReady!: () => void
  const readyPromise = new Promise<void>(res => { resolveReady = res })

  // Preload all faction × unit-type combos and era icons eagerly
  async function preload() {
    const paths = [
      ...ALL_FACTIONS.flatMap(f => ALL_UNIT_TYPES.map(t => getTemplatePath(t, f))),
      // Single-era icons (Civil War uses civil_war_rebel.png)
      imageUrl('/images/custom_era_icons/clone_wars.png'),
      imageUrl('/images/custom_era_icons/empire.png'),
      imageUrl('/images/custom_era_icons/civil_war_rebel.png'),
      imageUrl('/images/custom_era_icons/new_republic.png'),
      // Multi-era combo icons
      imageUrl('/images/custom_era_icons/clone_wars_empire.png'),
      imageUrl('/images/custom_era_icons/empire_civil_war.png'),
      imageUrl('/images/custom_era_icons/civil_war_new_republic.png'),
      imageUrl('/images/custom_era_icons/clone_wars_empire_civil_war.png'),
      imageUrl('/images/custom_era_icons/clone_wars_empire_civil_war_new_republic.png'),
    ]
    await Promise.allSettled(paths.map(loadImage))
    await ensureFontLoaded()
    fontReady.value = true
  }

  function scheduleRender() {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => { rafId = null; render() })
  }

  let dpr = 1

  function render() {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const fc = frontCard.value
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    // 1. White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // 2. Template overlay (drawn first so artwork sits on top inside the art window)
    if (fc?.unitType) {
      const tmpl = imgCache.get(getTemplatePath(fc.unitType, faction.value))
      if (tmpl) {
        ctx.drawImage(tmpl, 0, 0, CANVAS_W, CANVAS_H)
      }
    }

    // 3. User artwork (drawn over template, clipped to art window)
    if (fc?.imageData) {
      const userImg = imgCache.get(fc.imageData) ?? (() => {
        const img = new Image()
        img.onload = () => { imgCache.set(fc.imageData!, img); scheduleRender() }
        img.src = fc.imageData
        return null
      })()
      if (userImg) {
        drawUserImage(ctx, userImg, fc)
      }
    }

    // 4. Text overlays
    if (fc) {
      drawTextOverlays(ctx, fc)
    }

    // 5. Era icon
    if (fc?.era) {
      const iconPath = getEraIconPath(fc.era)
      if (iconPath) {
        const icon = imgCache.get(iconPath) ?? (() => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => { imgCache.set(iconPath, img); scheduleRender() }
          img.onerror = () => {} // silently ignore missing combo
          img.src = iconPath
          return null
        })()
        if (icon) {
          drawEraIcon(ctx, icon, fc.unitType === 'Support')
        }
      }
    }

    if (fontReady.value) resolveReady()
  }

  function drawUserImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, fc: FrontCardData) {
    // Artwork region: between header (~7% top) and footer (~15% bottom)
    const artTop = CANVAS_H * 0.07 + 35
    const artBottom = CANVAS_H * 0.85
    const artH = artBottom - artTop

    ctx.save()
    ctx.beginPath()
    ctx.rect(0, artTop, CANVAS_W, artH)
    ctx.clip()

    // Fit image to fill the clip region, then apply scale and pan
    const fitScale = Math.max(CANVAS_W / img.naturalWidth, artH / img.naturalHeight)
    const drawW = img.naturalWidth * fitScale * fc.imageScale
    const drawH = img.naturalHeight * fitScale * fc.imageScale

    // Center + offset
    const cx = CANVAS_W / 2 + fc.imageOffsetX * CANVAS_W
    const cy = artTop + artH / 2 + fc.imageOffsetY * CANVAS_H

    ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH)
    ctx.restore()
  }

  function drawTextOverlays(ctx: CanvasRenderingContext2D, fc: FrontCardData) {
    const font = fontReady.value ? 'Oswald' : 'Impact, Arial Black, sans-serif'

    // SP/PC number — top-left
    ctx.save()
    ctx.font = `bold 52px "${font}"`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.shadowColor = 'rgba(0,0,0,0.8)'
    ctx.shadowBlur = 4
    ctx.fillText(String(fc.cost), 24, 78)
    ctx.restore()

    // FP number — top-right
    ctx.save()
    ctx.font = `bold 52px "${font}"`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.shadowColor = 'rgba(0,0,0,0.8)'
    ctx.shadowBlur = 4
    ctx.fillText(String(fc.fp), CANVAS_W - 44, 78)
    ctx.restore()

    // Unit name — large white on the black bar (~89% down)
    if (fc.name) {
      const barText = fc.title ? `${fc.name}, ${fc.title}` : fc.name
      ctx.save()
      ctx.font = `bold 34px "${font}"`
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(barText.toUpperCase(), CANVAS_W / 2, CANVAS_H * 0.882 + 4)
      ctx.restore()

      // Subtitle — unit name only, smaller black text in white area (not on Support cards)
      if (fc.unitType !== 'Support') {
        ctx.save()
        ctx.font = `bold 19px Inter, system-ui, sans-serif`
        ctx.fillStyle = '#111111'
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        ctx.fillText(fc.name, CANVAS_W / 2 - 25, CANVAS_H * 0.936)
        ctx.restore()
      }
    }
  }

  function drawEraIcon(ctx: CanvasRenderingContext2D, icon: HTMLImageElement, isSupport = false) {
    // Era icon circle — top-left area (inside the template circle)
    const cx = isSupport ? 162 : 168
    const cy = 53
    const r = 40
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(icon, cx - r, cy - r, r * 2, r * 2)
    ctx.restore()
  }

  function toDataURL(type = 'image/png'): string {
    return canvasRef.value?.toDataURL(type) ?? ''
  }

  onMounted(async () => {
    const canvas = canvasRef.value
    if (canvas) {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width  = CANVAS_W * dpr
      canvas.height = CANVAS_H * dpr
    }
    await preload()
    scheduleRender()
  })

  onUnmounted(() => {
    if (rafId !== null) cancelAnimationFrame(rafId)
  })

  // Re-render whenever frontCard, faction, or any nested property changes
  watchEffect(() => {
    const fc = frontCard.value
    if (fc) {
      void `${fc.unitType}${fc.name}${fc.title}${fc.cost}${fc.fp}${fc.era}${fc.imageData}${fc.imageScale}${fc.imageOffsetX}${fc.imageOffsetY}`
    }
    void faction.value
    scheduleRender()
  })

  return { render: scheduleRender, toDataURL, fontReady, readyPromise }
}
