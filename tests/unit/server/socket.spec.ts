// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { io as ioc } from 'socket.io-client'
import type { Socket as ClientSocket } from 'socket.io-client'

// Minimal server setup (mirrors server/index.ts socket logic but no Express/DB)
function createTestServer() {
  const httpServer = createServer()
  const ioServer = new Server(httpServer, { cors: { origin: '*' } })

  // Import rooms inline (fresh copy via dynamic import is not needed here —
  // we just use a local Map to avoid polluting the module singleton)
  const rooms = new Map<string, { code: string; host: { socketId: string; disconnectedAt?: number }; guest?: { socketId: string; disconnectedAt?: number }; gracePeriod?: ReturnType<typeof setTimeout> }>()
  const socketToRoom = new Map<string, string>()

  function genCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let code: string
    do { code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * 26)]).join('') }
    while (rooms.has(code))
    return code
  }

  ioServer.on('connection', (socket) => {
    socket.on('create-room', (_: unknown, ack: (a: { code: string }) => void) => {
      const code = genCode()
      rooms.set(code, { code, host: { socketId: socket.id } })
      socketToRoom.set(socket.id, code)
      socket.join(code)
      if (typeof ack === 'function') ack({ code })
    })

    socket.on('join-room', ({ code }: { code: string }, ack: (a: { role: string | null; error?: string }) => void) => {
      const room = rooms.get(code)
      if (!room) { ack({ role: null, error: 'not-found' }); return }
      if (room.guest && !room.guest.disconnectedAt) { ack({ role: null, error: 'full' }); return }
      room.guest = { socketId: socket.id }
      socketToRoom.set(socket.id, code)
      socket.join(code)
      ack({ role: 'guest' })
      socket.to(code).emit('player-joined')
    })

    socket.on('sync-units', (payload: unknown) => {
      const code = socketToRoom.get(socket.id)
      if (!code) return
      const room = rooms.get(code)
      if (!room) return
      const oppId = room.host.socketId === socket.id ? room.guest?.socketId : room.host.socketId
      if (oppId) ioServer.to(oppId).emit('opponent-units', payload)
    })

    socket.on('disconnect', () => {
      const code = socketToRoom.get(socket.id)
      if (!code) return
      const room = rooms.get(code)
      if (!room) return
      socketToRoom.delete(socket.id)
      const oppId = room.host.socketId === socket.id ? room.guest?.socketId : room.host.socketId
      if (room.host.socketId === socket.id) room.host.disconnectedAt = Date.now()
      else if (room.guest?.socketId === socket.id) room.guest.disconnectedAt = Date.now()
      room.gracePeriod = setTimeout(() => { rooms.delete(code) }, 30_000)
      if (oppId) ioServer.to(oppId).emit('opponent-left')
    })
  })

  return { httpServer, ioServer }
}

let port: number
let ioServer: Server
let hostSocket: ClientSocket
let guestSocket: ClientSocket

function connectClient(p: number): Promise<ClientSocket> {
  return new Promise((resolve) => {
    const s = ioc(`http://localhost:${p}`, { autoConnect: false })
    s.connect()
    s.once('connect', () => resolve(s))
  })
}

beforeAll(async () => {
  const { httpServer, ioServer: srv } = createTestServer()
  ioServer = srv
  await new Promise<void>((resolve) => httpServer.listen(0, resolve))
  port = (httpServer.address() as { port: number }).port
})

afterAll(() => {
  hostSocket?.disconnect()
  guestSocket?.disconnect()
  ioServer.close()
})

describe('socket integration', () => {
  it('host creates room and receives code', async () => {
    hostSocket = await connectClient(port)
    const code: string = await new Promise((resolve) => {
      hostSocket.emit('create-room', null, (ack: { code: string }) => resolve(ack.code))
    })
    expect(code).toMatch(/^[A-Z]{4}$/)

    // Guest joins
    guestSocket = await connectClient(port)
    const joinResult: { role: string | null } = await new Promise((resolve) => {
      guestSocket.emit('join-room', { code }, (ack: { role: string | null }) => resolve(ack))
    })
    expect(joinResult.role).toBe('guest')
  })

  it('both players receive player-joined', async () => {
    const host2 = await connectClient(port)
    const guest2 = await connectClient(port)

    const code: string = await new Promise((resolve) => {
      host2.emit('create-room', null, (ack: { code: string }) => resolve(ack.code))
    })

    const joinedPromise = new Promise<void>((resolve) => {
      host2.once('player-joined', () => resolve())
    })

    guest2.emit('join-room', { code }, () => {})
    await joinedPromise

    host2.disconnect()
    guest2.disconnect()
  })

  it('host sync-units relays opponent-units to guest', async () => {
    const host3 = await connectClient(port)
    const guest3 = await connectClient(port)

    const code: string = await new Promise((resolve) => {
      host3.emit('create-room', null, (ack: { code: string }) => resolve(ack.code))
    })
    await new Promise<void>((resolve) => {
      guest3.emit('join-room', { code }, () => resolve())
    })

    const receivedPromise = new Promise((resolve) => {
      guest3.once('opponent-units', (data) => resolve(data))
    })

    host3.emit('sync-units', { units: [{ id: 1, name: 'Test' }] })
    const received = await receivedPromise
    expect((received as { units: { id: number }[] }).units[0].id).toBe(1)

    host3.disconnect()
    guest3.disconnect()
  })

  it('host disconnect sends opponent-left to guest', async () => {
    const host4 = await connectClient(port)
    const guest4 = await connectClient(port)

    const code: string = await new Promise((resolve) => {
      host4.emit('create-room', null, (ack: { code: string }) => resolve(ack.code))
    })
    await new Promise<void>((resolve) => {
      guest4.emit('join-room', { code }, () => resolve())
    })

    const leftPromise = new Promise<void>((resolve) => {
      guest4.once('opponent-left', () => resolve())
    })

    host4.disconnect()
    await leftPromise

    guest4.disconnect()
  }, 10_000)
})
