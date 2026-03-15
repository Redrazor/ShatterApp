import type { Character, Mission, Product } from '../src/types/index.ts'
import { toSlug } from '../src/utils/slug.ts'

export function normaliseCharacter(raw: Record<string, unknown>): Character {
  const unitType = resolveUnitType(raw.UNIT_TYPE as string | undefined ?? raw.unit_type as string | undefined)
  const tags = parseSemicolonList(raw.TAGS as string | undefined ?? raw.tags as string | undefined)
  const swpFull = String(raw.SWP ?? raw.swp ?? '')
  const swpCode = swpFull.slice(0, 5).toUpperCase()
  const name = String(raw.NAME ?? raw.name ?? '')

  return {
    id: Number(raw.ID ?? raw.id ?? 0),
    slug: toSlug(name),
    name,
    characterType: String(raw.CHARACTER_TYPE ?? raw.character_type ?? raw.characterType ?? ''),
    unitType,
    unitTypeName: raw.UNIT_TYPE_NAME != null ? String(raw.UNIT_TYPE_NAME) : undefined,
    pc: unitType !== 'Primary' ? (raw.PC != null ? Number(raw.PC) : raw.pc != null ? Number(raw.pc) : null) : null,
    sp: unitType === 'Primary' ? (raw.SP != null ? Number(raw.SP) : raw.sp != null ? Number(raw.sp) : null) : null,
    durability: Number(raw.DURABILITY ?? raw.durability ?? 0),
    stamina: Number(raw.STAMINA ?? raw.stamina ?? 0),
    fp: Number(raw.FP ?? raw.fp ?? 0),
    era: String(raw.ERA ?? raw.era ?? ''),
    tags,
    swp: swpFull,
    swpCode,
    spt: raw.SPT != null ? String(raw.SPT) : undefined,
    thumbnail: rewriteImagePath(raw.THUMBNAIL as string | undefined ?? raw.thumbnail as string | undefined),
    cardFront: rewriteImagePath(raw.CARD_FRONT as string | undefined ?? raw.card_front as string | undefined ?? raw.cardFront as string | undefined),
    cardBack: rewriteImagePath(raw.CARD_BACK as string | undefined ?? raw.card_back as string | undefined ?? raw.cardBack as string | undefined),
    orderCard: rewriteImagePath(raw.ORDER_CARD as string | undefined) || undefined,
    stance1: rewriteImagePath(raw.STANCE1 as string | undefined) || undefined,
    stance2: rewriteImagePath(raw.STANCE2 as string | undefined) || undefined,
    model: rewriteImagePath(raw.MODEL as string | undefined) || undefined,
    modelCount: raw.MODEL_COUNT != null ? Number(raw.MODEL_COUNT) : undefined,
    characterExclusion: raw.CHARACTER_EXCLUSION != null ? String(raw.CHARACTER_EXCLUSION) : undefined,
    extraCards: raw.EXTRA_CARDS != null ? String(raw.EXTRA_CARDS) : undefined,
    stances: [],
    releaseDate: String(raw.RELEASE_DATE ?? raw.release_date ?? raw.releaseDate ?? ''),
  }
}

export function normaliseMission(raw: Record<string, unknown>): Mission {
  return {
    id: Number(raw.ID ?? raw.id ?? 0),
    name: String(raw.NAME ?? raw.name ?? ''),
    card: rewriteImagePath(raw.CARD as string | undefined ?? raw.card as string | undefined),
    swp: String(raw.SWP ?? raw.swp ?? ''),
    spt: raw.SPT != null ? String(raw.SPT) : undefined,
    struggles: parseStruggles(raw),
  }
}

export function normaliseProduct(raw: Record<string, unknown>): Product {
  const imagesRaw = raw.IMAGES ?? raw.images
  const images = parseSemicolonImageList(imagesRaw as string | undefined)

  return {
    id: Number(raw.ID ?? raw.id ?? 0),
    name: String(raw.NAME ?? raw.name ?? ''),
    swp: String(raw.SWP ?? raw.swp ?? ''),
    number: raw.NUMBER != null ? String(raw.NUMBER) : undefined,
    era: String(raw.ERA ?? raw.era ?? ''),
    thumbnail: rewriteImagePath(raw.THUMBNAIL as string | undefined ?? raw.thumbnail as string | undefined),
    mainImage: rewriteImagePath(raw.MAIN_IMAGE as string | undefined) || undefined,
    images,
    models: parseSemicolonList(raw.MODELS as string | undefined ?? raw.models as string | undefined),
    description: String(raw.DESCRIPTION ?? raw.description ?? ''),
    assemblyUrl: String(raw.ASSEMBLY_URL ?? raw.assembly_url ?? raw.assemblyUrl ?? ''),
    storeLink: String(raw.STORE_LINK ?? raw.store_link ?? raw.storeLink ?? ''),
  }
}

function resolveUnitType(raw: string | undefined): 'Primary' | 'Secondary' | 'Support' {
  const lower = (raw ?? '').toLowerCase()
  if (lower === 'primary') return 'Primary'
  if (lower === 'secondary') return 'Secondary'
  if (lower === 'support') return 'Support'
  return 'Primary'
}

export function rewriteImagePath(url: string | undefined): string {
  if (!url) return ''
  const filename = url.split('/').pop() ?? ''
  return `/images/${filename}`
}

function parseSemicolonList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(';').map((t) => t.trim()).filter(Boolean)
  }
  return []
}

function parseSemicolonImageList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((u) => rewriteImagePath(String(u)))
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(';').map((u) => rewriteImagePath(u.trim())).filter(Boolean)
  }
  return []
}

function parseStruggles(raw: Record<string, unknown>): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const key of ['struggle1', 'struggle2', 'struggle3']) {
    const upperKey = key.toUpperCase()
    const val = raw[upperKey] ?? raw[key]
    if (Array.isArray(val)) {
      result[key] = val.map((s) => rewriteImagePath(String(s))).filter(Boolean)
    } else if (typeof val === 'string' && val.trim()) {
      result[key] = val.split(';').map((s) => rewriteImagePath(s.trim())).filter(Boolean)
    } else {
      result[key] = []
    }
  }
  return result
}
