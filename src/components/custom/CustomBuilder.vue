<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { BuilderPhase, AbilitiesData, StanceData } from '../../types/index.ts'
import { useHomebrewStore } from '../../stores/homebrew.ts'
import { useCharactersStore } from '../../stores/characters.ts'
import CustomPhaseStepper from './CustomPhaseStepper.vue'
import FrontCardForm from './phase1/FrontCardForm.vue'
import FrontCardPreview from './phase1/FrontCardPreview.vue'
import StatsForm from './phase2/StatsForm.vue'
import StatsCardPreview from './phase2/StatsCardPreview.vue'
import AbilitiesForm from './phase3/AbilitiesForm.vue'
import AbilitiesCardPreview from './phase3/AbilitiesCardPreview.vue'
import StancesForm from './phase4/StancesForm.vue'
import StanceCardPreview from './phase4/StanceCardPreview.vue'

const props = defineProps<{
  profileId: string
}>()

const emit = defineEmits<{
  back: []
  saved: []
}>()

const store = useHomebrewStore()
const charactersStore = useCharactersStore()

onMounted(() => {
  charactersStore.load()
  window.addEventListener('scroll', onScroll, { passive: true })
  updateActivePhase()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})

const allKnownTags = computed(() => {
  const officialTags = charactersStore.characters.flatMap(c => c.tags ?? [])
  const homebrewTags = store.allTags(profile.value?.id)
  return [...new Set([...officialTags, ...homebrewTags])].sort()
})

const profile = computed(() => store.profiles.find(p => p.id === props.profileId) ?? null)

// Which phases have been unlocked (revealed) in the stacked layout
const unlockedPhases = ref<BuilderPhase[]>([1])

// Which phase section is currently in focus (scroll-tracked)
const activePhase = ref<BuilderPhase>(1)

const lastUnlockedPhase = computed<BuilderPhase>(() =>
  (unlockedPhases.value[unlockedPhases.value.length - 1] ?? 1) as BuilderPhase
)

const completion = computed(() => ({
  front: profile.value ? store.isFrontCardComplete(profile.value) : false,
  stats: profile.value ? store.isStatsComplete(profile.value) : false,
  abilities: profile.value ? store.isAbilitiesComplete(profile.value) : false,
  stances: profile.value ? store.isStancesComplete(profile.value) : false,
}))

// ── Scroll tracking ──────────────────────────────────────────────────────────

function updateActivePhase() {
  let best: BuilderPhase = unlockedPhases.value[0] as BuilderPhase
  let bestDist = Infinity
  for (const p of unlockedPhases.value) {
    const el = document.getElementById(`phase-section-${p}`)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    const dist = Math.abs(rect.top - 100)
    if (dist < bestDist) {
      bestDist = dist
      best = p
    }
  }
  activePhase.value = best
}

function onScroll() {
  updateActivePhase()
}

// ── Navigation ───────────────────────────────────────────────────────────────

function scrollToPhase(phase: BuilderPhase) {
  activePhase.value = phase
  const el = document.getElementById(`phase-section-${phase}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function unlockPhase(phase: BuilderPhase) {
  if (!unlockedPhases.value.includes(phase)) {
    if (phase === 2 && profile.value && !profile.value.stats) {
      store.updateStats(props.profileId, {})
    }
    if (phase === 3 && profile.value && !profile.value.abilities) {
      store.updateAbilities(props.profileId, { blocks: [] })
    }
    if (phase === 4) {
      store.initStances(props.profileId)
    }
    unlockedPhases.value.push(phase)
  }
  setTimeout(() => scrollToPhase(phase), 50)
}

function handleStepperSelect(phase: BuilderPhase) {
  scrollToPhase(phase)
}

function activateSection(phase: BuilderPhase) {
  activePhase.value = phase
}

// ── Data updates ─────────────────────────────────────────────────────────────

function handleFrontCardUpdate(patch: Parameters<typeof store.updateFrontCard>[1]) {
  store.updateFrontCard(props.profileId, patch)
}

function handleStatsUpdate(patch: Parameters<typeof store.updateStats>[1]) {
  store.updateStats(props.profileId, patch)
}

function handleAbilitiesUpdate(data: AbilitiesData) {
  store.updateAbilities(props.profileId, data)
}

function handleStanceUpdate(which: 1 | 2, patch: Partial<StanceData>) {
  store.updateStance(props.profileId, which, patch)
}

function handlePortraitUpdate(offsetX: number, offsetY: number, scale: number) {
  store.updateStances(props.profileId, { portraitOffsetX: offsetX, portraitOffsetY: offsetY, portraitScale: scale })
}

function handleSave() {
  emit('saved')
}

function handleResetPhase(phase: BuilderPhase) {
  const labelMap: Record<BuilderPhase, string> = {
    1: 'Phase 1 (Front Card)',
    2: 'Phase 2 (Stats)',
    3: 'Phase 3 (Abilities)',
    4: 'Phase 4 (Stances)',
  }
  const label = labelMap[phase]
  if (confirm(`Reset ${label} data?`)) {
    store.resetPhase(props.profileId, phase)
    if (phase === 1) unlockedPhases.value = [1]
  }
}

function handleStartOver() {
  if (confirm('Start over? All phases will be cleared.')) {
    store.resetAll(props.profileId)
    unlockedPhases.value = [1]
    activePhase.value = 1
  }
}
</script>

<template>
  <div v-if="profile" class="space-y-6">

    <!-- Top bar -->
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="flex items-center gap-1 text-sw-text/60 hover:text-sw-gold transition-colors text-sm"
        @click="emit('back')"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <span class="flex-1 text-sw-gold font-semibold truncate">{{ profile.name }}</span>
    </div>

    <!-- Phase stepper (sticky) -->
    <div class="sticky top-0 z-10 bg-sw-bg/95 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-sw-gold/10">
      <CustomPhaseStepper
        :active-phase="activePhase"
        :unlocked-phases="unlockedPhases"
        :completion="completion"
        @select="handleStepperSelect"
      />
    </div>

    <!-- ── Phase 1: Front Card ───────────────────────────────────────────── -->
    <section
      id="phase-section-1"
      class="space-y-4 transition-opacity duration-300"
      :class="activePhase === 1 ? 'opacity-100' : 'opacity-40'"
      @click="activateSection(1)"
      @focusin="activateSection(1)"
    >
      <h2 class="text-xs font-semibold text-sw-text/40 uppercase tracking-wider">Phase 1 — Front Card</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Left: form -->
        <div class="order-2 md:order-1">
          <FrontCardForm
            :front-card="profile.frontCard"
            @update="handleFrontCardUpdate"
          />
        </div>

        <!-- Right: preview -->
        <div class="order-1 md:order-2 md:sticky md:top-16 self-start">
          <p class="text-xs text-sw-text/40 mb-2 text-center">Live Preview</p>
          <div class="w-3/5 mx-auto">
          <FrontCardPreview
            :front-card="profile.frontCard"
            @update:image-data="store.updateFrontCard(profileId, { imageData: $event })"
            @update:image-scale="store.updateFrontCard(profileId, { imageScale: $event })"
            @update:image-offset-x="store.updateFrontCard(profileId, { imageOffsetX: $event })"
            @update:image-offset-y="store.updateFrontCard(profileId, { imageOffsetY: $event })"
          />
          </div>
        </div>
      </div>

      <!-- Phase 1 footer -->
      <div class="flex flex-wrap gap-3 pt-2 border-t border-sw-gold/10">
        <!-- Next → only on the last unlocked phase -->
        <button
          v-if="lastUnlockedPhase === 1"
          type="button"
          class="rounded-xl px-5 py-2.5 text-sm font-semibold bg-sw-gold text-sw-bg hover:opacity-90 transition-opacity"
          @click="unlockPhase(2)"
        >
          Next →
        </button>
        <button
          type="button"
          class="rounded-xl px-4 py-2.5 text-sm font-medium bg-sw-card text-sw-text/70 border border-sw-gold/20 hover:border-sw-gold/50 transition-colors"
          @click="handleResetPhase(1)"
        >
          Reset Phase
        </button>
        <button
          type="button"
          class="rounded-xl px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors ml-auto"
          @click="handleStartOver"
        >
          Start Over
        </button>
      </div>
    </section>

    <!-- ── Phase 2: Stats ────────────────────────────────────────────────── -->
    <section
      v-if="unlockedPhases.includes(2)"
      id="phase-section-2"
      class="space-y-4 pt-4 border-t border-sw-gold/20 transition-opacity duration-300"
      :class="activePhase === 2 ? 'opacity-100' : 'opacity-40'"
      @click="activateSection(2)"
      @focusin="activateSection(2)"
    >
      <h2 class="text-xs font-semibold text-sw-text/40 uppercase tracking-wider">Phase 2 — Stats</h2>

      <!-- Back card preview — centred -->
      <div class="max-w-2xl mx-auto">
        <p class="text-xs text-sw-text/40 mb-2 text-center">Live Preview</p>
        <StatsCardPreview
          :front-card="profile.frontCard"
          :stats="profile.stats"
          @update:image-scale="store.updateStats(profileId, { imageScale: $event })"
          @update:image-offset-x="store.updateStats(profileId, { imageOffsetX: $event })"
          @update:image-offset-y="store.updateStats(profileId, { imageOffsetY: $event })"
        />
      </div>

      <!-- Controls below the card -->
      <div class="max-w-2xl mx-auto">
        <StatsForm
          :stats="profile.stats"
          :all-known-tags="allKnownTags"
          @update="handleStatsUpdate"
        />
      </div>

      <!-- Phase 2 footer -->
      <div class="flex flex-wrap gap-3 pt-2 border-t border-sw-gold/10">
        <!-- Next → only on the last unlocked phase -->
        <button
          v-if="lastUnlockedPhase === 2"
          type="button"
          class="rounded-xl px-5 py-2.5 text-sm font-semibold bg-sw-gold text-sw-bg hover:opacity-90 transition-opacity"
          @click="unlockPhase(3)"
        >
          Next →
        </button>
        <button
          type="button"
          class="rounded-xl px-4 py-2.5 text-sm font-medium bg-sw-card text-sw-text/70 border border-sw-gold/20 hover:border-sw-gold/50 transition-colors"
          @click="handleResetPhase(2)"
        >
          Reset Phase
        </button>
      </div>
    </section>

    <!-- ── Phase 3: Abilities ────────────────────────────────────────────── -->
    <section
      v-if="unlockedPhases.includes(3)"
      id="phase-section-3"
      class="space-y-4 pt-4 border-t border-sw-gold/20 transition-opacity duration-300"
      :class="activePhase === 3 ? 'opacity-100' : 'opacity-40'"
      @click="activateSection(3)"
      @focusin="activateSection(3)"
    >
      <h2 class="text-xs font-semibold text-sw-text/40 uppercase tracking-wider">Phase 3 — Abilities</h2>

      <!-- Top: options form -->
      <AbilitiesForm
        :abilities="profile.abilities"
        @update="handleAbilitiesUpdate"
      />

      <!-- Bottom: card preview -->
      <div class="max-w-2xl mx-auto">
        <p class="text-xs text-sw-text/40 mb-2 text-center">Live Preview</p>
        <AbilitiesCardPreview
          :front-card="profile.frontCard"
          :stats="profile.stats"
          :abilities="profile.abilities"
        />
      </div>

      <!-- Phase 3 footer -->
      <div class="flex flex-wrap gap-3 pt-2 border-t border-sw-gold/10">
        <button
          v-if="lastUnlockedPhase === 3"
          type="button"
          class="rounded-xl px-5 py-2.5 text-sm font-semibold bg-sw-gold text-sw-bg hover:opacity-90 transition-opacity"
          @click="unlockPhase(4)"
        >
          Next →
        </button>
        <button
          type="button"
          class="rounded-xl px-4 py-2.5 text-sm font-medium bg-sw-card text-sw-text/70 border border-sw-gold/20 hover:border-sw-gold/50 transition-colors"
          @click="handleResetPhase(3)"
        >
          Reset Phase
        </button>
      </div>
    </section>

    <!-- ── Phase 4: Stances ─────────────────────────────────────────────── -->
    <section
      v-if="unlockedPhases.includes(4)"
      id="phase-section-4"
      class="space-y-4 pt-4 border-t border-sw-gold/20 transition-opacity duration-300"
      :class="activePhase === 4 ? 'opacity-100' : 'opacity-40'"
      @click="activateSection(4)"
      @focusin="activateSection(4)"
    >
      <h2 class="text-xs font-semibold text-sw-text/40 uppercase tracking-wider">Phase 4 — Stances</h2>

      <p class="text-[11px] text-sw-text/40">
        {{ profile.frontCard?.unitType === 'Primary' ? '2 stances (Primary unit)' : '1 stance (Secondary / Support unit)' }}
      </p>

      <!-- Stance 1 -->
      <div :class="profile.frontCard?.unitType === 'Primary' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'max-w-2xl mx-auto'">
        <div class="space-y-4">
          <StancesForm
            :stances="profile.stances"
            :unit-type="profile.frontCard?.unitType ?? 'Primary'"
            :portrait-image-data="profile.frontCard?.imageData ?? null"
            @update-stance="handleStanceUpdate"
            @update-portrait="handlePortraitUpdate"
          />
        </div>

        <!-- Live previews -->
        <div class="space-y-4">
          <StanceCardPreview
            :stance-data="profile.stances?.stance1 ?? null"
            :label="profile.frontCard?.unitType === 'Primary' ? 'Stance 1 Preview' : 'Stance Preview'"
            :portrait-image-data="profile.frontCard?.imageData ?? null"
            :portrait-offset-x="profile.stances?.portraitOffsetX ?? 0"
            :portrait-offset-y="profile.stances?.portraitOffsetY ?? 0"
            :portrait-scale="profile.stances?.portraitScale ?? 1"
          />
          <StanceCardPreview
            v-if="profile.frontCard?.unitType === 'Primary'"
            :stance-data="profile.stances?.stance2 ?? null"
            label="Stance 2 Preview"
            :portrait-image-data="profile.frontCard?.imageData ?? null"
            :portrait-offset-x="profile.stances?.portraitOffsetX ?? 0"
            :portrait-offset-y="profile.stances?.portraitOffsetY ?? 0"
            :portrait-scale="profile.stances?.portraitScale ?? 1"
          />
        </div>
      </div>

      <!-- Phase 4 footer -->
      <div class="flex flex-wrap gap-3 pt-2 border-t border-sw-gold/10">
        <button
          v-if="lastUnlockedPhase === 4"
          type="button"
          class="rounded-xl px-5 py-2.5 text-sm font-semibold bg-sw-gold text-sw-bg hover:opacity-90 transition-opacity"
          @click="handleSave"
        >
          Save
        </button>
        <button
          type="button"
          class="rounded-xl px-4 py-2.5 text-sm font-medium bg-sw-card text-sw-text/70 border border-sw-gold/20 hover:border-sw-gold/50 transition-colors"
          @click="handleResetPhase(4)"
        >
          Reset Phase
        </button>
      </div>
    </section>

  </div>

  <div v-else class="text-sw-text/40 text-sm text-center py-8">
    Profile not found.
  </div>
</template>
