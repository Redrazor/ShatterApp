import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const dataDir = path.join(root, 'public', 'data')
const outFile = path.join(root, 'public', 'sitemap.xml')

const BASE = 'https://shatterapp.com'

interface Character { id: number; slug: string }

function loadJson<T>(file: string): T[] {
  const p = path.join(dataDir, file)
  if (!fs.existsSync(p)) return []
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as T[]
}

const staticRoutes = [
  { path: '/browse',     priority: '1.0', changefreq: 'weekly' },
  { path: '/build',      priority: '0.8', changefreq: 'monthly' },
  { path: '/collection', priority: '0.7', changefreq: 'monthly' },
  { path: '/reference',  priority: '0.7', changefreq: 'monthly' },
  { path: '/play',       priority: '0.6', changefreq: 'monthly' },
  { path: '/roll',       priority: '0.5', changefreq: 'monthly' },
]

const characters = loadJson<Character>('characters.json')

const urlTag = (loc: string, priority: string, changefreq?: string) => `  <url>
    <loc>${loc}</loc>
    <priority>${priority}</priority>${changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ''}
  </url>`

const urls = [
  ...staticRoutes.map(r => urlTag(`${BASE}${r.path}`, r.priority, r.changefreq)),
  ...characters.map(c => urlTag(`${BASE}/browse/${c.slug}`, '0.9', 'monthly')),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`

fs.writeFileSync(outFile, xml, 'utf-8')
console.log(`✓ sitemap.xml generated — ${characters.length} character URLs + ${staticRoutes.length} static routes`)
