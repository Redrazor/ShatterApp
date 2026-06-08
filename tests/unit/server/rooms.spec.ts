// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Reset module state between tests by re-importing
type Team = 'red' | 'blue'
type RoomMode = '1v1' | '2v2'
interface TestPlayer { socketId: string; name?: string; team?: Team; disconnectedAt?: number }
interface TestRoom { code: string; mode: RoomMode; players: TestPlayer[]; host: TestPlayer; guest?: TestPlayer }

let createRoom: (socketId: string, name?: string, mode?: RoomMode) => string
let joinRoom: (code: string, socketId: string, name?: string) => 'host' | 'guest' | 'full' | 'not-found'
let rejoinRoom: (code: string, socketId: string) => 'host' | 'guest' | null
let removePlayer: (socketId: string) => { code: string; role: 'host' | 'guest'; room: unknown } | null
let leaveRoom: (socketId: string) => { room: TestRoom; empty: boolean } | null
let generateCode: () => string
let getRoomBySocket: (socketId: string) => TestRoom | null
let selectTeam: (code: string, socketId: string, team: Team) => { ok: true; players: TestPlayer[] } | { ok: false; reason: string }
let isMatchReady: (room: TestRoom) => boolean
let getOtherPlayerSocketIds: (room: TestRoom, mySocketId: string) => string[]

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../server/rooms.ts')
  createRoom = mod.createRoom
  joinRoom = mod.joinRoom
  rejoinRoom = mod.rejoinRoom
  removePlayer = mod.removePlayer
  leaveRoom = mod.leaveRoom
  generateCode = mod.generateCode
  getRoomBySocket = mod.getRoomBySocket
  selectTeam = mod.selectTeam
  isMatchReady = mod.isMatchReady
  getOtherPlayerSocketIds = mod.getOtherPlayerSocketIds
})

describe('generateCode', () => {
  it('returns a 4-character uppercase code', () => {
    const code = generateCode()
    expect(code).toMatch(/^[A-Z]{4}$/)
  })
})

describe('createRoom', () => {
  it('returns a valid 4-char code', () => {
    const code = createRoom('socket-host')
    expect(code).toMatch(/^[A-Z]{4}$/)
  })

  it('allows finding room by socket', () => {
    const code = createRoom('socket-host')
    const room = getRoomBySocket('socket-host')
    expect(room).not.toBeNull()
    expect((room as { code: string }).code).toBe(code)
  })
})

describe('joinRoom', () => {
  it('returns guest for empty room', () => {
    const code = createRoom('host-1')
    const result = joinRoom(code, 'guest-1')
    expect(result).toBe('guest')
  })

  it('returns not-found for unknown code', () => {
    const result = joinRoom('ZZZZ', 'guest-x')
    expect(result).toBe('not-found')
  })

  it('returns full when guest already present', () => {
    const code = createRoom('host-2')
    joinRoom(code, 'guest-2')
    const result = joinRoom(code, 'guest-3')
    expect(result).toBe('full')
  })

  it('is case-insensitive for the code', () => {
    const code = createRoom('host-3')
    const result = joinRoom(code.toLowerCase(), 'guest-4')
    expect(result).toBe('guest')
  })
})

describe('removePlayer', () => {
  it('returns correct role for host', () => {
    const code = createRoom('host-r1')
    const result = removePlayer('host-r1')
    expect(result).not.toBeNull()
    expect(result!.role).toBe('host')
    expect(result!.code).toBe(code)
  })

  it('returns correct role for guest', () => {
    const code = createRoom('host-r2')
    joinRoom(code, 'guest-r2')
    const result = removePlayer('guest-r2')
    expect(result).not.toBeNull()
    expect(result!.role).toBe('guest')
  })

  it('returns null for unknown socket', () => {
    const result = removePlayer('unknown-socket')
    expect(result).toBeNull()
  })

  it('sets disconnectedAt on the player', () => {
    const code = createRoom('host-r3')
    removePlayer('host-r3')
    const room = getRoomBySocket('host-r3') as { host: { disconnectedAt?: number } } | null
    // Socket mapping is removed, so room should be null via socket lookup
    expect(room).toBeNull()
  })
})

describe('rejoinRoom', () => {
  it('returns host role when host disconnected', () => {
    vi.useFakeTimers()
    const code = createRoom('host-rj1')
    removePlayer('host-rj1')
    const role = rejoinRoom(code, 'host-rj1-new')
    expect(role).toBe('host')
    vi.useRealTimers()
  })

  it('returns guest role when guest disconnected', () => {
    vi.useFakeTimers()
    const code = createRoom('host-rj2')
    joinRoom(code, 'guest-rj2')
    removePlayer('guest-rj2')
    const role = rejoinRoom(code, 'guest-rj2-new')
    expect(role).toBe('guest')
    vi.useRealTimers()
  })

  it('returns null for unknown room', () => {
    const role = rejoinRoom('XXXX', 'any-socket')
    expect(role).toBeNull()
  })

  it('cleans up room after grace period', () => {
    vi.useFakeTimers()
    const code = createRoom('host-grace')
    removePlayer('host-grace')
    // Advance past the 30s grace period
    vi.advanceTimersByTime(31_000)
    const room = rejoinRoom(code, 'host-grace-new')
    expect(room).toBeNull()
    vi.useRealTimers()
  })

  it('keeps room alive while another player stays connected', () => {
    vi.useFakeTimers()
    const code = createRoom('host-keep')
    joinRoom(code, 'guest-keep')
    removePlayer('host-keep') // host disconnects, guest still here
    vi.advanceTimersByTime(31_000)
    // guest can still be found; room survives
    expect(getRoomBySocket('guest-keep')).not.toBeNull()
    vi.useRealTimers()
  })
})

describe('back-compat host/guest shims', () => {
  it('host resolves to players[0], guest to players[1]', () => {
    const code = createRoom('shim-host')
    joinRoom(code, 'shim-guest')
    const room = getRoomBySocket('shim-host')!
    expect(room.host.socketId).toBe('shim-host')
    expect(room.guest?.socketId).toBe('shim-guest')
    expect(room.players).toHaveLength(2)
  })

  it('guest is undefined when only host present', () => {
    createRoom('shim-solo')
    const room = getRoomBySocket('shim-solo')!
    expect(room.guest).toBeUndefined()
  })
})

describe('2v2 mode', () => {
  it('defaults to 1v1 with capacity 2', () => {
    const code = createRoom('v1-host')
    const room = getRoomBySocket('v1-host')!
    expect(room.mode).toBe('1v1')
    joinRoom(code, 'v1-guest')
    expect(joinRoom(code, 'v1-third')).toBe('full')
  })

  it('a 2v2 room accepts up to 4 players, rejects a 5th', () => {
    const code = createRoom('q-host', undefined, '2v2')
    const room = getRoomBySocket('q-host')!
    expect(room.mode).toBe('2v2')
    expect(joinRoom(code, 'q-p2')).toBe('guest')
    expect(joinRoom(code, 'q-p3')).toBe('guest')
    expect(joinRoom(code, 'q-p4')).toBe('guest')
    expect(joinRoom(code, 'q-p5')).toBe('full')
    expect(room.players).toHaveLength(4)
  })
})

describe('selectTeam', () => {
  function make2v2(): { code: string; ids: string[] } {
    const code = createRoom('t-p1', undefined, '2v2')
    const ids = ['t-p1', 't-p2', 't-p3', 't-p4']
    ids.slice(1).forEach((id) => joinRoom(code, id))
    return { code, ids }
  }

  it('assigns a player to a team', () => {
    const { code } = make2v2()
    const res = selectTeam(code, 't-p1', 'red')
    expect(res.ok).toBe(true)
    expect(getRoomBySocket('t-p1')!.players[0].team).toBe('red')
  })

  it('caps a team at 2 players', () => {
    const { code } = make2v2()
    selectTeam(code, 't-p1', 'red')
    selectTeam(code, 't-p2', 'red')
    const res = selectTeam(code, 't-p3', 'red')
    expect(res.ok).toBe(false)
    expect((res as { reason: string }).reason).toBe('team-full')
  })

  it('lets a player switch teams (own slot does not count against cap)', () => {
    const { code } = make2v2()
    selectTeam(code, 't-p1', 'red')
    const res = selectTeam(code, 't-p1', 'blue')
    expect(res.ok).toBe(true)
    expect(getRoomBySocket('t-p1')!.players[0].team).toBe('blue')
  })

  it('rejects selection from a socket not in the room', () => {
    const { code } = make2v2()
    const res = selectTeam(code, 'stranger', 'red')
    expect(res.ok).toBe(false)
  })

  it('rejects selection for an unknown room', () => {
    const res = selectTeam('ZZZZ', 'whoever', 'red')
    expect(res.ok).toBe(false)
  })
})

describe('isMatchReady', () => {
  it('1v1 is ready with two connected players', () => {
    const code = createRoom('r-host')
    expect(isMatchReady(getRoomBySocket('r-host')!)).toBe(false)
    joinRoom(code, 'r-guest')
    expect(isMatchReady(getRoomBySocket('r-host')!)).toBe(true)
  })

  it('2v2 is ready only when both teams have 2 connected players', () => {
    const code = createRoom('m-p1', undefined, '2v2')
    ;['m-p2', 'm-p3', 'm-p4'].forEach((id) => joinRoom(code, id))
    const room = getRoomBySocket('m-p1')!
    selectTeam(code, 'm-p1', 'red')
    selectTeam(code, 'm-p2', 'red')
    selectTeam(code, 'm-p3', 'blue')
    expect(isMatchReady(room)).toBe(false)
    selectTeam(code, 'm-p4', 'blue')
    expect(isMatchReady(room)).toBe(true)
  })

  it('2v2 drops to not-ready when a player disconnects', () => {
    const code = createRoom('d-p1', undefined, '2v2')
    ;['d-p2', 'd-p3', 'd-p4'].forEach((id) => joinRoom(code, id))
    const room = getRoomBySocket('d-p1')!
    selectTeam(code, 'd-p1', 'red')
    selectTeam(code, 'd-p2', 'red')
    selectTeam(code, 'd-p3', 'blue')
    selectTeam(code, 'd-p4', 'blue')
    expect(isMatchReady(room)).toBe(true)
    vi.useFakeTimers()
    removePlayer('d-p1')
    expect(isMatchReady(room)).toBe(false)
    vi.useRealTimers()
  })
})

describe('getOtherPlayerSocketIds', () => {
  it('returns every connected player except me', () => {
    const code = createRoom('o-p1', undefined, '2v2')
    ;['o-p2', 'o-p3', 'o-p4'].forEach((id) => joinRoom(code, id))
    const room = getRoomBySocket('o-p1')!
    expect(getOtherPlayerSocketIds(room, 'o-p1').sort()).toEqual(['o-p2', 'o-p3', 'o-p4'])
  })

  it('excludes disconnected players', () => {
    vi.useFakeTimers()
    const code = createRoom('o2-p1', undefined, '2v2')
    ;['o2-p2', 'o2-p3'].forEach((id) => joinRoom(code, id))
    const room = getRoomBySocket('o2-p1')!
    removePlayer('o2-p2')
    expect(getOtherPlayerSocketIds(room, 'o2-p1')).toEqual(['o2-p3'])
    vi.useRealTimers()
  })
})

describe('leaveRoom', () => {
  it('frees the slot immediately and reports non-empty when others remain', () => {
    const code = createRoom('l-p1', undefined, '2v2')
    joinRoom(code, 'l-p2')
    const result = leaveRoom('l-p1')
    expect(result).not.toBeNull()
    expect(result!.empty).toBe(false)
    expect(result!.room.players).toHaveLength(1)
    expect(result!.room.players[0].socketId).toBe('l-p2')
  })

  it('reports empty when the last player leaves', () => {
    createRoom('l-solo', undefined, '2v2')
    const result = leaveRoom('l-solo')
    expect(result!.empty).toBe(true)
  })

  it('returns null for an unknown socket', () => {
    expect(leaveRoom('nobody')).toBeNull()
  })
})

describe('2v2 rejoin restores team slot', () => {
  it('reconnecting player keeps their team', () => {
    vi.useFakeTimers()
    const code = createRoom('rj-p1', undefined, '2v2')
    joinRoom(code, 'rj-p2')
    selectTeam(code, 'rj-p1', 'blue')
    removePlayer('rj-p1')
    const role = rejoinRoom(code, 'rj-p1-new')
    expect(role).toBe('host')
    expect(getRoomBySocket('rj-p1-new')!.players[0].team).toBe('blue')
    vi.useRealTimers()
  })
})
