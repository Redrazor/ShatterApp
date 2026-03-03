<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStrikeForceStore } from '../stores/strikeForce.ts'
import { useCharactersStore } from '../stores/characters.ts'
import { useMissionsStore } from '../stores/missions.ts'
import type { Squad, Character, Mission } from '../types/index.ts'
import StrikeForcePanel from '../components/build/StrikeForcePanel.vue'
import SquadSlot from '../components/build/SquadSlot.vue'
import UnitPickerDrawer from '../components/build/UnitPickerDrawer.vue'

const sfStore = useStrikeForceStore()
const charStore = useCharactersStore()
const missionsStore = useMissionsStore()

onMounted(() => {
  charStore.load()
  missionsStore.load()
})

// Picker state
const pickerOpen = ref(false)
const activeSquadIdx = ref<0 | 1>(0)
const activeRole = ref<keyof Squad | null>(null)

// Mission picker state
const missionPickerOpen = ref(false)
const missionQuery = ref('')

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
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-sw-gold">Build</h1>

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
</style>
