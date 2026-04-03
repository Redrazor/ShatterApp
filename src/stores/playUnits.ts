import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Character, PlayUnit, ConditionKey } from '../types/index.ts'
import { useDiceRoom } from '../composables/useDiceRoom.ts'
import { useRollSessionStore } from './rollSession.ts'

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
        wounded: false,
        defeated: false,
        conditions: [],
        tags: c.tags ?? [],
        orderCard: c.orderCard,
      }
    }

    function _syncUnits() {
      const session = useRollSessionStore()
      if (session.isConnected) useDiceRoom().sendUnits(units.value, {
        spentTokens: [...spentTokens.value],
        total: totalFp.value,
      })
    }

    function addUnit(character: Character) {
      if (locked.value) return
      if (units.value.some(u => u.id === character.id)) return
      units.value.push(_toPlayUnit(character))
      _syncUnits()
    }

    function removeUnit(id: number) {
      if (locked.value) return
      units.value = units.value.filter(u => u.id !== id)
      _syncUnits()
    }

    function importFromBuild(characters: Character[], complete: boolean) {
      if (locked.value) return
      for (const c of characters) {
        if (!units.value.some(u => u.id === c.id)) {
          units.value.push(_toPlayUnit(c))
        }
      }
      if (complete) rosterComplete.value = true
      _syncUnits()
    }

    function lock() {
      locked.value = true
    }

    function unlock() {
      locked.value = false
    }

    function tapDamage(id: number, position: number) {
      const unit = units.value.find(u => u.id === id)
      if (!unit || unit.wounded) return
      // Tapping the current damage position undoes it (decrement)
      const next = position === unit.damage ? position - 1 : position
      unit.damage = Math.max(0, next)
      // Set wounded when damage fills (user must explicitly flip)
      if (unit.damage >= unit.stamina) {
        unit.wounded = true
      }
      _syncUnits()
    }

    function flipWounded(id: number) {
      const unit = units.value.find(u => u.id === id)
      if (!unit || !unit.wounded || unit.wounds >= unit.durability) return
      unit.damage = 0
      unit.wounds++
      // Keep wounded=true if injuries just filled durability so Remove Unit button shows immediately
      if (unit.wounds < unit.durability) {
        unit.wounded = false
      }
      _syncUnits()
    }

    function defeatUnit(id: number) {
      const unit = units.value.find(u => u.id === id)
      if (!unit || !unit.wounded || unit.wounds < unit.durability) return
      unit.defeated = true
      unit.wounded = false
      _syncUnits()
    }

    function adjustWounds(id: number, delta: number) {
      const unit = units.value.find(u => u.id === id)
      if (!unit) return
      unit.wounds = Math.max(0, unit.wounds + delta)
      _syncUnits()
    }

    function toggleCondition(id: number, condition: ConditionKey) {
      const unit = units.value.find(u => u.id === id)
      if (!unit) return
      const idx = unit.conditions.indexOf(condition)
      if (idx === -1) unit.conditions.push(condition)
      else unit.conditions.splice(idx, 1)
      _syncUnits()
    }

    function setStance(id: number, stance: 1 | 2) {
      const unit = units.value.find(u => u.id === id)
      if (!unit) return
      unit.activeStance = stance
      _syncUnits()
    }

    function isRemoved(unit: PlayUnit): boolean {
      return unit.defeated === true
    }

    function toggleForceToken(index: number) {
      while (spentTokens.value.length <= index) spentTokens.value.push(false)
      spentTokens.value[index] = !spentTokens.value[index]
      _syncUnits()
    }

    function refreshForcePool() {
      spentTokens.value = []
      _syncUnits()
    }

    function spendOneForce(): boolean {
      const idx = Array.from({ length: totalFp.value }, (_, i) => i)
        .find(i => !(spentTokens.value[i] ?? false))
      if (idx === undefined) return false
      while (spentTokens.value.length <= idx) spentTokens.value.push(false)
      spentTokens.value[idx] = true
      _syncUnits()
      return true
    }

    function syncNow() {
      _syncUnits()
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
      flipWounded,
      defeatUnit,
      adjustWounds,
      toggleCondition,
      setStance,
      isRemoved,
      toggleForceToken,
      syncNow,
      refreshForcePool,
      spendOneForce,
      clearRoster,
      reset,
    }
  },
  { persist: true },
)
