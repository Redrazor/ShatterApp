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
import { createRoom, joinRoom, rejoinRoom, removePlayer, deleteRoom, getRoomBySocket, getOpponentSocketId, setPlayerName, getOpponentName, claimDuelRole, clearDuelRole } from './rooms.ts'

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
  socket.on('create-room', (payload: { name?: string } | null, ack) => {
    const code = createRoom(socket.id, payload?.name)
    socket.join(code)
    if (typeof ack === 'function') ack({ code })
  })

  socket.on('join-room', ({ code, name }: { code: string; name?: string }, ack) => {
    // Try rejoin first (handles disconnected host or guest within grace period)
    const rejoinRole = rejoinRoom(code, socket.id)
    if (rejoinRole) {
      socket.join(code.toUpperCase())
      const room = getRoomBySocket(socket.id)
      const opponentOnline = room
        ? rejoinRole === 'host'
          ? !!(room.guest && !room.guest.disconnectedAt)
          : !room.host.disconnectedAt
        : false
      const opponentName = room ? getOpponentName(room, socket.id) : undefined
      if (typeof ack === 'function') ack({ role: rejoinRole, opponentOnline, opponentName })
      if (opponentOnline) {
        const myName = room ? (rejoinRole === 'host' ? room.host.name : room.guest?.name) : undefined
        socket.to(code.toUpperCase()).emit('player-joined', { name: myName })
      }
      return
    }

    const result = joinRoom(code, socket.id, name)
    if (result === 'not-found') {
      if (typeof ack === 'function') ack({ role: null, error: 'Room not found' })
      return
    }
    if (result === 'full') {
      if (typeof ack === 'function') ack({ role: null, error: 'Room is full' })
      return
    }
    socket.join(code.toUpperCase())
    const room = getRoomBySocket(socket.id)
    const opponentName = room ? getOpponentName(room, socket.id) : undefined
    if (typeof ack === 'function') ack({ role: result, opponentOnline: true, opponentName })
    socket.to(code.toUpperCase()).emit('player-joined', { name })
  })

  socket.on('rejoin-room', ({ code }: { code: string }, ack) => {
    const role = rejoinRoom(code, socket.id)
    if (!role) {
      if (typeof ack === 'function') ack({ role: null, error: 'Cannot rejoin' })
      return
    }
    socket.join(code.toUpperCase())
    const room = getRoomBySocket(socket.id)
    const opponentName = room ? getOpponentName(room, socket.id) : undefined
    if (typeof ack === 'function') ack({ role, opponentName })
    const myName = room ? (role === 'host' ? room.host.name : room.guest?.name) : undefined
    socket.to(code.toUpperCase()).emit('player-joined', { name: myName })
  })

  socket.on('leave-room', () => {
    const result = removePlayer(socket.id)
    if (!result) return
    const { code, room } = result
    const opponentId = getOpponentSocketId(room, socket.id)
    deleteRoom(code)
    if (opponentId) io.to(opponentId).emit('session-ended')
    socket.disconnect()
  })

  socket.on('sync-units', (payload) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    const opponentId = getOpponentSocketId(room, socket.id)
    if (opponentId) io.to(opponentId).emit('opponent-units', payload)
  })

  socket.on('sync-tracker', (payload) => {
    const room = getRoomBySocket(socket.id)
    console.log(`[sync-tracker] from=${socket.id} room=${room?.code} payload=${JSON.stringify(payload)}`)
    if (!room) return
    const opponentId = getOpponentSocketId(room, socket.id)
    console.log(`[sync-tracker] opponentId=${opponentId}`)
    if (opponentId) io.to(opponentId).emit('tracker-update', payload)
  })

  socket.on('set-player-name', ({ name }: { name: string }) => {
    setPlayerName(socket.id, name)
    const room = getRoomBySocket(socket.id)
    if (!room) return
    const opponentId = getOpponentSocketId(room, socket.id)
    if (opponentId) io.to(opponentId).emit('opponent-name', { name })
  })

  socket.on('claim-role', ({ role }: { role: 'attacker' | 'defender' }) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    // Reject if the role is already taken
    if (!claimDuelRole(room.code, role)) return
    // Broadcast to whole room so both players know the role is taken
    io.to(room.code).emit('role-taken', { role })
    // Confirm role back to claimer
    socket.emit('role-assigned', { role })
    // Auto-assign opposite role to opponent
    const opponentId = getOpponentSocketId(room, socket.id)
    if (opponentId) io.to(opponentId).emit('role-assigned', { role: role === 'attacker' ? 'defender' : 'attacker' })
  })

  socket.on('pool-update', (payload) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    const opponentId = getOpponentSocketId(room, socket.id)
    if (opponentId) io.to(opponentId).emit('opponent-pool-update', payload)
  })

  socket.on('reset-duel', () => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    clearDuelRole(room.code)
    socket.to(room.code).emit('roles-reset')
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
