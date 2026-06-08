export type RoomMode = '1v1' | '2v2'
export type Team = 'red' | 'blue'

export interface RoomPlayer {
  socketId: string
  name?: string
  team?: Team
  disconnectedAt?: number
  gracePeriod?: ReturnType<typeof setTimeout>
}

export interface Room {
  code: string
  mode: RoomMode
  players: RoomPlayer[]
  gracePeriod?: ReturnType<typeof setTimeout>
  duelRoles: Set<'attacker' | 'defender'>
  // Back-compat read shims — resolve to players[0] / players[1].
  readonly host: RoomPlayer
  readonly guest?: RoomPlayer
}

const rooms = new Map<string, Room>()
// Reverse index: socketId → room code
const socketToRoom = new Map<string, string>()

function makeRoom(code: string, mode: RoomMode, firstPlayer: RoomPlayer): Room {
  const room = {
    code,
    mode,
    players: [firstPlayer],
    duelRoles: new Set<'attacker' | 'defender'>(),
  } as Room
  // Legacy host/guest accessors so existing 1v1 code paths keep working.
  Object.defineProperty(room, 'host', {
    get(this: Room) { return this.players[0] },
    enumerable: true,
  })
  Object.defineProperty(room, 'guest', {
    get(this: Room) { return this.players[1] },
    enumerable: true,
  })
  return room
}

export function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code: string
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * 26)]).join('')
  } while (rooms.has(code))
  return code
}

export function createRoom(socketId: string, name?: string, mode: RoomMode = '1v1'): string {
  const code = generateCode()
  rooms.set(code, makeRoom(code, mode, { socketId, name }))
  socketToRoom.set(socketId, code)
  return code
}

export function getRoomCapacity(room: Room): number {
  return room.mode === '2v2' ? 4 : 2
}

export function claimDuelRole(code: string, role: 'attacker' | 'defender'): boolean {
  const room = rooms.get(code.toUpperCase())
  if (!room) return false
  if (room.duelRoles.has(role)) return false
  room.duelRoles.add(role)
  return true
}

export function clearDuelRole(code: string): void {
  const room = rooms.get(code.toUpperCase())
  if (room) room.duelRoles.clear()
}

export function joinRoom(code: string, socketId: string, name?: string): 'host' | 'guest' | 'full' | 'not-found' {
  const room = rooms.get(code.toUpperCase())
  if (!room) return 'not-found'
  if (room.players.length >= getRoomCapacity(room)) return 'full'
  room.players.push({ socketId, name })
  socketToRoom.set(socketId, code.toUpperCase())
  return room.players.length === 1 ? 'host' : 'guest'
}

export function setPlayerName(socketId: string, name: string): void {
  const code = socketToRoom.get(socketId)
  if (!code) return
  const room = rooms.get(code)
  if (!room) return
  const player = room.players.find((p) => p.socketId === socketId)
  if (player) player.name = name
}

export function getOpponentName(room: Room, mySocketId: string): string | undefined {
  return room.players.find((p) => p.socketId !== mySocketId)?.name
}

/** Pick a player to select a team. Rejects when the team already has 2 connected players. */
export function selectTeam(
  code: string,
  socketId: string,
  team: Team,
): { ok: true; players: RoomPlayer[] } | { ok: false; reason: string } {
  const room = rooms.get(code.toUpperCase())
  if (!room) return { ok: false, reason: 'not-found' }
  const player = room.players.find((p) => p.socketId === socketId)
  if (!player) return { ok: false, reason: 'not-in-room' }
  const onTeam = room.players.filter(
    (p) => p.team === team && !p.disconnectedAt && p.socketId !== socketId,
  )
  if (onTeam.length >= 2) return { ok: false, reason: 'team-full' }
  player.team = team
  return { ok: true, players: room.players }
}

/** Match is ready when 1v1 has 2 connected players, or 2v2 has 2 connected players on each team. */
export function isMatchReady(room: Room): boolean {
  const connected = room.players.filter((p) => !p.disconnectedAt)
  if (room.mode === '2v2') {
    const red = connected.filter((p) => p.team === 'red').length
    const blue = connected.filter((p) => p.team === 'blue').length
    return red === 2 && blue === 2
  }
  return connected.length >= 2
}

export function rejoinRoom(code: string, socketId: string): 'host' | 'guest' | null {
  const room = rooms.get(code.toUpperCase())
  if (!room) return null
  const player = room.players.find((p) => p.disconnectedAt !== undefined)
  if (!player) return null
  if (player.gracePeriod) {
    clearTimeout(player.gracePeriod)
    player.gracePeriod = undefined
  }
  player.socketId = socketId
  player.disconnectedAt = undefined
  socketToRoom.set(socketId, code.toUpperCase())
  return room.players.indexOf(player) === 0 ? 'host' : 'guest'
}

export function removePlayer(socketId: string): { code: string; role: 'host' | 'guest'; room: Room } | null {
  const code = socketToRoom.get(socketId)
  if (!code) return null

  const room = rooms.get(code)
  if (!room) return null

  socketToRoom.delete(socketId)

  const idx = room.players.findIndex((p) => p.socketId === socketId)
  if (idx === -1) return null

  const player = room.players[idx]
  player.disconnectedAt = Date.now()
  const role: 'host' | 'guest' = idx === 0 ? 'host' : 'guest'

  // Per-player grace period: drop just this player after 30s; delete the room
  // only once every remaining player has also disconnected.
  player.gracePeriod = setTimeout(() => {
    const i = room.players.indexOf(player)
    if (i !== -1) room.players.splice(i, 1)
    if (room.players.length === 0 || room.players.every((p) => p.disconnectedAt)) {
      deleteRoomInternal(room)
    }
  }, 30_000)

  return { code, role, room }
}

/** Explicit leave: drop the player's slot immediately (no grace). Frees a 2v2 team slot. */
export function leaveRoom(socketId: string): { room: Room; empty: boolean } | null {
  const code = socketToRoom.get(socketId)
  if (!code) return null
  const room = rooms.get(code)
  if (!room) return null
  socketToRoom.delete(socketId)
  const idx = room.players.findIndex((p) => p.socketId === socketId)
  if (idx === -1) return null
  const [player] = room.players.splice(idx, 1)
  if (player.gracePeriod) clearTimeout(player.gracePeriod)
  const empty = room.players.length === 0 || room.players.every((p) => p.disconnectedAt)
  return { room, empty }
}

function deleteRoomInternal(room: Room): void {
  if (room.gracePeriod) clearTimeout(room.gracePeriod)
  for (const p of room.players) {
    if (p.gracePeriod) clearTimeout(p.gracePeriod)
    if (p.socketId) socketToRoom.delete(p.socketId)
  }
  rooms.delete(room.code)
}

export function deleteRoom(code: string): void {
  const room = rooms.get(code.toUpperCase())
  if (!room) return
  deleteRoomInternal(room)
}

export function getRoomBySocket(socketId: string): Room | null {
  const code = socketToRoom.get(socketId)
  if (!code) return null
  return rooms.get(code) ?? null
}

/** 1v1 back-compat: the single other player's socket id. */
export function getOpponentSocketId(room: Room, mySocketId: string): string | null {
  return room.players.find((p) => p.socketId !== mySocketId && !p.disconnectedAt)?.socketId ?? null
}

/** 2v2-aware: every other connected player's socket id (for room fan-out). */
export function getOtherPlayerSocketIds(room: Room, mySocketId: string): string[] {
  return room.players
    .filter((p) => p.socketId !== mySocketId && !p.disconnectedAt)
    .map((p) => p.socketId)
}
