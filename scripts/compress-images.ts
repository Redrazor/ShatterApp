/**
 * Compresses all images in public/images to WebP at max 800px wide.
 * Output goes to public/images-compressed/ preserving directory structure.
 * Run: npx tsx scripts/compress-images.ts
 */
import sharp from 'sharp'
import { readdirSync, statSync, mkdirSync, existsSync } from 'fs'
import { join, relative, dirname, extname } from 'path'

const INPUT_DIR  = 'public/images'
const OUTPUT_DIR = 'public/images-compressed'
const MAX_WIDTH  = 800
const QUALITY    = 80

function getAllFiles(dir: string): string[] {
  const entries = readdirSync(dir)
  return entries.flatMap(entry => {
    const fullPath = join(dir, entry)
    return statSync(fullPath).isDirectory()
      ? getAllFiles(fullPath)
      : [fullPath]
  })
}

const supportedExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

async function main() {
  const files = getAllFiles(INPUT_DIR).filter(f =>
    supportedExts.has(extname(f).toLowerCase())
  )

  console.log(`Compressing ${files.length} images → WebP ${MAX_WIDTH}px max, Q${QUALITY}`)

  let done = 0
  let skipped = 0

  for (const file of files) {
    const rel      = relative(INPUT_DIR, file)
    const outPath  = join(OUTPUT_DIR, rel.replace(/\.[^.]+$/, '.webp'))
    const outDir   = dirname(outPath)

    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

    try {
      await sharp(file)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(outPath)
      done++
    } catch (err) {
      console.warn(`  skip ${rel}: ${(err as Error).message}`)
      skipped++
    }

    if (done % 50 === 0) process.stdout.write(`  ${done}/${files.length}\r`)
  }

  console.log(`\nDone: ${done} compressed, ${skipped} skipped`)
  console.log(`Output: ${OUTPUT_DIR}`)
}

main().catch(console.error)
