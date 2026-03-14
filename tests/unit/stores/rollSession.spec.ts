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
})
