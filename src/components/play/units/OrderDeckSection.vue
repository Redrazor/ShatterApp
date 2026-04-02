<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useOrderDeckStore } from '../../../stores/orderDeck.ts'
import { usePlayUnitsStore } from '../../../stores/playUnits.ts'
import { useCharactersStore } from '../../../stores/characters.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'
import type { PlayUnit } from '../../../types/index.ts'

defineProps<{
  isLegendary: boolean
}>()

const deckStore = useOrderDeckStore()
const playUnits = usePlayUnitsStore()
const charactersStore = useCharactersStore()

// Unit IDs with special order deck abilities
const LUMINARA_ID        = 21          // Flow of the Force — Peek before revealing
const B1_ID              = 12          // Well, I Guess I'm in Charge, Now — send to bottom instead of reserve
const SWAP_IDS           = [14, 133, 134] // Obi-Wan / Nossor Ri / Aqua Droids — swap reserved to top/bottom
const FREE_SELF_IDS      = [7, 25, 107]   // Kalani / Kraken / Wing Guard — free to reserve own card
const THRAWN_ID          = 91          // Free reserve for any Galactic Empire unit
const DENGAR_ID          = 99          // Free reserve for any Bounty Hunter unit

// Ability visibility
const hasLuminara     = computed(() => playUnits.units.some(u => u.id === LUMINARA_ID))
const revealedIsB1    = computed(() => deckStore.revealed?.id === B1_ID)
const revealedHasSwap = computed(() => SWAP_IDS.includes(deckStore.revealed?.id ?? -1))

// Reserve is free (no FP spent) for certain units/combinations
const reserveIsFree = computed(() => {
  const rev = deckStore.revealed
  if (!rev || rev.isShatterpoint) return false
  if (FREE_SELF_IDS.includes(rev.id)) return true
  const revUnit = playUnits.units.find(u => u.id === rev.id)
  if (playUnits.units.some(u => u.id === THRAWN_ID) && revUnit?.tags.includes('Galactic Empire')) return true
  if (playUnits.units.some(u => u.id === DENGAR_ID) && revUnit?.tags.includes('Bounty Hunter')) return true
  return false
})

// Enrich play units with orderCard from characters store when missing (handles persisted units
// that pre-date the orderCard field being mapped in _toPlayUnit)
function enrichedUnits(): PlayUnit[] {
  return playUnits.units.map(u => {
    if (u.orderCard) return u
    const char = charactersStore.characters.find(c => c.id === u.id)
    return { ...u, orderCard: char?.orderCard }
  })
}

// Force pool remaining
const remainingFp = computed(() => {
  const spent = (playUnits.spentTokens ?? []).filter(Boolean).length
  return Math.max(0, playUnits.totalFp - spent)
})
const canReserve = computed(() => (remainingFp.value > 0 || reserveIsFree.value) && !deckStore.reserved)

// Peek state — local only, no store persistence needed
const peekCard = ref<import('../../../stores/orderDeck.ts').OrderCard | null>(null)
const peekVisible = ref(false)
const peekTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

function handlePeek() {
  const card = deckStore.peek()
  if (!card) return
  peekCard.value = card
  peekVisible.value = true
  if (peekTimeout.value) clearTimeout(peekTimeout.value)
  peekTimeout.value = setTimeout(() => {
    peekVisible.value = false
    peekCard.value = null
  }, 3000)
}

function dismissPeek() {
  peekVisible.value = false
  peekCard.value = null
  if (peekTimeout.value) clearTimeout(peekTimeout.value)
}

// Confirmation modal
const confirmUnit = ref<{ id: number; name: string } | null>(null)

function requestActivate(id: number, name: string) {
  confirmUnit.value = { id, name }
}

function confirmActivate() {
  if (!confirmUnit.value) return
  deckStore.selectShatterpointUnit(confirmUnit.value.id)
  confirmUnit.value = null
}

function handleEndActivationAs() {
  if (deckStore.shatterpointPendingId === null) return
  deckStore.endActivationAs(deckStore.shatterpointPendingId)
}

function cancelActivate() {
  confirmUnit.value = null
}

// Flip button
function handleFlip() {
  deckStore.flip()
}

// End activation
function handleEndActivation() {
  deckStore.endActivation()
}

// Reserve — free for certain units, otherwise spend 1 FP
function handleReserve() {
  if (reserveIsFree.value) {
    deckStore.reserve()
    return
  }
  const spent = playUnits.spendOneForce()
  if (!spent) return
  deckStore.reserve()
}

function handleSendToBottom() {
  deckStore.sendToBottom()
}

function handleSwapReserved(pos: 'top' | 'bottom') {
  deckStore.swapReservedTo(pos)
}

function handlePlayReserved() {
  deckStore.playReserved()
}

async function handleReshuffle() {
  await charactersStore.load()
  deckStore.reshuffle(enrichedUnits())
}

async function handleBuildDeck() {
  await charactersStore.load()
  deckStore.buildDeck(enrichedUnits())
}

// Shatterpoint unit click
function onUnitPick(unitId: number, unitName: string) {
  requestActivate(unitId, unitName)
}

watch(() => deckStore.isShatterpointPicking, (val) => {
  if (!val) confirmUnit.value = null
})

const ORDER_DECK_BACK = '/images/order-deck-back.png'

function cardImgError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}
</script>

<template>
  <div
    v-if="!isLegendary && playUnits.units.length > 0"
    class="rounded-2xl border border-zinc-700/50 bg-zinc-900 overflow-hidden"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none"
      @click="deckStore.isCollapsed = !deckStore.isCollapsed"
    >
      <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Order Deck</span>
      <div class="flex items-center gap-2">
        <button
          v-if="deckStore.deckBuilt"
          class="rounded-md border border-zinc-700/60 bg-zinc-800/60 px-2 py-0.5 text-[10px] font-semibold text-zinc-500
                 transition-all hover:border-zinc-500 hover:text-zinc-300 active:scale-95"
          title="Reset deck"
          @click.stop="deckStore.reset()"
        >Reset</button>
        <span v-if="deckStore.deckBuilt && deckStore.deck.length > 0" class="text-[10px] text-zinc-500">
          {{ deckStore.deck.length }} remaining
        </span>
        <svg
          class="w-4 h-4 text-zinc-500 transition-transform duration-200"
          :class="deckStore.isCollapsed ? 'rotate-180' : ''"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </div>
    </div>

    <!-- Collapsed: nothing more -->
    <div v-if="!deckStore.isCollapsed" class="px-3 pb-3 space-y-3">

      <!-- Build deck prompt (no deck yet) -->
      <div v-if="!deckStore.deckBuilt" class="text-center py-4">
        <p class="text-xs text-zinc-600 mb-3">Shuffle your Strike Force order cards to get started.</p>
        <button
          class="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-zinc-900
                 shadow-[0_4px_0_0_rgba(0,0,0,0.4)] transition-all
                 hover:bg-amber-400 active:shadow-[0_1px_0_0_rgba(0,0,0,0.4)] active:translate-y-[3px]"
          @click="handleBuildDeck"
        >Shuffle &amp; Build Deck</button>
      </div>

      <template v-else>
        <!-- Card slots row -->
        <div class="grid grid-cols-3 gap-2">

          <!-- Slot 1: Deck (face-down) -->
          <div class="flex flex-col items-center gap-1.5">
            <div class="text-[9px] font-semibold uppercase tracking-widest text-zinc-600">Deck</div>
            <div
              class="relative w-full aspect-[5/7] rounded-xl border border-zinc-700/60 bg-zinc-800 overflow-hidden flex items-center justify-center"
              :class="deckStore.deckEmpty ? 'opacity-40' : ''"
            >
              <img
                :src="ORDER_DECK_BACK"
                class="w-full h-full object-contain"
                alt="Order deck"
                @error="cardImgError"
              />
              <!-- Fallback visual -->
              <div class="absolute inset-0 flex items-center justify-center text-2xl text-zinc-700 pointer-events-none">
                ⚔
              </div>
              <!-- Card count badge -->
              <div
                v-if="!deckStore.deckEmpty"
                class="absolute bottom-1.5 right-1.5 rounded-full bg-zinc-900/90 px-1.5 py-0.5 text-[9px] font-bold text-zinc-300 border border-zinc-700/60"
              >
                {{ deckStore.deck.length }}
              </div>
            </div>
          </div>

          <!-- Slot 2: Revealed -->
          <div class="flex flex-col items-center gap-1.5">
            <div class="text-[9px] font-semibold uppercase tracking-widest text-zinc-600">Active</div>
            <div
              class="relative w-full aspect-[5/7] rounded-xl overflow-hidden flex items-center justify-center"
              :class="deckStore.revealed
                ? 'bg-zinc-800 shadow-[0_0_10px_rgba(251,191,36,0.15)]'
                : 'bg-zinc-900/40'"
            >
              <template v-if="deckStore.revealed">
                <img
                  :src="imageUrl(deckStore.revealed.orderCard)"
                  class="w-full h-full object-contain"
                  :alt="deckStore.revealed.name"
                  @error="cardImgError"
                />
                <!-- Shatterpoint glow overlay -->
                <div
                  v-if="deckStore.revealed.isShatterpoint"
                  class="absolute inset-0 bg-amber-400/10 animate-pulse pointer-events-none rounded-xl"
                />
                <div
                  v-if="deckStore.revealed.isShatterpoint"
                  class="absolute bottom-0 left-0 right-0 bg-amber-500/90 py-1 text-center text-[9px] font-bold text-zinc-900 uppercase tracking-wider"
                >
                  Choose a unit
                </div>
              </template>
              <span v-else class="text-zinc-700 text-xl">—</span>
            </div>
            <div v-if="deckStore.revealed && !deckStore.revealed.isShatterpoint" class="text-[9px] text-zinc-500 text-center leading-tight truncate w-full px-0.5">
              {{ deckStore.revealed.name }}
            </div>
          </div>

          <!-- Slot 3: Reserved -->
          <div class="flex flex-col items-center gap-1.5">
            <div class="text-[9px] font-semibold uppercase tracking-widest text-zinc-600">Reserved</div>
            <div
              class="relative w-full aspect-[5/7] rounded-xl border overflow-hidden flex items-center justify-center"
              :class="deckStore.reserved
                ? 'border-amber-500/80 bg-zinc-800 shadow-[0_0_8px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/30'
                : 'border-zinc-700/30 bg-zinc-900/40'"
            >
              <template v-if="deckStore.reserved">
                <img
                  :src="imageUrl(deckStore.reserved.orderCard)"
                  class="w-full h-full object-contain opacity-80"
                  :alt="deckStore.reserved.name"
                  @error="cardImgError"
                />
                <div class="absolute inset-0 border-2 border-amber-500/60 rounded-xl pointer-events-none" />
                <div
                  class="absolute bottom-0 left-0 right-0 bg-amber-900/80 py-1 text-center text-[9px] font-bold text-amber-300 uppercase tracking-wider"
                >
                  Reserved
                </div>
              </template>
              <span v-else class="text-zinc-700 text-xl">—</span>
            </div>
            <div v-if="deckStore.reserved" class="text-[9px] text-zinc-500 text-center leading-tight truncate w-full px-0.5">
              {{ deckStore.reserved.name }}
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex flex-wrap gap-1.5">

          <!-- Shatterpoint pending: unit chosen, awaiting End Activation -->
          <template v-if="deckStore.shatterpointPendingId !== null">
            <button
              class="flex-1 min-w-[4rem] rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white
                     shadow-[0_3px_0_0_rgba(0,0,0,0.4)] transition-all
                     hover:bg-emerald-500 active:shadow-[0_1px_0_0_rgba(0,0,0,0.4)] active:translate-y-[2px]"
              @click="handleEndActivationAs"
            >End Activation</button>
          </template>

          <!-- Idle state: deck has cards -->
          <template v-else-if="!deckStore.revealed">
            <button
              v-if="!deckStore.deckEmpty"
              class="flex-1 min-w-[4rem] rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-zinc-900
                     shadow-[0_3px_0_0_rgba(0,0,0,0.4)] transition-all
                     hover:bg-amber-400 active:shadow-[0_1px_0_0_rgba(0,0,0,0.4)] active:translate-y-[2px]"
              @click="handleFlip"
            >Flip</button>
            <button
              v-if="!deckStore.deckEmpty && hasLuminara"
              class="rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-3 py-2 text-xs font-semibold text-zinc-500
                     transition-all hover:border-zinc-500 hover:text-zinc-300 active:scale-95"
              title="Peek at top card (Luminara — Flow of the Force)"
              @click="handlePeek"
            >Peek</button>
            <button
              v-if="deckStore.deckEmpty"
              class="flex-1 min-w-[4rem] rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300
                     transition-all hover:border-zinc-500 hover:text-zinc-100 active:scale-95"
              @click="handleReshuffle"
            >Reshuffle</button>
            <button
              v-if="deckStore.reserved"
              class="flex-1 min-w-[4rem] rounded-lg border border-amber-700/60 bg-amber-950/40 px-3 py-2 text-xs font-semibold text-amber-400
                     transition-all hover:border-amber-500 hover:text-amber-300 active:scale-95"
              @click="handlePlayReserved"
            >Play Reserved</button>
          </template>

          <!-- Revealed state -->
          <template v-else-if="!deckStore.revealed.isShatterpoint">
            <button
              class="flex-1 min-w-[4rem] rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white
                     shadow-[0_3px_0_0_rgba(0,0,0,0.4)] transition-all
                     hover:bg-emerald-500 active:shadow-[0_1px_0_0_rgba(0,0,0,0.4)] active:translate-y-[2px]"
              @click="handleEndActivation"
            >End Activation</button>

            <!-- No reserved card: Reserve + B1-only → Bottom -->
            <template v-if="!deckStore.reserved">
              <button
                class="rounded-lg border px-3 py-2 text-xs font-semibold transition-all active:scale-95"
                :class="canReserve
                  ? 'border-amber-700/60 bg-amber-950/40 text-amber-400 hover:border-amber-500 hover:text-amber-300'
                  : 'border-zinc-700/30 bg-zinc-900/20 text-zinc-700 cursor-not-allowed'"
                :disabled="!canReserve"
                :title="reserveIsFree ? 'Reserve (free — no Force cost)' : canReserve ? 'Reserve (costs 1 Force)' : 'No Force remaining'"
                @click="canReserve && handleReserve()"
              >Reserve ⬡</button>
              <button
                v-if="revealedIsB1"
                class="rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-3 py-2 text-xs font-semibold text-zinc-500
                       transition-all hover:border-zinc-500 hover:text-zinc-300 active:scale-95"
                title="Send to bottom instead of reserving (B1 — Well, I Guess I'm in Charge, Now)"
                @click="handleSendToBottom"
              >→ Bottom</button>
            </template>

            <!-- Reserved card exists: Swap buttons for Obi-Wan / Nossor Ri / Aqua Droids only -->
            <template v-else-if="revealedHasSwap">
              <button
                class="rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-2 py-2 text-[10px] font-semibold text-zinc-500
                       transition-all hover:border-zinc-500 hover:text-zinc-300 active:scale-95"
                title="Move reserved card to top of deck, put this card in reserve"
                @click="handleSwapReserved('top')"
              >Swap → Top</button>
              <button
                class="rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-2 py-2 text-[10px] font-semibold text-zinc-500
                       transition-all hover:border-zinc-500 hover:text-zinc-300 active:scale-95"
                title="Move reserved card to bottom of deck, put this card in reserve"
                @click="handleSwapReserved('bottom')"
              >Swap → Bot</button>
            </template>
          </template>

          <!-- Played from reserve: end activation only -->
          <template v-else-if="deckStore.playedFromReserve">
            <button
              class="flex-1 min-w-[4rem] rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white
                     shadow-[0_3px_0_0_rgba(0,0,0,0.4)] transition-all
                     hover:bg-emerald-500 active:shadow-[0_1px_0_0_rgba(0,0,0,0.4)] active:translate-y-[2px]"
              @click="handleEndActivation"
            >End Activation</button>
          </template>
        </div>

        <!-- Shatterpoint: unit picker -->
        <div v-if="deckStore.isShatterpointPicking" class="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 space-y-2">
          <div class="text-xs font-bold text-amber-400 text-center">Choose a unit to activate</div>
          <div class="flex flex-col gap-1.5">
            <button
              v-for="unit in playUnits.units"
              :key="unit.id"
              class="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-zinc-800/60 px-3 py-2.5
                     transition-all hover:border-amber-400/60 hover:bg-amber-950/30 active:scale-[0.98]
                     animate-pulse hover:animate-none"
              @click="onUnitPick(unit.id, unit.name)"
            >
              <img
                v-if="unit.thumbnail"
                :src="imageUrl(unit.thumbnail)"
                class="h-8 w-8 rounded-full border border-amber-500/40 object-contain flex-shrink-0"
                :alt="unit.name"
              />
              <span class="text-sm font-semibold text-zinc-200 flex-1 text-left">{{ unit.name }}</span>
              <span class="text-amber-400 text-sm">✦ Pick me</span>
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Peek overlay -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="peekVisible && peekCard"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          @click="dismissPeek"
        >
          <div class="flex flex-col items-center gap-3 px-6">
            <div class="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Top of deck</div>
            <div class="w-48 aspect-[5/7] rounded-2xl overflow-hidden border border-amber-400/40 shadow-2xl">
              <img
                :src="imageUrl(peekCard.orderCard)"
                class="w-full h-full object-contain"
                :alt="peekCard.name"
              />
            </div>
            <div class="text-sm font-bold text-zinc-300">{{ peekCard.name }}</div>
            <div class="text-[10px] text-zinc-600">Tap to dismiss · auto-closes in 3s</div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Confirmation modal (Shatterpoint pick) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="confirmUnit"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
          @click.self="cancelActivate"
        >
          <div class="w-full max-w-xs rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl space-y-4">
            <div class="text-sm font-bold text-zinc-200 text-center">Activate with Shatterpoint?</div>
            <div class="text-base font-bold text-amber-400 text-center">{{ confirmUnit.name }}</div>
            <div class="flex gap-2">
              <button
                class="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-sm font-semibold text-zinc-400 transition-all hover:border-zinc-600 hover:text-zinc-200 active:scale-95"
                @click="cancelActivate"
              >Cancel</button>
              <button
                class="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-zinc-900
                       shadow-[0_3px_0_0_rgba(0,0,0,0.4)] transition-all
                       hover:bg-amber-400 active:shadow-[0_1px_0_0_rgba(0,0,0,0.4)] active:translate-y-[2px]"
                @click="confirmActivate"
              >Activate</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
