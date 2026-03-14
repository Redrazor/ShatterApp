import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PlayUnit, DiceRollResult } from '../types/index.ts'

export const useRollSessionStore = defineStore('rollSession', () => {
  const roomCode = ref<string | null>(null)
  const isConnected = ref(false)
  const isHost = ref(false)
  const opponentOnline = ref(false)
  const opponentUnits = ref<PlayUnit[]>([])
  const lastOpponentDice = ref<DiceRollResult | null>(null)

  function setRoom(code: string, host: boolean) {
    roomCode.value = code
    isHost.value = host
    isConnected.value = true
  }

  function setOpponentOnline(online: boolean) {
    opponentOnline.value = online
  }

  function setOpponentUnits(units: PlayUnit[]) {
    opponentUnits.value = units
  }

  function setLastDice(roll: DiceRollResult) {
    lastOpponentDice.value = roll
  }

  function reset() {
    roomCode.value = null
    isConnected.value = false
    isHost.value = false
    opponentOnline.value = false
    opponentUnits.value = []
    lastOpponentDice.value = null
  }

  return {
    roomCode,
    isConnected,
    isHost,
    opponentOnline,
    opponentUnits,
    lastOpponentDice,
    setRoom,
    setOpponentOnline,
    setOpponentUnits,
    setLastDice,
    reset,
  }
})
