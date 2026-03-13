import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import type Database from 'better-sqlite3'
import type { Character, Mission, Product } from '../../src/types/index.ts'

type Sqlite = InstanceType<typeof Database>

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', '..', 'public', 'data')

function readJson<T>(filename: string): T[] {
  const path = join(DATA_DIR, filename)
  return JSON.parse(readFileSync(path, 'utf-8')) as T[]
}

export function createTables(sqlite: Sqlite): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      character_type TEXT NOT NULL DEFAULT '',
      unit_type TEXT NOT NULL DEFAULT 'Primary',
      unit_type_name TEXT,
      pc REAL,
      sp REAL,
      durability INTEGER NOT NULL DEFAULT 0,
      stamina INTEGER NOT NULL DEFAULT 0,
      fp INTEGER NOT NULL DEFAULT 0,
      era TEXT NOT NULL DEFAULT '',
      swp TEXT NOT NULL DEFAULT '',
      swp_code TEXT,
      spt TEXT,
      thumbnail TEXT NOT NULL DEFAULT '',
      card_front TEXT NOT NULL DEFAULT '',
      card_back TEXT NOT NULL DEFAULT '',
      order_card TEXT,
      stance1 TEXT,
      stance2 TEXT,
      model TEXT,
      model_count INTEGER,
      character_exclusion TEXT,
      extra_cards TEXT,
      release_date TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS character_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      tag TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS missions (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      swp TEXT NOT NULL DEFAULT '',
      spt TEXT,
      card TEXT NOT NULL DEFAULT '',
      struggle1a TEXT,
      struggle1b TEXT,
      struggle1c TEXT,
      struggle2a TEXT,
      struggle2b TEXT,
      struggle2c TEXT,
      struggle3a TEXT,
      struggle3b TEXT,
      struggle3c TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      swp TEXT NOT NULL DEFAULT '',
      number TEXT,
      era TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      thumbnail TEXT NOT NULL DEFAULT '',
      main_image TEXT,
      assembly_url TEXT NOT NULL DEFAULT '',
      store_link TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS product_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      character_name TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0
    );
  `)
}

export function dropTables(sqlite: Sqlite): void {
  sqlite.exec(`
    DROP TABLE IF EXISTS product_models;
    DROP TABLE IF EXISTS product_images;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS missions;
    DROP TABLE IF EXISTS character_tags;
    DROP TABLE IF EXISTS characters;
  `)
}

export function seedCharacters(sqlite: Sqlite, chars: Character[]): void {
  const insertChar = sqlite.prepare(`
    INSERT INTO characters (
      id, name, character_type, unit_type, unit_type_name,
      pc, sp, durability, stamina, fp, era,
      swp, swp_code, spt,
      thumbnail, card_front, card_back,
      order_card, stance1, stance2, model, model_count,
      character_exclusion, extra_cards, release_date
    ) VALUES (
      @id, @name, @characterType, @unitType, @unitTypeName,
      @pc, @sp, @durability, @stamina, @fp, @era,
      @swp, @swpCode, @spt,
      @thumbnail, @cardFront, @cardBack,
      @orderCard, @stance1, @stance2, @model, @modelCount,
      @characterExclusion, @extraCards, @releaseDate
    )
  `)

  const insertTag = sqlite.prepare(`
    INSERT INTO character_tags (character_id, tag) VALUES (@characterId, @tag)
  `)

  const insertAll = sqlite.transaction((chars: Character[]) => {
    for (const c of chars) {
      insertChar.run({
        id: c.id,
        name: c.name,
        characterType: c.characterType,
        unitType: c.unitType,
        unitTypeName: c.unitTypeName ?? null,
        pc: c.pc,
        sp: c.sp,
        durability: c.durability,
        stamina: c.stamina,
        fp: c.fp,
        era: c.era,
        swp: c.swp,
        swpCode: c.swpCode ?? null,
        spt: c.spt ?? null,
        thumbnail: c.thumbnail,
        cardFront: c.cardFront,
        cardBack: c.cardBack,
        orderCard: c.orderCard ?? null,
        stance1: c.stance1 ?? null,
        stance2: c.stance2 ?? null,
        model: c.model ?? null,
        modelCount: c.modelCount ?? null,
        characterExclusion: c.characterExclusion ?? null,
        extraCards: c.extraCards ?? null,
        releaseDate: c.releaseDate,
      })
      for (const tag of c.tags) {
        insertTag.run({ characterId: c.id, tag })
      }
    }
  })

  insertAll(chars)
}

export function seedMissions(sqlite: Sqlite, ms: Mission[]): void {
  const insert = sqlite.prepare(`
    INSERT INTO missions (
      id, name, swp, spt, card,
      struggle1a, struggle1b, struggle1c,
      struggle2a, struggle2b, struggle2c,
      struggle3a, struggle3b, struggle3c
    ) VALUES (
      @id, @name, @swp, @spt, @card,
      @struggle1a, @struggle1b, @struggle1c,
      @struggle2a, @struggle2b, @struggle2c,
      @struggle3a, @struggle3b, @struggle3c
    )
  `)

  const insertAll = sqlite.transaction((ms: Mission[]) => {
    for (const m of ms) {
      const s1 = m.struggles.struggle1 ?? []
      const s2 = m.struggles.struggle2 ?? []
      const s3 = m.struggles.struggle3 ?? []
      insert.run({
        id: m.id,
        name: m.name,
        swp: m.swp,
        spt: m.spt ?? null,
        card: m.card,
        struggle1a: s1[0] ?? null,
        struggle1b: s1[1] ?? null,
        struggle1c: s1[2] ?? null,
        struggle2a: s2[0] ?? null,
        struggle2b: s2[1] ?? null,
        struggle2c: s2[2] ?? null,
        struggle3a: s3[0] ?? null,
        struggle3b: s3[1] ?? null,
        struggle3c: s3[2] ?? null,
      })
    }
  })

  insertAll(ms)
}

export function seedProducts(sqlite: Sqlite, prods: Product[]): void {
  const insertProd = sqlite.prepare(`
    INSERT INTO products (
      id, name, swp, number, era, description,
      thumbnail, main_image, assembly_url, store_link
    ) VALUES (
      @id, @name, @swp, @number, @era, @description,
      @thumbnail, @mainImage, @assemblyUrl, @storeLink
    )
  `)

  const insertImage = sqlite.prepare(`
    INSERT INTO product_images (product_id, image_url, display_order)
    VALUES (@productId, @imageUrl, @displayOrder)
  `)

  const insertModel = sqlite.prepare(`
    INSERT INTO product_models (product_id, character_name, display_order)
    VALUES (@productId, @characterName, @displayOrder)
  `)

  const insertAll = sqlite.transaction((prods: Product[]) => {
    for (const p of prods) {
      insertProd.run({
        id: p.id,
        name: p.name,
        swp: p.swp,
        number: p.number ?? null,
        era: p.era,
        description: p.description,
        thumbnail: p.thumbnail,
        mainImage: p.mainImage ?? null,
        assemblyUrl: p.assemblyUrl,
        storeLink: p.storeLink,
      })
      for (let i = 0; i < p.images.length; i++) {
        insertImage.run({ productId: p.id, imageUrl: p.images[i], displayOrder: i })
      }
      for (let i = 0; i < p.models.length; i++) {
        insertModel.run({ productId: p.id, characterName: p.models[i], displayOrder: i })
      }
    }
  })

  insertAll(prods)
}

async function main(): Promise<void> {
  const { sqlite } = await import('./index.ts')

  console.log('Dropping tables...')
  dropTables(sqlite)
  console.log('Creating tables...')
  createTables(sqlite)

  console.log('Seeding characters...')
  const chars = readJson<Character>('characters.json')
  seedCharacters(sqlite, chars)
  console.log(`  → ${chars.length} characters inserted`)

  console.log('Seeding missions...')
  const ms = readJson<Mission>('missions.json')
  seedMissions(sqlite, ms)
  console.log(`  → ${ms.length} missions inserted`)

  console.log('Seeding products...')
  const prods = readJson<Product>('products.json')
  seedProducts(sqlite, prods)
  console.log(`  → ${prods.length} products inserted`)

  console.log('\nSeed complete!')
  sqlite.close()
}

export function runSeed(sqlite: Sqlite): void {
  dropTables(sqlite)
  createTables(sqlite)

  const chars = readJson<Character>('characters.json')
  seedCharacters(sqlite, chars)

  const ms = readJson<Mission>('missions.json')
  seedMissions(sqlite, ms)

  const prods = readJson<Product>('products.json')
  seedProducts(sqlite, prods)

  console.log(`Seed complete: ${chars.length} characters, ${ms.length} missions, ${prods.length} products`)
}

// Only run when executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(e => { console.error(e); process.exit(1) })
}
