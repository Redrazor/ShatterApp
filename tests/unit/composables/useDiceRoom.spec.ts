import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock socket.io-client before importing the composable
const mockEmit = vi.fn()
const mockDisconnect = vi.fn()
const mockConnect = vi.fn()
const mockOn = vi.fn()
const mockOnce = vi.fn()
const mockOff = vi.fn()

const mockSocket = {
  connected: false,
  connect: mockConnect,
  disconnect: mockDisconnect,
  emit: mockEmit,
  on: mockOn,
  once: mockOnce,
  off: mockOff,
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}))

import { useDiceRoom } from '../../../src/composables/useDiceRoom.ts'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  mockSocket.connected = false
})

// Helper: initialize socket by simulating a createRoom call
async function initSocket() {
  // _connectAndRun registers once('connect', ...) and once('connect_error', ...)
  // We simulate immediate connection by firing all 'connect' once-handlers
  mockSocket.once.mockImplementation((event: string, cb: () => void) => {
    if (event === 'connect') setTimeout(() => cb(), 0)
  })
  mockSocket.connect.mockImplementation(() => { mockSocket.connected = true })
  mockEmit.mockImplementation((_ev: string, _d: unknown, ack?: (r: { code: string }) => void) => {
    if (typeof ack === 'function') ack({ code: 'TEST' })
  })
  const room = useDiceRoom()
  await room.createRoom()
  // Reset only emit/connect/disconnect so we can check calls from the actual test
  mockEmit.mockReset()
  mockConnect.mockReset()
  mockDisconnect.mockReset()
  mockOff.mockReset()
  return room
}

describe('useDiceRoom', () => {
  it('createRoom resolves with code from ack', async () => {
    mockSocket.once.mockImplementation((event: string, cb: () => void) => {
      if (event === 'connect') cb()
    })
    mockSocket.connect.mockImplementation(() => { mockSocket.connected = true })
    mockEmit.mockImplementation((_ev: string, _d: unknown, ack?: (r: { code: string }) => void) => {
      if (typeof ack === 'function') ack({ code: 'ABCD' })
    })

    const room = useDiceRoom()
    const code = await room.createRoom()
    expect(code).toBe('ABCD')
    expect(room.roomCode.value).toBe('ABCD')
    expect(room.isHost.value).toBe(true)
  })

  it('joinRoom resolves with success true on valid code', async () => {
    const room = await initSocket()
    mockSocket.connected = true
    mockEmit.mockImplementation((_ev: string, _d: unknown, ack?: (r: { role: string | null }) => void) => {
      if (typeof ack === 'function') ack({ role: 'guest' })
    })

    const result = await room.joinRoom('ABCD')
    expect(result.success).toBe(true)
  })

  it('joinRoom resolves with success false on error', async () => {
    const room = await initSocket()
    mockSocket.connected = true
    mockEmit.mockImplementation((_ev: string, _d: unknown, ack?: (r: { role: null; error: string }) => void) => {
      if (typeof ack === 'function') ack({ role: null, error: 'Room not found' })
    })

    const result = await room.joinRoom('ZZZZ')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Room not found')
  })

  it('sendUnits calls socket.emit with sync-units', async () => {
    const room = await initSocket()
    const units = [{ id: 1 }] as never
    room.sendUnits(units)
    expect(mockEmit).toHaveBeenCalledWith('sync-units', { units })
  })

  it('sendTrackerState calls socket.emit with sync-tracker', async () => {
    const room = await initSocket()
    const snapshot = { mode: 'standard' as const }
    room.sendTrackerState(snapshot)
    expect(mockEmit).toHaveBeenCalledWith('sync-tracker', { snapshot })
  })


  it('leaveRoom calls socket.disconnect and resets state', async () => {
    const room = await initSocket()
    room.leaveRoom()
    expect(mockDisconnect).toHaveBeenCalled()
    expect(room.roomCode.value).toBeNull()
    expect(room.connected.value).toBe(false)
  })

  it('onOpponentUnits callback fires when socket receives opponent-units', async () => {
    await initSocket()
    const room = useDiceRoom()
    const cb = vi.fn()
    room.onOpponentUnits(cb)

    // Find the opponent-units handler registered via mockOn
    const call = mockOn.mock.calls.find(([event]: [string]) => event === 'opponent-units')
    expect(call).toBeDefined()
    const handler = call![1] as (data: unknown) => void
    handler({ units: [{ id: 99 }] })
    expect(cb).toHaveBeenCalledWith([{ id: 99 }], undefined, undefined)
  })

  it('routes opponent-units with a `from` sender id (2v2 fan-out)', async () => {
    useDiceRoom().leaveRoom() // reset the socket singleton so .on re-registers
    await initSocket()
    const room = useDiceRoom()
    const cb = vi.fn()
    room.onOpponentUnits(cb)
    const call = mockOn.mock.calls.find(([event]: [string]) => event === 'opponent-units')
    const handler = call![1] as (data: unknown) => void
    handler({ units: [{ id: 7 }], forcePool: { total: 3, spentTokens: [] }, from: 'sock-B' })
    expect(cb).toHaveBeenCalledWith([{ id: 7 }], { total: 3, spentTokens: [] }, 'sock-B')
  })

  it('room-update sets mode and invokes the callback', async () => {
    useDiceRoom().leaveRoom() // reset the socket singleton so .on re-registers
    await initSocket()
    const room = useDiceRoom()
    const cb = vi.fn()
    room.onRoomUpdate(cb)
    const call = mockOn.mock.calls.find(([event]: [string]) => event === 'room-update')
    expect(call).toBeDefined()
    const handler = call![1] as (data: unknown) => void
    const payload = { players: [{ socketId: 'a', connected: true }], mode: '2v2', ready: false }
    handler(payload)
    expect(room.mode.value).toBe('2v2')
    expect(cb).toHaveBeenCalledWith(payload)
  })

  it('order-deck-update fires the callback with deck state and sender id', async () => {
    useDiceRoom().leaveRoom()
    await initSocket()
    const room = useDiceRoom()
    const cb = vi.fn()
    room.onOrderDeckUpdate(cb)
    const call = mockOn.mock.calls.find(([event]: [string]) => event === 'order-deck-update')
    expect(call).toBeDefined()
    const handler = call![1] as (data: unknown) => void
    handler({ revealed: { id: 3, name: 'Ahsoka', orderCard: '/a.png', isShatterpoint: false }, deckCount: 5, activatedCount: 1, from: 'sock-C' })
    expect(cb).toHaveBeenCalledWith(
      { revealed: { id: 3, name: 'Ahsoka', orderCard: '/a.png', isShatterpoint: false }, deckCount: 5, activatedCount: 1 },
      'sock-C',
    )
  })

  it('sendOrderDeck emits sync-order-deck with the payload', async () => {
    useDiceRoom().leaveRoom()
    await initSocket()
    const room = useDiceRoom()
    const payload = { revealed: null, deckCount: 6, activatedCount: 0 }
    room.sendOrderDeck(payload)
    expect(mockEmit).toHaveBeenCalledWith('sync-order-deck', payload)
  })

  it('selectTeam emits select-team and resolves the ack', async () => {
    useDiceRoom().leaveRoom()
    await initSocket()
    const room = useDiceRoom()
    mockEmit.mockImplementation((ev: string, _d: unknown, ack?: (r: unknown) => void) => {
      if (ev === 'select-team' && typeof ack === 'function') ack({ ok: true, players: [] })
    })
    const res = await room.selectTeam('red')
    expect(mockEmit).toHaveBeenCalledWith('select-team', { team: 'red' }, expect.any(Function))
    expect(res.ok).toBe(true)
  })
})
