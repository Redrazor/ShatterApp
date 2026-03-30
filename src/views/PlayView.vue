<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useHead } from '@vueuse/head'
import { useStruggleStore } from '../stores/struggle.ts'
import { useMissionsStore } from '../stores/missions.ts'
import { useKeyopsStore, type GameMode } from '../stores/keyops.ts'
import { useKoMissionsStore } from '../stores/koMissions.ts'
import { useLegendaryStore } from '../stores/legendary.ts'
import { useLegendaryMissionsStore } from '../stores/legendaryMissions.ts'
import { useGalacticLegendsStore } from '../stores/galacticLegends.ts'
import { usePlayUnitsStore } from '../stores/playUnits.ts'
import { useCharactersStore } from '../stores/characters.ts'
import { useStrikeForceStore } from '../stores/strikeForce.ts'
import { useRollSessionStore } from '../stores/rollSession.ts'
import { useDiceRoom } from '../composables/useDiceRoom.ts'
import { useSettingsStore } from '../stores/settings.ts'
import { imageUrl } from '../utils/imageUrl.ts'
import KoStageCards from '../components/play/KoStageCards.vue'
import KoMissionInteraction from '../components/play/KoMissionInteraction.vue'
import VictoryTracker from '../components/play/legendary/VictoryTracker.vue'
import LegendaryForcePools from '../components/play/legendary/LegendaryForcePools.vue'
import LegendaryTurnOrder from '../components/play/legendary/LegendaryTurnOrder.vue'
import UnitsTab from '../components/play/units/UnitsTab.vue'
import LegendaryMissionInteraction from '../components/play/legendary/LegendaryMissionInteraction.vue'
import MultiplayerPanel from '../components/play/multiplayer/MultiplayerPanel.vue'
import SessionBanner from '../components/play/multiplayer/SessionBanner.vue'
import DicePanel from '../components/play/DicePanel.vue'

useHead({
  title: 'Game Tracker — ShatterApp',
  meta: [
    { name: 'description', content: 'Track mission struggle, unit health, conditions, and dice rolls during your Shatterpoint game.' },
    { property: 'og:title', content: 'Game Tracker — ShatterApp' },
    { property: 'og:description', content: 'Track mission struggle, unit health, conditions, and dice rolls during your Shatterpoint game.' },
    { property: 'og:url', content: 'https://shatterapp.com/play' },
  ],
  link: [{ rel: 'canonical', href: 'https://shatterapp.com/play' }],
})

const store = useStruggleStore()
const missionsStore = useMissionsStore()
const koStore = useKeyopsStore()
const koMissionsStore = useKoMissionsStore()
const legendaryStore = useLegendaryStore()
const legendaryMissionsStore = useLegendaryMissionsStore()
const galacticLegendsStore = useGalacticLegendsStore()
const playUnitsStore = usePlayUnitsStore()
const charactersStore = useCharactersStore()
const strikeForceStore = useStrikeForceStore()

const settingsStore = useSettingsStore()

const playTab = ref<'tracker' | 'units' | 'dice'>(
  (store.selectedMission || koStore.selectedKoMission || (legendaryStore.selectedMission && legendaryStore.selectedGalacticLegend))
    ? 'tracker' : 'units'
)
const multiplayerMode = ref(false)
const rollSession = useRollSessionStore()
const diceRoom = useDiceRoom()

// Wire up multiplayer callbacks
diceRoom.onOpponentUnits((units, forcePool) => {
  rollSession.setOpponentUnits(units)
  if (forcePool) rollSession.setOpponentForcePool(forcePool)
})
diceRoom.onTrackerUpdate((snapshot) => {
  console.log('[onTrackerUpdate] received snapshot:', JSON.stringify(snapshot), 'missions loaded:', missionsStore.missions.length)
  store.applySnapshot(snapshot, missionsStore.missions)
  if (snapshot.selectedMissionId != null) playUnitsStore.lock()
})
diceRoom.onPlayerJoined(() => {
  rollSession.setOpponentOnline(true)
  playUnitsStore.syncNow()
})
diceRoom.onPlayerLeft(() => rollSession.setOpponentOnline(false))
diceRoom.onSessionEnded(() => {
  diceRoom.leaveRoom()
  rollSession.reset()
  multiplayerMode.value = false
})
diceRoom.onOpponentName((name) => rollSession.setOpponentName(name))
diceRoom.onRoleAssigned(({ myRole }) => rollSession.claimRole(myRole))
diceRoom.onOpponentPoolUpdate(({ pool }) => {
  rollSession.setOpponentPool(pool)
})
diceRoom.onRoleTaken(({ role, unitId }) => {
  rollSession.setRoleTaken(role)
  if (unitId !== null) {
    if (role === 'attacker') rollSession.setAtkUnit(unitId)
    else rollSession.setDefUnit(unitId)
  }
})


const pendingRoll = ref<{ role: 'attacker' | 'defender'; count: number } | null>(null)

function onRollStat(payload: { unitId: number; role: 'attacker' | 'defender'; diceCount: number }) {
  if (payload.role === 'attacker') rollSession.setAtkUnit(payload.unitId)
  else rollSession.setDefUnit(payload.unitId)
  pendingRoll.value = { role: payload.role, count: payload.diceCount }
  playTab.value = 'dice'
  if (rollSession.isConnected) {
    diceRoom.claimRole(payload.role, payload.unitId)
  }
}

const MODES: { value: GameMode; label: string; disabled?: boolean }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'key-operations', label: 'Key Ops' },
  { value: 'legendary', label: 'Legendary' },
]

const isKO = computed(() => koStore.mode === 'key-operations')
const isLegendary = computed(() => koStore.mode === 'legendary')
const inGame = computed(() => {
  if (isLegendary.value) return legendaryStore.legendaryInGame
  return isKO.value ? !!koStore.selectedKoMission : !!store.selectedMission
})
const pickerMissions = computed(() => {
  if (isLegendary.value) return legendaryMissionsStore.missions as unknown as import('../types/index.ts').Mission[]
  return isKO.value ? koMissionsStore.missions : missionsStore.missions
})
const pickerLoading = computed(() => {
  if (isLegendary.value) return legendaryMissionsStore.loading
  return isKO.value ? koMissionsStore.loading : missionsStore.loading
})
const p1Label = computed(() => (isKO.value ? 'Aggressor' : 'P1'))
const p2Label = computed(() => (isKO.value ? 'Sentinel' : 'P2'))

const winPlayerLabel = computed(() => {
  if (winPlayer.value === null) return ''
  return winPlayer.value === 1 ? p1Label.value : p2Label.value
})

const opWinnerRole = computed<'aggressor' | 'sentinel' | null>(() => {
  if (!store.gameOver) return null
  return store.p1Wins === 2 ? 'aggressor' : 'sentinel'
})
const opWinnerLabel = computed(() =>
  opWinnerRole.value === 'aggressor' ? p1Label.value : p2Label.value,
)
const currentOp = computed(() => koStore.opResults.length + 1)
// In KO mode the struggle marker only appears when both sides have full momentum
const koMarkerVisible = computed(
  () => isKO.value && store.p1Momentum === 8 && store.p2Momentum === 8,
)

// Single computed gate for the game-over overlay
const gameOverVisible = computed(
  () =>
    (isLegendary.value && legendaryStore.legendaryOver) ||
    (!isKO.value && !isLegendary.value && store.gameOver) ||
    (isKO.value && (store.gameOver || koStore.campaignOver)),
)

function opPipClass(i: number, pendingCurrent = false): string {
  const result = koStore.opResults[i - 1]
  if (result === 'aggressor') return 'bg-sky-400 border-sky-300'
  if (result === 'sentinel') return 'bg-amber-400 border-amber-300'
  if (pendingCurrent && i === koStore.opResults.length + 1)
    return 'bg-zinc-600 border-zinc-500 animate-pulse'
  return 'bg-zinc-800 border-zinc-600'
}

function selectMode(m: GameMode) {
  if (koStore.mode === m) return
  koStore.mode = m
  koStore.resetCampaign()
  store.resetGame()
  legendaryStore.resetLegendary()
  pickerIndex.value = 0
  playTab.value = 'tracker'
}

function playSelectedMission() {
  const m = pickerMissions.value[pickerIndex.value]
  if (isLegendary.value) {
    legendaryStore.selectMission(m as unknown as import('../types/index.ts').LegendaryMission)
    const gl = galacticLegendsStore.legends[0]
    if (gl) legendaryStore.selectGalacticLegend(gl)
    playUnitsStore.lock()
    playTab.value = 'tracker'
  } else if (isKO.value) {
    selectKoMission(m as import('../types/index.ts').KoMission)
  } else {
    confirmMission(m as import('../types/index.ts').Mission)
  }
}


function pickerCardSrc(item: import('../types/index.ts').Mission | import('../types/index.ts').KoMission | import('../types/index.ts').LegendaryMission): string | undefined {
  return (item as import('../types/index.ts').Mission).card
    ?? (item as import('../types/index.ts').KoMission).missionFront
    ?? (item as import('../types/index.ts').LegendaryMission).missionCard
}

function claimOp() {
  if (opWinnerRole.value === null) return
  koStore.claimOp(opWinnerRole.value)
  koStore.resetKoMission()
  store.resetGame()
}

function selectKoMission(m: import('../types/index.ts').KoMission) {
  koStore.selectKoMission(m)
  store.p1Momentum = 0
  store.p2Momentum = 0
  playUnitsStore.lock()
  playTab.value = 'tracker'
}

function newCampaign() {
  koStore.resetCampaign()
  store.resetGame()
}

function handleReset() {
  if (isLegendary.value) {
    legendaryStore.resetLegendary()
    pickerIndex.value = 0
  } else {
    if (isKO.value) koStore.resetKoMission()
    store.resetGame()
  }
  playUnitsStore.reset()
  playTab.value = 'units'
  if (rollSession.isConnected) rollSession.clearHistory()
}

function confirmMission(mission: import('../types/index.ts').Mission) {
  store.confirmMission(mission)
  if (isKO.value) {
    store.p1Momentum = 0
    store.p2Momentum = 0
  }
  playUnitsStore.lock()
  playTab.value = 'tracker'
}

function handleClaimStruggle(player: 1 | 2) {
  store.claimStruggle(player)
  if (isKO.value) {
    store.p1Momentum = 0
    store.p2Momentum = 0
  }
}

const pickerIndex = ref(0)
const slideDir = ref<'left' | 'right'>('right')
const cardCollapsed = ref(false)
const touchStartX = ref(0)
const missionFullscreen = ref(false)
const missionFullscreenSrc = ref('')
const fsTouchStartX = ref(0)

function openFullscreen(src: string) {
  missionFullscreenSrc.value = src
  missionFullscreen.value = true
}

function onTouchStart(e: TouchEvent) {
  touchStartX.value = e.touches[0].clientX
}
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX.value
  if (Math.abs(dx) < 40) return
  if (dx > 0) goPrev()
  else goNext()
}

function onFsTouchStart(e: TouchEvent) {
  fsTouchStartX.value = e.touches[0].clientX
}
function onFsTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - fsTouchStartX.value
  if (Math.abs(dx) < 40) {
    missionFullscreen.value = false
    return
  }
  if (dx > 0) goPrev()
  else goNext()
  const card = pickerCardSrc(pickerMissions.value[pickerIndex.value])
  if (card) missionFullscreenSrc.value = imageUrl(card)
}
const koMissionCardIndex = ref(0)
const legendaryMissionCardIndex = ref(0)
watch(() => store.selectedMission, () => { cardCollapsed.value = false })
watch(() => koStore.selectedKoMission, () => { koMissionCardIndex.value = 0 })
watch(() => legendaryStore.selectedMission, () => { legendaryMissionCardIndex.value = 0; cardCollapsed.value = false })
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
  if (pickerIndex.value >= pickerMissions.value.length - 1) return
  slideDir.value = 'right'
  pickerIndex.value++
}

// Arrow keys: cycle missions in picker (State A) or move token during game (State B)
function onKeyDown(e: KeyboardEvent) {
  if (inGame.value && !isKO.value) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); store.moveStruggle(-1) }
    if (e.key === 'ArrowRight') { e.preventDefault(); store.moveStruggle(1) }
  } else if (!inGame.value && pickerMissions.value.length > 0) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
    if (e.key === 'ArrowRight') { e.preventDefault(); goNext() }
  }
}
onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  missionsStore.load()
  koMissionsStore.load()
  legendaryMissionsStore.load()
  galacticLegendsStore.load()
  charactersStore.load()
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

function cellClass(pos: number, vertical = false): string {
  const p1Filled = isP1Filled(pos)
  const p2Filled = isP2Filled(pos)
  const p1Win = store.p1WinsStruggle && isP1Innermost(pos)
  const p2Win = store.p2WinsStruggle && isP2Innermost(pos)

  let base = vertical
    ? 'relative flex items-center justify-center w-full flex-none rounded select-none transition-all duration-150 h-10 '
    : 'relative flex items-center justify-center flex-1 min-w-0 rounded select-none transition-all duration-150 h-10 '

  if (pos === 0) {
    base += vertical ? 'w-full !h-14 rounded-lg ' : 'flex-none w-11 !h-12 rounded-lg '
    base += 'bg-gradient-to-b from-zinc-800 to-zinc-950 '
    base += 'border-2 border-amber-500/40 '
    base += 'shadow-[inset_0_2px_6px_rgba(0,0,0,0.6),0_0_10px_rgba(245,158,11,0.2)] '
  } else if (p1Filled) {
    base += 'bg-gradient-to-b from-sky-400 to-blue-700 '
    base += 'border border-sky-300/20 '
    base += vertical
      ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] active:scale-95 '
      : 'shadow-[0_3px_0_0_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.22)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.55)] active:translate-y-0.5 '
    base += 'cursor-pointer hover:from-sky-300 hover:to-blue-600 '
    if (p1Win) base += 'ring-2 ring-green-400 shadow-[0_0_12px_rgba(74,222,128,0.55)] animate-pulse '
  } else if (p2Filled) {
    base += 'bg-gradient-to-b from-amber-300 to-amber-700 '
    base += 'border border-amber-200/20 '
    base += vertical
      ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] active:scale-95 '
      : 'shadow-[0_3px_0_0_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.22)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.55)] active:translate-y-0.5 '
    base += 'cursor-pointer hover:from-amber-200 hover:to-amber-600 '
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
        v-if="gameOverVisible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-6"
      >
        <div
          class="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-zinc-900 p-8 text-center
                 shadow-[0_0_60px_rgba(201,168,76,0.15)]"
        >
          <!-- Legendary: GL wins -->
          <template v-if="isLegendary">
            <div class="mb-3 text-5xl">⚡</div>
            <div class="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/50">
              Legendary Encounter Over
            </div>
            <div class="mb-6 text-2xl font-bold text-amber-400">
              Galactic Legend Wins!
            </div>
            <button
              class="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-bold text-zinc-900
                     shadow-[0_4px_0_0_rgba(0,0,0,0.4)] transition-all hover:bg-amber-400
                     active:shadow-[0_1px_0_0_rgba(0,0,0,0.4)] active:translate-y-[3px]"
              @click="handleReset()"
            >
              New Game
            </button>
          </template>

          <!-- KO: Campaign complete -->
          <template v-else-if="isKO && koStore.campaignOver">
            <div class="mb-3 text-5xl">⚔</div>
            <div class="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/50">
              Campaign Complete
            </div>
            <div class="mb-4 text-2xl font-bold text-amber-400">
              {{ koStore.campaignWinner === 'aggressor' ? p1Label : p2Label }} Wins the Campaign!
            </div>
            <div class="mb-6 flex justify-center gap-2">
              <div
                v-for="i in 3" :key="i"
                class="h-5 w-5 rounded-full border transition-colors"
                :class="opPipClass(i)"
              />
            </div>
            <button
              class="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-bold text-zinc-900
                     shadow-[0_4px_0_0_rgba(0,0,0,0.4)] transition-all hover:bg-amber-400
                     active:shadow-[0_1px_0_0_rgba(0,0,0,0.4)] active:translate-y-[3px]"
              @click="newCampaign()"
            >
              New Campaign
            </button>
          </template>

          <!-- KO: Op complete (campaign not yet over) -->
          <template v-else-if="isKO && store.gameOver">
            <div class="mb-3 text-5xl">⚔</div>
            <div class="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/50">
              Op {{ currentOp }} Complete
            </div>
            <div class="mb-4 text-2xl font-bold text-amber-400">
              {{ opWinnerLabel }} Wins!
            </div>
            <div class="mb-6 flex justify-center gap-2">
              <div
                v-for="i in 3" :key="i"
                class="h-5 w-5 rounded-full border transition-colors"
                :class="opPipClass(i, true)"
              />
            </div>
            <button
              class="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-bold text-zinc-900
                     shadow-[0_4px_0_0_rgba(0,0,0,0.4)] transition-all hover:bg-amber-400
                     active:shadow-[0_1px_0_0_rgba(0,0,0,0.4)] active:translate-y-[3px]"
              @click="claimOp()"
            >
              Next Op →
            </button>
          </template>

          <!-- Standard: Game over -->
          <template v-else>
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
          </template>
        </div>
      </div>
    </Transition>

    <!-- ── Header ── -->
    <div class="flex items-center justify-between gap-2">
      <h1 class="text-xl font-bold tracking-wide text-amber-400">⚔ Game Tracker</h1>
      <div class="flex items-center gap-2">
        <!-- Multiplayer toggle -->
        <button
          :class="[
            'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
            multiplayerMode
              ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
              : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200',
          ]"
          @click="multiplayerMode = !multiplayerMode"
        >🔗 Enable Multiplayer</button>
        <button
          v-if="inGame"
          class="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-400
                 shadow-[0_2px_0_0_rgba(0,0,0,0.4)] transition-all
                 hover:border-zinc-500 hover:text-zinc-200
                 active:shadow-none active:translate-y-0.5"
          @click="handleReset()"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- ── Multiplayer panel / session banner ── -->
    <template v-if="multiplayerMode">
      <SessionBanner v-if="rollSession.isConnected" @left="multiplayerMode = false" />
      <MultiplayerPanel v-else @connected="() => { multiplayerMode = true; playUnitsStore.syncNow() }" />
    </template>

    <!-- ── Mode selector ── -->
    <div class="flex gap-1 rounded-lg border border-zinc-700/60 bg-zinc-900/60 p-1">
      <button
        v-for="m in MODES" :key="m.value"
        class="flex-1 rounded px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-all leading-tight"
        :class="[
          m.disabled
            ? 'cursor-not-allowed text-zinc-700'
            : koStore.mode === m.value
              ? 'bg-amber-500 text-zinc-900 shadow-[0_2px_0_rgba(0,0,0,0.3)]'
              : 'text-zinc-500 hover:text-zinc-300'
        ]"
        :disabled="m.disabled"
        @click="!m.disabled && selectMode(m.value)"
      >
        {{ m.label }}
      </button>
    </div>

    <!-- ── Play tab bar ── -->
    <div class="flex gap-1 rounded-lg border border-zinc-700/40 bg-zinc-900/40 p-1">
      <button
        v-if="settingsStore.playShowRoster"
        class="flex-1 rounded px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1"
        :class="playTab === 'units'
          ? 'bg-zinc-700 text-zinc-100 shadow-[0_1px_0_rgba(0,0,0,0.3)]'
          : 'text-zinc-500 hover:text-zinc-300'"
        @click="playTab = 'units'"
      >
        Units
        <span v-if="playUnitsStore.locked" class="text-amber-500 text-[9px]">🔒</span>
        <span v-else-if="playUnitsStore.hasUnits" class="rounded-full bg-zinc-600 px-1 text-[9px] text-zinc-300">{{ playUnitsStore.units.length }}</span>
      </button>
      <button
        v-if="settingsStore.playShowTracker"
        class="flex-1 rounded px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-all"
        :class="playTab === 'tracker'
          ? 'bg-zinc-700 text-zinc-100 shadow-[0_1px_0_rgba(0,0,0,0.3)]'
          : 'text-zinc-500 hover:text-zinc-300'"
        @click="playTab = 'tracker'"
      >Tracker</button>
      <button
        v-if="settingsStore.playShowDice"
        class="flex-1 rounded px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-all"
        :class="playTab === 'dice'
          ? 'bg-zinc-700 text-zinc-100 shadow-[0_1px_0_rgba(0,0,0,0.3)]'
          : 'text-zinc-500 hover:text-zinc-300'"
        @click="playTab = 'dice'"
      >Dice</button>
    </div>

    <!-- ── Units tab ── -->
    <UnitsTab
      v-if="settingsStore.playShowRoster && playTab === 'units'"
      :characters="charactersStore.characters"
      :saved-lists="strikeForceStore.savedLists"
      :squad0-valid="strikeForceStore.isSquad0Valid"
      :locked="playUnitsStore.locked"
      :opponent-units="rollSession.isConnected ? rollSession.opponentUnits : undefined"
      @roll-stat="onRollStat"
    />

    <!-- ── Dice tab ── -->
    <DicePanel v-show="settingsStore.playShowDice && playTab === 'dice'" :pending-roll="pendingRoll" @consumed="pendingRoll = null" />

    <!-- ══════════════════════════════════════════
         TRACKER TAB CONTENT
         ══════════════════════════════════════════ -->
    <template v-if="settingsStore.playShowTracker && playTab === 'tracker'">

    <!-- ══════════════════════════════════════════
         STATE A: Mission Picker
         ══════════════════════════════════════════ -->
    <template v-if="!inGame">
      <!-- Section label -->
      <div class="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
        Choose Mission
      </div>

      <!-- Loading skeleton -->
      <div
        v-if="pickerLoading"
        class="flex flex-col gap-3 rounded-2xl border border-zinc-700/40 bg-zinc-900/60 p-6"
      >
        <div class="mx-auto h-48 w-full animate-pulse rounded-xl bg-zinc-800" />
        <div class="mx-auto h-4 w-40 animate-pulse rounded bg-zinc-800" />
      </div>

      <!-- Missions loaded -->
      <template v-else-if="!pickerLoading && pickerMissions.length > 0">

        <!-- ── MOBILE: full-width card, swipe to navigate ── -->
        <div class="flex flex-col gap-4 sm:hidden"
          @touchstart.passive="onTouchStart"
          @touchend.passive="onTouchEnd"
        >
          <div class="relative w-full rounded-2xl border border-zinc-700/50 bg-zinc-900 shadow-2xl flex items-center justify-center overflow-hidden"
               :style="{ minHeight: '56vw' }">
            <Transition :name="`card-slide-${slideDir}`" mode="out-in">
              <img
                v-if="pickerCardSrc(pickerMissions[pickerIndex])"
                :key="pickerIndex"
                :src="imageUrl(pickerCardSrc(pickerMissions[pickerIndex])!)"
                class="w-full object-contain max-h-[65vh]"
                alt="mission card"
              />
              <div
                v-else
                :key="`placeholder-${pickerIndex}`"
                class="flex w-full items-center justify-center px-6 py-12 text-center"
              >
                <div>
                  <div class="mb-2 text-3xl">⚔</div>
                  <div class="text-sm font-semibold text-zinc-400">{{ pickerMissions[pickerIndex].name }}</div>
                  <div class="mt-1 text-[11px] text-zinc-700">Mission card coming soon</div>
                </div>
              </div>
            </Transition>
            <button
              v-if="pickerCardSrc(pickerMissions[pickerIndex])"
              class="absolute bottom-2 right-2 z-20 rounded-lg bg-black/60 p-2 text-white/60 backdrop-blur-sm transition-colors hover:text-white"
              @click.stop="openFullscreen(imageUrl(pickerCardSrc(pickerMissions[pickerIndex])!))"
            >⛶</button>
          </div>

          <div class="text-center font-semibold text-zinc-200">
            {{ pickerMissions[pickerIndex].name }}
          </div>

          <div class="flex justify-center gap-1.5">
            <span
              v-for="(_, i) in pickerMissions" :key="i"
              class="block h-1.5 w-1.5 rounded-full transition-colors duration-200"
              :class="i === pickerIndex ? 'bg-amber-400' : 'bg-zinc-600'"
            />
          </div>

          <button
            class="w-full rounded-xl bg-amber-500 px-4 py-3 font-bold text-zinc-900
                   shadow-[0_4px_0_0_rgba(0,0,0,0.4)] transition-all
                   hover:bg-amber-400 active:shadow-[0_1px_0_0_rgba(0,0,0,0.4)] active:translate-y-[3px]"
            @click="playSelectedMission()"
          >▶ Play this Mission</button>
        </div>

        <!-- ── DESKTOP: 3-col grid with arrow buttons ── -->
        <div class="hidden sm:grid gap-x-3 gap-y-4" style="grid-template-columns: 2.5rem 1fr 2.5rem">

          <button
            class="self-center flex h-24 w-full items-center justify-center
                   rounded-lg border-2 border-zinc-400 bg-zinc-700 text-white
                   shadow-[0_4px_14px_rgba(0,0,0,0.8)]
                   transition-all hover:border-amber-400 hover:bg-amber-500 hover:text-zinc-900
                   active:scale-95 disabled:cursor-not-allowed disabled:opacity-20
                   disabled:hover:border-zinc-400 disabled:hover:bg-zinc-700 disabled:hover:text-white"
            :disabled="pickerIndex === 0"
            @click="goPrev"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <div class="relative rounded-2xl border border-zinc-700/50 bg-zinc-900 shadow-2xl flex items-center justify-center overflow-hidden p-2"
               style="height: 338px">
            <Transition :name="`card-slide-${slideDir}`" mode="out-in">
              <img
                v-if="pickerCardSrc(pickerMissions[pickerIndex])"
                :key="pickerIndex"
                :src="imageUrl(pickerCardSrc(pickerMissions[pickerIndex])!)"
                class="w-full rounded-xl object-contain max-h-[322px]"
                alt="mission card"
                @load="onCardImgLoad"
              />
              <div
                v-else
                :key="`placeholder-${pickerIndex}`"
                class="flex w-full items-center justify-center px-6 py-12 text-center"
              >
                <div>
                  <div class="mb-2 text-4xl">⚔</div>
                  <div class="text-sm font-semibold text-zinc-400">{{ pickerMissions[pickerIndex].name }}</div>
                  <div class="mt-1 text-[11px] text-zinc-700">Mission card coming soon</div>
                </div>
              </div>
            </Transition>
          </div>

          <button
            class="self-center flex h-24 w-full items-center justify-center
                   rounded-lg border-2 border-zinc-400 bg-zinc-700 text-white
                   shadow-[0_4px_14px_rgba(0,0,0,0.8)]
                   transition-all hover:border-amber-400 hover:bg-amber-500 hover:text-zinc-900
                   active:scale-95 disabled:cursor-not-allowed disabled:opacity-20
                   disabled:hover:border-zinc-400 disabled:hover:bg-zinc-700 disabled:hover:text-white"
            :disabled="pickerIndex === pickerMissions.length - 1"
            @click="goNext"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          <div class="col-start-2 text-center font-semibold text-zinc-200">
            {{ pickerMissions[pickerIndex].name }}
          </div>

          <div class="col-start-2 flex justify-center gap-1.5">
            <span
              v-for="(_, i) in pickerMissions" :key="i"
              class="block h-1.5 w-1.5 rounded-full transition-colors duration-200"
              :class="i === pickerIndex ? 'bg-amber-400' : 'bg-zinc-600'"
            />
          </div>

          <button
            class="col-start-2 mx-auto w-full rounded-xl bg-amber-500 px-4 py-3 font-bold text-zinc-900
                   shadow-[0_4px_0_0_rgba(0,0,0,0.4)] transition-all
                   hover:bg-amber-400 active:shadow-[0_1px_0_0_rgba(0,0,0,0.4)] active:translate-y-[3px]"
            :style="cardImgWidth ? { maxWidth: cardImgWidth + 'px' } : {}"
            @click="playSelectedMission()"
          >▶ Play this Mission</button>

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

      <!-- ══════════════════════════════════════════
           LEGENDARY MODE game content
           ══════════════════════════════════════════ -->
      <template v-if="isLegendary && legendaryStore.selectedMission && legendaryStore.selectedGalacticLegend">

        <!-- Turn order (always visible at top) -->
        <LegendaryTurnOrder
          :phase="legendaryStore.turnPhase"
          :round="legendaryStore.roundNumber"
          @next="(inc) => legendaryStore.nextTurnPhase(inc)"
        />

        <!-- Mission card (collapsible) -->
        <div
          class="rounded-xl border border-zinc-700/50 bg-zinc-900/80 select-none overflow-hidden"
          :class="cardCollapsed ? 'p-0' : 'p-2'"
        >
          <!-- Collapsed bar -->
          <div
            v-if="cardCollapsed"
            class="flex cursor-pointer items-center justify-between px-3 py-2"
            @click="cardCollapsed = false"
          >
            <span class="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
              {{ legendaryStore.selectedMission.name }}
            </span>
            <span class="text-[10px] text-zinc-600">▼ expand</span>
          </div>
          <template v-else>
            <!-- Multi-face card container -->
            <div class="relative flex justify-center">
              <img
                v-if="legendaryStore.selectedMission.missionCards?.length"
                :src="imageUrl(legendaryStore.selectedMission.missionCards[legendaryMissionCardIndex])"
                class="w-[58%] mx-auto rounded-lg object-contain"
                style="aspect-ratio: 800/523"
                alt="mission card"
              />
              <img
                v-else-if="legendaryStore.selectedMission.missionCard"
                :src="imageUrl(legendaryStore.selectedMission.missionCard)"
                class="w-[58%] mx-auto rounded-lg object-contain"
                style="aspect-ratio: 800/523"
                alt="mission card"
              />
              <div
                v-else
                class="flex w-full items-center justify-center px-6 py-8 text-center"
              >
                <div>
                  <div class="mb-2 text-3xl">⚡</div>
                  <div class="text-sm font-semibold text-zinc-400">{{ legendaryStore.selectedMission.name }}</div>
                  <div class="mt-1 text-[11px] text-zinc-700">Mission card coming soon</div>
                </div>
              </div>
              <!-- Face selector pills -->
              <div
                v-if="legendaryStore.selectedMission.missionCards && legendaryStore.selectedMission.missionCards.length > 1"
                class="absolute top-2 right-2 z-20 flex rounded-lg overflow-hidden border border-zinc-600 bg-black/70 backdrop-blur-sm"
              >
                <button
                  v-for="(_, i) in legendaryStore.selectedMission.missionCards"
                  :key="i"
                  class="px-2.5 py-1 text-[10px] font-bold transition-colors"
                  :class="legendaryMissionCardIndex === i
                    ? 'bg-amber-500/80 text-zinc-900'
                    : 'text-zinc-300 hover:text-zinc-100 hover:bg-white/10'"
                  @click.stop="legendaryMissionCardIndex = i"
                >{{ i + 1 }}</button>
              </div>
            </div>
            <div class="mt-1 flex cursor-pointer items-center justify-between px-1" @click="cardCollapsed = true">
              <span class="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                {{ legendaryStore.selectedMission.name }} ·
                <span class="text-amber-500">{{ legendaryStore.selectedGalacticLegend.name }}</span>
              </span>
              <span class="text-[10px] text-zinc-600">▲ collapse</span>
            </div>
          </template>
        </div>

        <!-- Victory Tracker -->
        <VictoryTracker
          :position="legendaryStore.victoryPosition"
          @advance="legendaryStore.advanceVictory()"
          @retreat="legendaryStore.retreatVictory()"
        />

        <!-- Force Pools -->
        <LegendaryForcePools
          :cadre1-force="legendaryStore.cadre1Force"
          :cadre2-force="legendaryStore.cadre2Force"
          :legend-force="legendaryStore.legendForce"
          :cadre-force-refresh="legendaryStore.cadreForceRefresh"
          @adjust="(player, delta) => legendaryStore.adjustForce(player, delta)"
        />

        <!-- Mission interaction / dashboard -->
        <LegendaryMissionInteraction :mission="legendaryStore.selectedMission" />

        <!-- Rules Quick Reference -->
        <details class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
          <summary class="cursor-pointer select-none text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
            Legendary Encounters — Rules Reference
          </summary>
          <div class="mt-3 space-y-3 text-xs leading-relaxed text-zinc-500">
            <div>
              <p class="mb-1 font-semibold text-zinc-300">Players &amp; Squads</p>
              <p><span class="font-semibold text-zinc-400">Cadre players (×2):</span> Each builds 2 Secondary + 2 Supporting units. No Primary unit. Same Era, within Mission SP limit.</p>
              <p class="mt-1"><span class="font-semibold text-zinc-400">Galactic Legend player:</span> GL unit + 1 Minion set from the Minion List. No duplicate unique names across any squad.</p>
            </div>
            <div>
              <p class="mb-1 font-semibold text-zinc-300">Turn Order</p>
              <p>Cadre 1 → Cadre 2 → Galactic Legend (repeat). Cadre players choose their own order each round. Both Cadres share <span class="text-zinc-300">one reserve slot</span> — can't reserve if the other cadre's unit is already in Reserve.</p>
            </div>
            <div>
              <p class="mb-1 font-semibold text-zinc-300">Galactic Legend Turn (4 steps)</p>
              <ol class="list-decimal list-inside space-y-0.5">
                <li><span class="text-zinc-400">Reveal Order Cards</span> — reveal 2 from deck, choose 1; resolve its Effect; discard both.</li>
                <li><span class="text-zinc-400">Minion Activations</span> — all Minion units activate.</li>
                <li><span class="text-zinc-400">Strategic Redeployment</span> — mission-specific.</li>
                <li><span class="text-zinc-400">GL Activation</span> — Galactic Legend unit activates.</li>
              </ol>
              <p class="mt-1"><span class="font-semibold text-zinc-400">Shatterpoint card:</span> if revealed, the other card is auto-chosen AND its Legend Ability triggers. On Turn 1: set aside, draw a replacement, shuffle back in at round end.</p>
            </div>
            <div>
              <p class="mb-1 font-semibold text-zinc-300">Victory Tracker &amp; Alert Levels</p>
              <p>The GL advances the tracker by completing plot objectives. Reaching space 9 = GL wins.</p>
              <div class="mt-1.5 grid grid-cols-3 gap-1 text-[10px]">
                <div class="rounded border border-emerald-800/40 bg-emerald-950/30 px-2 py-1 text-center">
                  <div class="font-bold text-emerald-400">Condition Green</div>
                  <div class="text-emerald-700">Spaces 1–3</div>
                  <div class="text-emerald-600">0 Force/turn</div>
                </div>
                <div class="rounded border border-yellow-800/40 bg-yellow-950/30 px-2 py-1 text-center">
                  <div class="font-bold text-yellow-400">Yellow Alert</div>
                  <div class="text-yellow-700">Spaces 4–6</div>
                  <div class="text-yellow-600">+1 Force/turn</div>
                </div>
                <div class="rounded border border-red-800/40 bg-red-950/30 px-2 py-1 text-center">
                  <div class="font-bold text-red-400">Red Alert</div>
                  <div class="text-red-700">Spaces 7–9</div>
                  <div class="text-red-600">+2 Force/turn</div>
                </div>
              </div>
              <p class="mt-1">Cadre Force Refresh happens once per Cadre turn, before the first activation.</p>
            </div>
            <div>
              <p class="mb-1 font-semibold text-zinc-300">GL Order Deck</p>
              <p>7 unique Order Cards + 1 Shatterpoint Card. Each card has a <span class="text-zinc-400">Force Refresh</span> value (Force GL gains that turn), an <span class="text-zinc-400">Effect</span>, and a <span class="text-zinc-400">Legend Ability</span> (Shatterpoint only). Force is <span class="text-zinc-300">not</span> refreshed when the deck is reshuffled — only from the drawn card's value.</p>
            </div>
            <div>
              <p class="mb-1 font-semibold text-zinc-300">Force Pools</p>
              <p><span class="text-zinc-400">GL:</span> equal to the GL unit's Force stat. <span class="text-zinc-400">Each Cadre:</span> amount specified by the Mission. Cadre players spend Force for abilities; GL spends for their own. Refreshed per Alert Level table above.</p>
            </div>
          </div>
        </details>

      </template>

      <!-- ══════════════════════════════════════════
           STANDARD / KO game content
           ══════════════════════════════════════════ -->
      <template v-else-if="!isLegendary">

      <!-- ── Mission card (collapsible) ── -->
      <div
        class="rounded-xl border border-zinc-700/50 bg-zinc-900/80 cursor-pointer select-none"
        :class="[cardCollapsed ? 'p-0' : 'p-2', isKO ? '' : 'overflow-hidden']"
        @click="cardCollapsed = !cardCollapsed"
      >
        <!-- Collapsed: slim name bar -->
        <div
          v-if="cardCollapsed"
          class="flex items-center justify-between px-3 py-2"
        >
          <span class="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            {{ isKO ? koStore.selectedKoMission?.name : store.selectedMission?.name }}
          </span>
          <span class="text-[10px] text-zinc-600">▼ expand</span>
        </div>

        <!-- Expanded: full-size card -->
        <template v-else>
          <div class="relative flex" :class="isKO ? 'justify-center' : ''">
            <img
              v-if="!isKO"
              data-testid="mission-card"
              :src="imageUrl(store.selectedMission?.card)"
              class="w-full max-h-[322px] rounded-lg object-contain"
              alt="mission card"
            />
            <!-- KO: fixed aspect-ratio container keeps all card faces the same display size -->
            <div
              v-else
              class="w-[58%] rounded-lg overflow-hidden"
              style="aspect-ratio: 800/660"
            >
              <img
                data-testid="mission-card"
                :src="imageUrl(
                  koStore.selectedKoMission!.missionCards
                    ? koStore.selectedKoMission!.missionCards[koMissionCardIndex]
                    : koMissionCardIndex === 0
                      ? koStore.selectedKoMission!.missionFront!
                      : koStore.selectedKoMission!.missionBack!
                )"
                class="w-full h-full object-contain rounded-lg"
                :alt="`Mission card face ${koMissionCardIndex + 1}`"
              />
            </div>
            <!-- KO: multi-face buttons (1|2|3) or standard flip -->
            <template v-if="isKO && koStore.selectedKoMission">
              <!-- 3-face button row -->
              <div
                v-if="koStore.selectedKoMission.missionCards && koStore.selectedKoMission.missionCards.length > 2"
                class="absolute top-2 right-2 z-20 flex rounded-lg overflow-hidden border border-zinc-600 bg-black/70 backdrop-blur-sm"
              >
                <button
                  v-for="(_, i) in koStore.selectedKoMission.missionCards"
                  :key="i"
                  class="px-2.5 py-1 text-[10px] font-bold transition-colors"
                  :class="koMissionCardIndex === i
                    ? 'bg-amber-500/80 text-zinc-900'
                    : 'text-zinc-300 hover:text-zinc-100 hover:bg-white/10'"
                  @click.stop="koMissionCardIndex = i"
                >{{ i + 1 }}</button>
              </div>
              <!-- Standard flip button -->
              <button
                v-else-if="koStore.selectedKoMission.missionBack"
                class="absolute top-2 right-2 z-20 rounded-lg border border-zinc-600 bg-black/70 px-2.5 py-1 text-[10px] font-medium text-zinc-300 backdrop-blur-sm transition-colors hover:border-zinc-400 hover:text-zinc-100"
                @click.stop="koMissionCardIndex = koMissionCardIndex === 0 ? 1 : 0"
              >
                {{ koMissionCardIndex === 1 ? '↩ Front' : 'Flip →' }}
              </button>
            </template>
            <button
              v-if="!isKO"
              class="absolute bottom-2 right-2 z-20 rounded-lg bg-black/60 p-2 text-white/60 backdrop-blur-sm transition-colors hover:text-white sm:hidden"
              @click.stop="openFullscreen(imageUrl(store.selectedMission?.card))"
            >⛶</button>
          </div>
          <div class="mt-1 flex items-center justify-between px-1">
            <span class="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
              {{ isKO ? koStore.selectedKoMission?.name : store.selectedMission?.name }}
            </span>
            <span class="text-[10px] text-zinc-600">▲ collapse</span>
          </div>
        </template>
      </div>

      <!-- ── Scoreboard (standard mode only) ── -->
      <div v-if="!isKO" class="flex items-center gap-3 rounded-xl border border-zinc-700/50 bg-zinc-900/80 px-4 py-3">
        <!-- P1 / Aggressor -->
        <div class="flex flex-1 items-center gap-2">
          <span class="text-xs font-bold uppercase tracking-wider text-sky-400">{{ p1Label }}</span>
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

        <!-- P2 / Sentinel -->
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
          <span class="text-xs font-bold uppercase tracking-wider text-amber-400">{{ p2Label }}</span>
        </div>
      </div>


      <!-- ── Win banner (standard mode only) ── -->
      <Transition name="slide-down">
        <div
          v-if="!isKO && winPlayer !== null"
          class="overflow-hidden rounded-xl border border-green-500/30 bg-green-950/50"
        >
          <div class="border-b border-green-500/20 px-4 py-2.5 text-center text-sm font-bold text-green-400">
            ⚔ {{ winPlayerLabel }} Wins the Struggle!
          </div>
          <button
            class="w-full px-4 py-2.5 text-sm font-semibold text-green-300 transition-colors
                   hover:bg-green-500/10 active:bg-green-500/20"
            @click="handleClaimStruggle(winPlayer as 1 | 2)"
          >
            Claim Struggle →
          </button>
        </div>
      </Transition>

      <!-- ══════════════════════════════════════════
           VERTICAL STRUGGLE TRACK (mobile only)
           ══════════════════════════════════════════ -->
      <div class="sm:hidden overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl">

        <!-- P1 header + move buttons -->
        <div class="border-b border-zinc-800/80 px-4 py-3 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-sky-400">▲ {{ p1Label }}</span>
            <span class="rounded-full bg-sky-950 px-2 py-0.5 text-[10px] font-bold tabular-nums text-sky-400 border border-sky-800/50">{{ store.p1Momentum }}</span>
          </div>
          <div v-if="!isKO" class="grid grid-cols-2 gap-2">
            <button
              class="rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-800 px-2 py-3 text-sm font-bold
                     border border-zinc-600/50 text-sky-300 transition-all
                     shadow-[0_4px_0_0_rgba(0,0,0,0.5)] hover:from-zinc-600 hover:to-zinc-700 hover:text-sky-200
                     active:shadow-[0_1px_0_0_rgba(0,0,0,0.5)] active:translate-y-[3px]
                     disabled:opacity-25 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_0_rgba(0,0,0,0.5)]"
              :disabled="store.strugglePosition <= -8"
              @click="store.moveStruggle(-3)"
            >▲▲ +3</button>
            <button
              class="rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-800 px-2 py-3 text-sm font-bold
                     border border-zinc-600/50 text-sky-300 transition-all
                     shadow-[0_4px_0_0_rgba(0,0,0,0.5)] hover:from-zinc-600 hover:to-zinc-700 hover:text-sky-200
                     active:shadow-[0_1px_0_0_rgba(0,0,0,0.5)] active:translate-y-[3px]
                     disabled:opacity-25 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_0_rgba(0,0,0,0.5)]"
              :disabled="store.strugglePosition <= -8"
              @click="store.moveStruggle(-1)"
            >▲ +1</button>
          </div>
        </div>

        <!-- Vertical rail -->
        <div class="px-3 py-2">
          <div
            class="relative w-full rounded-xl
                   bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950
                   border border-zinc-800/80
                   shadow-[inset_0_3px_10px_rgba(0,0,0,0.7)]"
          >
            <div class="pointer-events-none absolute inset-y-3 left-[9px] w-px rounded-full bg-zinc-700/30" />
            <div class="pointer-events-none absolute inset-y-3 right-[9px] w-px rounded-full bg-zinc-700/30" />
            <div class="flex flex-col w-full gap-0.5 py-1 px-1">
              <div
                v-for="pos in POSITIONS"
                :key="pos"
                :class="cellClass(pos, true)"
                @click="onCellClick(pos)"
              >
                <span
                  v-if="pos !== 0 && !isP1Filled(pos) && !isP2Filled(pos)"
                  class="text-[9px] font-bold text-zinc-700 tabular-nums select-none"
                >{{ Math.abs(pos) }}</span>

                <div
                  v-if="isP1Filled(pos) || isP2Filled(pos)"
                  class="pointer-events-none absolute inset-y-1.5 left-1.5 w-px rounded-full opacity-40"
                  :class="isP1Filled(pos) ? 'bg-sky-200' : 'bg-amber-100'"
                />

                <span
                  v-if="pos === 0"
                  class="relative z-10 text-lg select-none text-amber-500
                         drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                >✴</span>

                <div
                  v-if="pos === store.strugglePosition && (!isKO || koMarkerVisible)"
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
            <template v-if="!isKO">
              <span
                class="rounded border border-zinc-700/60 bg-zinc-800 px-2 py-0.5
                       text-xs font-bold tabular-nums text-zinc-300"
              >{{ store.strugglePosition > 0 ? '+' : '' }}{{ store.strugglePosition }}</span>
              <span class="text-[10px] text-zinc-600">▲▼ to move</span>
            </template>
            <span v-else class="text-[10px] text-zinc-700">fill both sides to place marker</span>
          </div>
        </div>

        <!-- P2 move buttons + header -->
        <div class="border-t border-zinc-800/80 px-4 py-3 space-y-2.5">
          <div v-if="!isKO" class="grid grid-cols-2 gap-2">
            <button
              class="rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-800 px-2 py-3 text-sm font-bold
                     border border-zinc-600/50 text-amber-400 transition-all
                     shadow-[0_4px_0_0_rgba(0,0,0,0.5)] hover:from-zinc-600 hover:to-zinc-700 hover:text-amber-300
                     active:shadow-[0_1px_0_0_rgba(0,0,0,0.5)] active:translate-y-[3px]
                     disabled:opacity-25 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_0_rgba(0,0,0,0.5)]"
              :disabled="store.strugglePosition >= 8"
              @click="store.moveStruggle(1)"
            >▼ +1</button>
            <button
              class="rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-800 px-2 py-3 text-sm font-bold
                     border border-zinc-600/50 text-amber-400 transition-all
                     shadow-[0_4px_0_0_rgba(0,0,0,0.5)] hover:from-zinc-600 hover:to-zinc-700 hover:text-amber-300
                     active:shadow-[0_1px_0_0_rgba(0,0,0,0.5)] active:translate-y-[3px]
                     disabled:opacity-25 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_0_rgba(0,0,0,0.5)]"
              :disabled="store.strugglePosition >= 8"
              @click="store.moveStruggle(3)"
            >▼▼ +3</button>
          </div>
          <div class="flex items-center justify-between">
            <span class="rounded-full bg-amber-950 px-2 py-0.5 text-[10px] font-bold tabular-nums text-amber-400 border border-amber-800/50">{{ store.p2Momentum }}</span>
            <span class="text-xs font-bold uppercase tracking-wider text-amber-400">{{ p2Label }} ▼</span>
          </div>
        </div>

      </div>

      <!-- ══════════════════════════════════════════
           STRUGGLE TRACK (desktop only)
           ══════════════════════════════════════════ -->
      <div class="hidden sm:block overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl">

        <!-- Track header -->
        <div class="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2.5">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-sky-400">◀ {{ p1Label }}</span>
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
            <span class="text-xs font-bold uppercase tracking-wider text-amber-400">{{ p2Label }} ▶</span>
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
                v-if="pos === store.strugglePosition && (!isKO || koMarkerVisible)"
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
            <template v-if="!isKO">
              <span
                class="rounded border border-zinc-700/60 bg-zinc-800 px-2 py-0.5
                       text-xs font-bold tabular-nums text-zinc-300"
              >{{ store.strugglePosition > 0 ? '+' : '' }}{{ store.strugglePosition }}</span>
              <span class="text-[10px] text-zinc-600">← → to move</span>
            </template>
            <span v-else class="text-[10px] text-zinc-700">fill both sides to place marker</span>
          </div>
        </div>
      </div>

      <!-- ── Move controls (desktop only — mobile uses integrated buttons in vertical track) ── -->
      <div v-if="!isKO" class="hidden sm:block rounded-xl border border-zinc-700/50 bg-zinc-900/80 px-4 py-3">
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

      <!-- ── KO: Stage cards + Mission interaction ── -->
      <KoStageCards v-if="isKO" />
      <KoMissionInteraction v-if="isKO" />

      <!-- ── Struggle cards (standard mode only) ── -->
      <div
        v-if="!isKO && store.struggleCards"
        class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3"
      >
        <div class="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          Struggle Cards
        </div>
        <div class="flex flex-col gap-6 sm:grid sm:grid-cols-3 sm:gap-2">
          <div v-for="(cardImg, i) in store.struggleCards" :key="i" class="w-full sm:w-auto">
            <div
              data-testid="card-flipper"
              class="card-flipper mx-auto"
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

      <!-- ── Rules reference (standard mode only) ── -->
      <details v-if="!isKO" class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
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

      </template> <!-- end v-else-if="!isLegendary" -->

    </template> <!-- end STATE B -->

    </template> <!-- end tracker tab -->

  </div>

  <!-- Mission fullscreen overlay (mobile, rotated 90°) -->
  <Teleport to="body">
    <Transition name="fs">
      <div
        v-if="missionFullscreen"
        class="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-black sm:hidden"
        @touchstart="onFsTouchStart"
        @touchend="onFsTouchEnd"
      >
        <img
          :src="missionFullscreenSrc"
          alt="Mission card fullscreen"
          class="fs-mission"
        />
        <button
          class="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:text-white"
          @click.stop="missionFullscreen = false"
        >✕</button>
      </div>
    </Transition>
  </Teleport>
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

/* ── Mission fullscreen (rotated landscape) ── */
.fs-mission {
  transform: rotate(90deg);
  width: 100vh;
  height: 100vw;
  max-width: none;
  max-height: none;
  object-fit: contain;
}
.fs-enter-active,
.fs-leave-active { transition: opacity 0.15s ease; }
.fs-enter-from,
.fs-leave-to     { opacity: 0; }
</style>
