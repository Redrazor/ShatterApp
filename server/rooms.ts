interface RoomPlayer {
  socketId: string
  disconnectedAt?: number
}

interface Room {
  code: string
  host: RoomPlayer
  guest?: RoomPlayer
  gracePeriod?: ReturnType<typeof setTimeout>
}

const rooms = new Map<string, Room>()
// Reverse index: socketId → room code
const socketToRoom = new Map<string, string>()

export function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code: string
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * 26)]).join('')
  } while (rooms.has(code))
  return code
}

export function createRoom(socketId: string): string {
  const code = generateCode()
  rooms.set(code, { code, host: { socketId } })
  socketToRoom.set(socketId, code)
  return code
}

export function joinRoom(code: string, socketId: string): 'host' | 'guest' | 'full' | 'not-found' {
  const room = rooms.get(code.toUpperCase())
  if (!room) return 'not-found'
  if (room.guest && !room.guest.disconnectedAt) return 'full'
  // Allow joining as guest (or rejoining as guest)
  room.guest = { socketId }
  socketToRoom.set(socketId, code.toUpperCase())
  return 'guest'
}

export function rejoinRoom(code: string, socketId: string): 'host' | 'guest' | null {
  const room = rooms.get(code.toUpperCase())
  if (!room) return null

  // Check if host disconnected
  if (room.host.disconnectedAt !== undefined) {
    // Clear any grace period
    if (room.gracePeriod) {
      clearTimeout(room.gracePeriod)
      room.gracePeriod = undefined
    }
    room.host = { socketId }
    socketToRoom.set(socketId, code.toUpperCase())
    return 'host'
  }

  // Check if guest disconnected
  if (room.guest?.disconnectedAt !== undefined) {
    if (room.gracePeriod) {
      clearTimeout(room.gracePeriod)
      room.gracePeriod = undefined
    }
    room.guest = { socketId }
    socketToRoom.set(socketId, code.toUpperCase())
    return 'guest'
  }

  return null
}

export function removePlayer(socketId: string): { code: string; role: 'host' | 'guest'; room: Room } | null {
  const code = socketToRoom.get(socketId)
  if (!code) return null

  const room = rooms.get(code)
  if (!room) return null

  socketToRoom.delete(socketId)

  let role: 'host' | 'guest'
  if (room.host.socketId === socketId) {
    role = 'host'
    room.host.disconnectedAt = Date.now()
  } else if (room.guest?.socketId === socketId) {
    role = 'guest'
    room.guest.disconnectedAt = Date.now()
  } else {
    return null
  }

  // Schedule room cleanup after grace period
  room.gracePeriod = setTimeout(() => {
    rooms.delete(code)
    // Clean up the remaining player's socket mapping
    if (room.host.socketId) socketToRoom.delete(room.host.socketId)
    if (room.guest?.socketId) socketToRoom.delete(room.guest.socketId)
  }, 30_000)

  return { code, role, room }
}

export function getRoomBySocket(socketId: string): Room | null {
  const code = socketToRoom.get(socketId)
  if (!code) return null
  return rooms.get(code) ?? null
}

export function getOpponentSocketId(room: Room, mySocketId: string): string | null {
  if (room.host.socketId === mySocketId) return room.guest?.socketId ?? null
  if (room.guest?.socketId === mySocketId) return room.host.socketId
  return null
}
