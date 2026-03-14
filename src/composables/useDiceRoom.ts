import { ref, toRaw } from 'vue'
import { io, Socket } from 'socket.io-client'
import type { PlayUnit, TrackerSnapshot, DiceRole, ForcePoolPayload } from '../types/index.ts'
import type { DieState } from '../utils/dice.ts'

// Module-level singleton
let socket: Socket | null = null

const roomCode = ref<string | null>(null)
const connected = ref(false)
const isHost = ref(false)
const opponentOnline = ref(false)

type Callback<T = void> = (arg: T) => void

let _onOpponentUnits: ((units: PlayUnit[], forcePool?: ForcePoolPayload) => void) | null = null
let _onTrackerUpdate: Callback<TrackerSnapshot> | null = null
let _onPlayerJoined: Callback | null = null
let _onPlayerLeft: Callback | null = null
let _onSessionEnded: Callback | null = null
let _onOpponentName: Callback<string> | null = null
let _onRoleAssigned: Callback<{ myRole: DiceRole }> | null = null
let _onOpponentPoolUpdate: Callback<{ pool: DieState[]; role: 'attacker' | 'defender'; playerName: string; type: 'roll' | 'change' }> | null = null
let _onRolesReset: Callback | null = null
let _onRoleTaken: Callback<{ role: 'attacker' | 'defender' }> | null = null

function getSocket(): Socket {
  if (!socket) {
    const env = (import.meta as { env?: Record<string, string> }).env ?? {}
    const url = env.VITE_WS_URL || env.VITE_API_BASE || window.location.origin
    socket = io(url, { path: '/socket.io', autoConnect: false })

    socket.on('opponent-units', ({ units, forcePool }: { units: PlayUnit[]; forcePool?: ForcePoolPayload }) => {
      _onOpponentUnits?.(units, forcePool)
    })
    socket.on('tracker-update', ({ snapshot }: { snapshot: TrackerSnapshot }) => { _onTrackerUpdate?.(snapshot) })
    socket.on('player-joined', (payload?: { name?: string }) => {
      opponentOnline.value = true
      if (payload?.name) _onOpponentName?.(payload.name)
      _onPlayerJoined?.()
    })
    socket.on('opponent-left', () => {
      opponentOnline.value = false
      _onPlayerLeft?.()
    })
    socket.on('session-ended', () => { _onSessionEnded?.() })
    socket.on('opponent-name', ({ name }: { name: string }) => { _onOpponentName?.(name) })
    socket.on('role-assigned', ({ role }: { role: DiceRole }) => { _onRoleAssigned?.({ myRole: role }) })
    socket.on('opponent-pool-update', (payload: { pool: DieState[]; role: 'attacker' | 'defender'; playerName: string; type: 'roll' | 'change' }) => {
      _onOpponentPoolUpdate?.(payload)
    })
    socket.on('roles-reset', () => { _onRolesReset?.() })
    socket.on('role-taken', (payload: { role: 'attacker' | 'defender' }) => { _onRoleTaken?.(payload) })
    socket.on('connect', () => { connected.value = true })
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
  function createRoom(name?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      _connectAndRun((s) => {
        s.emit('create-room', { name }, (ack: { code: string }) => {
          roomCode.value = ack.code
          isHost.value = true
          resolve(ack.code)
        })
      }).catch(reject)
    })
  }

  function joinRoom(code: string, name?: string): Promise<{ success: boolean; opponentName?: string; error?: string }> {
    return new Promise((resolve, reject) => {
      _connectAndRun((s) => {
        s.emit('join-room', { code, name }, (ack: { role: string | null; error?: string; opponentOnline?: boolean; opponentName?: string }) => {
          if (ack.role) {
            roomCode.value = code.toUpperCase()
            isHost.value = ack.role === 'host'
            if (ack.opponentOnline) {
              opponentOnline.value = true
              _onPlayerJoined?.()
            }
            resolve({ success: true, opponentName: ack.opponentName })
          } else {
            resolve({ success: false, error: ack.error })
          }
        })
      }).catch(reject)
    })
  }

  function sendUnits(units: PlayUnit[], forcePool?: ForcePoolPayload): void {
    const plain = units.map(u => ({ ...toRaw(u) }))
    socket?.emit('sync-units', { units: plain, forcePool })
  }

  function sendTrackerState(snapshot: TrackerSnapshot): void {
    socket?.emit('sync-tracker', { snapshot })
  }

  function sendPlayerName(name: string): void {
    socket?.emit('set-player-name', { name })
  }

  function claimRole(role: 'attacker' | 'defender'): void {
    socket?.emit('claim-role', { role })
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
  }

  function onOpponentUnits(cb: (units: PlayUnit[], forcePool?: ForcePoolPayload) => void): void { _onOpponentUnits = cb }
  function onTrackerUpdate(cb: Callback<TrackerSnapshot>): void { _onTrackerUpdate = cb }
  function onPlayerJoined(cb: Callback): void { _onPlayerJoined = cb }
  function onPlayerLeft(cb: Callback): void { _onPlayerLeft = cb }
  function onSessionEnded(cb: Callback): void { _onSessionEnded = cb }
  function onOpponentName(cb: Callback<string>): void { _onOpponentName = cb }
  function onRoleAssigned(cb: Callback<{ myRole: DiceRole }>): void { _onRoleAssigned = cb }
  function onOpponentPoolUpdate(cb: Callback<{ pool: DieState[]; role: 'attacker' | 'defender'; playerName: string; type: 'roll' | 'change' }>): void { _onOpponentPoolUpdate = cb }
  function onRolesReset(cb: Callback): void { _onRolesReset = cb }
  function onRoleTaken(cb: Callback<{ role: 'attacker' | 'defender' }>): void { _onRoleTaken = cb }

  return {
    roomCode,
    connected,
    isHost,
    opponentOnline,
    createRoom,
    joinRoom,
    sendUnits,
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
    onRoleAssigned,
    onOpponentPoolUpdate,
    onRolesReset,
    onRoleTaken,
  }
}
