// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import {
  createTables,
  dropTables,
  seedCharacters,
  seedMissions,
  seedProducts,
} from '../../../../server/db/seed.ts'
import { testChars, testMissions, testProducts } from '../helpers/testDb.ts'

function freshDb() {
  const sqlite = new Database(':memory:')
  sqlite.pragma('journal_mode = WAL')
  createTables(sqlite)
  return sqlite
}

let sqlite = freshDb()

afterAll(() => sqlite.close())

// Helper to count rows
function count(sqlite: InstanceType<typeof Database>, table: string): number {
  const row = sqlite.prepare(`SELECT COUNT(*) as n FROM ${table}`).get() as { n: number }
  return row.n
}

describe('createTables', () => {
  it('creates all 6 tables', () => {
    const db = new Database(':memory:')
    createTables(db)
    const tables = (db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all() as { name: string }[]).map(r => r.name)
    expect(tables).toContain('characters')
    expect(tables).toContain('character_tags')
    expect(tables).toContain('missions')
    expect(tables).toContain('products')
    expect(tables).toContain('product_images')
    expect(tables).toContain('product_models')
    db.close()
  })

  it('is idempotent — calling twice does not throw', () => {
    const db = new Database(':memory:')
    expect(() => {
      createTables(db)
      createTables(db)
    }).not.toThrow()
    db.close()
  })
})

describe('dropTables', () => {
  it('removes all tables', () => {
    const db = new Database(':memory:')
    createTables(db)
    dropTables(db)
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`).all()
    expect(tables).toHaveLength(0)
    db.close()
  })

  it('is safe to call on empty database', () => {
    const db = new Database(':memory:')
    expect(() => dropTables(db)).not.toThrow()
    db.close()
  })
})

describe('seedCharacters', () => {
  beforeEach(() => {
    sqlite = freshDb()
  })

  it('inserts the correct number of characters', () => {
    seedCharacters(sqlite, testChars)
    expect(count(sqlite, 'characters')).toBe(3)
  })

  it('inserts character tag rows', () => {
    seedCharacters(sqlite, testChars)
    // Luke: 2 tags, R2-D2: 2 tags, Han: 2 tags = 6 total
    expect(count(sqlite, 'character_tags')).toBe(6)
  })

  it('persists all scalar fields correctly', () => {
    seedCharacters(sqlite, testChars)
    const row = sqlite.prepare('SELECT * FROM characters WHERE id = 1').get() as Record<string, unknown>
    expect(row.name).toBe('Luke Skywalker')
    expect(row.unit_type).toBe('Primary')
    expect(row.sp).toBe(5)
    expect(row.pc).toBeNull()
    expect(row.era).toBe('Galactic Civil War')
    expect(row.swp_code).toBe('SWP01')
    expect(row.spt).toBe('00010101')
    expect(row.thumbnail).toBe('/images/luke.png')
    expect(row.order_card).toBe('/images/luke_order.png')
    expect(row.stance1).toBe('/images/luke_s1.png')
    expect(row.model_count).toBe(1)
  })

  it('persists tags with correct character_id', () => {
    seedCharacters(sqlite, testChars)
    const tags = sqlite.prepare('SELECT tag FROM character_tags WHERE character_id = 1 ORDER BY id').all() as { tag: string }[]
    expect(tags.map(t => t.tag)).toEqual(['Rebel', 'Jedi'])
  })

  it('sets nullable optional fields to NULL when absent', () => {
    seedCharacters(sqlite, testChars)
    const row = sqlite.prepare('SELECT * FROM characters WHERE id = 2').get() as Record<string, unknown>
    expect(row.spt).toBeNull()
    expect(row.order_card).toBeNull()
    expect(row.stance1).toBeNull()
    expect(row.model).toBeNull()
    expect(row.model_count).toBeNull()
  })

  it('persists secondary unit with pc and null sp', () => {
    seedCharacters(sqlite, testChars)
    const row = sqlite.prepare('SELECT * FROM characters WHERE id = 2').get() as Record<string, unknown>
    expect(row.unit_type).toBe('Secondary')
    expect(row.pc).toBe(3)
    expect(row.sp).toBeNull()
  })

  it('runs inside a transaction — all or nothing', () => {
    const badChars = [...testChars, { ...testChars[0] }] // duplicate id = constraint violation
    expect(() => seedCharacters(sqlite, badChars)).toThrow()
    // Transaction rolled back — nothing inserted
    expect(count(sqlite, 'characters')).toBe(0)
  })
})

describe('seedMissions', () => {
  beforeEach(() => {
    sqlite = freshDb()
  })

  it('inserts the correct number of missions', () => {
    seedMissions(sqlite, testMissions)
    expect(count(sqlite, 'missions')).toBe(2)
  })

  it('persists all struggle image columns', () => {
    seedMissions(sqlite, testMissions)
    const row = sqlite.prepare('SELECT * FROM missions WHERE id = 1').get() as Record<string, unknown>
    expect(row.struggle1a).toBe('/images/s1a.png')
    expect(row.struggle1b).toBe('/images/s1b.png')
    expect(row.struggle1c).toBe('/images/s1c.png')
    expect(row.struggle2a).toBe('/images/s2a.png')
    expect(row.struggle3c).toBe('/images/s3c.png')
  })

  it('sets partial struggle columns to NULL', () => {
    seedMissions(sqlite, testMissions)
    const row = sqlite.prepare('SELECT * FROM missions WHERE id = 2').get() as Record<string, unknown>
    expect(row.struggle1a).toBe('/images/ta_s1a.png')
    expect(row.struggle1b).toBeNull()
    expect(row.struggle2a).toBeNull()
    expect(row.struggle3a).toBeNull()
  })

  it('persists spt field', () => {
    seedMissions(sqlite, testMissions)
    const row = sqlite.prepare('SELECT * FROM missions WHERE id = 1').get() as Record<string, unknown>
    expect(row.spt).toBe('00010001')
  })

  it('sets spt to NULL when absent', () => {
    seedMissions(sqlite, testMissions)
    const row = sqlite.prepare('SELECT * FROM missions WHERE id = 2').get() as Record<string, unknown>
    expect(row.spt).toBeNull()
  })
})

describe('seedProducts', () => {
  beforeEach(() => {
    sqlite = freshDb()
  })

  it('inserts the correct number of products', () => {
    seedProducts(sqlite, testProducts)
    expect(count(sqlite, 'products')).toBe(2)
  })

  it('inserts product_images rows', () => {
    seedProducts(sqlite, testProducts)
    expect(count(sqlite, 'product_images')).toBe(2) // starter has 2 images, cwp has 0
  })

  it('inserts product_models rows', () => {
    seedProducts(sqlite, testProducts)
    expect(count(sqlite, 'product_models')).toBe(3) // starter: 2, cwp: 1
  })

  it('persists image display_order', () => {
    seedProducts(sqlite, testProducts)
    const images = sqlite.prepare('SELECT image_url, display_order FROM product_images WHERE product_id = 1 ORDER BY display_order').all() as { image_url: string; display_order: number }[]
    expect(images[0].image_url).toBe('/images/starter1.jpg')
    expect(images[0].display_order).toBe(0)
    expect(images[1].image_url).toBe('/images/starter2.jpg')
    expect(images[1].display_order).toBe(1)
  })

  it('persists model display_order', () => {
    seedProducts(sqlite, testProducts)
    const models = sqlite.prepare('SELECT character_name, display_order FROM product_models WHERE product_id = 1 ORDER BY display_order').all() as { character_name: string; display_order: number }[]
    expect(models[0].character_name).toBe('Luke Skywalker')
    expect(models[1].character_name).toBe('Darth Vader')
  })

  it('persists optional number field', () => {
    seedProducts(sqlite, testProducts)
    const row = sqlite.prepare('SELECT number FROM products WHERE id = 1').get() as { number: string | null }
    expect(row.number).toBe('01')
  })

  it('sets number to NULL when absent', () => {
    seedProducts(sqlite, testProducts)
    const row = sqlite.prepare('SELECT number FROM products WHERE id = 2').get() as { number: string | null }
    expect(row.number).toBeNull()
  })

  it('persists optional mainImage field', () => {
    seedProducts(sqlite, testProducts)
    const row = sqlite.prepare('SELECT main_image FROM products WHERE id = 1').get() as { main_image: string | null }
    expect(row.main_image).toBe('/images/starter_main.png')
  })

  it('sets main_image to NULL when absent', () => {
    seedProducts(sqlite, testProducts)
    const row = sqlite.prepare('SELECT main_image FROM products WHERE id = 2').get() as { main_image: string | null }
    expect(row.main_image).toBeNull()
  })
})

describe('full seed cycle — drop + create + seed is idempotent', () => {
  it('can seed, drop, recreate, and seed again cleanly', () => {
    const db = freshDb()
    seedCharacters(db, testChars)
    seedMissions(db, testMissions)
    seedProducts(db, testProducts)

    expect(count(db, 'characters')).toBe(3)

    dropTables(db)
    createTables(db)

    seedCharacters(db, testChars)
    seedMissions(db, testMissions)
    seedProducts(db, testProducts)

    expect(count(db, 'characters')).toBe(3)
    expect(count(db, 'character_tags')).toBe(6)
    expect(count(db, 'missions')).toBe(2)
    expect(count(db, 'products')).toBe(2)
    db.close()
  })
})
