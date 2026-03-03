// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import { createProductsRouter } from '../../../../server/routes/products.ts'
import { createTestDb, resetTestDb, seedAll, type Sqlite } from '../helpers/testDb.ts'

const sqlite: Sqlite = createTestDb()
seedAll(sqlite)

const app = express()
app.use(express.json())
app.use('/api/products', createProductsRouter(sqlite))

afterAll(() => sqlite.close())

describe('GET /api/products', () => {
  beforeEach(() => {
    resetTestDb(sqlite)
    seedAll(sqlite)
  })

  it('returns 200 with all products', async () => {
    const res = await supertest(app).get('/api/products')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('each product has expected shape', async () => {
    const res = await supertest(app).get('/api/products')
    const starter = res.body.find((p: { name: string }) => p.name === 'Starter Set')
    expect(starter).toBeDefined()
    expect(starter.id).toBe(1)
    expect(starter.swp).toBe('SWP01')
    expect(starter.era).toBe('Galactic Civil War')
    expect(starter.description).toBe('The starter set')
    expect(starter.thumbnail).toBe('/images/starter.png')
  })

  it('includes images array joined from product_images', async () => {
    const res = await supertest(app).get('/api/products')
    const starter = res.body.find((p: { name: string }) => p.name === 'Starter Set')
    expect(starter.images).toEqual(['/images/starter1.jpg', '/images/starter2.jpg'])
  })

  it('includes models array joined from product_models', async () => {
    const res = await supertest(app).get('/api/products')
    const starter = res.body.find((p: { name: string }) => p.name === 'Starter Set')
    expect(starter.models).toEqual(['Luke Skywalker', 'Darth Vader'])
  })

  it('includes optional number field when present', async () => {
    const res = await supertest(app).get('/api/products')
    const starter = res.body.find((p: { name: string }) => p.name === 'Starter Set')
    expect(starter.number).toBe('01')
  })

  it('includes optional mainImage field when present', async () => {
    const res = await supertest(app).get('/api/products')
    const starter = res.body.find((p: { name: string }) => p.name === 'Starter Set')
    expect(starter.mainImage).toBe('/images/starter_main.png')
  })

  it('number and mainImage are undefined when absent', async () => {
    const res = await supertest(app).get('/api/products')
    const cwp = res.body.find((p: { name: string }) => p.name === 'Clone Wars Pack')
    expect(cwp.number).toBeUndefined()
    expect(cwp.mainImage).toBeUndefined()
  })

  it('returns empty images and models arrays when none exist', async () => {
    const res = await supertest(app).get('/api/products')
    const cwp = res.body.find((p: { name: string }) => p.name === 'Clone Wars Pack')
    expect(cwp.images).toEqual([])
    // Clone Wars Pack has one model
    expect(cwp.models).toEqual(['R2-D2'])
  })

  it('filters by era', async () => {
    const res = await supertest(app).get('/api/products?era=Clone+Wars')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('Clone Wars Pack')
  })

  it('returns empty array for unknown era', async () => {
    const res = await supertest(app).get('/api/products?era=Unknown')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })
})

describe('GET /api/products/:id', () => {
  beforeEach(() => {
    resetTestDb(sqlite)
    seedAll(sqlite)
  })

  it('returns a product by id', async () => {
    const res = await supertest(app).get('/api/products/1')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Starter Set')
  })

  it('includes images and models in single product response', async () => {
    const res = await supertest(app).get('/api/products/1')
    expect(res.body.images).toHaveLength(2)
    expect(res.body.models).toHaveLength(2)
  })

  it('images are in correct display order', async () => {
    const res = await supertest(app).get('/api/products/1')
    expect(res.body.images[0]).toBe('/images/starter1.jpg')
    expect(res.body.images[1]).toBe('/images/starter2.jpg')
  })

  it('models are in correct display order', async () => {
    const res = await supertest(app).get('/api/products/1')
    expect(res.body.models[0]).toBe('Luke Skywalker')
    expect(res.body.models[1]).toBe('Darth Vader')
  })

  it('returns 404 for unknown id', async () => {
    const res = await supertest(app).get('/api/products/9999')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Not found')
  })

  it('returns 404 for non-numeric id', async () => {
    const res = await supertest(app).get('/api/products/bad')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Not found')
  })
})

describe('GET /api/products — DB error', () => {
  it('returns 500 when the database throws', async () => {
    const brokenDb = createTestDb()
    brokenDb.close()
    const errorApp = express()
    errorApp.use(express.json())
    errorApp.use('/api/products', createProductsRouter(brokenDb))
    const res = await supertest(errorApp).get('/api/products')
    expect(res.status).toBe(500)
  })
})

describe('rowToProduct (unit)', () => {
  it('maps row to product object', async () => {
    const { rowToProduct } = await import('../../../../server/routes/products.ts')
    const row = {
      id: 99,
      name: 'Test Pack',
      swp: 'SWP99',
      number: null,
      era: 'High Republic',
      description: 'A pack',
      thumbnail: '/images/t.png',
      main_image: null,
      assembly_url: '',
      store_link: '',
    }
    const result = rowToProduct(row, ['/images/a.png'], ['Obi-Wan'])
    expect(result.id).toBe(99)
    expect(result.number).toBeUndefined()
    expect(result.mainImage).toBeUndefined()
    expect(result.images).toEqual(['/images/a.png'])
    expect(result.models).toEqual(['Obi-Wan'])
  })
})
