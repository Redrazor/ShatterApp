<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStrikeForceStore } from '../stores/strikeForce.ts'
import { useCharactersStore } from '../stores/characters.ts'
import { useMissionsStore } from '../stores/missions.ts'
import type { Squad, Character, Mission } from '../types/index.ts'
import type { CompactBuild } from '../types/index.ts'
import { isSquadValid, hasStrikeForceConflict } from '../types/index.ts'
import StrikeForcePanel from '../components/build/StrikeForcePanel.vue'
import SquadSlot from '../components/build/SquadSlot.vue'
import UnitPickerDrawer from '../components/build/UnitPickerDrawer.vue'
import { decodeBuild, encodeBuild } from '../utils/profileShare.ts'

const sfStore = useStrikeForceStore()
const charStore = useCharactersStore()
const missionsStore = useMissionsStore()
const route = useRoute()
const router = useRouter()

onMounted(() => {
  charStore.load()
  missionsStore.load()

  const sf = route.query.sf as string | undefined
  if (sf) {
    const build = decodeBuild(sf)
    if (build) pendingSharedBuild.value = build
    router.replace({ query: {} })
  }
})

// Picker state
const pickerOpen = ref(false)
const activeSquadIdx = ref<0 | 1>(0)
const activeRole = ref<keyof Squad | null>(null)

// Mission picker state
const missionPickerOpen = ref(false)
const missionQuery = ref('')

// Shared build import
const pendingSharedBuild = ref<CompactBuild | null>(null)

// Save / Share toast
const saveFeedback = ref('')

const pickerExclusions = computed(() => {
  const names = new Set<string>()
  const characterTypes = new Set<string>()
  for (let si = 0; si < 2; si++) {
    for (const role of ['primary', 'secondary', 'support'] as const) {
      if (si === activeSquadIdx.value && role === activeRole.value) continue
      const u = sfStore.squads[si][role]
      if (u) {
        names.add(u.name)
        if (u.characterType) characterTypes.add(u.characterType)
      }
    }
  }
  return { names, characterTypes }
})

const savedListLegality = computed(() =>
  sfStore.savedLists.map(build => {
    const resolve = (id: number) => id ? (charStore.characters.find(c => c.id === id) ?? null) : null
    const squads: [Squad, Squad] = [
      { primary: resolve(build.s[0][0]), secondary: resolve(build.s[0][1]), support: resolve(build.s[0][2]) },
      { primary: resolve(build.s[1][0]), secondary: resolve(build.s[1][1]), support: resolve(build.s[1][2]) },
    ]
    if (!squads.every(sq => sq.primary && sq.secondary && sq.support)) {
      return { valid: false, reason: 'Incomplete' }
    }
    const r0 = isSquadValid(squads[0])
    if (!r0.valid) return r0
    const r1 = isSquadValid(squads[1])
    if (!r1.valid) return r1
    if (hasStrikeForceConflict(squads)) return { valid: false, reason: 'Duplicate units' }
    return { valid: true, reason: '' }
  })
)

function openPicker(squadIdx: 0 | 1, role: keyof Squad) {
  activeSquadIdx.value = squadIdx
  activeRole.value = role
  pickerOpen.value = true
}

function selectUnit(char: Character) {
  if (activeRole.value) {
    sfStore.setUnit(activeSquadIdx.value, activeRole.value, char)
  }
  pickerOpen.value = false
}

function clearUnit(squadIdx: 0 | 1, role: keyof Squad) {
  sfStore.clearUnit(squadIdx, role)
}

function selectMission(mission: Mission) {
  sfStore.setMission(mission)
  missionPickerOpen.value = false
}

const filteredMissions = () => {
  const q = missionQuery.value.toLowerCase()
  if (!q) return missionsStore.missions
  return missionsStore.missions.filter((m) => m.name.toLowerCase().includes(q))
}

function handleSave() {
  sfStore.saveCurrentList()
  saveFeedback.value = 'Saved!'
  setTimeout(() => { saveFeedback.value = '' }, 1500)
}

function handleShare() {
  const s0 = sfStore.squads[0]
  const s1 = sfStore.squads[1]
  const encoded = encodeBuild(
    sfStore.name,
    sfStore.mission?.id ?? null,
    sfStore.premiere,
    [
      [s0.primary?.id ?? 0, s0.secondary?.id ?? 0, s0.support?.id ?? 0],
      [s1.primary?.id ?? 0, s1.secondary?.id ?? 0, s1.support?.id ?? 0],
    ],
  )
  const url = `${window.location.origin}/build?sf=${encoded}`
  navigator.clipboard.writeText(url)
  saveFeedback.value = 'Build link copied!'
  setTimeout(() => { saveFeedback.value = '' }, 2000)
}

function loadList(i: number) {
  sfStore.loadList(i, charStore.characters, missionsStore.missions)
}

function importSharedBuild() {
  if (!pendingSharedBuild.value) return
  sfStore.importLists([pendingSharedBuild.value])
  const newIdx = sfStore.savedLists.length - 1
  sfStore.loadList(newIdx, charStore.characters, missionsStore.missions)
  pendingSharedBuild.value = null
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-sw-gold">Build</h1>

    <!-- Shared build import banner -->
    <div
      v-if="pendingSharedBuild"
      class="rounded-xl border border-sw-blue/40 bg-sw-card/70 p-4 flex items-center justify-between gap-4"
    >
      <p class="text-sm text-sw-text">
        Shared build received: <span class="font-semibold text-sw-gold">{{ pendingSharedBuild.name }}</span>. Import as new list?
      </p>
      <div class="flex gap-2 shrink-0">
        <button
          class="rounded-lg bg-sw-gold/20 px-3 py-1 text-xs font-medium text-sw-gold hover:bg-sw-gold/30"
          @click="importSharedBuild"
        >
          Import
        </button>
        <button
          class="rounded-lg px-3 py-1 text-xs text-sw-text/50 hover:text-sw-text"
          @click="pendingSharedBuild = null"
        >
          Dismiss
        </button>
      </div>
    </div>

    <!-- Saved Lists -->
    <div
      v-if="sfStore.savedLists.length > 0"
      class="rounded-xl border border-sw-gold/20 bg-sw-card/40 p-4 space-y-2"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-sw-text/70">Saved Lists</h3>
        <button
          class="rounded-lg px-2 py-0.5 text-xs text-sw-gold/70 hover:text-sw-gold"
          @click="sfStore.newList()"
        >
          + New
        </button>
      </div>
      <div class="space-y-1">
        <div
          v-for="(list, i) in sfStore.savedLists"
          :key="i"
          class="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
          :class="sfStore.activeIndex === i ? 'bg-sw-gold/10' : 'hover:bg-sw-card'"
        >
          <span class="flex-1 truncate text-sm" :class="sfStore.activeIndex === i ? 'text-sw-gold' : 'text-sw-text'">
            {{ list.name }}
          </span>
          <span
            v-if="charStore.characters.length > 0"
            class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
            :class="savedListLegality[i].valid
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'"
            :title="savedListLegality[i].reason || 'Legal'"
          >
            {{ savedListLegality[i].valid ? '✓ Legal' : '✗ Illegal' }}
          </span>
          <button
            class="rounded px-2 py-0.5 text-xs text-sw-text/50 hover:text-sw-gold"
            @click="loadList(i)"
          >
            Load
          </button>
          <button
            class="rounded px-2 py-0.5 text-xs text-sw-text/50 hover:text-red-400"
            @click="sfStore.deleteList(i)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Save feedback toast -->
    <Transition name="fade">
      <div
        v-if="saveFeedback"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-sw-card border border-sw-gold/30 px-4 py-2 text-sm text-sw-gold shadow-xl"
      >
        {{ saveFeedback }}
      </div>
    </Transition>

    <!-- Strike Force Panel -->
    <StrikeForcePanel
      :name="sfStore.name"
      :mission="sfStore.mission"
      :premiere="sfStore.premiere"
      :is-complete="sfStore.isStrikeForceComplete"
      @update:name="sfStore.setName"
      @update:premiere="sfStore.setPremiere"
      @pick-mission="missionPickerOpen = true"
      @reset="sfStore.resetStrikeForce"
      @save="handleSave"
      @share="handleShare"
    />

    <!-- Squads -->
    <div class="grid gap-4 md:grid-cols-2">
      <SquadSlot
        v-for="(squad, idx) in sfStore.squads"
        :key="idx"
        :squad="squad"
        :squad-index="idx"
        @pick="(role) => openPicker(idx as 0 | 1, role)"
        @clear="(role) => clearUnit(idx as 0 | 1, role)"
      />
    </div>
  </div>

  <!-- Unit Picker Drawer -->
  <UnitPickerDrawer
    :show="pickerOpen"
    :characters="charStore.characters"
    :role="activeRole"
    :excluded-names="pickerExclusions.names"
    :excluded-character-types="pickerExclusions.characterTypes"
    @select="selectUnit"
    @close="pickerOpen = false"
  />

  <!-- Mission Picker Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="missionPickerOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="missionPickerOpen = false"
      >
        <div class="absolute inset-0 bg-black/70" @click="missionPickerOpen = false" />
        <div class="relative z-10 w-full max-w-md rounded-xl border border-sw-gold/30 bg-sw-card p-4 shadow-2xl">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="font-semibold text-sw-gold">Select Mission</h2>
            <button class="text-sw-text/60 hover:text-sw-text" @click="missionPickerOpen = false">✕</button>
          </div>
          <input
            v-model="missionQuery"
            type="text"
            placeholder="Search missions…"
            class="mb-3 w-full rounded-lg border border-sw-gold/30 bg-sw-dark px-3 py-2 text-sw-text placeholder-sw-text/30 focus:border-sw-gold focus:outline-none"
          />
          <div class="max-h-64 overflow-y-auto space-y-1">
            <button
              v-for="m in filteredMissions()"
              :key="m.id"
              class="w-full rounded-lg px-3 py-2 text-left text-sm text-sw-text transition-colors hover:bg-sw-gold/10"
              @click="selectMission(m)"
            >
              {{ m.name }}
              <span class="ml-2 text-xs text-sw-text/40">{{ m.swp }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
