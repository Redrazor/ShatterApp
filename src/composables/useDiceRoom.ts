import { ref, toRaw } from 'vue'
import { io, Socket } from 'socket.io-client'
import type { PlayUnit, TrackerSnapshot, DiceRole, ForcePoolPayload, RoomMode, Team, RoomPlayerView, OrderDeckState } from '../types/index.ts'
import type { DieState } from '../utils/dice.ts'

// Module-level singleton
let socket: Socket | null = null

const roomCode = ref<string | null>(null)
const connected = ref(false)
const isHost = ref(false)
const opponentOnline = ref(false)
const mode = ref<RoomMode>('1v1')
const socketId = ref<string | null>(null)

type Callback<T = void> = (arg: T) => void

// In 2v2 the server tags relays with the sender's socketId via `from`.
let _onOpponentUnits: ((units: PlayUnit[], forcePool?: ForcePoolPayload, from?: string) => void) | null = null
let _onTrackerUpdate: ((snapshot: TrackerSnapshot, from?: string) => void) | null = null
let _onPlayerJoined: Callback | null = null
let _onPlayerLeft: Callback | null = null
let _onSessionEnded: Callback | null = null
let _onOpponentName: ((name: string, from?: string) => void) | null = null
let _onRoleAssigned: Callback<{ myRole: DiceRole }> | null = null
let _onOpponentPoolUpdate: Callback<{ pool: DieState[]; role: 'attacker' | 'defender'; playerName: string; type: 'roll' | 'change'; from?: string }> | null = null
let _onRolesReset: Callback | null = null
let _onRoleTaken: Callback<{ role: 'attacker' | 'defender'; unitId: number | null }> | null = null
let _onRoomUpdate: Callback<{ players: RoomPlayerView[]; mode: RoomMode; ready: boolean }> | null = null
let _onOrderDeckUpdate: ((deck: OrderDeckState, from?: string) => void) | null = null

function getSocket(): Socket {
  if (!socket) {
    const env = (import.meta as { env?: Record<string, string> }).env ?? {}
    const url = env.VITE_WS_URL || env.VITE_API_BASE || window.location.origin
    socket = io(url, { path: '/socket.io', autoConnect: false })

    socket.on('opponent-units', ({ units, forcePool, from }: { units: PlayUnit[]; forcePool?: ForcePoolPayload; from?: string }) => {
      _onOpponentUnits?.(units, forcePool, from)
    })
    socket.on('tracker-update', ({ snapshot, from }: { snapshot: TrackerSnapshot; from?: string }) => { _onTrackerUpdate?.(snapshot, from) })
    socket.on('order-deck-update', ({ revealed, deckCount, activatedCount, from }: OrderDeckState & { from?: string }) => {
      _onOrderDeckUpdate?.({ revealed, deckCount, activatedCount }, from)
    })
    socket.on('player-joined', (payload?: { name?: string }) => {
      opponentOnline.value = true
      if (payload?.name) _onOpponentName?.(payload.name)
      _onPlayerJoined?.()
    })
    socket.on('opponent-left', () => {
      opponentOnline.value = false
      _onPlayerLeft?.()
    })
    socket.on('player-left', () => { _onPlayerLeft?.() })
    socket.on('room-update', (payload: { players: RoomPlayerView[]; mode: RoomMode; ready: boolean }) => {
      mode.value = payload.mode
      _onRoomUpdate?.(payload)
    })
    socket.on('session-ended', () => { _onSessionEnded?.() })
    socket.on('opponent-name', ({ name, from }: { name: string; from?: string }) => { _onOpponentName?.(name, from) })
    socket.on('role-assigned', ({ role }: { role: DiceRole }) => { _onRoleAssigned?.({ myRole: role }) })
    socket.on('opponent-pool-update', (payload: { pool: DieState[]; role: 'attacker' | 'defender'; playerName: string; type: 'roll' | 'change'; from?: string }) => {
      _onOpponentPoolUpdate?.(payload)
    })
    socket.on('roles-reset', () => { _onRolesReset?.() })
    socket.on('role-taken', (payload: { role: 'attacker' | 'defender'; unitId: number | null }) => { _onRoleTaken?.(payload) })
    socket.on('connect', () => { connected.value = true; socketId.value = socket?.id ?? null })
    socket.on('disconnect', () => { connected.value = false })
  }
  return socket
}

function _connectAndRun(fn: (s: Socket) => void): Promise<void> {
  return new Promise((_, reject) => {
    const s = getSocket()
    if (s.connected) {
      fn(s)
      return
    }
    const onError = (err: Error) => {
      s.off('connect', onConnect)
      reject(new Error(`Cannot reach server: ${err.message}`))
    }
    const onConnect = () => {
      s.off('connect_error', onError)
      fn(s)
    }
    s.once('connect', onConnect)
    s.once('connect_error', onError)
    const timer = setTimeout(() => {
      s.off('connect', onConnect)
      s.off('connect_error', onError)
      reject(new Error('Connection timed out — is the server running?'))
    }, 8_000)
    s.once('connect', () => clearTimeout(timer))
    s.connect()
  })
}

export function useDiceRoom() {
  function createRoom(name?: string, roomMode: RoomMode = '1v1'): Promise<string> {
    return new Promise((resolve, reject) => {
      _connectAndRun((s) => {
        s.emit('create-room', { name, mode: roomMode }, (ack: { code: string; mode?: RoomMode }) => {
          roomCode.value = ack.code
          isHost.value = true
          mode.value = ack.mode ?? roomMode
          socketId.value = s.id ?? null
          resolve(ack.code)
        })
      }).catch(reject)
    })
  }

  function joinRoom(code: string, name?: string): Promise<{ success: boolean; opponentName?: string; error?: string; mode?: RoomMode; players?: RoomPlayerView[] }> {
    return new Promise((resolve, reject) => {
      _connectAndRun((s) => {
        s.emit('join-room', { code, name }, (ack: { role: string | null; error?: string; opponentOnline?: boolean; opponentName?: string; mode?: RoomMode; players?: RoomPlayerView[] }) => {
          if (ack.role) {
            roomCode.value = code.toUpperCase()
            isHost.value = ack.role === 'host'
            if (ack.mode) mode.value = ack.mode
            socketId.value = s.id ?? null
            if (ack.opponentOnline) {
              opponentOnline.value = true
              _onPlayerJoined?.()
            }
            resolve({ success: true, opponentName: ack.opponentName, mode: ack.mode, players: ack.players })
          } else {
            resolve({ success: false, error: ack.error })
          }
        })
      }).catch(reject)
    })
  }

  function selectTeam(team: Team): Promise<{ ok: boolean; players?: RoomPlayerView[]; reason?: string }> {
    return new Promise((resolve) => {
      const s = socket
      if (!s) { resolve({ ok: false, reason: 'not-connected' }); return }
      s.emit('select-team', { team }, (ack: { ok: boolean; players?: RoomPlayerView[]; reason?: string }) => {
        resolve(ack)
      })
    })
  }

  function sendUnits(units: PlayUnit[], forcePool?: ForcePoolPayload): void {
    const plain = units.map(u => ({ ...toRaw(u) }))
    socket?.emit('sync-units', { units: plain, forcePool })
  }

  function sendTrackerState(snapshot: TrackerSnapshot): void {
    socket?.emit('sync-tracker', { snapshot })
  }

  function sendOrderDeck(deck: OrderDeckState): void {
    socket?.emit('sync-order-deck', deck)
  }

  function sendPlayerName(name: string): void {
    socket?.emit('set-player-name', { name })
  }

  function claimRole(role: 'attacker' | 'defender', unitId?: number | null): void {
    socket?.emit('claim-role', { role, unitId: unitId ?? null })
  }

  function sendPoolUpdate(role: 'attacker' | 'defender', pool: DieState[], playerName: string, type: 'roll' | 'change'): void {
    socket?.emit('pool-update', { role, pool, playerName, type })
  }

  function resetDuel(): void {
    socket?.emit('reset-duel')
  }

  function leaveRoom(): void {
    socket?.emit('leave-room')
    socket?.disconnect()
    socket = null
    roomCode.value = null
    connected.value = false
    isHost.value = false
    opponentOnline.value = false
    mode.value = '1v1'
    socketId.value = null
  }

  function onOpponentUnits(cb: (units: PlayUnit[], forcePool?: ForcePoolPayload, from?: string) => void): void { _onOpponentUnits = cb }
  function onTrackerUpdate(cb: (snapshot: TrackerSnapshot, from?: string) => void): void { _onTrackerUpdate = cb }
  function onPlayerJoined(cb: Callback): void { _onPlayerJoined = cb }
  function onPlayerLeft(cb: Callback): void { _onPlayerLeft = cb }
  function onSessionEnded(cb: Callback): void { _onSessionEnded = cb }
  function onOpponentName(cb: (name: string, from?: string) => void): void { _onOpponentName = cb }
  function onRoomUpdate(cb: Callback<{ players: RoomPlayerView[]; mode: RoomMode; ready: boolean }>): void { _onRoomUpdate = cb }
  function onOrderDeckUpdate(cb: (deck: OrderDeckState, from?: string) => void): void { _onOrderDeckUpdate = cb }
  function onRoleAssigned(cb: Callback<{ myRole: DiceRole }>): void { _onRoleAssigned = cb }
  function onOpponentPoolUpdate(cb: Callback<{ pool: DieState[]; role: 'attacker' | 'defender'; playerName: string; type: 'roll' | 'change' }>): void { _onOpponentPoolUpdate = cb }
  function onRolesReset(cb: Callback): void { _onRolesReset = cb }
  function onRoleTaken(cb: Callback<{ role: 'attacker' | 'defender'; unitId: number | null }>): void { _onRoleTaken = cb }

  return {
    roomCode,
    connected,
    isHost,
    opponentOnline,
    mode,
    socketId,
    createRoom,
    joinRoom,
    selectTeam,
    sendUnits,
    sendOrderDeck,
    sendTrackerState,
    sendPlayerName,
    claimRole,
    sendPoolUpdate,
    resetDuel,
    leaveRoom,
    onOpponentUnits,
    onTrackerUpdate,
    onPlayerJoined,
    onPlayerLeft,
    onSessionEnded,
    onOpponentName,
    onRoomUpdate,
    onOrderDeckUpdate,
    onRoleAssigned,
    onOpponentPoolUpdate,
    onRolesReset,
    onRoleTaken,
  }
}
