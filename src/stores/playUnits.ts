import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Character, PlayUnit, ConditionKey } from '../types/index.ts'

export const usePlayUnitsStore = defineStore(
  'playUnits',
  () => {
    const units = ref<PlayUnit[]>([])
    const locked = ref(false)
    const rosterComplete = ref(false) // both squads imported — no manual adding allowed
    const spentTokens = ref<boolean[]>([]) // force pool spent state

    const hasUnits = computed(() => units.value.length > 0)
    const totalFp = computed(() => units.value.reduce((s, u) => s + (u.fp ?? 0), 0))

    function _toPlayUnit(c: Character): PlayUnit {
      return {
        id: c.id,
        name: c.name,
        thumbnail: c.thumbnail,
        unitType: c.unitType ?? '',
        stamina: c.stamina ?? 1,
        durability: c.durability ?? 1,
        fp: c.fp ?? 0,
        stance1: c.stance1,
        stance2: c.stance2,
        activeStance: 1,
        damage: 0,
        wounds: 0,
        conditions: [],
        tags: c.tags ?? [],
      }
    }

    function addUnit(character: Character) {
      if (locked.value) return
      if (units.value.some(u => u.id === character.id)) return
      units.value.push(_toPlayUnit(character))
    }

    function removeUnit(id: number) {
      if (locked.value) return
      units.value = units.value.filter(u => u.id !== id)
    }

    function importFromBuild(characters: Character[], complete: boolean) {
      if (locked.value) return
      for (const c of characters) {
        if (!units.value.some(u => u.id === c.id)) {
          units.value.push(_toPlayUnit(c))
        }
      }
      if (complete) rosterComplete.value = true
    }

    function lock() {
      locked.value = true
    }

    function unlock() {
      locked.value = false
    }

    function tapDamage(id: number, position: number) {
      const unit = units.value.find(u => u.id === id)
      if (!unit) return
      // Tapping the current damage position undoes it (decrement)
      const next = position === unit.damage ? position - 1 : position
      unit.damage = Math.max(0, next)
      // Auto-wound when damage fills
      if (unit.damage >= unit.stamina) {
        unit.damage = 0
        unit.wounds++
      }
    }

    function adjustWounds(id: number, delta: number) {
      const unit = units.value.find(u => u.id === id)
      if (!unit) return
      unit.wounds = Math.max(0, unit.wounds + delta)
    }

    function toggleCondition(id: number, condition: ConditionKey) {
      const unit = units.value.find(u => u.id === id)
      if (!unit) return
      const idx = unit.conditions.indexOf(condition)
      if (idx === -1) unit.conditions.push(condition)
      else unit.conditions.splice(idx, 1)
    }

    function setStance(id: number, stance: 1 | 2) {
      const unit = units.value.find(u => u.id === id)
      if (!unit) return
      unit.activeStance = stance
    }

    function isRemoved(unit: PlayUnit): boolean {
      return unit.wounds >= unit.durability
    }

    function toggleForceToken(index: number) {
      while (spentTokens.value.length <= index) spentTokens.value.push(false)
      spentTokens.value[index] = !spentTokens.value[index]
    }

    function refreshForcePool() {
      spentTokens.value = []
    }

    function clearRoster() {
      units.value = []
      rosterComplete.value = false
      spentTokens.value = []
      // locked (game state) intentionally preserved
    }

    function reset() {
      units.value = []
      locked.value = false
      rosterComplete.value = false
      spentTokens.value = []
    }

    return {
      units,
      locked,
      rosterComplete,
      spentTokens,
      hasUnits,
      totalFp,
      addUnit,
      removeUnit,
      importFromBuild,
      lock,
      unlock,
      tapDamage,
      adjustWounds,
      toggleCondition,
      setStance,
      isRemoved,
      toggleForceToken,
      refreshForcePool,
      clearRoster,
      reset,
    }
  },
  { persist: true },
)
