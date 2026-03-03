// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import { createCharactersRouter } from '../../../../server/routes/characters.ts'
import { createTestDb, resetTestDb, seedAll, testChars, type Sqlite } from '../helpers/testDb.ts'

const sqlite: Sqlite = createTestDb()
seedAll(sqlite)

const app = express()
app.use(express.json())
app.use('/api/characters', createCharactersRouter(sqlite))

afterAll(() => sqlite.close())

describe('GET /api/characters', () => {
  beforeEach(() => {
    resetTestDb(sqlite)
    seedAll(sqlite)
  })

  it('returns 200 with all characters', async () => {
    const res = await supertest(app).get('/api/characters')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(3)
  })

  it('each character has expected shape', async () => {
    const res = await supertest(app).get('/api/characters')
    const luke = res.body.find((c: { name: string }) => c.name === 'Luke Skywalker')
    expect(luke).toBeDefined()
    expect(luke.id).toBe(1)
    expect(luke.characterType).toBe('Hero')
    expect(luke.unitType).toBe('Primary')
    expect(luke.sp).toBe(5)
    expect(luke.pc).toBeNull()
    expect(luke.era).toBe('Galactic Civil War')
    expect(luke.stances).toEqual([])
  })

  it('includes tags array for each character', async () => {
    const res = await supertest(app).get('/api/characters')
    const luke = res.body.find((c: { name: string }) => c.name === 'Luke Skywalker')
    expect(luke.tags).toEqual(['Rebel', 'Jedi'])
  })

  it('includes optional fields when present', async () => {
    const res = await supertest(app).get('/api/characters')
    const luke = res.body.find((c: { name: string }) => c.name === 'Luke Skywalker')
    expect(luke.swpCode).toBe('SWP01')
    expect(luke.spt).toBe('00010101')
    expect(luke.orderCard).toBe('/images/luke_order.png')
    expect(luke.stance1).toBe('/images/luke_s1.png')
    expect(luke.stance2).toBe('/images/luke_s2.png')
    expect(luke.model).toBe('/images/luke_model.png')
    expect(luke.modelCount).toBe(1)
  })

  it('filters by era', async () => {
    const res = await supertest(app).get('/api/characters?era=Clone+Wars')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('R2-D2')
  })

  it('returns empty array for unknown era', async () => {
    const res = await supertest(app).get('/api/characters?era=Unknown+Era')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })

  it('filters by unit type', async () => {
    const res = await supertest(app).get('/api/characters?type=Secondary')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('R2-D2')
  })

  it('filters by type=Support', async () => {
    const res = await supertest(app).get('/api/characters?type=Support')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('Han Solo')
  })

  it('filters by tag', async () => {
    const res = await supertest(app).get('/api/characters?tag=Rebel')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    const names = res.body.map((c: { name: string }) => c.name)
    expect(names).toContain('Luke Skywalker')
    expect(names).toContain('Han Solo')
  })

  it('returns empty array for tag with no matches', async () => {
    const res = await supertest(app).get('/api/characters?tag=Sith')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })

  it('filters by swp code', async () => {
    const res = await supertest(app).get('/api/characters?swp=SWP01')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    const names = res.body.map((c: { name: string }) => c.name)
    expect(names).toContain('Luke Skywalker')
    expect(names).toContain('Han Solo')
  })

  it('can combine era and type filters', async () => {
    const res = await supertest(app).get('/api/characters?era=Galactic+Civil+War&type=Support')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('Han Solo')
  })

  it('tag filter respects other active filters', async () => {
    const res = await supertest(app).get('/api/characters?era=Galactic+Civil+War&tag=Rebel')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })
})

describe('GET /api/characters/:id', () => {
  beforeEach(() => {
    resetTestDb(sqlite)
    seedAll(sqlite)
  })

  it('returns a character by id', async () => {
    const res = await supertest(app).get('/api/characters/1')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Luke Skywalker')
  })

  it('includes tags in single-character response', async () => {
    const res = await supertest(app).get('/api/characters/1')
    expect(res.body.tags).toEqual(['Rebel', 'Jedi'])
  })

  it('returns secondary character with pc and null sp', async () => {
    const res = await supertest(app).get('/api/characters/2')
    expect(res.status).toBe(200)
    expect(res.body.unitType).toBe('Secondary')
    expect(res.body.pc).toBe(3)
    expect(res.body.sp).toBeNull()
  })

  it('returns 404 for unknown id', async () => {
    const res = await supertest(app).get('/api/characters/9999')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Not found')
  })

  it('returns 404 for non-numeric id', async () => {
    const res = await supertest(app).get('/api/characters/abc')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Not found')
  })

  it('character without optional fields returns undefined for those fields', async () => {
    const res = await supertest(app).get('/api/characters/2')
    expect(res.body.spt).toBeUndefined()
    expect(res.body.orderCard).toBeUndefined()
    expect(res.body.stance1).toBeUndefined()
    expect(res.body.model).toBeUndefined()
  })
})

describe('GET /api/characters — DB error', () => {
  it('returns 500 when the database throws', async () => {
    const brokenDb = createTestDb()
    brokenDb.close()
    const errorApp = express()
    errorApp.use(express.json())
    errorApp.use('/api/characters', createCharactersRouter(brokenDb))
    const res = await supertest(errorApp).get('/api/characters')
    expect(res.status).toBe(500)
  })
})

describe('rowToCharacter (unit)', () => {
  it('maps database row to response object', async () => {
    const { rowToCharacter } = await import('../../../../server/routes/characters.ts')
    const row = {
      id: 10,
      name: 'Test',
      character_type: 'Villain',
      unit_type: 'Primary',
      unit_type_name: null,
      pc: null,
      sp: 4,
      durability: 3,
      stamina: 5,
      fp: 1,
      era: 'Old Republic',
      swp: 'SWP10',
      swp_code: 'SWP10',
      spt: null,
      thumbnail: '/images/t.png',
      card_front: '/images/tf.png',
      card_back: '/images/tb.png',
      order_card: null,
      stance1: null,
      stance2: null,
      model: null,
      model_count: null,
      character_exclusion: null,
      extra_cards: null,
      release_date: '2024-01-01',
    }
    const result = rowToCharacter(row, ['Force'])
    expect(result.id).toBe(10)
    expect(result.tags).toEqual(['Force'])
    expect(result.stances).toEqual([])
    expect(result.sp).toBe(4)
    expect(result.spt).toBeUndefined()
  })
})
