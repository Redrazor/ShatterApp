import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { sqlite } from './db/index.ts'
import { runSeed } from './db/seed.ts'
import { createCharactersRouter } from './routes/characters.ts'
import { createMissionsRouter } from './routes/missions.ts'
import { createProductsRouter } from './routes/products.ts'
import { createRoom, joinRoom, rejoinRoom, removePlayer, getRoomBySocket, getOpponentSocketId } from './rooms.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT ?? 3001

runSeed(sqlite)

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })

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

// ── Socket.io handlers ──────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('create-room', (_, ack) => {
    const code = createRoom(socket.id)
    socket.join(code)
    if (typeof ack === 'function') ack({ code })
  })

  socket.on('join-room', ({ code }: { code: string }, ack) => {
    const result = joinRoom(code, socket.id)
    if (result === 'not-found') {
      if (typeof ack === 'function') ack({ role: null, error: 'Room not found' })
      return
    }
    if (result === 'full') {
      if (typeof ack === 'function') ack({ role: null, error: 'Room is full' })
      return
    }
    socket.join(code.toUpperCase())
    if (typeof ack === 'function') ack({ role: result })
    socket.to(code.toUpperCase()).emit('player-joined')
  })

  socket.on('rejoin-room', ({ code }: { code: string }, ack) => {
    const role = rejoinRoom(code, socket.id)
    if (!role) {
      if (typeof ack === 'function') ack({ role: null, error: 'Cannot rejoin' })
      return
    }
    socket.join(code.toUpperCase())
    if (typeof ack === 'function') ack({ role })
    socket.to(code.toUpperCase()).emit('player-joined')
  })

  socket.on('sync-units', (payload) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    const opponentId = getOpponentSocketId(room, socket.id)
    if (opponentId) io.to(opponentId).emit('opponent-units', payload)
  })

  socket.on('sync-tracker', (payload) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    const opponentId = getOpponentSocketId(room, socket.id)
    if (opponentId) io.to(opponentId).emit('tracker-update', payload)
  })

  socket.on('dice-result', (payload) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    const opponentId = getOpponentSocketId(room, socket.id)
    if (opponentId) io.to(opponentId).emit('opponent-dice', payload)
  })

  socket.on('disconnect', () => {
    const result = removePlayer(socket.id)
    if (!result) return
    const { code, room } = result
    const opponentId = getOpponentSocketId(room, socket.id)
    if (opponentId) io.to(opponentId).emit('opponent-left')
  })
})

httpServer.listen(PORT, () => {
  console.log(`ShatterApp API server running on http://localhost:${PORT}`)
})
