import { Router } from 'express'
import type Database from 'better-sqlite3'

type Sqlite = InstanceType<typeof Database>

function getTagsForCharacter(sqlite: Sqlite, id: number): string[] {
  const rows = sqlite.prepare('SELECT tag FROM character_tags WHERE character_id = ? ORDER BY id').all(id) as { tag: string }[]
  return rows.map(r => r.tag)
}

export function rowToCharacter(row: Record<string, unknown>, tags: string[]) {
  return {
    id: row.id,
    slug: row.slug ?? '',
    name: row.name,
    characterType: row.character_type,
    unitType: row.unit_type,
    unitTypeName: row.unit_type_name ?? undefined,
    pc: row.pc ?? null,
    sp: row.sp ?? null,
    durability: row.durability,
    stamina: row.stamina,
    fp: row.fp,
    era: row.era,
    tags,
    swp: row.swp,
    swpCode: row.swp_code ?? undefined,
    spt: row.spt ?? undefined,
    thumbnail: row.thumbnail,
    cardFront: row.card_front,
    cardBack: row.card_back,
    orderCard: row.order_card ?? undefined,
    stance1: row.stance1 ?? undefined,
    stance2: row.stance2 ?? undefined,
    model: row.model ?? undefined,
    modelCount: row.model_count ?? undefined,
    characterExclusion: row.character_exclusion ?? undefined,
    extraCards: row.extra_cards ?? undefined,
    stances: [],
    releaseDate: row.release_date,
    lastUpdated: row.last_updated ?? '',
  }
}

export function createCharactersRouter(sqlite: Sqlite) {
  const router = Router()

  router.get('/', (req, res) => {
    let sql = 'SELECT * FROM characters WHERE 1=1'
    const params: unknown[] = []

    if (req.query.era) {
      sql += ' AND era = ?'
      params.push(req.query.era)
    }
    if (req.query.type) {
      sql += ' AND unit_type = ?'
      params.push(req.query.type)
    }
    if (req.query.swp) {
      sql += ' AND swp_code = ?'
      params.push(req.query.swp)
    }

    const rows = sqlite.prepare(sql).all(...(params as [])) as Record<string, unknown>[]

    if (req.query.tag) {
      const tag = req.query.tag as string
      const taggedIds = new Set(
        (sqlite.prepare('SELECT character_id FROM character_tags WHERE tag = ?').all(tag) as { character_id: number }[])
          .map(r => r.character_id)
      )
      const filtered = rows.filter(r => taggedIds.has(r.id as number))
      res.json(filtered.map(r => rowToCharacter(r, getTagsForCharacter(sqlite, r.id as number))))
      return
    }

    res.json(rows.map(r => rowToCharacter(r, getTagsForCharacter(sqlite, r.id as number))))
  })

  router.get('/:id', (req, res) => {
    const row = sqlite.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!row) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    const tags = getTagsForCharacter(sqlite, row.id as number)
    res.json(rowToCharacter(row, tags))
  })

  return router
}
