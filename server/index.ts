import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { sqlite } from './db/index.ts'
import { createCharactersRouter } from './routes/characters.ts'
import { createMissionsRouter } from './routes/missions.ts'
import { createProductsRouter } from './routes/products.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT ?? 3001

const app = express()

app.use(cors())
app.use(express.json())

// Serve images from public/images/
app.use('/images', express.static(join(__dirname, '..', 'public', 'images')))

// API routes
app.use('/api/characters', createCharactersRouter(sqlite))
app.use('/api/missions', createMissionsRouter(sqlite))
app.use('/api/products', createProductsRouter(sqlite))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`ShatterApp API server running on http://localhost:${PORT}`)
})
