import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Mission, TrackerSnapshot } from '../types/index.ts'
import { useDiceRoom } from '../composables/useDiceRoom.ts'
import { useRollSessionStore } from './rollSession.ts'

export const useStruggleStore = defineStore(
  'struggle',
  () => {
    const strugglePosition = ref<number>(0)
    const p1Momentum = ref<number>(1)
    const p2Momentum = ref<number>(1)
    const p1Wins = ref<number>(0)
    const p2Wins = ref<number>(0)
    const selectedMission = ref<Mission | null>(null)
    const struggleCards = ref<[string, string, string] | null>(null)

    // P1 fills slots -8 inward; innermost slot = -(9 - p1Momentum)
    const p1InnermostSlot = computed<number | null>(() =>
      p1Momentum.value > 0 ? -(9 - p1Momentum.value) : null,
    )

    // P2 fills slots +8 inward; innermost slot = +(9 - p2Momentum)
    const p2InnermostSlot = computed<number | null>(() =>
      p2Momentum.value > 0 ? 9 - p2Momentum.value : null,
    )

    const p1WinsStruggle = computed<boolean>(
      () =>
        p1Momentum.value > 0 &&
        p1InnermostSlot.value !== null &&
        strugglePosition.value === p1InnermostSlot.value,
    )

    const p2WinsStruggle = computed<boolean>(
      () =>
        p2Momentum.value > 0 &&
        p2InnermostSlot.value !== null &&
        strugglePosition.value === p2InnermostSlot.value,
    )

    const gameOver = computed<boolean>(() => p1Wins.value === 2 || p2Wins.value === 2)

    // 1 at game start, +1 per struggle completed; 0 when no mission selected
    const revealedCount = computed<number>(() =>
      selectedMission.value ? Math.min(3, p1Wins.value + p2Wins.value + 1) : 0,
    )

    function _buildSnapshot(): TrackerSnapshot {
      return {
        mode: 'standard',
        strugglePosition: strugglePosition.value,
        p1Momentum: p1Momentum.value,
        p2Momentum: p2Momentum.value,
        p1Wins: p1Wins.value,
        p2Wins: p2Wins.value,
        selectedMissionId: selectedMission.value?.id ?? null,
        struggleCards: struggleCards.value,
      }
    }

    function _syncTracker() {
      const session = useRollSessionStore()
      if (session.isConnected) useDiceRoom().sendTrackerState(_buildSnapshot())
    }

    function addMomentum(player: 1 | 2) {
      if (player === 1 && p1Momentum.value < 8) p1Momentum.value++
      if (player === 2 && p2Momentum.value < 8) p2Momentum.value++
      _syncTracker()
    }

    function removeMomentum(player: 1 | 2) {
      if (player === 1 && p1Momentum.value > 0) p1Momentum.value--
      if (player === 2 && p2Momentum.value > 0) p2Momentum.value--
      _syncTracker()
    }

    // Click a track cell to set momentum directly.
    // P1: pos is -8..-1 → level = 9 + pos (e.g. -8→1, -7→2 … -1→8)
    // P2: pos is +1..+8 → level = 9 - pos (e.g. +8→1, +7→2 … +1→8)
    // Clicking the current innermost slot (level === current) removes it (level - 1).
    function setMomentumToSlot(player: 1 | 2, pos: number) {
      const level = player === 1 ? 9 + pos : 9 - pos
      if (level < 1 || level > 8) return
      if (player === 1) {
        p1Momentum.value = level === p1Momentum.value ? level - 1 : level
      } else {
        p2Momentum.value = level === p2Momentum.value ? level - 1 : level
      }
      _syncTracker()
    }

    function moveStruggle(delta: number) {
      strugglePosition.value = Math.max(-8, Math.min(8, strugglePosition.value + delta))
      _syncTracker()
    }

    function claimStruggle(player: 1 | 2) {
      if (player === 1) p1Wins.value++
      else p2Wins.value++
      // Reset tracker to initial positions
      strugglePosition.value = 0
      p1Momentum.value = 1
      p2Momentum.value = 1
      _syncTracker()
    }

    function confirmMission(mission: Mission): void {
      selectedMission.value = mission
      const pick = (arr: string[]) =>
        arr.length ? arr[Math.floor(Math.random() * arr.length)] : ''
      const s = mission.struggles
      struggleCards.value = [
        pick(s.struggle1 ?? []),
        pick(s.struggle2 ?? []),
        pick(s.struggle3 ?? []),
      ]
      _syncTracker()
    }

    function applySnapshot(snap: TrackerSnapshot, missions: Mission[]): void {
      if (snap.mode !== 'standard') return
      strugglePosition.value = snap.strugglePosition ?? 0
      p1Momentum.value = snap.p1Momentum ?? 1
      p2Momentum.value = snap.p2Momentum ?? 1
      p1Wins.value = snap.p1Wins ?? 0
      p2Wins.value = snap.p2Wins ?? 0
      if (snap.selectedMissionId != null && selectedMission.value?.id !== snap.selectedMissionId) {
        const m = missions.find(m => m.id === snap.selectedMissionId) ?? null
        selectedMission.value = m
        if (m) {
          if (snap.struggleCards) {
            struggleCards.value = snap.struggleCards
          } else {
            const pick = (arr: string[]) => arr.length ? arr[Math.floor(Math.random() * arr.length)] : ''
            const s = m.struggles
            struggleCards.value = [pick(s.struggle1 ?? []), pick(s.struggle2 ?? []), pick(s.struggle3 ?? [])]
          }
        }
      } else if (snap.selectedMissionId == null) {
        selectedMission.value = null
        struggleCards.value = null
      }
    }

    function resetGame() {
      strugglePosition.value = 0
      p1Momentum.value = 1
      p2Momentum.value = 1
      p1Wins.value = 0
      p2Wins.value = 0
      selectedMission.value = null
      struggleCards.value = null
    }

    return {
      strugglePosition,
      p1Momentum,
      p2Momentum,
      p1Wins,
      p2Wins,
      selectedMission,
      struggleCards,
      p1InnermostSlot,
      p2InnermostSlot,
      p1WinsStruggle,
      p2WinsStruggle,
      gameOver,
      revealedCount,
      addMomentum,
      removeMomentum,
      setMomentumToSlot,
      moveStruggle,
      claimStruggle,
      confirmMission,
      applySnapshot,
      resetGame,
      buildSnapshot: _buildSnapshot,
    }
  },
  { persist: true },
)
