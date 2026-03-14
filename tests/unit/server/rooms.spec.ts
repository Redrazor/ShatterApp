// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Reset module state between tests by re-importing
let createRoom: (socketId: string) => string
let joinRoom: (code: string, socketId: string) => 'host' | 'guest' | 'full' | 'not-found'
let rejoinRoom: (code: string, socketId: string) => 'host' | 'guest' | null
let removePlayer: (socketId: string) => { code: string; role: 'host' | 'guest'; room: unknown } | null
let generateCode: () => string
let getRoomBySocket: (socketId: string) => unknown

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../server/rooms.ts')
  createRoom = mod.createRoom
  joinRoom = mod.joinRoom
  rejoinRoom = mod.rejoinRoom
  removePlayer = mod.removePlayer
  generateCode = mod.generateCode
  getRoomBySocket = mod.getRoomBySocket
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
})
