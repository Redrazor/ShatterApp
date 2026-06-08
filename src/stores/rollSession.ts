import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PlayUnit, DiceRole, DuelRow, ForcePoolPayload, RoomMode, Team, RoomPlayerView, OrderDeckState } from '../types/index.ts'
import type { DieState } from '../utils/dice.ts'

export const useRollSessionStore = defineStore('rollSession', () => {
  const roomCode = ref<string | null>(null)
  const isConnected = ref(false)
  const isHost = ref(false)
  const opponentOnline = ref(false)

  // ── 2v2 multiplayer ────────────────────────────────────────────
  const mode = ref<RoomMode>('1v1')
  const mySocketId = ref<string | null>(null)
  const players = ref<RoomPlayerView[]>([])
  const matchReady = ref(false)
  // Per-player rosters / force pools, keyed by socketId (2v2 fan-out).
  const playerUnits = ref<Record<string, PlayUnit[]>>({})
  const playerForcePools = ref<Record<string, ForcePoolPayload>>({})

  // Opponent order-deck state (revealed card + remaining count).
  const opponentDeck = ref<OrderDeckState | null>(null)            // 1v1
  const playerDecks = ref<Record<string, OrderDeckState>>({})      // 2v2, keyed by socketId
  function setOpponentDeck(d: OrderDeckState | null) { opponentDeck.value = d }
  function setPlayerDeck(socketId: string, d: OrderDeckState) { playerDecks.value[socketId] = d }

  const myTeam = computed<Team | null>(
    () => players.value.find((p) => p.socketId === mySocketId.value)?.team ?? null,
  )
  // Other players ordered teammates-first, for the roster sub-tabs.
  const otherPlayers = computed<RoomPlayerView[]>(() => {
    const others = players.value.filter((p) => p.socketId !== mySocketId.value)
    return [...others].sort((a, b) => {
      const aMine = a.team && a.team === myTeam.value ? 0 : 1
      const bMine = b.team && b.team === myTeam.value ? 0 : 1
      return aMine - bMine
    })
  })
  const teammates = computed<RoomPlayerView[]>(() =>
    players.value.filter((p) => p.socketId !== mySocketId.value && p.team != null && p.team === myTeam.value),
  )
  const opponents = computed<RoomPlayerView[]>(() =>
    players.value.filter((p) => p.team != null && p.team !== myTeam.value),
  )

  function setMode(m: RoomMode) { mode.value = m }
  function setMySocketId(id: string | null) { mySocketId.value = id }
  function setPlayers(list: RoomPlayerView[]) { players.value = list }
  function setMatchReady(ready: boolean) { matchReady.value = ready }
  function setPlayerUnits(socketId: string, units: PlayUnit[]) { playerUnits.value[socketId] = units }
  function setPlayerForcePool(socketId: string, fp: ForcePoolPayload) { playerForcePools.value[socketId] = fp }
  function applyRoomUpdate(payload: { players: RoomPlayerView[]; mode: RoomMode; ready: boolean }) {
    players.value = payload.players
    mode.value = payload.mode
    matchReady.value = payload.ready
  }

  // Player names
  const playerName = ref<string | null>(null)
  const opponentName = ref<string | null>(null)

  // Units sync
  const opponentUnits = ref<PlayUnit[]>([])
  const opponentForcePool = ref<ForcePoolPayload | null>(null)

  // Dice role system
  const myRole = ref<DiceRole>(null)
  const roleTaken = ref<'attacker' | 'defender' | null>(null)
  const opponentRole = computed<DiceRole>(() =>
    myRole.value === 'attacker' ? 'defender' : myRole.value === 'defender' ? 'attacker' : null,
  )
  const opponentPool = ref<DieState[]>([])

  // Unit IDs linked to each dice column
  const atkUnitId = ref<number | null>(null)
  const defUnitId = ref<number | null>(null)

  function setAtkUnit(id: number | null) { atkUnitId.value = id }
  function setDefUnit(id: number | null) { defUnitId.value = id }

  // Mission ownership (used to sync lock state to opponent)
  const missionOwner = ref<'host' | 'guest' | null>(null)

  // Duel history — one committed row per completed duel, capped at 20
  const duelHistory = ref<DuelRow[]>([])

  function setRoom(code: string, host: boolean) {
    roomCode.value = code
    isHost.value = host
    isConnected.value = true
  }

  function setPlayerName(name: string) { playerName.value = name }
  function setOpponentName(name: string) { opponentName.value = name }
  function setOpponentOnline(online: boolean) { opponentOnline.value = online }
  function setOpponentUnits(units: PlayUnit[]) { opponentUnits.value = units }
  function setOpponentForcePool(fp: ForcePoolPayload) { opponentForcePool.value = fp }
  function claimRole(role: DiceRole) { myRole.value = role }
  function setRoleTaken(role: 'attacker' | 'defender' | null) { roleTaken.value = role }
  function setMissionOwner(owner: 'host' | 'guest' | null) { missionOwner.value = owner }
  function setOpponentPool(pool: DieState[]) { opponentPool.value = pool }

  function commitDuel(atkPool: DieState[], defPool: DieState[], atkName: string, defName: string) {
    const crits   = atkPool.filter(d => d.face === 'crit').length
    const strikes = atkPool.filter(d => d.face === 'strike').length
    const blocks  = defPool.filter(d => d.face === 'block').length
    const netHits = crits + Math.max(0, strikes - blocks)
    const row: DuelRow = { atkPool: atkPool.map(d => ({ ...d })), defPool: defPool.map(d => ({ ...d })), atkName, defName, netHits, timestamp: Date.now() }
    duelHistory.value = [row, ...duelHistory.value].slice(0, 20)
  }

  function resetDuel() {
    myRole.value = null
    roleTaken.value = null
    opponentPool.value = []
    atkUnitId.value = null
    defUnitId.value = null
  }

  function clearHistory() {
    duelHistory.value = []
  }

  function reset() {
    missionOwner.value = null
    roleTaken.value = null
    roomCode.value = null
    isConnected.value = false
    isHost.value = false
    opponentOnline.value = false
    opponentUnits.value = []
    opponentForcePool.value = null
    playerName.value = null
    opponentName.value = null
    myRole.value = null
    opponentPool.value = []
    duelHistory.value = []
    atkUnitId.value = null
    defUnitId.value = null
    mode.value = '1v1'
    mySocketId.value = null
    players.value = []
    matchReady.value = false
    playerUnits.value = {}
    playerForcePools.value = {}
    opponentDeck.value = null
    playerDecks.value = {}
  }

  return {
    roomCode,
    isConnected,
    isHost,
    opponentOnline,
    playerName,
    missionOwner,
    setMissionOwner,
    roleTaken,
    setRoleTaken,
    opponentName,
    opponentUnits,
    opponentForcePool,
    myRole,
    opponentRole,
    opponentPool,
    duelHistory,
    atkUnitId,
    defUnitId,
    setAtkUnit,
    setDefUnit,
    setRoom,
    setPlayerName,
    setOpponentName,
    setOpponentOnline,
    setOpponentUnits,
    setOpponentForcePool,
    claimRole,
    setOpponentPool,
    commitDuel,
    resetDuel,
    clearHistory,
    reset,
    // 2v2
    mode,
    mySocketId,
    players,
    matchReady,
    playerUnits,
    playerForcePools,
    opponentDeck,
    playerDecks,
    myTeam,
    otherPlayers,
    teammates,
    opponents,
    setMode,
    setMySocketId,
    setPlayers,
    setMatchReady,
    setPlayerUnits,
    setPlayerForcePool,
    setOpponentDeck,
    setPlayerDeck,
    applyRoomUpdate,
  }
})
