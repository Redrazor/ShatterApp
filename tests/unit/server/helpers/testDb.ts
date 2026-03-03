import Database from 'better-sqlite3'
import { createTables, dropTables, seedCharacters, seedMissions, seedProducts } from '../../../../server/db/seed.ts'
import type { Character, Mission, Product } from '../../../../src/types/index.ts'

export type Sqlite = InstanceType<typeof Database>

export function createTestDb(): Sqlite {
  const sqlite = new Database(':memory:')
  sqlite.pragma('journal_mode = WAL')
  createTables(sqlite)
  return sqlite
}

export function resetTestDb(sqlite: Sqlite): void {
  dropTables(sqlite)
  createTables(sqlite)
}

// ---- Minimal test fixtures ----

export const testChars: Character[] = [
  {
    id: 1,
    name: 'Luke Skywalker',
    characterType: 'Hero',
    unitType: 'Primary',
    pc: null,
    sp: 5,
    durability: 4,
    stamina: 6,
    fp: 2,
    era: 'Galactic Civil War',
    tags: ['Rebel', 'Jedi'],
    swp: 'SWP01: Starter Set',
    swpCode: 'SWP01',
    spt: '00010101',
    thumbnail: '/images/luke.png',
    cardFront: '/images/luke_f.png',
    cardBack: '/images/luke_b.png',
    orderCard: '/images/luke_order.png',
    stance1: '/images/luke_s1.png',
    stance2: '/images/luke_s2.png',
    model: '/images/luke_model.png',
    modelCount: 1,
    stances: [],
    releaseDate: '2023-01-01',
  },
  {
    id: 2,
    name: 'R2-D2',
    characterType: 'Droid',
    unitType: 'Secondary',
    pc: 3,
    sp: null,
    durability: 3,
    stamina: 4,
    fp: 0,
    era: 'Clone Wars',
    tags: ['Droid', 'Republic'],
    swp: 'SWP02: Clone Wars Pack',
    swpCode: 'SWP02',
    thumbnail: '/images/r2.png',
    cardFront: '/images/r2_f.png',
    cardBack: '/images/r2_b.png',
    stances: [],
    releaseDate: '2023-02-01',
  },
  {
    id: 3,
    name: 'Han Solo',
    characterType: 'Hero',
    unitType: 'Support',
    pc: 2,
    sp: null,
    durability: 3,
    stamina: 5,
    fp: 1,
    era: 'Galactic Civil War',
    tags: ['Rebel', 'Scoundrel'],
    swp: 'SWP01: Starter Set',
    swpCode: 'SWP01',
    thumbnail: '/images/han.png',
    cardFront: '/images/han_f.png',
    cardBack: '/images/han_b.png',
    stances: [],
    releaseDate: '2023-01-01',
  },
]

export const testMissions: Mission[] = [
  {
    id: 1,
    name: 'Outer Rim Siege',
    swp: 'SWP01: Starter Set',
    spt: '00010001',
    card: '/images/ors.png',
    struggles: {
      struggle1: ['/images/s1a.png', '/images/s1b.png', '/images/s1c.png'],
      struggle2: ['/images/s2a.png', '/images/s2b.png', '/images/s2c.png'],
      struggle3: ['/images/s3a.png', '/images/s3b.png', '/images/s3c.png'],
    },
  },
  {
    id: 2,
    name: 'Temple Assault',
    swp: 'SWP02: Clone Wars Pack',
    card: '/images/ta.png',
    struggles: {
      struggle1: ['/images/ta_s1a.png'],
      struggle2: [],
      struggle3: [],
    },
  },
]

export const testProducts: Product[] = [
  {
    id: 1,
    name: 'Starter Set',
    swp: 'SWP01',
    number: '01',
    era: 'Galactic Civil War',
    description: 'The starter set',
    thumbnail: '/images/starter.png',
    mainImage: '/images/starter_main.png',
    images: ['/images/starter1.jpg', '/images/starter2.jpg'],
    models: ['Luke Skywalker', 'Darth Vader'],
    assemblyUrl: 'https://example.com/assembly',
    storeLink: 'https://store.example.com',
  },
  {
    id: 2,
    name: 'Clone Wars Pack',
    swp: 'SWP02',
    era: 'Clone Wars',
    description: 'Clone Wars expansion',
    thumbnail: '/images/cwp.png',
    images: [],
    models: ['R2-D2'],
    assemblyUrl: '',
    storeLink: '',
  },
]

export function seedAll(sqlite: Sqlite): void {
  seedCharacters(sqlite, testChars)
  seedMissions(sqlite, testMissions)
  seedProducts(sqlite, testProducts)
}
