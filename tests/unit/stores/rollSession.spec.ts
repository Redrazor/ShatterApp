import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRollSessionStore } from '../../../src/stores/rollSession.ts'

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
    expect(store.lastOpponentDice).toBeNull()
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

  it('setLastDice updates lastOpponentDice', () => {
    const store = useRollSessionStore()
    const roll = { atkPool: [], defPool: [], hits: 3, timestamp: 42 }
    store.setLastDice(roll)
    expect(store.lastOpponentDice).toEqual(roll)
  })

  it('reset clears all state', () => {
    const store = useRollSessionStore()
    store.setRoom('ZZZZ', false)
    store.setOpponentOnline(true)
    store.setOpponentUnits([{ id: 2 }] as never)
    store.setLastDice({ atkPool: [], defPool: [], hits: 1, timestamp: 1 })
    store.reset()
    expect(store.roomCode).toBeNull()
    expect(store.isConnected).toBe(false)
    expect(store.isHost).toBe(false)
    expect(store.opponentOnline).toBe(false)
    expect(store.opponentUnits).toEqual([])
    expect(store.lastOpponentDice).toBeNull()
  })
})
