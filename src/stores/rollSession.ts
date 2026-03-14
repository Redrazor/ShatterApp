import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PlayUnit, DiceRole, DuelRow, ForcePoolPayload } from '../types/index.ts'
import type { DieState } from '../utils/dice.ts'

export const useRollSessionStore = defineStore('rollSession', () => {
  const roomCode = ref<string | null>(null)
  const isConnected = ref(false)
  const isHost = ref(false)
  const opponentOnline = ref(false)

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

  // Unit IDs linked to active dice roll
  const myUnitId  = ref<number | null>(null)
  const oppUnitId = ref<number | null>(null)

  function setMyUnit(id: number | null)  { myUnitId.value = id }
  function setOppUnit(id: number | null) { oppUnitId.value = id }

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
    myUnitId.value = null
    oppUnitId.value = null
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
    myUnitId.value = null
    oppUnitId.value = null
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
    myUnitId,
    oppUnitId,
    setMyUnit,
    setOppUnit,
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
  }
})
