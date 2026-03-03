// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import { createMissionsRouter } from '../../../../server/routes/missions.ts'
import { createTestDb, resetTestDb, seedAll, type Sqlite } from '../helpers/testDb.ts'

const sqlite: Sqlite = createTestDb()
seedAll(sqlite)

const app = express()
app.use(express.json())
app.use('/api/missions', createMissionsRouter(sqlite))

afterAll(() => sqlite.close())

describe('GET /api/missions', () => {
  beforeEach(() => {
    resetTestDb(sqlite)
    seedAll(sqlite)
  })

  it('returns 200 with all missions', async () => {
    const res = await supertest(app).get('/api/missions')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('missions are ordered by id', async () => {
    const res = await supertest(app).get('/api/missions')
    expect(res.body[0].id).toBe(1)
    expect(res.body[1].id).toBe(2)
  })

  it('each mission has expected shape', async () => {
    const res = await supertest(app).get('/api/missions')
    const m = res.body[0]
    expect(m.id).toBe(1)
    expect(m.name).toBe('Outer Rim Siege')
    expect(m.swp).toBe('SWP01: Starter Set')
    expect(m.card).toBe('/images/ors.png')
  })

  it('includes spt when present', async () => {
    const res = await supertest(app).get('/api/missions')
    expect(res.body[0].spt).toBe('00010001')
  })

  it('spt is undefined when absent', async () => {
    const res = await supertest(app).get('/api/missions')
    expect(res.body[1].spt).toBeUndefined()
  })

  it('struggle arrays are properly structured', async () => {
    const res = await supertest(app).get('/api/missions')
    const m = res.body[0]
    expect(m.struggles).toBeDefined()
    expect(m.struggles.struggle1).toEqual(['/images/s1a.png', '/images/s1b.png', '/images/s1c.png'])
    expect(m.struggles.struggle2).toEqual(['/images/s2a.png', '/images/s2b.png', '/images/s2c.png'])
    expect(m.struggles.struggle3).toEqual(['/images/s3a.png', '/images/s3b.png', '/images/s3c.png'])
  })

  it('partial struggle arrays only include non-null values', async () => {
    const res = await supertest(app).get('/api/missions')
    const m = res.body[1] // Temple Assault has only 1 struggle1 image
    expect(m.struggles.struggle1).toEqual(['/images/ta_s1a.png'])
    expect(m.struggles.struggle2).toEqual([])
    expect(m.struggles.struggle3).toEqual([])
  })
})

describe('GET /api/missions/:id', () => {
  beforeEach(() => {
    resetTestDb(sqlite)
    seedAll(sqlite)
  })

  it('returns a mission by id', async () => {
    const res = await supertest(app).get('/api/missions/1')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Outer Rim Siege')
  })

  it('returns struggles as nested object with arrays', async () => {
    const res = await supertest(app).get('/api/missions/1')
    expect(res.body.struggles).toHaveProperty('struggle1')
    expect(res.body.struggles).toHaveProperty('struggle2')
    expect(res.body.struggles).toHaveProperty('struggle3')
    expect(Array.isArray(res.body.struggles.struggle1)).toBe(true)
  })

  it('returns second mission by id', async () => {
    const res = await supertest(app).get('/api/missions/2')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Temple Assault')
  })

  it('returns 404 for unknown id', async () => {
    const res = await supertest(app).get('/api/missions/9999')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Not found')
  })

  it('returns 404 for non-numeric id', async () => {
    const res = await supertest(app).get('/api/missions/bad')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Not found')
  })
})

describe('rowToMission (unit)', () => {
  it('maps row to mission with full struggle arrays', async () => {
    const { rowToMission } = await import('../../../../server/routes/missions.ts')
    const row = {
      id: 5,
      name: 'Test Mission',
      swp: 'SWP05',
      spt: null,
      card: '/images/m5.png',
      struggle1a: '/images/a.png',
      struggle1b: '/images/b.png',
      struggle1c: '/images/c.png',
      struggle2a: '/images/d.png',
      struggle2b: null,
      struggle2c: null,
      struggle3a: null,
      struggle3b: null,
      struggle3c: null,
    }
    const result = rowToMission(row)
    expect(result.struggles.struggle1).toHaveLength(3)
    expect(result.struggles.struggle2).toHaveLength(1)
    expect(result.struggles.struggle3).toHaveLength(0)
    expect(result.spt).toBeUndefined()
  })
})
