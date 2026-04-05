<script setup lang="ts">
import { ref } from 'vue'
import type { StancesData, StanceData, HomebrewUnitType, ExpertiseTables, ExpertiseSection, ExpertiseColor, CombatTree } from '../../../types/index.ts'
import ExpertiseSectionEditor from './ExpertiseSectionEditor.vue'
import CombatTreeEditor from './CombatTreeEditor.vue'
import { useHomebrewStore } from '../../../stores/homebrew.ts'

defineProps<{
  stances: StancesData | null
  unitType: HomebrewUnitType
  which: 1 | 2
  portraitImageData?: string | null
}>()

const emit = defineEmits<{
  updateStance:   [which: 1 | 2, patch: Partial<StanceData>]
  updatePortrait: [offsetX: number, offsetY: number, scale: number]
}>()

const homebrewStore = useHomebrewStore()

// ── Per-instance tab state ─────────────────────────────────────────────────────
type MainTab = 'stats' | 'combat-tree' | 'expertise'
type ExpertiseTab = 'ranged' | 'melee' | 'defense'

const currentTab    = ref<MainTab>('stats')
const currentExpTab = ref<ExpertiseTab>('ranged')

// ── Helpers ────────────────────────────────────────────────────────────────────
function num(val: string): number {
  const n = parseInt(val, 10)
  return isNaN(n) ? 0 : Math.max(0, n)
}

function blankSection(color: ExpertiseColor): ExpertiseSection {
  return {
    color,
    entries: [
      { from: 1, to: 2, isPlus: false, icons: [] },
      { from: 3, to: 3, isPlus: false, icons: [] },
      { from: 4, to: null, isPlus: true, icons: [] },
    ],
  }
}

function blankExpertise(): ExpertiseTables {
  return {
    ranged:  blankSection('blue'),
    melee:   blankSection('red'),
    defense: blankSection('grey'),
  }
}

function onUpdateExpertise(which: 1 | 2, key: keyof ExpertiseTables, section: ExpertiseSection, currentExpertise: ExpertiseTables | null | undefined) {
  const current = currentExpertise ?? blankExpertise()
  emit('updateStance', which, { expertise: { ...current, [key]: section } })
}
</script>

<template>
  <div class="space-y-6">

    <!-- ── Portrait Controls (Stance 1 only, shown only when image uploaded) ─── -->
    <div
      v-if="which === 1 && portraitImageData"
      class="rounded-2xl border border-sw-gold/20 bg-sw-card/60 p-4 space-y-3"
    >
      <p class="text-xs font-bold uppercase tracking-widest text-sw-gold/60">Portrait Position</p>
      <div class="grid grid-cols-3 gap-4">
        <!-- Pan H -->
        <div class="space-y-1">
          <label class="text-[10px] text-sw-text/40 uppercase tracking-wider block">Pan H</label>
          <input
            type="range" min="-50" max="50" step="1"
            :value="Math.round((stances?.portraitOffsetX ?? 0) * 100)"
            class="w-full accent-sw-gold"
            @input="emit('updatePortrait',
              Number(($event.target as HTMLInputElement).value) / 100,
              stances?.portraitOffsetY ?? 0,
              stances?.portraitScale ?? 1)"
          />
        </div>
        <!-- Pan V -->
        <div class="space-y-1">
          <label class="text-[10px] text-sw-text/40 uppercase tracking-wider block">Pan V</label>
          <input
            type="range" min="-50" max="50" step="1"
            :value="Math.round((stances?.portraitOffsetY ?? 0) * 100)"
            class="w-full accent-sw-gold"
            @input="emit('updatePortrait',
              stances?.portraitOffsetX ?? 0,
              Number(($event.target as HTMLInputElement).value) / 100,
              stances?.portraitScale ?? 1)"
          />
        </div>
        <!-- Scale -->
        <div class="space-y-1">
          <label class="text-[10px] text-sw-text/40 uppercase tracking-wider block">Scale</label>
          <input
            type="range" min="100" max="300" step="5"
            :value="Math.round((stances?.portraitScale ?? 1) * 100)"
            class="w-full accent-sw-gold"
            @input="emit('updatePortrait',
              stances?.portraitOffsetX ?? 0,
              stances?.portraitOffsetY ?? 0,
              Number(($event.target as HTMLInputElement).value) / 100)"
          />
        </div>
      </div>
    </div>

    <!-- ── Stance block ──────────────────────────────────────────────────────── -->
    <div class="rounded-2xl border border-sw-gold/20 bg-sw-card/60">

      <!-- Header -->
      <div class="overflow-hidden rounded-t-2xl px-5 pt-4 pb-0">
        <p class="text-xs font-bold uppercase tracking-widest text-sw-gold/60 mb-3">
          {{ which === 1 ? (unitType === 'Primary' ? 'Stance 1' : 'Stance') : 'Stance 2' }}
        </p>

        <!-- Main tab bar -->
        <div class="flex gap-0 border-b border-white/10">
          <button
            v-for="tab in ([
              { key: 'stats',        label: 'Stats' },
              { key: 'combat-tree',  label: 'Combat Tree' },
              { key: 'expertise',    label: 'Expertise' },
            ] as const)"
            :key="tab.key"
            type="button"
            class="px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 -mb-px transition-colors"
            :class="currentTab === tab.key
              ? 'border-sw-gold text-sw-gold'
              : 'border-transparent text-sw-text/40 hover:text-sw-text/70'"
            @click="currentTab = tab.key as MainTab"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Tab content -->
      <div class="p-5 space-y-4">

        <!-- Tab 1: Stats -->
        <template v-if="currentTab === 'stats'">

          <!-- Stance Title -->
          <div class="space-y-1">
            <label class="text-xs text-sw-text/50 uppercase tracking-wider">Stance Title</label>
            <input
              type="text"
              :value="which === 1 ? (stances?.stance1.title ?? '') : (stances?.stance2?.title ?? '')"
              :placeholder="which === 1 ? 'e.g. AGGRESSIVE' : 'e.g. DEFENSIVE'"
              maxlength="28"
              class="w-full rounded-xl bg-sw-dark border border-sw-gold/20 px-4 py-2.5 text-sm text-sw-text placeholder:text-sw-text/25 focus:outline-none focus:border-sw-gold/50 transition-colors"
              @input="emit('updateStance', which, { title: ($event.target as HTMLInputElement).value })"
            />
          </div>

          <!-- Stats row -->
          <div class="grid grid-cols-5 gap-3">
            <div class="space-y-1 text-center">
              <label class="text-[10px] text-sw-text/40 uppercase tracking-wider block">Range</label>
              <input type="number" min="0" max="9"
                :value="which === 1 ? (stances?.stance1.range ?? 0) : (stances?.stance2?.range ?? 0)"
                class="w-full rounded-xl bg-sw-dark border border-sw-gold/20 px-2 py-2.5 text-sm text-sw-text text-center focus:outline-none focus:border-sw-gold/50 transition-colors"
                @change="emit('updateStance', which, { range: num(($event.target as HTMLInputElement).value) })" />
              <p class="text-[9px] text-sw-text/30">0 = dash</p>
            </div>
            <div class="space-y-1 text-center">
              <label class="text-[10px] text-sw-text/40 uppercase tracking-wider block">Rng Atk</label>
              <input type="number" min="0" max="9"
                :value="which === 1 ? (stances?.stance1.rangeAttack ?? 0) : (stances?.stance2?.rangeAttack ?? 0)"
                class="w-full rounded-xl bg-sw-dark border border-sw-gold/20 px-2 py-2.5 text-sm text-sw-text text-center focus:outline-none focus:border-sw-gold/50 transition-colors"
                @change="emit('updateStance', which, { rangeAttack: num(($event.target as HTMLInputElement).value) })" />
              <p class="text-[9px] text-sw-text/30">△ grey</p>
            </div>
            <div class="space-y-1 text-center">
              <label class="text-[10px] text-sw-text/40 uppercase tracking-wider block">Rng Def</label>
              <input type="number" min="0" max="9"
                :value="which === 1 ? (stances?.stance1.rangeDefense ?? 0) : (stances?.stance2?.rangeDefense ?? 0)"
                class="w-full rounded-xl bg-sw-dark border border-sw-gold/20 px-2 py-2.5 text-sm text-sw-text text-center focus:outline-none focus:border-sw-gold/50 transition-colors"
                @change="emit('updateStance', which, { rangeDefense: num(($event.target as HTMLInputElement).value) })" />
              <p class="text-[9px] text-sw-text/30">□ blue</p>
            </div>
            <div class="space-y-1 text-center">
              <label class="text-[10px] text-sw-text/40 uppercase tracking-wider block">Mel Atk</label>
              <input type="number" min="0" max="9"
                :value="which === 1 ? (stances?.stance1.meleeAttack ?? 0) : (stances?.stance2?.meleeAttack ?? 0)"
                class="w-full rounded-xl bg-sw-dark border border-sw-gold/20 px-2 py-2.5 text-sm text-sw-text text-center focus:outline-none focus:border-sw-gold/50 transition-colors"
                @change="emit('updateStance', which, { meleeAttack: num(($event.target as HTMLInputElement).value) })" />
              <p class="text-[9px] text-sw-text/30">△ grey</p>
            </div>
            <div class="space-y-1 text-center">
              <label class="text-[10px] text-sw-text/40 uppercase tracking-wider block">Mel Def</label>
              <input type="number" min="0" max="9"
                :value="which === 1 ? (stances?.stance1.meleeDefense ?? 0) : (stances?.stance2?.meleeDefense ?? 0)"
                class="w-full rounded-xl bg-sw-dark border border-sw-gold/20 px-2 py-2.5 text-sm text-sw-text text-center focus:outline-none focus:border-sw-gold/50 transition-colors"
                @change="emit('updateStance', which, { meleeDefense: num(($event.target as HTMLInputElement).value) })" />
              <p class="text-[9px] text-sw-text/30">□ blue</p>
            </div>
          </div>

          <!-- Weapon labels -->
          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1">
              <label class="text-[10px] text-sw-text/40 uppercase tracking-wider block">Ranged Weapon</label>
              <input type="text"
                :value="which === 1 ? (stances?.stance1.rangedWeapon ?? '') : (stances?.stance2?.rangedWeapon ?? '')"
                placeholder="e.g. Blaster Pistol" maxlength="24"
                class="w-full rounded-xl bg-sw-dark border border-sw-gold/20 px-3 py-2.5 text-sm text-sw-text placeholder:text-sw-text/25 focus:outline-none focus:border-sw-gold/50 transition-colors"
                @input="emit('updateStance', which, { rangedWeapon: ($event.target as HTMLInputElement).value })" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] text-sw-text/40 uppercase tracking-wider block">Melee Weapon</label>
              <input type="text"
                :value="which === 1 ? (stances?.stance1.meleeWeapon ?? '') : (stances?.stance2?.meleeWeapon ?? '')"
                placeholder="e.g. Vibrosword" maxlength="24"
                class="w-full rounded-xl bg-sw-dark border border-sw-gold/20 px-3 py-2.5 text-sm text-sw-text placeholder:text-sw-text/25 focus:outline-none focus:border-sw-gold/50 transition-colors"
                @input="emit('updateStance', which, { meleeWeapon: ($event.target as HTMLInputElement).value })" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] text-sw-text/40 uppercase tracking-wider block">Defensive Equipment</label>
              <input type="text"
                :value="which === 1 ? (stances?.stance1.defensiveEquipment ?? '') : (stances?.stance2?.defensiveEquipment ?? '')"
                placeholder="e.g. Beskar Armor" maxlength="24"
                class="w-full rounded-xl bg-sw-dark border border-sw-gold/20 px-3 py-2.5 text-sm text-sw-text placeholder:text-sw-text/25 focus:outline-none focus:border-sw-gold/50 transition-colors"
                @input="emit('updateStance', which, { defensiveEquipment: ($event.target as HTMLInputElement).value })" />
            </div>
          </div>

        </template>

        <!-- Tab 2: Combat Tree -->
        <template v-else-if="currentTab === 'combat-tree'">
          <CombatTreeEditor
            :tree="which === 1 ? (stances?.stance1.combatTree ?? null) : (stances?.stance2?.combatTree ?? null)"
            :icon-usage="homebrewStore.combatIconUsage"
            @update:tree="emit('updateStance', which, { combatTree: $event as CombatTree })"
          />
        </template>

        <!-- Tab 3: Expertise Tables -->
        <template v-else-if="currentTab === 'expertise'">

          <div class="flex gap-1 bg-sw-dark/60 p-1 rounded-xl">
            <button
              v-for="sub in ([
                { key: 'ranged',  label: 'Ranged' },
                { key: 'melee',   label: 'Melee' },
                { key: 'defense', label: 'Defense' },
              ] as const)"
              :key="sub.key"
              type="button"
              class="flex-1 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
              :class="currentExpTab === sub.key
                ? 'bg-sw-card text-sw-gold shadow-sm'
                : 'text-sw-text/40 hover:text-sw-text/60'"
              @click="currentExpTab = sub.key"
            >
              {{ sub.label }}
            </button>
          </div>

          <template v-if="which === 1">
            <ExpertiseSectionEditor
              v-if="currentExpTab === 'ranged'"
              section-label="Ranged"
              :section="stances?.stance1.expertise?.ranged ?? blankSection('blue')"
              @update="onUpdateExpertise(1, 'ranged', $event, stances?.stance1.expertise)"
            />
            <ExpertiseSectionEditor
              v-else-if="currentExpTab === 'melee'"
              section-label="Melee"
              :section="stances?.stance1.expertise?.melee ?? blankSection('red')"
              @update="onUpdateExpertise(1, 'melee', $event, stances?.stance1.expertise)"
            />
            <ExpertiseSectionEditor
              v-else-if="currentExpTab === 'defense'"
              section-label="Defense"
              :section="stances?.stance1.expertise?.defense ?? blankSection('grey')"
              @update="onUpdateExpertise(1, 'defense', $event, stances?.stance1.expertise)"
            />
          </template>

          <template v-else>
            <ExpertiseSectionEditor
              v-if="currentExpTab === 'ranged'"
              section-label="Ranged"
              :section="stances?.stance2?.expertise?.ranged ?? blankSection('blue')"
              @update="onUpdateExpertise(2, 'ranged', $event, stances?.stance2?.expertise)"
            />
            <ExpertiseSectionEditor
              v-else-if="currentExpTab === 'melee'"
              section-label="Melee"
              :section="stances?.stance2?.expertise?.melee ?? blankSection('red')"
              @update="onUpdateExpertise(2, 'melee', $event, stances?.stance2?.expertise)"
            />
            <ExpertiseSectionEditor
              v-else-if="currentExpTab === 'defense'"
              section-label="Defense"
              :section="stances?.stance2?.expertise?.defense ?? blankSection('grey')"
              @update="onUpdateExpertise(2, 'defense', $event, stances?.stance2?.expertise)"
            />
          </template>

        </template>

      </div>
    </div>

  </div>
</template>
