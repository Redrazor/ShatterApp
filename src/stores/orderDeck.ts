import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PlayUnit } from '../types/index.ts'

export interface OrderCard {
  id: number           // character id; -1 = Shatterpoint wild
  name: string
  orderCard: string    // image path
  isShatterpoint: boolean
}

const SHATTERPOINT_ORDER_CARD = '/images/shatterpoint-order.png'
const SHATTERPOINT_ID = -1

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const useOrderDeckStore = defineStore(
  'orderDeck',
  () => {
    const deck = ref<OrderCard[]>([])
    const revealed = ref<OrderCard | null>(null)
    const reserved = ref<OrderCard | null>(null)
    const activatedIds = ref<number[]>([])
    const isCollapsed = ref(false)
    const playedFromReserve = ref(false)
    const deckBuilt = ref(false)
    // Unit chosen via Shatterpoint that is currently being activated (pre-End Activation)
    const shatterpointPendingId = ref<number | null>(null)

    const deckEmpty = computed(() => deck.value.length === 0)
    const currentActiveId = computed(() => shatterpointPendingId.value ?? activatedIds.value.at(-1) ?? null)
    const activatedSet = computed(() => new Set(activatedIds.value.slice(0, -1)))
    const isShatterpointPicking = computed(() => revealed.value?.isShatterpoint === true)
    const remainingFp = computed(() => 0) // placeholder; consumers read from playUnits store directly

    function _buildCards(units: PlayUnit[]): OrderCard[] {
      const cards: OrderCard[] = units
        .filter(u => u.orderCard)
        .map(u => ({
          id: u.id,
          name: u.name,
          orderCard: u.orderCard!,
          isShatterpoint: false,
        }))
      cards.push({
        id: SHATTERPOINT_ID,
        name: 'Shatterpoint',
        orderCard: SHATTERPOINT_ORDER_CARD,
        isShatterpoint: true,
      })
      return fisherYates(cards)
    }

    function buildDeck(units: PlayUnit[]) {
      deck.value = _buildCards(units)
      revealed.value = null
      reserved.value = null
      activatedIds.value = []
      playedFromReserve.value = false
      deckBuilt.value = true
      shatterpointPendingId.value = null
    }

    function flip() {
      if (deckEmpty.value || revealed.value !== null) return
      revealed.value = deck.value.shift()!
      playedFromReserve.value = false
    }

    function endActivation() {
      if (!revealed.value) return
      activatedIds.value.push(revealed.value.id)
      revealed.value = null
      playedFromReserve.value = false
    }

    // Called when user confirms a Shatterpoint pick — marks the unit as active pending End Activation
    function selectShatterpointUnit(unitId: number) {
      shatterpointPendingId.value = unitId
      revealed.value = null
    }

    function endActivationAs(unitId: number) {
      activatedIds.value.push(unitId)
      revealed.value = null
      playedFromReserve.value = false
      shatterpointPendingId.value = null
    }

    function reserve() {
      if (!revealed.value) return
      reserved.value = revealed.value
      revealed.value = null
    }

    function sendToBottom() {
      if (!revealed.value) return
      deck.value.push(revealed.value)
      revealed.value = null
    }

    function swapReservedTo(pos: 'top' | 'bottom') {
      if (!revealed.value || !reserved.value) return
      if (pos === 'top') {
        deck.value.unshift(reserved.value)
      } else {
        deck.value.push(reserved.value)
      }
      reserved.value = revealed.value
      revealed.value = null
    }


    function playReserved() {
      if (!reserved.value) return
      revealed.value = reserved.value
      reserved.value = null
      playedFromReserve.value = true
    }

    function peek(): OrderCard | null {
      return deck.value[0] ?? null
    }

    function reshuffle(units: PlayUnit[]) {
      deck.value = _buildCards(units)
      revealed.value = null
      reserved.value = null
      activatedIds.value = []
      playedFromReserve.value = false
      deckBuilt.value = true
      shatterpointPendingId.value = null
    }

    function reset() {
      deck.value = []
      revealed.value = null
      reserved.value = null
      activatedIds.value = []
      playedFromReserve.value = false
      deckBuilt.value = false
      shatterpointPendingId.value = null
    }

    return {
      deck,
      revealed,
      reserved,
      activatedIds,
      isCollapsed,
      playedFromReserve,

      deckBuilt,
      shatterpointPendingId,
      deckEmpty,
      currentActiveId,
      activatedSet,
      isShatterpointPicking,
      remainingFp,
      buildDeck,
      flip,
      endActivation,
      endActivationAs,
      selectShatterpointUnit,
      reserve,
      sendToBottom,
      swapReservedTo,
      playReserved,
      peek,
      reshuffle,
      reset,
    }
  },
  { persist: true },
)
