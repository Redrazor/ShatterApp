import { ref, watch, watchEffect, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { StanceData, ExpertiseColor, ExpertiseTables, CombatTree, HomebrewFaction } from '../types/index.ts'
import { imageUrl } from '../utils/imageUrl.ts'

export interface PortraitOptions {
  imageData: string | null
  offsetX: number   // -0.5 to 0.5
  offsetY: number
  scale: number     // 1.0 = fill circle
}

// Portrait circle measured from template image
export const PORTRAIT_CX = 543
export const PORTRAIT_CY = 48
export const PORTRAIT_R  = 40

// Canvas matches the template image exactly
export const STANCE_CANVAS_W = 836
export const STANCE_CANVAS_H = 481

function getTemplatePath(faction: HomebrewFaction): string {
  return imageUrl(`/images/custom_cards/custom_card_stance_${faction}.png`)
}

// Pixel positions measured from the 836×481 template image
const POS = {
  // Top black bar: y=16–59, center y=37
  titleX: 592,   // left-aligned, matching left edge of the gun icon black box
  titleY: 40,

  // Range number — over the crosshair symbol inside the gun icon black square
  rangeX: 634,
  rangeY: 127,

  // Left grey triangle (Range Attack): measured center
  rangeAttackX: 625,
  rangeAttackY: 183,

  // Left blue square (Range Defense): measured center
  rangeDefenseX: 626,
  rangeDefenseY: 255,

  // Right grey triangle (Melee Attack): measured center
  meleeAttackX: 754,
  meleeAttackY: 183,

  // Right blue square (Melee Defense): measured center
  meleeDefenseX: 756,
  meleeDefenseY: 255,

  // Bottom strip labels — left-aligned, placed after each icon
  // Icons: gun x=31-60, swords x=306-324, diamond x=570-592; strip y center ≈319
  bottomY: 319,
  rangedWeaponX: 85,   // after gun icon (x=60)
  meleeWeaponX: 349,   // after swords icon (x=324)
  defensiveEquipmentX: 619, // after diamond icon (x=592)
}

// ─── Expertise table color shades (index = entry position 0–3) ───────────────
const EXPERTISE_SHADES: Record<ExpertiseColor, string[]> = {
  blue:   ['#7ab0d4', '#4d8cb8', '#2a6a9c', '#0d4a80'],
  red:    ['#d47a7a', '#b85252', '#9c2e2e', '#800a0a'],
  purple: ['#a07ad4', '#7e52b8', '#5e2e9c', '#3e0a80'],
  grey:   ['#a8a8a8', '#888888', '#686868', '#484848'],
}

// Column layout aligned with the weapon-icon boxes in the bottom strip above.
// Each column splits into: badge area (width = icon box width) + content area.
//   Column 1 (ranged):  x=0   w=278  iconW=85  (gun icon ends ~x60, label at x85)
//   Column 2 (melee):   x=278 w=278  iconW=71  (swords icon, label at x349 → 349-278=71)
//   Column 3 (defense): x=556 w=280  iconW=63  (diamond icon, label at x619 → 619-556=63)
const EXP_COLS = [
  { key: 'ranged'  as const, x: 21,  w: 257, badgeW: 52 },
  { key: 'melee'   as const, x: 288, w: 268, badgeW: 52 },
  { key: 'defense' as const, x: 557, w: 279, badgeW: 52 },
] as const

// Shared layout constants
const EXP = {
  tableY:   340,   // top of the expertise rows (below the weapon-name strip)
  tableBot: 430,   // bottom edge — stops before the dark footer strip (~y=462)
  rowH:     28,    // fixed row height regardless of entry count
  colPad:   5,     // horizontal padding inside content area
  iconSize: 20,    // fallback icon size (overridden per-image by aspect ratio)
  // Card background in the expertise area (matches the light grey strip tone)
  contentBg: '#e8e8e8',
  borderColor: 'rgba(0,0,0,0.12)',   // soft dark grey row divider
  shadowColor: 'rgba(0,0,0,0.05)',   // very faded 1px drop shadow below border
}

const imgCache = new Map<string, HTMLImageElement>()
const loadingPromises = new Map<string, Promise<HTMLImageElement>>()

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

// Shared promise-based loader for combat tree icons — deduplicates in-flight requests
function loadCombatIcon(src: string): Promise<HTMLImageElement> {
  if (imgCache.has(src)) return Promise.resolve(imgCache.get(src)!)
  if (loadingPromises.has(src)) return loadingPromises.get(src)!
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { imgCache.set(src, img); loadingPromises.delete(src); resolve(img) }
    img.onerror = () => { loadingPromises.delete(src); reject(new Error(`Failed: ${src}`)) }
    img.src = src
  })
  loadingPromises.set(src, promise)
  return promise
}

// Icons whose plain .png has an orange background — use _white_bg.png for c2+ columns
const CT_USE_WHITE_BG = new Set(['09_DMG_DMG', '22_SHV_DMG_DMG', '43_PIN_SHV', '61_SHV_HEA_HEA_HEA', '70_SHV_DASH'])

function ctDisplayFile(iconFile: string, colIdx: number): string {
  if (colIdx === 0) return iconFile
  const base = iconFile.replace('_orange_bg.png', '').replace('_white_bg.png', '').replace('.png', '')
  return CT_USE_WHITE_BG.has(base) ? `${base}_white_bg.png` : `${base}.png`
}

// ─── Combat tree layout constants ────────────────────────────────────────────
const CT = {
  areaX:  64,    // shifted right
  areaY:  95,
  areaH:  215,
  nodeW:  54,
  nodeH:  46,
  colGap: 24,    // horizontal gap between columns (connector zone)
}

// Fixed vertical center-Y for each row
// Mid shifted 30px up from original (205→175); top/bot symmetric around mid at ~10px gap
const ROW_CY = [100, 170, 240]   // top, mid, bot  — 20px up
function rowCY(rowIdx: number): number { return ROW_CY[rowIdx] }

// Draw two parallel lines from (x1,y1) to (x2,y2) — the "2-bar connector"
function drawTwoBar(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 1) return
  // Perpendicular unit vector scaled to 4px offset
  const px = (-dy / len) * 4
  const py = (dx / len) * 4
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#ffffff'
  ctx.beginPath(); ctx.moveTo(x1 + px, y1 + py); ctx.lineTo(x2 + px, y2 + py); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x1 - px, y1 - py); ctx.lineTo(x2 - px, y2 - py); ctx.stroke()
}

function drawCombatTree(
  ctx: CanvasRenderingContext2D,
  tree: CombatTree,
  _font: string,
  ensureIconFn: (src: string) => void,
) {
  const { areaX, nodeW, nodeH, colGap } = CT
  const grid = tree.grid
  if (!grid) return

  const colStep = nodeW + colGap

  // Find last column with any icon to know how many columns to draw connectors for
  let maxCol = -1
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) if (grid[r]?.[c]) maxCol = Math.max(maxCol, c)
  if (maxCol < 0) return

  // ── Draw connectors first (behind nodes) — use explicit connections ───────
  const connections = tree.connections ?? []
  for (const conn of connections) {
    // Connect center-to-center; node boxes drawn on top will cover the endpoints
    const x1 = areaX + conn.fromCol * colStep + nodeW / 2
    const y1 = rowCY(conn.fromRow)
    const x2 = areaX + conn.toCol * colStep + nodeW / 2
    const y2 = rowCY(conn.toRow)
    drawTwoBar(ctx, x1, y1, x2, y2)
  }

  // ── Draw nodes on top ─────────────────────────────────────────────────────
  for (let c = 0; c <= maxCol; c++) {
    for (let r = 0; r < 3; r++) {
      const iconFile = grid[r]?.[c]
      if (!iconFile) continue

      const nx = areaX + c * colStep
      const cy = rowCY(r)
      const ny = cy - nodeH / 2

      // Node box — orange for c1, white for c2+
      ctx.save()
      ctx.fillStyle   = c === 0 ? 'rgb(200, 90, 20)' : '#ffffff'
      ctx.strokeStyle = '#000000'
      ctx.lineWidth   = 2
      ctx.beginPath()
      ctx.roundRect(nx, ny, nodeW, nodeH, 5)
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      // Icon centered in box — use correct variant per column
      const displayFile = ctDisplayFile(iconFile, c)
      const iconSrc = imageUrl(`/images/combat_tree_icons/crops/${displayFile}`)
      const img = imgCache.get(iconSrc)
      if (img) {
        const pad = 4
        const maxW = nodeW - pad * 2
        const maxH = nodeH - pad * 2
        const aspect = img.naturalWidth / img.naturalHeight
        let iw: number, ih: number
        if (aspect >= maxW / maxH) { iw = maxW; ih = iw / aspect }
        else                       { ih = maxH; iw = ih * aspect }
        ctx.drawImage(img, nx + (nodeW - iw) / 2, ny + (nodeH - ih) / 2, iw, ih)
      } else {
        ensureIconFn(iconSrc)
      }
    }
  }
}

async function ensureFontLoaded(): Promise<void> {
  try {
    await document.fonts.load('bold 32px Oswald')
  } catch { /* fallback */ }
}

export function useStanceCanvas(
  canvasRef: Ref<HTMLCanvasElement | null>,
  stanceData: Ref<StanceData | null>,
  faction: Ref<HomebrewFaction>,
  portraitRef?: Ref<PortraitOptions | null>,
  unitNameRef?: Ref<string>,
  unitTitleRef?: Ref<string>,
) {
  const fontReady = ref(false)
  let rendered = false
  let pendingIcons = 0
  const pendingIconSrcs = new Set<string>()

  let resolveReady!: () => void
  const readyPromise = new Promise<void>(res => { resolveReady = res })

  function checkReady() {
    if (fontReady.value && rendered && pendingIcons === 0) resolveReady()
  }
  let rafId: number | null = null

  // Per-instance icon loader — defers readyPromise resolution until all icons are painted
  function ensureCombatIconLocal(src: string) {
    if (imgCache.has(src)) return
    if (pendingIconSrcs.has(src)) return
    pendingIconSrcs.add(src)
    pendingIcons++
    loadCombatIcon(src)
      .then(() => { pendingIconSrcs.delete(src); pendingIcons--; scheduleRender() })
      .catch(() => { pendingIconSrcs.delete(src); pendingIcons--; checkReady() })
  }

  // ── Portrait image (data URL — cached separately from iconography) ────────────
  let portraitImg: HTMLImageElement | null = null
  let portraitDataUrl: string | null = null

  function loadPortraitImage(dataUrl: string | null) {
    if (!dataUrl) { portraitImg = null; portraitDataUrl = null; return }
    if (dataUrl === portraitDataUrl) return   // same image, no reload
    portraitDataUrl = dataUrl
    portraitImg = null
    const img = new Image()
    img.onload = () => { portraitImg = img; scheduleRender() }
    img.src = dataUrl
  }

  const ICONOGRAPHY_FILES = [
    // _to die-result icons (used in expertise tables)
    'crit_to.png', 'hit_to.png', 'block_to.png',
    // _crop ability icons
    'active_crop.png', 'advance_crop.png', 'attack_expertise_crop.png', 'block_crop.png',
    'character_crop.png', 'climb_crop.png', 'critical_crop.png', 'damage_crop.png',
    'dash_crop.png', 'defense_expertise_crop.png', 'disarmed_crop.png', 'dmg.png',
    'exposed_crop.png', 'fail.png', 'failure_crop.png', 'force_crop.png', 'heal_crop.png',
    'hunker_crop.png', 'identity_crop.png', 'innate_crop.png', 'jump_crop.png',
    'melee_crop.png', 'pinned_crop.png', 'range_crop.png', 'ranged_crop.png',
    'reactive_crop.png', 'reposition_crop.png', 'shove_crop.png', 'strained_crop.png',
    'strike_crop.png', 'tactic_crop.png',
  ]

  async function preload() {
    const iconUrls = ICONOGRAPHY_FILES.map(f => imageUrl(`/images/abilities_iconography/${f}`))
    await Promise.allSettled([loadImage(getTemplatePath(faction.value)), ...iconUrls.map(loadImage)])
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

    ctx.clearRect(0, 0, STANCE_CANVAS_W, STANCE_CANVAS_H)

    // 1. White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, STANCE_CANVAS_W, STANCE_CANVAS_H)

    // 2. Template
    const tmpl = imgCache.get(getTemplatePath(faction.value))
    if (tmpl) {
      ctx.drawImage(tmpl, 0, 0, STANCE_CANVAS_W, STANCE_CANVAS_H)
    }

    // 3. Portrait image clipped to circle (drawn after template so it sits inside the white circle area)
    const portrait = portraitRef?.value
    if (portrait?.imageData && portraitImg) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(PORTRAIT_CX, PORTRAIT_CY, PORTRAIT_R, 0, Math.PI * 2)
      ctx.clip()

      const img = portraitImg
      const aspect = img.naturalWidth / img.naturalHeight
      const diameter = PORTRAIT_R * 2
      // scale=1 fills the circle (shorter side = diameter)
      let baseW: number, baseH: number
      if (aspect >= 1) { baseH = diameter; baseW = baseH * aspect }
      else             { baseW = diameter; baseH = baseW / aspect }
      const finalW = baseW * portrait.scale
      const finalH = baseH * portrait.scale
      const drawX = PORTRAIT_CX - finalW / 2 + portrait.offsetX * finalW
      const drawY = PORTRAIT_CY - finalH / 2 + portrait.offsetY * finalH
      ctx.drawImage(img, drawX, drawY, finalW, finalH)
      ctx.restore()
    }

    // 4. Text overlays
    const data = stanceData.value
    if (data) {
      drawStanceTexts(ctx, data)
    }

    // 5. Combat tree (drawn over the template, left half of card)
    if (data?.combatTree) {
      const font = fontReady.value ? 'Oswald' : 'Impact, Arial Black, sans-serif'
      drawCombatTree(ctx, data.combatTree, font, ensureCombatIconLocal)
    }

    rendered = true
    checkReady()
  }

  function drawStroked(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    fontSize: number,
    font: string,
    align: CanvasTextAlign = 'center',
    baseline: CanvasTextBaseline = 'middle',
  ) {
    ctx.save()
    ctx.font = `bold ${fontSize}px "${font}"`
    ctx.textAlign = align
    ctx.textBaseline = baseline
    ctx.lineJoin = 'round'
    ctx.strokeStyle = 'rgba(0,0,0,0.9)'
    ctx.lineWidth = Math.max(3, fontSize * 0.1)
    ctx.strokeText(text, x, y)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(text, x, y)
    ctx.restore()
  }

  function expertiseThresholdLabel(entry: { from: number; to: number | null; isPlus: boolean }): string {
    if (entry.isPlus) return `${entry.from}+`
    if (entry.to === null || entry.from === entry.to) return String(entry.from)
    return `${entry.from}-${entry.to}`
  }

  function drawExpertiseTables(ctx: CanvasRenderingContext2D, tables: ExpertiseTables, font: string): void {
    EXP_COLS.forEach(({ key, x: colX, w: colW, badgeW }) => {
      const section = tables[key]

      // Skip hidden / suppressed columns
      if (section.hidden) return

      const entries = section.entries
      const shades = EXPERTISE_SHADES[section.color]
      if (entries.length === 0) return

      const rowH = EXP.rowH

      // Vertical separator line on left edge of each column (except the first)
      if (colX > 0) {
        ctx.strokeStyle = EXP.borderColor
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(colX + 0.5, EXP.tableY)
        ctx.lineTo(colX + 0.5, EXP.tableBot)
        ctx.stroke()
      }

      entries.forEach((entry, eIdx) => {
        const rowY = EXP.tableY + eIdx * rowH
        const shade = shades[eIdx] ?? shades[shades.length - 1]

        // ── Badge area (left side) — colored per shade ───────────────────
        ctx.fillStyle = shade
        ctx.fillRect(colX, rowY, badgeW, rowH)

        // Threshold number centred in badge, white bold
        const badgeLabel = expertiseThresholdLabel(entry)
        ctx.save()
        ctx.font = `bold 11px "${font}"`
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(badgeLabel, colX + badgeW / 2, rowY + rowH / 2)
        ctx.restore()

        // ── Content area (right of badge) — card background colour ───────
        ctx.fillStyle = EXP.contentBg
        ctx.fillRect(colX + badgeW, rowY, colW - badgeW, rowH)

        // ── Row divider below (border + drop shadow), skip on last row ───
        if (eIdx < entries.length - 1) {
          const lineY = rowY + rowH

          // Divider line
          ctx.strokeStyle = EXP.borderColor
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(colX, lineY + 0.5)
          ctx.lineTo(colX + colW, lineY + 0.5)
          ctx.stroke()

          // Drop shadow 1px below
          ctx.strokeStyle = EXP.shadowColor
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(colX, lineY + 1.5)
          ctx.lineTo(colX + colW, lineY + 1.5)
          ctx.stroke()
        }

        // ── Icons + labels in content area ───────────────────────────────
        const contentX    = colX + badgeW + EXP.colPad
        const contentMaxX = colX + colW - EXP.colPad
        if (entry.icons.length === 0) return  // leave empty cells blank

        type Segment =
          | { type: 'img';    file: string }
          | { type: 'comma' }
          | { type: 'text';   text: string }

        const labelFontSize = 10
        const commaFontSize = labelFontSize * 2
        const midY = rowY + rowH / 2

        ctx.save()
        ctx.font = `bold ${labelFontSize}px "${font}"`

        const segments: Segment[] = []
        entry.icons.forEach((ic, idx) => {
          const prevIsTo = idx > 0 && entry.icons[idx - 1].iconFile.includes('_to')
          if (idx > 0 && !prevIsTo) segments.push({ type: 'comma' })
          segments.push({ type: 'img', file: ic.iconFile })
          if (ic.label) segments.push({ type: 'text', text: ic.label })
        })

        let drawX = contentX
        for (const seg of segments) {
          if (drawX >= contentMaxX) break
          if (seg.type === 'img') {
            const img = imgCache.get(imageUrl(`/images/abilities_iconography/${seg.file}`))
            const drawH = rowH - 6
            const drawW = (img && img.naturalWidth > 0)
              ? Math.round(drawH * (img.naturalWidth / img.naturalHeight))
              : drawH
            if (img) ctx.drawImage(img, drawX, rowY + 3, drawW, drawH)
            drawX += drawW + 2
          } else if (seg.type === 'comma') {
            ctx.font = `bold ${commaFontSize}px "${font}"`
            ctx.fillStyle = '#1a1a1a'
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            const commaW = ctx.measureText(',').width
            if (drawX + commaW <= contentMaxX) {
              ctx.fillText(',', drawX, midY)
              drawX += commaW + 2
            }
            ctx.font = `bold ${labelFontSize}px "${font}"`
          } else {
            ctx.font = `bold ${labelFontSize}px "${font}"`
            ctx.fillStyle = '#1a1a1a'
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            const availW = contentMaxX - drawX
            const textW  = ctx.measureText(seg.text).width
            if (textW <= availW) {
              ctx.fillText(seg.text, drawX, midY)
              drawX += textW + 2
            } else {
              let truncated = seg.text
              while (truncated.length > 1 && ctx.measureText(truncated + '…').width > availW) {
                truncated = truncated.slice(0, -1)
              }
              ctx.fillText(truncated + '…', drawX, midY)
              drawX = contentMaxX
            }
          }
        }
        ctx.restore()
      })
    })
  }

  function drawStanceTexts(ctx: CanvasRenderingContext2D, data: StanceData) {
    const font = fontReady.value ? 'Oswald' : 'Impact, Arial Black, sans-serif'

    // Stance title — white, right-aligned in the top black bar
    if (data.title) {
      ctx.save()
      ctx.font = `bold 18px "${font}"`
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(data.title.toUpperCase(), POS.titleX, POS.titleY)
      ctx.restore()
    }

    // Range — in front of the white range symbol in the pistol icon box
    const rangeText = data.range === 0 ? '-' : String(data.range)
    drawStroked(ctx, rangeText, POS.rangeX, POS.rangeY, 24, font)

    // Range Attack — large number in the left grey triangle (0 = dash)
    drawStroked(ctx, data.rangeAttack === 0 ? '-' : String(data.rangeAttack), POS.rangeAttackX, POS.rangeAttackY, 44, font)

    // Range Defense — left blue square (0 = dash)
    drawStroked(ctx, data.rangeDefense === 0 ? '-' : String(data.rangeDefense), POS.rangeDefenseX, POS.rangeDefenseY, 40, font)

    // Melee Attack — large number in the right grey triangle (0 = dash)
    drawStroked(ctx, data.meleeAttack === 0 ? '-' : String(data.meleeAttack), POS.meleeAttackX, POS.meleeAttackY, 44, font)

    // Melee Defense — right blue square (0 = dash)
    drawStroked(ctx, data.meleeDefense === 0 ? '-' : String(data.meleeDefense), POS.meleeDefenseX, POS.meleeDefenseY, 40, font)

    // Bottom strip labels — black text after each icon
    ctx.save()
    ctx.font = `bold 18px "${font}"`
    ctx.fillStyle = '#1a1a1a'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    if (data.rangedWeapon) ctx.fillText(data.rangedWeapon.toUpperCase(), POS.rangedWeaponX, POS.bottomY)
    if (data.meleeWeapon) ctx.fillText(data.meleeWeapon.toUpperCase(), POS.meleeWeaponX, POS.bottomY)
    if (data.defensiveEquipment) ctx.fillText(data.defensiveEquipment.toUpperCase(), POS.defensiveEquipmentX, POS.bottomY)
    ctx.restore()

    // Expertise tables (below the bottom strip)
    if (data.expertise) {
      drawExpertiseTables(ctx, data.expertise, font)
    }

    // Unit name + title — centered in the white rectangle at the bottom (below expertise, above dark footer)
    const name = unitNameRef?.value ?? ''
    if (name) {
      const title = unitTitleRef?.value ?? ''
      const label = title ? `${name}, ${title}` : name
      ctx.save()
      ctx.font = `bold 15px "${font}"`
      ctx.fillStyle = '#1a1a1a'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, STANCE_CANVAS_W / 2, 455)
      ctx.restore()
    }
  }

  onMounted(async () => {
    const canvas = canvasRef.value
    if (canvas) {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width  = STANCE_CANVAS_W * dpr
      canvas.height = STANCE_CANVAS_H * dpr
      canvas.style.width  = `${STANCE_CANVAS_W}px`
      canvas.style.height = `${STANCE_CANVAS_H}px`
    }
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
    const d = stanceData.value
    if (d) {
      void `${d.title}${d.range}${d.rangeAttack}${d.rangeDefense}${d.meleeAttack}${d.meleeDefense}${d.rangedWeapon}${d.meleeWeapon}${d.defensiveEquipment}${JSON.stringify(d.expertise)}${JSON.stringify(d.combatTree)}`
    }
    void faction.value
    void unitNameRef?.value
    void unitTitleRef?.value
    // Read portrait ref unconditionally so Vue always tracks it
    const p = portraitRef ? portraitRef.value : null
    const imageData = p?.imageData ?? null
    const offsetX   = p?.offsetX   ?? 0
    const offsetY   = p?.offsetY   ?? 0
    const scale     = p?.scale     ?? 1
    void `${imageData}${offsetX}${offsetY}${scale}`
    loadPortraitImage(imageData)
    scheduleRender()
  })

  function toDataURL(type = 'image/png'): string {
    return canvasRef.value?.toDataURL(type) ?? ''
  }

  return { scheduleRender, fontReady, readyPromise, toDataURL }
}
