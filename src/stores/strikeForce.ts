import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Character, Mission, Squad, StrikeForce, CompactBuild } from '../types/index.ts'
import { isSquadValid, hasStrikeForceConflict } from '../types/index.ts'

const emptySquad = (): Squad => ({ primary: null, secondary: null, support: null })

function buildToCompact(
  name: string,
  mission: Mission | null,
  squads: [Squad, Squad],
): CompactBuild {
  return {
    name: name || 'Unnamed',
    mid: mission?.id ?? null,
    pre: false,
    s: [
      [
        squads[0].primary?.id ?? 0,
        squads[0].secondary?.id ?? 0,
        squads[0].support?.id ?? 0,
      ],
      [
        squads[1].primary?.id ?? 0,
        squads[1].secondary?.id ?? 0,
        squads[1].support?.id ?? 0,
      ],
    ],
  }
}

export function migrateStrikeForceState(s: any): void {
  if (
    Array.isArray(s.savedLists) &&
    s.savedLists.length === 0 &&
    s.name
  ) {
    const compact: CompactBuild = {
      name: s.name,
      mid: s.mission?.id ?? null,
      pre: s.premiere ?? false,
      s: [
        [
          s.squads?.[0]?.primary?.id ?? 0,
          s.squads?.[0]?.secondary?.id ?? 0,
          s.squads?.[0]?.support?.id ?? 0,
        ],
        [
          s.squads?.[1]?.primary?.id ?? 0,
          s.squads?.[1]?.secondary?.id ?? 0,
          s.squads?.[1]?.support?.id ?? 0,
        ],
      ],
    }
    s.savedLists.push(compact)
    s.activeIndex = 0
  }
}

export const useStrikeForceStore = defineStore(
  'strikeForce',
  () => {
    // Draft (working copy)
    const name = ref<string>('')
    const mission = ref<Mission | null>(null)
    const squads = ref<[Squad, Squad]>([emptySquad(), emptySquad()])

    // Multi-list
    const savedLists = ref<CompactBuild[]>([])
    const activeIndex = ref<number>(-1)

    const squad0Result = computed(() => isSquadValid(squads.value[0]))
    const squad1Result = computed(() => isSquadValid(squads.value[1]))
    const isSquad0Valid = computed(() => squad0Result.value.valid)
    const isSquad1Valid = computed(() => squad1Result.value.valid)
    const hasUniqueConflict = computed(() => hasStrikeForceConflict(squads.value))

    const isStrikeForceComplete = computed(() => {
      const s0 = squads.value[0]
      const s1 = squads.value[1]
      const allFilled =
        s0.primary && s0.secondary && s0.support &&
        s1.primary && s1.secondary && s1.support
      return !!(allFilled && isSquad0Valid.value && isSquad1Valid.value && !hasUniqueConflict.value)
    })

    function setName(n: string) {
      name.value = n
    }

    function setMission(m: Mission | null) {
      mission.value = m
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
      squads.value = [emptySquad(), emptySquad()]
    }

    function saveCurrentList() {
      const compact = buildToCompact(name.value, mission.value, squads.value)
      if (activeIndex.value === -1) {
        savedLists.value.push(compact)
        activeIndex.value = savedLists.value.length - 1
      } else {
        savedLists.value[activeIndex.value] = compact
      }
    }

    function loadList(i: number, characters: Character[], missions: Mission[]) {
      const build = savedLists.value[i]
      if (!build) return
      name.value = build.name
      mission.value = build.mid !== null
        ? (missions.find(m => m.id === build.mid) ?? null)
        : null
      squads.value = [
        {
          primary: build.s[0][0] ? (characters.find(c => c.id === build.s[0][0]) ?? null) : null,
          secondary: build.s[0][1] ? (characters.find(c => c.id === build.s[0][1]) ?? null) : null,
          support: build.s[0][2] ? (characters.find(c => c.id === build.s[0][2]) ?? null) : null,
        },
        {
          primary: build.s[1][0] ? (characters.find(c => c.id === build.s[1][0]) ?? null) : null,
          secondary: build.s[1][1] ? (characters.find(c => c.id === build.s[1][1]) ?? null) : null,
          support: build.s[1][2] ? (characters.find(c => c.id === build.s[1][2]) ?? null) : null,
        },
      ]
      activeIndex.value = i
    }

    function deleteList(i: number) {
      savedLists.value.splice(i, 1)
      if (activeIndex.value === i) {
        resetStrikeForce()
        activeIndex.value = -1
      } else if (activeIndex.value > i) {
        activeIndex.value--
      }
    }

    function newList() {
      resetStrikeForce()
      activeIndex.value = -1
    }

    function importLists(lists: CompactBuild[]) {
      for (const list of lists) {
        savedLists.value.push(list)
      }
    }

    const strikeForce = computed<StrikeForce>(() => ({
      name: name.value,
      mission: mission.value,
      squads: squads.value,
    }))

    return {
      name,
      mission,
      squads,
      savedLists,
      activeIndex,
      strikeForce,
      squad0Result,
      squad1Result,
      isSquad0Valid,
      isSquad1Valid,
      hasUniqueConflict,
      isStrikeForceComplete,
      setName,
      setMission,
      setUnit,
      clearUnit,
      resetStrikeForce,
      saveCurrentList,
      loadList,
      deleteList,
      newList,
      importLists,
    }
  },
  {
    persist: {
      afterRestore: (ctx) => { migrateStrikeForceState(ctx.store) },
    },
  },
)
