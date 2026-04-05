const ORDER_W = 600
const ORDER_H = Math.round(ORDER_W * 574 / 343) // matches back card aspect ratio (343×574)

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function generateOrderCard(
  imageData: string,
  hasTactic: boolean,
): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = ORDER_W
  canvas.height = ORDER_H
  const ctx = canvas.getContext('2d')!

  // Black background
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, ORDER_W, ORDER_H)

  // Draw unit image centered and scaled to fit
  if (imageData) {
    const img = await loadImage(imageData)
    const scale = Math.min(ORDER_W / img.width, ORDER_H / img.height)
    const w = img.width * scale
    const h = img.height * scale
    const x = (ORDER_W - w) / 2
    const y = (ORDER_H - h) / 2
    ctx.drawImage(img, x, y, w, h)
  }

  // Draw tactic icon top-left if applicable
  if (hasTactic) {
    try {
      const tacticImg = await loadImage('/images/tactical_order.png')
      const padding = 16
      ctx.drawImage(tacticImg, padding, padding + 40, tacticImg.width * 2, tacticImg.height * 2)
    } catch {
      // tactic icon not available — skip silently
    }
  }

  return canvas.toDataURL('image/jpeg', 0.85)
}
