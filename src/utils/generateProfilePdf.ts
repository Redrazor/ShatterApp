import jsPDF from 'jspdf'

export interface PdfCardImages {
  front: string
  abilities: string
  stance1: string
  stance2: string | null
  orderFront: string
  orderBack: string
}

// A4 landscape page: 297 × 210 mm
const PAGE_W = 297
const PAGE_H = 210

// Card dimensions in mm
const FRONT_W  = 100, FRONT_H  = 153   // portrait
const ABIL_W   = 153, ABIL_H   = 100   // landscape
const STANCE_W = 118, STANCE_H = 70    // landscape
const ORDER_W  = 70,  ORDER_H  = 118   // portrait

// Convert a path or data URL to a JPEG data URL via canvas (needed for local PNG paths)
function toJpegDataUrl(src: string): Promise<string> {
  if (src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg')) {
    return Promise.resolve(src)
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.onerror = reject
    img.src = src
  })
}

// Centre a card horizontally on the page
function cx(cardW: number): number {
  return (PAGE_W - cardW) / 2
}

// Centre a card vertically on the page
function cy(cardH: number): number {
  return (PAGE_H - cardH) / 2
}

export async function generateProfilePdf(
  profileName: string,
  cards: PdfCardImages,
): Promise<void> {
  // Resolve all images to JPEG data URLs up front
  const [front, abilities, stance1, stance2, orderFront, orderBack] = await Promise.all([
    toJpegDataUrl(cards.front),
    toJpegDataUrl(cards.abilities),
    toJpegDataUrl(cards.stance1),
    cards.stance2 ? toJpegDataUrl(cards.stance2) : Promise.resolve(null),
    toJpegDataUrl(cards.orderFront),
    toJpegDataUrl(cards.orderBack),
  ])

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // ── Page 1: Front (portrait 100×153) + Abilities (landscape 153×100) ────────
  const p1TotalW = FRONT_W + 8 + ABIL_W   // 261mm
  const p1StartX = (PAGE_W - p1TotalW) / 2
  doc.addImage(front,     'JPEG', p1StartX,                   cy(FRONT_H), FRONT_W, FRONT_H)
  doc.addImage(abilities, 'JPEG', p1StartX + FRONT_W + 8,     cy(ABIL_H),  ABIL_W,  ABIL_H)

  // ── Page 2: Stances stacked vertically ──────────────────────────────────────
  doc.addPage()
  if (stance2) {
    const totalH = STANCE_H + 6 + STANCE_H   // 146mm
    const startY = (PAGE_H - totalH) / 2
    doc.addImage(stance1, 'JPEG', cx(STANCE_W), startY,                STANCE_W, STANCE_H)
    doc.addImage(stance2, 'JPEG', cx(STANCE_W), startY + STANCE_H + 6, STANCE_W, STANCE_H)
  } else {
    doc.addImage(stance1, 'JPEG', cx(STANCE_W), cy(STANCE_H), STANCE_W, STANCE_H)
  }

  // ── Page 3: Order card front + back (portrait 70×118) ───────────────────────
  doc.addPage()
  const p3TotalW = ORDER_W + 8 + ORDER_W   // 148mm
  const p3StartX = (PAGE_W - p3TotalW) / 2
  doc.addImage(orderFront, 'JPEG', p3StartX,              cy(ORDER_H), ORDER_W, ORDER_H)
  doc.addImage(orderBack,  'JPEG', p3StartX + ORDER_W + 8, cy(ORDER_H), ORDER_W, ORDER_H)

  doc.save(`${profileName || 'custom-profile'}.pdf`)
}
