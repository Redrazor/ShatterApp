import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { normaliseCharacter, normaliseMission, normaliseProduct, rewriteImagePath } from './normalise.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'public', 'data')
const IMAGES_DIR = join(ROOT, 'public', 'images')

const BASE_API = 'https://api.pointbreaksw.com'
const BASE_IMAGES = 'https://pointbreaksw.com/Images'

// AMG CDN image map: local filename → canonical AMG CDN URL
// Built from scraper/amg-image-map.json; any filename not in the map falls back to BASE_IMAGES
const AMG_MAP_PATH = join(__dirname, 'amg-image-map.json')
const amgImageMap: Record<string, string> = existsSync(AMG_MAP_PATH)
  ? JSON.parse(readFileSync(AMG_MAP_PATH, 'utf-8')) as Record<string, string>
  : {}

function imageDownloadUrl(filename: string): string {
  return amgImageMap[filename] ?? `${BASE_IMAGES}/${filename}`
}

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://pointbreaksw.com/',
}

function ensureDirs() {
  for (const dir of [DATA_DIR, IMAGES_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }
}

async function fetchJSON(url: string): Promise<unknown[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  return res.json() as Promise<unknown[]>
}

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)) }

async function downloadImageWithRetry(url: string, dest: string): Promise<void> {
  if (existsSync(dest)) return
  const headers = url.includes('asmodee.net') ? {} : BROWSER_HEADERS
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(1000 * Math.pow(2, attempt - 1))  // 1s, 2s
    try {
      const res = await fetch(url, { headers })
      if (res.status === 404) { console.warn(`  [404] ${url}`); return }
      if (!res.ok) { console.warn(`  [${res.status}] ${url} attempt ${attempt + 1}/3`); continue }
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
      return
    } catch (e) {
      console.warn(`  [err] ${url} attempt ${attempt + 1}/3: ${(e as Error).message}`)
    }
  }
  console.error(`  [fail] ${url} after 3 attempts`)
}

async function throttledDownload(tasks: Array<() => Promise<void>>, concurrency = 5, delayMs = 500): Promise<void> {
  let done = 0
  const total = tasks.length
  for (let i = 0; i < tasks.length; i += concurrency) {
    await Promise.all(tasks.slice(i, i + concurrency).map(fn => fn()))
    done += Math.min(concurrency, tasks.length - i)
    console.log(`  ${done}/${total}`)
    if (i + concurrency < tasks.length) await sleep(delayMs)
  }
}

function extractImageUrls(obj: unknown): string[] {
  const urls: string[] = []
  if (typeof obj === 'string' && obj.startsWith('/images/')) {
    urls.push(obj)
  } else if (Array.isArray(obj)) {
    for (const item of obj) urls.push(...extractImageUrls(item))
  } else if (obj && typeof obj === 'object') {
    for (const val of Object.values(obj as Record<string, unknown>)) {
      urls.push(...extractImageUrls(val))
    }
  }
  return urls
}

function collectMissingImages(): string[] {
  const missing: string[] = []
  for (const file of ['characters.json', 'missions.json', 'products.json']) {
    const path = join(DATA_DIR, file)
    if (!existsSync(path)) { console.warn(`  [skip] ${file} not found`); continue }
    const data = JSON.parse(readFileSync(path, 'utf-8')) as unknown[]
    for (const localPath of extractImageUrls(data)) {
      if (!existsSync(join(IMAGES_DIR, localPath.replace('/images/', '')))) {
        missing.push(localPath)
      }
    }
  }
  return [...new Set(missing)]
}

async function scrapeAndSave<T extends { id: number }>(
  endpoint: string,
  normalise: (raw: Record<string, unknown>) => T,
  outFile: string,
) {
  console.log(`Fetching ${BASE_API}${endpoint}...`)
  const raw = await fetchJSON(`${BASE_API}${endpoint}`)
  const all = raw.map((item) => normalise(item as Record<string, unknown>))
  // Deduplicate by id — keep first occurrence
  const seen = new Set<number>()
  const normalised = all.filter(item => {
    if (seen.has(item.id)) { console.warn(`  [dedup] id=${item.id} skipped`); return false }
    seen.add(item.id)
    return true
  })
  writeFileSync(outFile, JSON.stringify(normalised, null, 2))
  console.log(`  → ${normalised.length} items written to ${outFile}`)
  return normalised
}

async function retryMissing() {
  ensureDirs()
  const missing = collectMissingImages()
  console.log(`\nFound ${missing.length} missing images. Downloading...`)
  if (!missing.length) { console.log('Nothing to do.'); return }
  const tasks = missing.map((localPath) => async () => {
    const filename = localPath.replace('/images/', '')
    await downloadImageWithRetry(imageDownloadUrl(filename), join(IMAGES_DIR, filename))
  })
  await throttledDownload(tasks)
  console.log('\nRetry complete.')
}

async function main() {
  ensureDirs()

  const [characters, missions, products] = await Promise.all([
    scrapeAndSave('/characters', normaliseCharacter, join(DATA_DIR, 'characters.json')),
    scrapeAndSave('/missions', normaliseMission, join(DATA_DIR, 'missions.json')),
    scrapeAndSave('/collection', normaliseProduct, join(DATA_DIR, 'products.json')),
  ])

  const allData = [...characters, ...missions, ...products]
  const imageLocalPaths = [...new Set(extractImageUrls(allData))]

  console.log(`\nDownloading ${imageLocalPaths.length} images...`)
  const tasks = imageLocalPaths.map((localPath) => async () => {
    const filename = localPath.replace('/images/', '')
    await downloadImageWithRetry(imageDownloadUrl(filename), join(IMAGES_DIR, filename))
  })

  await throttledDownload(tasks)
  console.log(`\nDone!`)
}

if (process.argv.includes('--retry')) {
  retryMissing().catch(e => { console.error(e); process.exit(1) })
} else {
  main().catch(e => { console.error(e); process.exit(1) })
}
