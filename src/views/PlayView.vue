<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useStruggleStore } from '../stores/struggle.ts'
import { useMissionsStore } from '../stores/missions.ts'
import { imageUrl } from '../utils/imageUrl.ts'

const store = useStruggleStore()
const missionsStore = useMissionsStore()

const pickerIndex = ref(0)
const slideDir = ref<'left' | 'right'>('right')
const cardCollapsed = ref(false)
watch(() => store.selectedMission, () => { cardCollapsed.value = false })
const cardImgWidth = ref<number | null>(null)

function onCardImgLoad(e: Event) {
  const img = e.target as HTMLImageElement
  const scale = Math.min(img.clientWidth / img.naturalWidth, 322 / img.naturalHeight)
  cardImgWidth.value = Math.round(img.naturalWidth * scale)
}

function goPrev() {
  if (pickerIndex.value === 0) return
  slideDir.value = 'left'
  pickerIndex.value--
}
function goNext() {
  if (pickerIndex.value >= missionsStore.missions.length - 1) return
  slideDir.value = 'right'
  pickerIndex.value++
}

// Arrow keys: cycle missions in picker (State A) or move token during game (State B)
function onKeyDown(e: KeyboardEvent) {
  if (store.selectedMission) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); store.moveStruggle(-1) }
    if (e.key === 'ArrowRight') { e.preventDefault(); store.moveStruggle(1) }
  } else if (missionsStore.missions.length > 0) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
    if (e.key === 'ArrowRight') { e.preventDefault(); goNext() }
  }
}
onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  missionsStore.load()
})
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))

// All 17 track positions: -8 … +8
const POSITIONS = Array.from({ length: 17 }, (_, i) => i - 8)

function isP1Filled(pos: number): boolean {
  if (pos >= 0 || store.p1Momentum === 0) return false
  return Math.abs(pos) >= 9 - store.p1Momentum
}
function isP2Filled(pos: number): boolean {
  if (pos <= 0 || store.p2Momentum === 0) return false
  return pos >= 9 - store.p2Momentum
}
function isP1Innermost(pos: number): boolean {
  return store.p1InnermostSlot !== null && pos === store.p1InnermostSlot
}
function isP2Innermost(pos: number): boolean {
  return store.p2InnermostSlot !== null && pos === store.p2InnermostSlot
}

function cellClass(pos: number): string {
  const p1Filled = isP1Filled(pos)
  const p2Filled = isP2Filled(pos)
  const p1Win = store.p1WinsStruggle && isP1Innermost(pos)
  const p2Win = store.p2WinsStruggle && isP2Innermost(pos)

  let base = 'relative flex items-center justify-center flex-1 min-w-0 rounded select-none transition-all duration-150 h-10 '

  if (pos === 0) {
    base += 'flex-none w-11 !h-12 rounded-lg '
    base += 'bg-gradient-to-b from-zinc-800 to-zinc-950 '
    base += 'border-2 border-amber-500/40 '
    base += 'shadow-[inset_0_2px_6px_rgba(0,0,0,0.6),0_0_10px_rgba(245,158,11,0.2)] '
  } else if (p1Filled) {
    base += 'bg-gradient-to-b from-sky-400 to-blue-700 '
    base += 'border border-sky-300/20 '
    base += 'shadow-[0_3px_0_0_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.22)] '
    base += 'cursor-pointer hover:from-sky-300 hover:to-blue-600 '
    base += 'active:shadow-[0_1px_0_0_rgba(0,0,0,0.55)] active:translate-y-0.5 '
    if (p1Win) base += 'ring-2 ring-green-400 shadow-[0_0_12px_rgba(74,222,128,0.55)] animate-pulse '
  } else if (p2Filled) {
    base += 'bg-gradient-to-b from-amber-300 to-amber-700 '
    base += 'border border-amber-200/20 '
    base += 'shadow-[0_3px_0_0_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.22)] '
    base += 'cursor-pointer hover:from-amber-200 hover:to-amber-600 '
    base += 'active:shadow-[0_1px_0_0_rgba(0,0,0,0.55)] active:translate-y-0.5 '
    if (p2Win) base += 'ring-2 ring-green-400 shadow-[0_0_12px_rgba(74,222,128,0.55)] animate-pulse '
  } else if (pos < 0) {
    base += 'bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-700/25 '
    base += 'shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)] '
    base += 'cursor-pointer hover:border-sky-700/50 hover:bg-sky-950/25 active:scale-95 '
  } else {
    base += 'bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-700/25 '
    base += 'shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)] '
    base += 'cursor-pointer hover:border-amber-700/50 hover:bg-amber-950/25 active:scale-95 '
  }

  return base
}

function onCellClick(pos: number) {
  if (pos < 0) store.setMomentumToSlot(1, pos)
  else if (pos > 0) store.setMomentumToSlot(2, pos)
}

const winPlayer = computed(() => {
  if (store.p1WinsStruggle) return 1
  if (store.p2WinsStruggle) return 2
  return null
})
const gameWinner = computed(() => {
  if (store.p1Wins === 2) return 1
  if (store.p2Wins === 2) return 2
  return null
})

const ROMAN = ['I', 'II', 'III']
</script>

<template>
  <div class="relative flex flex-col gap-4">

    <!-- ── Game over overlay (always in DOM, full-screen fixed) ── -->
    <Transition name="fade">
      <div
        v-if="store.gameOver"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-6"
      >
        <div
          class="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-zinc-900 p-8 text-center
                 shadow-[0_0_60px_rgba(201,168,76,0.15)]"
        >
          <div class="mb-3 text-6xl">⚔</div>
          <div class="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/50">
            Game Over
          </div>
          <div class="mb-6 text-2xl font-bold text-amber-400">
            Player {{ gameWinner }} Wins!
          </div>
          <button
            class="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-bold text-zinc-900
                   shadow-[0_4px_0_0_rgba(0,0,0,0.4)] transition-all hover:bg-amber-400
                   active:shadow-[0_1px_0_0_rgba(0,0,0,0.4)] active:translate-y-[3px]"
            @click="store.resetGame()"
          >
            New Game
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── Header ── -->
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold tracking-wide text-amber-400">⚔ Play</h1>
      <button
        v-if="store.selectedMission"
        class="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-400
               shadow-[0_2px_0_0_rgba(0,0,0,0.4)] transition-all
               hover:border-zinc-500 hover:text-zinc-200
               active:shadow-none active:translate-y-0.5"
        @click="store.resetGame()"
      >
        Reset
      </button>
    </div>

    <!-- ══════════════════════════════════════════
         STATE A: Mission Picker
         ══════════════════════════════════════════ -->
    <template v-if="!store.selectedMission">
      <!-- Section label -->
      <div class="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
        Choose Mission
      </div>

      <!-- Loading skeleton -->
      <div
        v-if="missionsStore.loading"
        class="flex flex-col gap-3 rounded-2xl border border-zinc-700/40 bg-zinc-900/60 p-6"
      >
        <div class="mx-auto h-48 w-full animate-pulse rounded-xl bg-zinc-800" />
        <div class="mx-auto h-4 w-40 animate-pulse rounded bg-zinc-800" />
      </div>

      <!-- Missions loaded -->
      <template v-else-if="missionsStore.missions.length > 0">

        <!-- Grid: arrows in outer cols, card+name+dots+button share the center col (same width) -->
        <div class="grid gap-x-3 gap-y-4" style="grid-template-columns: 2.5rem 1fr 2.5rem">

          <!-- Left arrow — col 1, vertically centred against the card -->
          <button
            class="self-center flex h-24 w-full items-center justify-center
                   rounded-lg border-2 border-zinc-400 bg-zinc-700 text-white
                   shadow-[0_4px_14px_rgba(0,0,0,0.8)]
                   transition-all hover:border-amber-400 hover:bg-amber-500 hover:text-zinc-900
                   active:scale-95
                   disabled:cursor-not-allowed disabled:opacity-20
                   disabled:hover:border-zinc-400 disabled:hover:bg-zinc-700 disabled:hover:text-white"
            :disabled="pickerIndex === 0"
            @click="goPrev"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <!-- Card — col 2, fixed height prevents flicker on out-in transition -->
          <div class="overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-900 p-2 shadow-2xl
                      flex items-center justify-center"
               style="height: 338px;">
            <Transition :name="`card-slide-${slideDir}`" mode="out-in">
              <img
                :key="pickerIndex"
                :src="imageUrl(missionsStore.missions[pickerIndex].card)"
                class="w-full rounded-xl object-contain max-h-[322px]"
                alt="mission card"
                @load="onCardImgLoad"
              />
            </Transition>
          </div>

          <!-- Right arrow — col 3, vertically centred against the card -->
          <button
            class="self-center flex h-24 w-full items-center justify-center
                   rounded-lg border-2 border-zinc-400 bg-zinc-700 text-white
                   shadow-[0_4px_14px_rgba(0,0,0,0.8)]
                   transition-all hover:border-amber-400 hover:bg-amber-500 hover:text-zinc-900
                   active:scale-95
                   disabled:cursor-not-allowed disabled:opacity-20
                   disabled:hover:border-zinc-400 disabled:hover:bg-zinc-700 disabled:hover:text-white"
            :disabled="pickerIndex === missionsStore.missions.length - 1"
            @click="goNext"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          <!-- Mission name — col 2 -->
          <div class="col-start-2 text-center font-semibold text-zinc-200">
            {{ missionsStore.missions[pickerIndex].name }}
          </div>

          <!-- Dot indicators — col 2 -->
          <div class="col-start-2 flex justify-center gap-1.5">
            <span
              v-for="(_, i) in missionsStore.missions"
              :key="i"
              class="block h-1.5 w-1.5 rounded-full transition-colors duration-200"
              :class="i === pickerIndex ? 'bg-amber-400' : 'bg-zinc-600'"
            />
          </div>

          <!-- Confirm button — col 2, width clamped to rendered card image width -->
          <button
            class="col-start-2 mx-auto w-full rounded-xl bg-amber-500 px-4 py-3 font-bold text-zinc-900
                   shadow-[0_4px_0_0_rgba(0,0,0,0.4)] transition-all
                   hover:bg-amber-400
                   active:shadow-[0_1px_0_0_rgba(0,0,0,0.4)] active:translate-y-[3px]"
            :style="cardImgWidth ? { maxWidth: cardImgWidth + 'px' } : {}"
            @click="store.confirmMission(missionsStore.missions[pickerIndex])"
          >
            ▶ Play this Mission
          </button>

        </div>
      </template>

      <!-- Empty / error state -->
      <div
        v-else
        class="rounded-2xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-8 text-center text-sm text-zinc-500"
      >
        No missions available
      </div>
    </template>

    <!-- ══════════════════════════════════════════
         STATE B: Game in progress
         ══════════════════════════════════════════ -->
    <template v-else>

      <!-- ── Mission card (collapsible) ── -->
      <div
        class="overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-900/80 cursor-pointer select-none"
        :class="cardCollapsed ? 'p-0' : 'p-2'"
        @click="cardCollapsed = !cardCollapsed"
      >
        <!-- Collapsed: slim name bar -->
        <div
          v-if="cardCollapsed"
          class="flex items-center justify-between px-3 py-2"
        >
          <span class="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            {{ store.selectedMission.name }}
          </span>
          <span class="text-[10px] text-zinc-600">▼ expand</span>
        </div>

        <!-- Expanded: full-size card -->
        <template v-else>
          <img
            data-testid="mission-card"
            :src="imageUrl(store.selectedMission.card)"
            class="w-full max-h-[322px] rounded-lg object-contain"
            alt="mission card"
          />
          <div class="mt-1 flex items-center justify-between px-1">
            <span class="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
              {{ store.selectedMission.name }}
            </span>
            <span class="text-[10px] text-zinc-600">▲ collapse</span>
          </div>
        </template>
      </div>

      <!-- ── Scoreboard ── -->
      <div class="flex items-center gap-3 rounded-xl border border-zinc-700/50 bg-zinc-900/80 px-4 py-3">
        <!-- P1 -->
        <div class="flex flex-1 items-center gap-2">
          <span class="text-xs font-bold uppercase tracking-wider text-sky-400">P1</span>
          <div class="flex gap-1">
            <span
              v-for="i in 2"
              :key="i"
              class="text-sm transition-all duration-300"
              :class="store.p1Wins >= i
                ? 'text-sky-400 drop-shadow-[0_0_5px_rgba(56,189,248,0.9)]'
                : 'text-zinc-700'"
            >⚔</span>
          </div>
        </div>

        <!-- Score -->
        <div class="text-center">
          <div class="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-600">Struggles</div>
          <div class="mt-0.5 text-lg font-bold tabular-nums text-zinc-400">
            {{ store.p1Wins }}&thinsp;–&thinsp;{{ store.p2Wins }}
          </div>
        </div>

        <!-- P2 -->
        <div class="flex flex-1 items-center justify-end gap-2">
          <div class="flex gap-1">
            <span
              v-for="i in 2"
              :key="i"
              class="text-sm transition-all duration-300"
              :class="store.p2Wins >= i
                ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.9)]'
                : 'text-zinc-700'"
            >⚔</span>
          </div>
          <span class="text-xs font-bold uppercase tracking-wider text-amber-400">P2</span>
        </div>
      </div>

      <!-- ── Win banner ── -->
      <Transition name="slide-down">
        <div
          v-if="winPlayer !== null"
          class="overflow-hidden rounded-xl border border-green-500/30 bg-green-950/50"
        >
          <div class="border-b border-green-500/20 px-4 py-2.5 text-center text-sm font-bold text-green-400">
            ⚔ Player {{ winPlayer }} Wins the Struggle!
          </div>
          <button
            class="w-full px-4 py-2.5 text-sm font-semibold text-green-300 transition-colors
                   hover:bg-green-500/10 active:bg-green-500/20"
            @click="store.claimStruggle(winPlayer as 1 | 2)"
          >
            Claim Struggle →
          </button>
        </div>
      </Transition>

      <!-- ══════════════════════════════════════════
           STRUGGLE TRACK
           ══════════════════════════════════════════ -->
      <div class="overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl">

        <!-- Track header -->
        <div class="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2.5">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-sky-400">◀ P1</span>
            <span
              class="rounded-full bg-sky-950 px-2 py-0.5 text-[10px] font-bold tabular-nums text-sky-400
                     border border-sky-800/50"
            >{{ store.p1Momentum }}</span>
          </div>
          <span class="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">Track</span>
          <div class="flex items-center gap-2">
            <span
              class="rounded-full bg-amber-950 px-2 py-0.5 text-[10px] font-bold tabular-nums text-amber-400
                     border border-amber-800/50"
            >{{ store.p2Momentum }}</span>
            <span class="text-xs font-bold uppercase tracking-wider text-amber-400">P2 ▶</span>
          </div>
        </div>

        <!-- Rail groove -->
        <div class="p-3">
          <div
            class="relative h-14 rounded-xl
                   bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950
                   border border-zinc-800/80
                   shadow-[inset_0_3px_10px_rgba(0,0,0,0.7)]"
          >
            <div class="pointer-events-none absolute inset-x-3 top-[9px] h-px rounded-full bg-zinc-700/30" />
            <div class="pointer-events-none absolute inset-x-3 bottom-[9px] h-px rounded-full bg-zinc-700/30" />

            <div data-track-rail class="flex h-full items-center gap-0.5 px-1">
            <div
              v-for="pos in POSITIONS"
              :key="pos"
              :class="cellClass(pos)"
              @click="onCellClick(pos)"
            >
              <span
                v-if="pos !== 0 && !isP1Filled(pos) && !isP2Filled(pos)"
                class="text-[9px] font-bold text-zinc-700 tabular-nums select-none"
              >{{ Math.abs(pos) }}</span>

              <div
                v-if="isP1Filled(pos) || isP2Filled(pos)"
                class="pointer-events-none absolute inset-x-1.5 top-1.5 h-px rounded-full opacity-40"
                :class="isP1Filled(pos) ? 'bg-sky-200' : 'bg-amber-100'"
              />

              <span
                v-if="pos === 0"
                class="relative z-10 text-lg select-none text-amber-500
                       drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              >✴</span>

              <div
                v-if="pos === store.strugglePosition"
                class="absolute inset-1.5 z-20 rounded-full
                       bg-gradient-to-b from-white to-zinc-200
                       border border-white/90
                       shadow-[0_0_14px_rgba(255,255,255,0.65),0_2px_0_rgba(0,0,0,0.5)]"
              />
            </div>
            </div>
          </div>

          <!-- Readout bar -->
          <div class="mt-2.5 flex items-center justify-between px-0.5">
            <span class="text-[10px] text-zinc-600">tap cells → momentum</span>
            <span
              class="rounded border border-zinc-700/60 bg-zinc-800 px-2 py-0.5
                     text-xs font-bold tabular-nums text-zinc-300"
            >{{ store.strugglePosition > 0 ? '+' : '' }}{{ store.strugglePosition }}</span>
            <span class="text-[10px] text-zinc-600">← → to move</span>
          </div>
        </div>
      </div>

      <!-- ── Move controls ── -->
      <div class="rounded-xl border border-zinc-700/50 bg-zinc-900/80 px-4 py-3">
        <div class="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          Move Struggle Token
        </div>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="(btn, i) in [
              { label: '←←', delta: -3, side: 'p1' },
              { label: '← 1', delta: -1, side: 'p1' },
              { label: '1 →', delta: 1,  side: 'p2' },
              { label: '→→', delta: 3,  side: 'p2' },
            ]"
            :key="i"
            class="rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-800 px-2 py-2.5 text-sm font-bold
                   border border-zinc-600/50 transition-all
                   shadow-[0_4px_0_0_rgba(0,0,0,0.5)]
                   hover:from-zinc-600 hover:to-zinc-700
                   active:shadow-[0_1px_0_0_rgba(0,0,0,0.5)] active:translate-y-[3px]
                   disabled:opacity-25 disabled:cursor-not-allowed
                   disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_0_rgba(0,0,0,0.5)]"
            :class="btn.side === 'p1' ? 'text-sky-300 hover:text-sky-200' : 'text-amber-400 hover:text-amber-300'"
            :disabled="btn.delta < 0 ? store.strugglePosition <= -8 : store.strugglePosition >= 8"
            @click="store.moveStruggle(btn.delta)"
          >
            {{ btn.label }}
          </button>
        </div>
      </div>

      <!-- ── Struggle cards ── -->
      <div
        v-if="store.struggleCards"
        class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3"
      >
        <div class="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          Struggle Cards
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div v-for="(cardImg, i) in store.struggleCards" :key="i">
            <div
              data-testid="card-flipper"
              class="card-flipper"
              :class="{ revealed: store.revealedCount > i }"
            >
              <!-- Face-down back -->
              <div class="card-face card-back">
                <span class="roman">{{ ROMAN[i] }}</span>
              </div>
              <!-- Face-up front -->
              <div class="card-face card-front">
                <img
                  :src="imageUrl(cardImg)"
                  class="w-full h-full object-contain rounded"
                  :alt="`Struggle ${i + 1}`"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Rules reference ── -->
      <details class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
        <summary class="cursor-pointer select-none text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          Rules Quick Reference
        </summary>
        <div class="mt-3 space-y-2 text-xs leading-relaxed text-zinc-500">
          <p><span class="font-semibold text-zinc-300">Track:</span> 17 spaces, −8 to +8. P1 owns left (negative), P2 owns right (positive). Center (0) cannot hold momentum tokens.</p>
          <p><span class="font-semibold text-zinc-300">Setup:</span> Struggle token at 0. Each player places 1 momentum token at their ±8 space.</p>
          <p><span class="font-semibold text-zinc-300">Moving:</span> At turn-end, move the struggle token toward your momentum tokens = # of active objectives you control.</p>
          <p><span class="font-semibold text-zinc-300">Gaining momentum:</span> Opponent wounds a unit on your side → you gain 1. Struggle token ends on opponent's half → you gain 1. Struggle token ends at center (not turn 1) → both gain 1.</p>
          <p><span class="font-semibold text-zinc-300">Winning:</span> Struggle token lands on your innermost momentum token space. Win 2 struggles to win the game.</p>
        </div>
      </details>

    </template>

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* ── Mission picker card slide ── */
.card-slide-right-enter-active,
.card-slide-right-leave-active { transition: transform 0.28s ease, opacity 0.28s ease; }
.card-slide-right-enter-from   { transform: translateX(48px); opacity: 0; }
.card-slide-right-leave-to     { transform: translateX(-48px); opacity: 0; }

.card-slide-left-enter-active,
.card-slide-left-leave-active  { transition: transform 0.28s ease, opacity 0.28s ease; }
.card-slide-left-enter-from    { transform: translateX(-48px); opacity: 0; }
.card-slide-left-leave-to      { transform: translateX(48px); opacity: 0; }

/* ── Struggle card flip ── */
.card-flipper {
  position: relative;
  aspect-ratio: 3 / 4;
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
}
.card-flipper.revealed {
  transform: rotateY(180deg);
}
.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 0.5rem;
}
.card-back {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, rgb(39 39 42), rgb(24 24 27));
  border: 1px solid rgb(63 63 70 / 0.5);
}
.card-front {
  transform: rotateY(180deg);
  background: rgb(24 24 27);
}
.roman {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(113 113 122);
  user-select: none;
}
</style>
