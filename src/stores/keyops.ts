import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { KoMission } from '../types/index.ts'

export type GameMode = 'standard' | 'key-operations' | 'legendary'

export const useKeyopsStore = defineStore(
  'keyops',
  () => {
    const mode = ref<GameMode>('standard')

    // Campaign: wins per role across ops (persisted)
    const aggressorCampaignWins = ref(0)
    const sentinelCampaignWins = ref(0)
    // Which role won each op, in order (for pip colouring)
    const opResults = ref<Array<'aggressor' | 'sentinel'>>([])

    // KO mission selection
    const selectedKoMission = ref<KoMission | null>(null)
    const koStageIndex = ref(0)

    const campaignOver = computed(
      () => aggressorCampaignWins.value === 2 || sentinelCampaignWins.value === 2,
    )

    const campaignWinner = computed<'aggressor' | 'sentinel' | null>(() => {
      if (aggressorCampaignWins.value === 2) return 'aggressor'
      if (sentinelCampaignWins.value === 2) return 'sentinel'
      return null
    })

    function claimOp(winner: 'aggressor' | 'sentinel') {
      opResults.value.push(winner)
      if (winner === 'aggressor') aggressorCampaignWins.value++
      else sentinelCampaignWins.value++
    }

    function selectKoMission(m: KoMission) {
      selectedKoMission.value = m
      koStageIndex.value = 0
    }

    function advanceStage() {
      if (koStageIndex.value < (selectedKoMission.value?.stages.length ?? 1) - 1)
        koStageIndex.value++
    }

    function resetKoMission() {
      selectedKoMission.value = null
      koStageIndex.value = 0
    }

    function resetCampaign() {
      aggressorCampaignWins.value = 0
      sentinelCampaignWins.value = 0
      opResults.value = []
      resetKoMission()
    }

    return {
      mode,
      aggressorCampaignWins,
      sentinelCampaignWins,
      opResults,
      selectedKoMission,
      koStageIndex,
      campaignOver,
      campaignWinner,
      claimOp,
      selectKoMission,
      advanceStage,
      resetKoMission,
      resetCampaign,
    }
  },
  { persist: true },
)
