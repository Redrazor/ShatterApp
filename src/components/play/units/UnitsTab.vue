<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Character, CompactBuild } from '../../../types/index.ts'
import { usePlayUnitsStore } from '../../../stores/playUnits.ts'
import UnitRosterCard from './UnitRosterCard.vue'
import UnitSearchPicker from './UnitSearchPicker.vue'
import UnitProfileModal from '../../browse/UnitProfileModal.vue'
import BuildListPicker from './BuildListPicker.vue'
import ForcePool from './ForcePool.vue'

const props = defineProps<{
  characters: Character[]
  savedLists: CompactBuild[]
  squad0Valid: boolean   // active draft squad 0 valid (used only to decide whether to show import button)
  locked: boolean
}>()

const store = usePlayUnitsStore()
const showPicker = ref(false)
const showListPicker = ref(false)
const profileCharacter = ref<Character | null>(null)
const showProfile = ref(false)
const activeTag = ref<string | null>(null)
let tagTimer: ReturnType<typeof setTimeout> | null = null

function onTagPress(tag: string) {
  if (tagTimer) clearTimeout(tagTimer)
  activeTag.value = tag
  tagTimer = setTimeout(() => { activeTag.value = null }, 5000)
}

const excludeIds = computed(() => store.units.map(u => u.id))
const canAdd = computed(() => !props.locked && !store.rosterComplete)

function onListSelected(sq0: Character[], sq1: Character[], sq1Complete: boolean) {
  store.importFromBuild([...sq0, ...sq1], sq1Complete)
  showListPicker.value = false
}

function openProfile(unitId: number) {
  const char = props.characters.find(c => c.id === unitId) ?? null
  if (!char) return
  profileCharacter.value = char
  showProfile.value = true
}
</script>

<template>
  <div class="flex flex-col gap-3">

    <!-- Setup screen: no units and not locked -->
    <template v-if="store.units.length === 0 && !locked">
      <div class="rounded-2xl border border-zinc-700/40 bg-zinc-900/60 px-5 py-8 text-center space-y-4">
        <div class="text-3xl">⚔</div>
        <div>
          <div class="text-sm font-bold text-zinc-300 mb-1">Set up your Strike Team</div>
          <div class="text-xs text-zinc-600">Import from your active build or add units manually.</div>
        </div>
        <div class="flex flex-col gap-2 pt-1">
          <button
            v-if="savedLists.length > 0"
            class="w-full rounded-xl bg-amber-500 px-4 py-3 font-bold text-zinc-900
                   shadow-[0_4px_0_0_rgba(0,0,0,0.4)] transition-all
                   hover:bg-amber-400 active:shadow-[0_1px_0_0_rgba(0,0,0,0.4)] active:translate-y-[3px]"
            @click="showListPicker = true"
          >Import from saved build…</button>

          <div
            v-else
            class="rounded-lg border border-zinc-700/30 bg-zinc-800/40 px-3 py-2.5 text-[11px] text-zinc-600 text-center"
          >
            No saved builds — save a list in the Build view first
          </div>

          <button
            class="w-full rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-3 font-semibold text-zinc-300
                   transition-all hover:border-zinc-500 hover:text-zinc-100 active:scale-[0.98]"
            @click="showPicker = true"
          >+ Add unit manually</button>
        </div>
      </div>
    </template>

    <!-- Roster -->
    <template v-else>
      <!-- Force Pool -->
      <ForcePool />

      <!-- Status bar row -->
      <div class="flex items-center gap-2">
        <div
          v-if="locked"
          class="flex-1 flex items-center gap-2 rounded-lg border border-amber-900/40 bg-amber-950/30 px-3 py-2"
        >
          <span class="text-amber-500 text-sm">🔒</span>
          <span class="text-[11px] font-semibold text-amber-600/80">Roster locked — Reset Game to edit</span>
        </div>
        <div
          v-else-if="store.rosterComplete"
          class="flex-1 flex items-center gap-2 rounded-lg border border-zinc-700/30 bg-zinc-800/30 px-3 py-2"
        >
          <span class="text-zinc-500 text-sm">✓</span>
          <span class="text-[11px] text-zinc-600">Full Strike Force imported</span>
        </div>
        <div v-else class="flex-1" />

        <!-- Clear roster button — always available when units exist -->
        <button
          class="rounded-lg border border-zinc-700/40 bg-zinc-800/60 px-2.5 py-1.5 text-[10px] font-semibold text-zinc-600
                 transition-all hover:border-zinc-500 hover:text-zinc-400 active:scale-95"
          @click="store.clearRoster()"
        >Clear roster</button>
      </div>

      <!-- Unit cards -->
      <UnitRosterCard
        v-for="unit in store.units"
        :key="unit.id"
        :unit="unit"
        :removed="store.isRemoved(unit)"
        :can-remove="canAdd"
        :active-tag="activeTag"
        @tap-damage="(pos) => store.tapDamage(unit.id, pos)"
        @adjust-wounds="(delta) => store.adjustWounds(unit.id, delta)"
        @toggle-condition="(c) => store.toggleCondition(unit.id, c)"
        @set-stance="(s) => store.setStance(unit.id, s)"
        @remove="store.removeUnit(unit.id)"
        @open-profile="openProfile(unit.id)"
        @tag-press="onTagPress"
      />

      <!-- Add unit button -->
      <button
        v-if="canAdd"
        class="w-full rounded-xl border border-dashed border-zinc-700/60 bg-transparent px-4 py-3
               text-sm font-semibold text-zinc-600 transition-all hover:border-zinc-500 hover:text-zinc-400 active:scale-[0.98]"
        @click="showPicker = true"
      >+ Add unit</button>
    </template>

    <!-- Empty locked state -->
    <div
      v-if="store.units.length === 0 && locked"
      class="rounded-2xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-8 text-center text-xs text-zinc-600"
    >
      No units in roster. Reset Game to add units.
    </div>

    <!-- Unit search picker -->
    <UnitSearchPicker
      v-if="showPicker"
      :characters="characters"
      :exclude-ids="excludeIds"
      @add="store.addUnit($event)"
      @close="showPicker = false"
    />

    <!-- Build list picker -->
    <BuildListPicker
      v-if="showListPicker"
      :saved-lists="savedLists"
      :characters="characters"
      @select="onListSelected"
      @close="showListPicker = false"
    />

    <!-- Unit profile modal -->
    <UnitProfileModal
      :character="profileCharacter"
      :show="showProfile"
      @close="showProfile = false"
    />
  </div>
</template>
