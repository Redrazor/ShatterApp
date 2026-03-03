import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Character, Mission, Squad, StrikeForce } from '../types/index.ts'
import { isSquadValid } from '../types/index.ts'

const emptySquad = (): Squad => ({ primary: null, secondary: null, support: null })

export const useStrikeForceStore = defineStore(
  'strikeForce',
  () => {
    const name = ref<string>('')
    const mission = ref<Mission | null>(null)
    const premiere = ref<boolean>(false)
    const squads = ref<[Squad, Squad]>([emptySquad(), emptySquad()])

    const squad0Result = computed(() => isSquadValid(squads.value[0]))
    const squad1Result = computed(() => isSquadValid(squads.value[1]))
    const isSquad0Valid = computed(() => squad0Result.value.valid)
    const isSquad1Valid = computed(() => squad1Result.value.valid)

    const isStrikeForceComplete = computed(() => {
      const s0 = squads.value[0]
      const s1 = squads.value[1]
      const allFilled =
        s0.primary && s0.secondary && s0.support &&
        s1.primary && s1.secondary && s1.support
      return !!(allFilled && isSquad0Valid.value && isSquad1Valid.value)
    })

    function setName(n: string) {
      name.value = n
    }

    function setMission(m: Mission | null) {
      mission.value = m
    }

    function setPremiere(p: boolean) {
      premiere.value = p
    }

    function setUnit(squadIdx: 0 | 1, role: keyof Squad, unit: Character | null) {
      squads.value[squadIdx][role] = unit
    }

    function clearUnit(squadIdx: 0 | 1, role: keyof Squad) {
      squads.value[squadIdx][role] = null
    }

    function resetStrikeForce() {
      name.value = ''
      mission.value = null
      premiere.value = false
      squads.value = [emptySquad(), emptySquad()]
    }

    const strikeForce = computed<StrikeForce>(() => ({
      name: name.value,
      mission: mission.value,
      premiere: premiere.value,
      squads: squads.value,
    }))

    return {
      name,
      mission,
      premiere,
      squads,
      strikeForce,
      squad0Result,
      squad1Result,
      isSquad0Valid,
      isSquad1Valid,
      isStrikeForceComplete,
      setName,
      setMission,
      setPremiere,
      setUnit,
      clearUnit,
      resetStrikeForce,
    }
  },
  { persist: true },
)
