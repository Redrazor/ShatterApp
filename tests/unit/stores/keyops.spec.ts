import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useKeyopsStore } from '../../../src/stores/keyops.ts'
import type { KoMission } from '../../../src/types/index.ts'

const mockMission: KoMission = {
  id: 1,
  name: 'Explore the Ruins',
  missionFront: '/images/ko/mission-front.png',
  missionBack: '/images/ko/mission-back.png',
  stages: [
    { front: '/images/ko/stage-1-front.png', back: '/images/ko/stage-1-back.png' },
    { front: '/images/ko/stage-2-front.png', back: '/images/ko/stage-2-back.png' },
  ],
  tracker: '/images/ko/tracker.png',
}

describe('useKeyopsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ── Initial state ─────────────────────────────────────────────────────────

  it('starts in standard mode', () => {
    const store = useKeyopsStore()
    expect(store.mode).toBe('standard')
  })

  it('starts with zero campaign wins', () => {
    const store = useKeyopsStore()
    expect(store.aggressorCampaignWins).toBe(0)
    expect(store.sentinelCampaignWins).toBe(0)
  })

  it('starts with empty opResults', () => {
    const store = useKeyopsStore()
    expect(store.opResults).toEqual([])
  })

  it('starts with no selected KO mission', () => {
    const store = useKeyopsStore()
    expect(store.selectedKoMission).toBeNull()
  })

  it('starts with koStageIndex 0', () => {
    const store = useKeyopsStore()
    expect(store.koStageIndex).toBe(0)
  })

  // ── campaignOver computed ─────────────────────────────────────────────────

  it('campaignOver is false initially', () => {
    const store = useKeyopsStore()
    expect(store.campaignOver).toBe(false)
  })

  it('campaignOver is true when aggressor has 2 wins', () => {
    const store = useKeyopsStore()
    store.aggressorCampaignWins = 2
    expect(store.campaignOver).toBe(true)
  })

  it('campaignOver is true when sentinel has 2 wins', () => {
    const store = useKeyopsStore()
    store.sentinelCampaignWins = 2
    expect(store.campaignOver).toBe(true)
  })

  // ── campaignWinner computed ───────────────────────────────────────────────

  it('campaignWinner is null initially', () => {
    const store = useKeyopsStore()
    expect(store.campaignWinner).toBeNull()
  })

  it('campaignWinner returns aggressor when aggressor has 2 wins', () => {
    const store = useKeyopsStore()
    store.aggressorCampaignWins = 2
    expect(store.campaignWinner).toBe('aggressor')
  })

  it('campaignWinner returns sentinel when sentinel has 2 wins', () => {
    const store = useKeyopsStore()
    store.sentinelCampaignWins = 2
    expect(store.campaignWinner).toBe('sentinel')
  })

  // ── claimOp ───────────────────────────────────────────────────────────────

  it('claimOp(aggressor) increments aggressorCampaignWins', () => {
    const store = useKeyopsStore()
    store.claimOp('aggressor')
    expect(store.aggressorCampaignWins).toBe(1)
    expect(store.sentinelCampaignWins).toBe(0)
  })

  it('claimOp(sentinel) increments sentinelCampaignWins', () => {
    const store = useKeyopsStore()
    store.claimOp('sentinel')
    expect(store.sentinelCampaignWins).toBe(1)
    expect(store.aggressorCampaignWins).toBe(0)
  })

  it('claimOp pushes winner to opResults', () => {
    const store = useKeyopsStore()
    store.claimOp('aggressor')
    store.claimOp('sentinel')
    expect(store.opResults).toEqual(['aggressor', 'sentinel'])
  })

  // ── selectKoMission ───────────────────────────────────────────────────────

  it('selectKoMission sets selectedKoMission', () => {
    const store = useKeyopsStore()
    store.selectKoMission(mockMission)
    expect(store.selectedKoMission).toEqual(mockMission)
  })

  it('selectKoMission resets koStageIndex to 0', () => {
    const store = useKeyopsStore()
    store.koStageIndex = 1
    store.selectKoMission(mockMission)
    expect(store.koStageIndex).toBe(0)
  })

  // ── advanceStage ─────────────────────────────────────────────────────────

  it('advanceStage increments koStageIndex when not on last stage', () => {
    const store = useKeyopsStore()
    store.selectKoMission(mockMission) // 2 stages
    store.advanceStage()
    expect(store.koStageIndex).toBe(1)
  })

  it('advanceStage does not exceed last stage index', () => {
    const store = useKeyopsStore()
    store.selectKoMission(mockMission)
    store.koStageIndex = 1 // last stage
    store.advanceStage()
    expect(store.koStageIndex).toBe(1)
  })

  it('advanceStage does nothing when no mission is selected', () => {
    const store = useKeyopsStore()
    store.advanceStage()
    expect(store.koStageIndex).toBe(0)
  })

  // ── resetKoMission ────────────────────────────────────────────────────────

  it('resetKoMission clears selectedKoMission', () => {
    const store = useKeyopsStore()
    store.selectKoMission(mockMission)
    store.resetKoMission()
    expect(store.selectedKoMission).toBeNull()
  })

  it('resetKoMission resets koStageIndex to 0', () => {
    const store = useKeyopsStore()
    store.selectKoMission(mockMission)
    store.koStageIndex = 1
    store.resetKoMission()
    expect(store.koStageIndex).toBe(0)
  })

  // ── resetCampaign ─────────────────────────────────────────────────────────

  it('resetCampaign zeroes all win counts and opResults', () => {
    const store = useKeyopsStore()
    store.claimOp('aggressor')
    store.claimOp('sentinel')
    store.resetCampaign()
    expect(store.aggressorCampaignWins).toBe(0)
    expect(store.sentinelCampaignWins).toBe(0)
    expect(store.opResults).toEqual([])
  })

  it('resetCampaign also resets mission selection', () => {
    const store = useKeyopsStore()
    store.selectKoMission(mockMission)
    store.resetCampaign()
    expect(store.selectedKoMission).toBeNull()
    expect(store.koStageIndex).toBe(0)
  })
})
