import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Character, Mission, Squad, StrikeForce, CompactBuild } from '../types/index.ts'
import { isSquadValid, hasStrikeForceConflict } from '../types/index.ts'

const emptySquad = (): Squad => ({ primary: null, secondary: null, support: null })

function buildToCompact(
  name: string,
  mission: Mission | null,
  premiere: boolean,
  squads: [Squad, Squad],
  extraSquads: [Squad, Squad],
): CompactBuild {
  const compact: CompactBuild = {
    name: name.trim() || 'Unnamed',
    mid: mission?.id ?? null,
    pre: premiere,
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
  if (premiere) {
    compact.ex = [
      [
        extraSquads[0].primary?.id ?? 0,
        extraSquads[0].secondary?.id ?? 0,
        extraSquads[0].support?.id ?? 0,
      ],
      [
        extraSquads[1].primary?.id ?? 0,
        extraSquads[1].secondary?.id ?? 0,
        extraSquads[1].support?.id ?? 0,
      ],
    ]
  }
  return compact
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
    const premiere = ref<boolean>(false)
    const extraSquads = ref<[Squad, Squad]>([emptySquad(), emptySquad()])

    // Multi-list
    const savedLists = ref<CompactBuild[]>([])
    const activeIndex = ref<number>(-1)

    const squad0Result = computed(() => isSquadValid(squads.value[0]))
    const squad1Result = computed(() => isSquadValid(squads.value[1]))
    const squad2Result = computed(() => isSquadValid(extraSquads.value[0]))
    const squad3Result = computed(() => isSquadValid(extraSquads.value[1]))
    const isSquad0Valid = computed(() => squad0Result.value.valid)
    const isSquad1Valid = computed(() => squad1Result.value.valid)
    const isSquad2Valid = computed(() => squad2Result.value.valid)
    const isSquad3Valid = computed(() => squad3Result.value.valid)
    const hasUniqueConflict = computed(() => hasStrikeForceConflict(squads.value))

    const isStrikeForceComplete = computed(() => {
      const s0 = squads.value[0]
      const s1 = squads.value[1]
      const baseFilled =
        s0.primary && s0.secondary && s0.support &&
        s1.primary && s1.secondary && s1.support
      if (!baseFilled || !isSquad0Valid.value || !isSquad1Valid.value) return false

      if (premiere.value) {
        const e0 = extraSquads.value[0]
        const e1 = extraSquads.value[1]
        const extraFilled =
          e0.primary && e0.secondary && e0.support &&
          e1.primary && e1.secondary && e1.support
        if (!extraFilled || !isSquad2Valid.value || !isSquad3Valid.value) return false
        // Check uniqueness across all 4 squads
        const allUnits: Character[] = []
        for (const sq of [...squads.value, ...extraSquads.value]) {
          for (const role of ['primary', 'secondary', 'support'] as const) {
            const u = sq[role]
            if (u) allUnits.push(u)
          }
        }
        const names = allUnits.map(u => u.name)
        if (new Set(names).size < names.length) return false
        const charTypes = allUnits.map(u => u.characterType).filter(Boolean)
        if (new Set(charTypes).size < charTypes.length) return false
        return true
      }

      return !hasUniqueConflict.value
    })

    function setName(n: string) {
      name.value = n
    }

    function setMission(m: Mission | null) {
      mission.value = m
    }

    function setPremiere(val: boolean) {
      premiere.value = val
      if (!val) extraSquads.value = [emptySquad(), emptySquad()]
    }

    function setUnit(squadIdx: 0 | 1 | 2 | 3, role: keyof Squad, unit: Character | null) {
      if (squadIdx < 2) {
        squads.value[squadIdx][role] = unit
      } else {
        extraSquads.value[squadIdx - 2][role] = unit
      }
    }

    function clearUnit(squadIdx: 0 | 1 | 2 | 3, role: keyof Squad) {
      if (squadIdx < 2) {
        squads.value[squadIdx][role] = null
      } else {
        extraSquads.value[squadIdx - 2][role] = null
      }
    }

    function resetStrikeForce() {
      name.value = ''
      mission.value = null
      squads.value = [emptySquad(), emptySquad()]
      premiere.value = false
      extraSquads.value = [emptySquad(), emptySquad()]
    }

    function saveCurrentList() {
      const compact = buildToCompact(name.value, mission.value, premiere.value, squads.value, extraSquads.value)
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
      premiere.value = build.pre
      if (build.ex) {
        extraSquads.value = [
          {
            primary: build.ex[0][0] ? (characters.find(c => c.id === build.ex![0][0]) ?? null) : null,
            secondary: build.ex[0][1] ? (characters.find(c => c.id === build.ex![0][1]) ?? null) : null,
            support: build.ex[0][2] ? (characters.find(c => c.id === build.ex![0][2]) ?? null) : null,
          },
          {
            primary: build.ex[1][0] ? (characters.find(c => c.id === build.ex![1][0]) ?? null) : null,
            secondary: build.ex[1][1] ? (characters.find(c => c.id === build.ex![1][1]) ?? null) : null,
            support: build.ex[1][2] ? (characters.find(c => c.id === build.ex![1][2]) ?? null) : null,
          },
        ]
      } else {
        extraSquads.value = [emptySquad(), emptySquad()]
      }
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
      premiere,
      extraSquads,
      savedLists,
      activeIndex,
      strikeForce,
      squad0Result,
      squad1Result,
      squad2Result,
      squad3Result,
      isSquad0Valid,
      isSquad1Valid,
      isSquad2Valid,
      isSquad3Valid,
      hasUniqueConflict,
      isStrikeForceComplete,
      setName,
      setMission,
      setPremiere,
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
