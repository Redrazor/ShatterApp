import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, copyFileSync, mkdirSync, existsSync } from 'fs'
import { sqlite } from './db/index.ts'
import { runSeed } from './db/seed.ts'
import { createCharactersRouter } from './routes/characters.ts'
import { createMissionsRouter } from './routes/missions.ts'
import { createProductsRouter } from './routes/products.ts'
import { createRoom, joinRoom, rejoinRoom, removePlayer, leaveRoom, deleteRoom, getRoomBySocket, getOpponentSocketId, setPlayerName, getOpponentName, claimDuelRole, clearDuelRole, selectTeam, isMatchReady } from './rooms.ts'
import type { Room, RoomMode, Team } from './rooms.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT ?? 3001

runSeed(sqlite)

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json({ limit: '5mb' }))

// Serve images from public/images/
app.use('/images', express.static(join(__dirname, '..', 'public', 'images')))

// API routes
app.use('/api/characters', createCharactersRouter(sqlite))
app.use('/api/missions', createMissionsRouter(sqlite))
app.use('/api/products', createProductsRouter(sqlite))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// ── Audit tool: save abilities.json with backup ─────────────────
app.put('/api/abilities', (req, res) => {
  try {
    const abilitiesPath = join(__dirname, '..', 'public', 'data', 'abilities.json')
    const backupDir = join(__dirname, '..', 'public', 'data', 'backups')
    if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    copyFileSync(abilitiesPath, join(backupDir, `abilities-${timestamp}.json`))
    writeFileSync(abilitiesPath, JSON.stringify(req.body, null, 2) + '\n')
    res.json({ ok: true, backup: `abilities-${timestamp}.json` })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    res.status(500).json({ ok: false, error: msg })
  }
})

// ── Socket.io handlers ──────────────────────────────────────────
function serializePlayers(room: Room) {
  return room.players.map((p) => ({
    socketId: p.socketId,
    name: p.name,
    team: p.team,
    connected: !p.disconnectedAt,
  }))
}

/** Broadcast room membership/team state to everyone in the room (2v2 lobby sync). */
function broadcastRoomUpdate(room: Room) {
  io.to(room.code).emit('room-update', {
    players: serializePlayers(room),
    mode: room.mode,
    ready: isMatchReady(room),
  })
}

io.on('connection', (socket) => {
  socket.on('create-room', (payload: { name?: string; mode?: RoomMode } | null, ack) => {
    const mode: RoomMode = payload?.mode === '2v2' ? '2v2' : '1v1'
    const code = createRoom(socket.id, payload?.name, mode)
    socket.join(code)
    if (typeof ack === 'function') ack({ code, mode })
  })

  socket.on('select-team', ({ team }: { team: Team }, ack) => {
    const room = getRoomBySocket(socket.id)
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'not-in-room' })
      return
    }
    const result = selectTeam(room.code, socket.id, team)
    if (typeof ack === 'function') {
      ack(result.ok ? { ok: true, players: serializePlayers(room) } : result)
    }
    if (result.ok) broadcastRoomUpdate(room)
  })

  socket.on('join-room', ({ code, name }: { code: string; name?: string }, ack) => {
    // Try rejoin first (handles disconnected host or guest within grace period)
    const rejoinRole = rejoinRoom(code, socket.id)
    if (rejoinRole) {
      socket.join(code.toUpperCase())
      if (name) setPlayerName(socket.id, name)
      const room = getRoomBySocket(socket.id)
      const opponentOnline = room
        ? rejoinRole === 'host'
          ? !!(room.guest && !room.guest.disconnectedAt)
          : !room.host.disconnectedAt
        : false
      const opponentName = room ? getOpponentName(room, socket.id) : undefined
      if (typeof ack === 'function') ack({
        role: rejoinRole,
        opponentOnline,
        opponentName,
        mode: room?.mode,
        players: room ? serializePlayers(room) : [],
      })
      if (opponentOnline) {
        const myName = name ?? (room ? (rejoinRole === 'host' ? room.host.name : room.guest?.name) : undefined)
        socket.to(code.toUpperCase()).emit('player-joined', { name: myName })
      }
      if (room) broadcastRoomUpdate(room)
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
    if (typeof ack === 'function') ack({
      role: result,
      opponentOnline: true,
      opponentName,
      mode: room?.mode,
      players: room ? serializePlayers(room) : [],
    })
    socket.to(code.toUpperCase()).emit('player-joined', { name })
    if (room) broadcastRoomUpdate(room)
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
    const room = getRoomBySocket(socket.id)
    if (!room) return
    if (room.mode === '2v2') {
      // Free the team slot immediately for a new joiner; keep the room alive
      // for the remaining players.
      const result = leaveRoom(socket.id)
      if (result) {
        socket.to(room.code).emit('player-left', { from: socket.id })
        if (result.empty) deleteRoom(room.code)
        else broadcastRoomUpdate(room)
      }
      socket.disconnect()
      return
    }
    // 1v1: a leave ends the session for both players.
    const result = removePlayer(socket.id)
    if (!result) return
    const { code, room: r } = result
    const opponentId = getOpponentSocketId(r, socket.id)
    deleteRoom(code)
    if (opponentId) io.to(opponentId).emit('session-ended')
    socket.disconnect()
  })

  socket.on('sync-units', (payload) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    socket.to(room.code).emit('opponent-units', { ...payload, from: socket.id })
  })

  socket.on('sync-tracker', (payload) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    socket.to(room.code).emit('tracker-update', { ...payload, from: socket.id })
  })

  socket.on('sync-order-deck', (payload) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    socket.to(room.code).emit('order-deck-update', { ...payload, from: socket.id })
  })

  socket.on('set-player-name', ({ name }: { name: string }) => {
    setPlayerName(socket.id, name)
    const room = getRoomBySocket(socket.id)
    if (!room) return
    socket.to(room.code).emit('opponent-name', { name, from: socket.id })
  })

  socket.on('claim-role', ({ role, unitId }: { role: 'attacker' | 'defender'; unitId?: number | null }) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    // Reject if the role is already taken
    if (!claimDuelRole(room.code, role)) return
    // Broadcast to whole room so both players know the role is taken (including unitId for stance display)
    io.to(room.code).emit('role-taken', { role, unitId: unitId ?? null })
    // Confirm role back to claimer
    socket.emit('role-assigned', { role })
    // Auto-assign opposite role to opponent
    const opponentId = getOpponentSocketId(room, socket.id)
    if (opponentId) io.to(opponentId).emit('role-assigned', { role: role === 'attacker' ? 'defender' : 'attacker' })
  })

  socket.on('pool-update', (payload) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    socket.to(room.code).emit('opponent-pool-update', { ...payload, from: socket.id })
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
    const { room } = result
    if (room.mode === '2v2') {
      socket.to(room.code).emit('opponent-left', { from: socket.id })
      broadcastRoomUpdate(room)
    } else {
      const opponentId = getOpponentSocketId(room, socket.id)
      if (opponentId) io.to(opponentId).emit('opponent-left')
    }
  })
})

httpServer.listen(PORT, () => {
  console.log(`ShatterApp API server running on http://localhost:${PORT}`)
})
