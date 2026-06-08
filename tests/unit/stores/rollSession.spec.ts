import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRollSessionStore } from '../../../src/stores/rollSession.ts'

const strike = { id: 0, type: 'attack',  face: 'strike', locked: false, isBonus: false } as never
const crit   = { id: 1, type: 'attack',  face: 'crit',   locked: false, isBonus: false } as never
const block  = { id: 2, type: 'defense', face: 'block',  locked: false, isBonus: false } as never

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('rollSession store', () => {
  it('initial state is empty/false', () => {
    const store = useRollSessionStore()
    expect(store.roomCode).toBeNull()
    expect(store.isConnected).toBe(false)
    expect(store.isHost).toBe(false)
    expect(store.opponentOnline).toBe(false)
    expect(store.opponentUnits).toEqual([])
    expect(store.opponentPool).toEqual([])
    expect(store.myRole).toBeNull()
    expect(store.missionOwner).toBeNull()
  })

  it('setRoom updates roomCode, isHost, isConnected', () => {
    const store = useRollSessionStore()
    store.setRoom('ABCD', true)
    expect(store.roomCode).toBe('ABCD')
    expect(store.isHost).toBe(true)
    expect(store.isConnected).toBe(true)
  })

  it('setOpponentOnline updates opponentOnline', () => {
    const store = useRollSessionStore()
    store.setOpponentOnline(true)
    expect(store.opponentOnline).toBe(true)
    store.setOpponentOnline(false)
    expect(store.opponentOnline).toBe(false)
  })

  it('setOpponentUnits updates opponentUnits', () => {
    const store = useRollSessionStore()
    const units = [{ id: 1, name: 'Rex' }] as never
    store.setOpponentUnits(units)
    expect(store.opponentUnits).toEqual(units)
  })

  it('setOpponentPool updates opponentPool', () => {
    const store = useRollSessionStore()
    store.setOpponentPool([strike])
    expect(store.opponentPool).toEqual([strike])
  })

  it('claimRole sets myRole and derives opponentRole', () => {
    const store = useRollSessionStore()
    store.claimRole('attacker')
    expect(store.myRole).toBe('attacker')
    expect(store.opponentRole).toBe('defender')
  })

  it('setMissionOwner updates missionOwner', () => {
    const store = useRollSessionStore()
    store.setMissionOwner('host')
    expect(store.missionOwner).toBe('host')
    store.setMissionOwner(null)
    expect(store.missionOwner).toBeNull()
  })

  it('commitDuel prepends a DuelRow and caps at 20', () => {
    const store = useRollSessionStore()
    for (let i = 0; i < 22; i++) {
      store.commitDuel([strike], [block], `Atk${i}`, `Def${i}`)
    }
    expect(store.duelHistory.length).toBe(20)
    expect(store.duelHistory[0].atkName).toBe('Atk21')
  })

  it('commitDuel computes netHits correctly', () => {
    const store = useRollSessionStore()
    // 1 crit + 2 strikes vs 1 block → 1 + max(0, 2-1) = 2
    store.commitDuel([crit, strike, strike], [block], 'A', 'D')
    expect(store.duelHistory[0].netHits).toBe(2)
  })

  it('commitDuel stores frozen copies of pools', () => {
    const store = useRollSessionStore()
    const atk = [{ ...strike }] as never
    const def = [{ ...block }]  as never
    store.commitDuel(atk, def, 'A', 'D')
    // Mutating originals should not affect stored row
    atk[0].face = 'miss'
    expect(store.duelHistory[0].atkPool[0].face).toBe('strike')
  })

  it('resetDuel clears role and opponentPool but preserves history', () => {
    const store = useRollSessionStore()
    store.claimRole('defender')
    store.setOpponentPool([strike])
    store.commitDuel([strike], [block], 'A', 'D')
    store.resetDuel()
    expect(store.myRole).toBeNull()
    expect(store.opponentPool).toEqual([])
    expect(store.duelHistory.length).toBe(1)
  })

  it('clearHistory removes all duel history entries', () => {
    const store = useRollSessionStore()
    store.commitDuel([strike], [block], 'A', 'D')
    store.commitDuel([crit],   [],      'A', 'D')
    store.clearHistory()
    expect(store.duelHistory).toEqual([])
  })

  it('reset clears all state', () => {
    const store = useRollSessionStore()
    store.setRoom('ZZZZ', false)
    store.setOpponentOnline(true)
    store.setOpponentUnits([{ id: 2 }] as never)
    store.claimRole('attacker')
    store.setMissionOwner('guest')
    store.reset()
    expect(store.roomCode).toBeNull()
    expect(store.isConnected).toBe(false)
    expect(store.isHost).toBe(false)
    expect(store.opponentOnline).toBe(false)
    expect(store.opponentUnits).toEqual([])
    expect(store.myRole).toBeNull()
    expect(store.missionOwner).toBeNull()
  })

  it('setAtkUnit and setDefUnit update unit ids', () => {
    const store = useRollSessionStore()
    store.setAtkUnit(5)
    store.setDefUnit(9)
    expect(store.atkUnitId).toBe(5)
    expect(store.defUnitId).toBe(9)
    store.setAtkUnit(null)
    expect(store.atkUnitId).toBeNull()
  })

  it('setPlayerName and setOpponentName update names', () => {
    const store = useRollSessionStore()
    store.setPlayerName('Alice')
    store.setOpponentName('Bob')
    expect(store.playerName).toBe('Alice')
    expect(store.opponentName).toBe('Bob')
  })

  it('setRoleTaken updates roleTaken', () => {
    const store = useRollSessionStore()
    store.setRoleTaken('attacker')
    expect(store.roleTaken).toBe('attacker')
    store.setRoleTaken(null)
    expect(store.roleTaken).toBeNull()
  })

  it('setOpponentForcePool updates opponentForcePool', () => {
    const store = useRollSessionStore()
    const pool = { tokens: [false, true], total: 2 } as never
    store.setOpponentForcePool(pool)
    expect(store.opponentForcePool).toEqual(pool)
  })
})

describe('rollSession store — 2v2', () => {
  function seed4() {
    const store = useRollSessionStore()
    store.setMySocketId('me')
    store.setMode('2v2')
    store.setPlayers([
      { socketId: 'me', name: 'Me', team: 'red', connected: true },
      { socketId: 'ally', name: 'Ally', team: 'red', connected: true },
      { socketId: 'opp1', name: 'Opp1', team: 'blue', connected: true },
      { socketId: 'opp2', name: 'Opp2', team: 'blue', connected: true },
    ])
    return store
  }

  it('defaults to 1v1 mode', () => {
    expect(useRollSessionStore().mode).toBe('1v1')
  })

  it('myTeam reflects my own player slot', () => {
    expect(seed4().myTeam).toBe('red')
  })

  it('teammates excludes me and includes only same-team players', () => {
    const store = seed4()
    expect(store.teammates.map((p) => p.socketId)).toEqual(['ally'])
  })

  it('opponents are the other team', () => {
    const store = seed4()
    expect(store.opponents.map((p) => p.socketId).sort()).toEqual(['opp1', 'opp2'])
  })

  it('otherPlayers orders teammates before opponents', () => {
    const store = seed4()
    expect(store.otherPlayers.map((p) => p.socketId)).toEqual(['ally', 'opp1', 'opp2'])
  })

  it('setPlayerUnits / setPlayerForcePool key by socketId', () => {
    const store = seed4()
    store.setPlayerUnits('opp1', [{ id: 5 }] as never)
    store.setPlayerForcePool('opp1', { total: 2, spentTokens: [true, false] })
    expect(store.playerUnits['opp1']).toEqual([{ id: 5 }])
    expect(store.playerForcePools['opp1'].total).toBe(2)
  })

  it('setOpponentDeck / setPlayerDeck store order-deck state', () => {
    const store = seed4()
    store.setOpponentDeck({ revealed: null, deckCount: 4, activatedCount: 0 })
    expect(store.opponentDeck?.deckCount).toBe(4)
    store.setPlayerDeck('opp1', { revealed: { id: 7, name: 'Maul', orderCard: '/x.png', isShatterpoint: false }, deckCount: 2, activatedCount: 3 })
    expect(store.playerDecks['opp1'].revealed?.name).toBe('Maul')
    expect(store.playerDecks['opp1'].deckCount).toBe(2)
  })

  it('reset clears opponent/player deck state', () => {
    const store = seed4()
    store.setOpponentDeck({ revealed: null, deckCount: 4, activatedCount: 0 })
    store.setPlayerDeck('opp1', { revealed: null, deckCount: 1, activatedCount: 0 })
    store.reset()
    expect(store.opponentDeck).toBeNull()
    expect(store.playerDecks).toEqual({})
  })

  it('applyRoomUpdate sets players, mode, and matchReady', () => {
    const store = useRollSessionStore()
    store.applyRoomUpdate({
      players: [{ socketId: 'x', connected: true }],
      mode: '2v2',
      ready: true,
    })
    expect(store.mode).toBe('2v2')
    expect(store.matchReady).toBe(true)
    expect(store.players).toHaveLength(1)
  })

  it('reset clears all 2v2 state', () => {
    const store = seed4()
    store.setMatchReady(true)
    store.setPlayerUnits('opp1', [{ id: 1 }] as never)
    store.reset()
    expect(store.mode).toBe('1v1')
    expect(store.mySocketId).toBeNull()
    expect(store.players).toEqual([])
    expect(store.matchReady).toBe(false)
    expect(store.playerUnits).toEqual({})
    expect(store.playerForcePools).toEqual({})
  })
})
