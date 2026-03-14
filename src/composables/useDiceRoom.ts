import { ref } from 'vue'
import { io, Socket } from 'socket.io-client'
import type { PlayUnit, TrackerSnapshot, DiceRollResult } from '../types/index.ts'

// Module-level singleton
let socket: Socket | null = null

const roomCode = ref<string | null>(null)
const connected = ref(false)
const isHost = ref(false)
const opponentOnline = ref(false)

type Callback<T = void> = (arg: T) => void

let _onOpponentUnits: Callback<PlayUnit[]> | null = null
let _onTrackerUpdate: Callback<TrackerSnapshot> | null = null
let _onOpponentDice: Callback<DiceRollResult> | null = null
let _onPlayerJoined: Callback | null = null
let _onPlayerLeft: Callback | null = null

function getSocket(): Socket {
  if (!socket) {
    const url = (import.meta as { env?: Record<string, string> }).env?.VITE_WS_URL ?? ''
    socket = io(url || window.location.origin, { path: '/socket.io', autoConnect: false })

    socket.on('opponent-units', (data: PlayUnit[]) => { _onOpponentUnits?.(data) })
    socket.on('tracker-update', (data: TrackerSnapshot) => { _onTrackerUpdate?.(data) })
    socket.on('opponent-dice', (data: DiceRollResult) => { _onOpponentDice?.(data) })
    socket.on('player-joined', () => {
      opponentOnline.value = true
      _onPlayerJoined?.()
    })
    socket.on('opponent-left', () => {
      opponentOnline.value = false
      _onPlayerLeft?.()
    })
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
      // 8-second timeout
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
  function createRoom(): Promise<string> {
    return new Promise((resolve, reject) => {
      _connectAndRun((s) => {
        s.emit('create-room', null, (ack: { code: string }) => {
          roomCode.value = ack.code
          isHost.value = true
          resolve(ack.code)
        })
      }).catch(reject)
    })
  }

  function joinRoom(code: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve, reject) => {
      _connectAndRun((s) => {
        s.emit('join-room', { code }, (ack: { role: string | null; error?: string }) => {
          if (ack.role) {
            roomCode.value = code.toUpperCase()
            isHost.value = ack.role === 'host'
            resolve({ success: true })
          } else {
            resolve({ success: false, error: ack.error })
          }
        })
      }).catch(reject)
    })
  }

  function sendUnits(units: PlayUnit[]): void {
    socket?.emit('sync-units', { units })
  }

  function sendTrackerState(snapshot: TrackerSnapshot): void {
    socket?.emit('sync-tracker', { snapshot })
  }

  function sendDiceResult(roll: DiceRollResult): void {
    socket?.emit('dice-result', { roll })
  }

  function leaveRoom(): void {
    socket?.disconnect()
    socket = null
    roomCode.value = null
    connected.value = false
    isHost.value = false
    opponentOnline.value = false
  }

  function onOpponentUnits(cb: Callback<PlayUnit[]>): void { _onOpponentUnits = cb }
  function onTrackerUpdate(cb: Callback<TrackerSnapshot>): void { _onTrackerUpdate = cb }
  function onOpponentDice(cb: Callback<DiceRollResult>): void { _onOpponentDice = cb }
  function onPlayerJoined(cb: Callback): void { _onPlayerJoined = cb }
  function onPlayerLeft(cb: Callback): void { _onPlayerLeft = cb }

  return {
    roomCode,
    connected,
    isHost,
    opponentOnline,
    createRoom,
    joinRoom,
    sendUnits,
    sendTrackerState,
    sendDiceResult,
    leaveRoom,
    onOpponentUnits,
    onTrackerUpdate,
    onOpponentDice,
    onPlayerJoined,
    onPlayerLeft,
  }
}
