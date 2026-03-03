import { Router } from 'express'
import type Database from 'better-sqlite3'

type Sqlite = InstanceType<typeof Database>

function getImagesForProduct(sqlite: Sqlite, id: number): string[] {
  const rows = sqlite.prepare('SELECT image_url FROM product_images WHERE product_id = ? ORDER BY display_order').all(id) as { image_url: string }[]
  return rows.map(r => r.image_url)
}

function getModelsForProduct(sqlite: Sqlite, id: number): string[] {
  const rows = sqlite.prepare('SELECT character_name FROM product_models WHERE product_id = ? ORDER BY display_order').all(id) as { character_name: string }[]
  return rows.map(r => r.character_name)
}

export function rowToProduct(row: Record<string, unknown>, images: string[], models: string[]) {
  return {
    id: row.id,
    name: row.name,
    swp: row.swp,
    number: row.number ?? undefined,
    era: row.era,
    description: row.description,
    thumbnail: row.thumbnail,
    mainImage: row.main_image ?? undefined,
    images,
    models,
    assemblyUrl: row.assembly_url,
    storeLink: row.store_link,
  }
}

export function createProductsRouter(sqlite: Sqlite) {
  const router = Router()

  router.get('/', (req, res) => {
    let sql = 'SELECT * FROM products WHERE 1=1'
    const params: unknown[] = []

    if (req.query.era) {
      sql += ' AND era = ?'
      params.push(req.query.era)
    }

    const rows = sqlite.prepare(sql).all(...(params as [])) as Record<string, unknown>[]
    const result = rows.map(r => rowToProduct(
      r,
      getImagesForProduct(sqlite, r.id as number),
      getModelsForProduct(sqlite, r.id as number),
    ))
    res.json(result)
  })

  router.get('/:id', (req, res) => {
    const row = sqlite.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!row) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    const images = getImagesForProduct(sqlite, row.id as number)
    const models = getModelsForProduct(sqlite, row.id as number)
    res.json(rowToProduct(row, images, models))
  })

  return router
}
