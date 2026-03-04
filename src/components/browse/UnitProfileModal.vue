<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Character } from '../../types/index.ts'
import { imageUrl, eraIconMap } from '../../utils/imageUrl.ts'
import { useErrataStore } from '../../stores/errata.ts'

const props = defineProps<{ character: Character | null; show: boolean }>()
defineEmits<{ (e: 'close'): void }>()

type CardView = 'card' | 'stance'
const activeView = ref<CardView>('card')
const isFlipped = ref(false)
const isFullscreen = ref(false)

watch(activeView, () => { isFlipped.value = false })
watch(() => props.show, (val) => {
  if (!val) return
  activeView.value = 'card'
  isFlipped.value = false
  isFullscreen.value = false
})

const frontImage = computed((): string => {
  if (!props.character) return ''
  if (activeView.value === 'card')   return imageUrl(props.character.cardFront)
  if (activeView.value === 'stance') return imageUrl(props.character.stance1)
  return ''
})

const backImage = computed((): string => {
  if (!props.character) return ''
  if (activeView.value === 'card')   return imageUrl(props.character.cardBack)
  if (activeView.value === 'stance') return imageUrl(props.character.stance2)
  return ''
})

const hasBack = computed(() => !!backImage.value)

// The image currently visible (respects flip state)
const visibleImage = computed(() =>
  isFlipped.value && backImage.value ? backImage.value : frontImage.value
)

// Abilities (cardBack) and all stance images are landscape — rotate 90° in fullscreen
const needsRotation = computed(() =>
  (activeView.value === 'card' && isFlipped.value) || activeView.value === 'stance'
)


const eras = computed(() =>
  props.character?.era.split(';').map(e => e.trim()).filter(Boolean) ?? []
)

const errataStore = useErrataStore()
errataStore.load()

const artStatus = computed(() =>
  props.character ? errataStore.isCardArtCurrent(props.character.id) : null
)
const errata = computed(() =>
  props.character ? errataStore.getErrata(props.character.id) : []
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show && character"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')" />

        <!-- Modal -->
        <div class="relative z-10 flex w-full max-w-5xl max-h-[95vh] flex-col overflow-hidden rounded-2xl border border-sw-gold/30 bg-sw-card shadow-2xl md:flex-row">

          <!-- Close button (floating) -->
          <button
            class="absolute right-3 top-3 z-30 rounded-full bg-black/50 p-1.5 text-sw-text/60 hover:text-sw-text backdrop-blur-sm transition-colors"
            @click="$emit('close')"
          >✕</button>

          <!-- ── LEFT: Image column ─────────────────────────── -->
          <div class="flex h-[42vh] w-full flex-shrink-0 flex-col bg-sw-dark md:h-auto md:w-[68%]">

            <!-- View tabs -->
            <div class="flex gap-1.5 p-3 pb-1">
              <button
                :class="['rounded-lg px-3 py-1 text-xs font-semibold transition-colors',
                  activeView === 'card' ? 'bg-sw-gold text-sw-dark' : 'bg-white/5 text-sw-text/50 hover:text-sw-text']"
                @click="activeView = 'card'"
              >Card</button>
              <button
                v-if="character.stance1"
                :class="['rounded-lg px-3 py-1 text-xs font-semibold transition-colors',
                  activeView === 'stance' ? 'bg-sw-gold text-sw-dark' : 'bg-white/5 text-sw-text/50 hover:text-sw-text']"
                @click="activeView = 'stance'"
              >Stance</button>
            </div>

            <!-- Card freshness badge -->
            <div v-if="artStatus !== null" class="px-3 pb-1">
              <span v-if="artStatus" class="text-[10px] font-semibold text-green-400">✓ Card Updated</span>
              <span v-else class="text-[10px] font-semibold text-amber-400">⚠ Card Not Updated</span>
            </div>

            <!-- Flip card (fills remaining height) -->
            <div class="relative flex-1 overflow-hidden">
              <div :class="['card-flip-inner', { flipped: isFlipped }]">
                <!-- Front -->
                <div class="card-face">
                  <img
                    v-if="frontImage"
                    :src="frontImage"
                    :alt="`${character.name} ${activeView}`"
                    class="h-full w-full object-contain"
                  />
                  <div v-else class="flex h-full items-center justify-center text-sw-text/10 text-6xl">⚔</div>
                </div>
                <!-- Back -->
                <div class="card-face card-face-back">
                  <img
                    v-if="backImage"
                    :src="backImage"
                    :alt="`${character.name} ${activeView} back`"
                    class="h-full w-full object-contain"
                  />
                  <div v-else class="flex h-full items-center justify-center text-sw-text/10 text-6xl">⚔</div>
                </div>
              </div>

              <!-- Fullscreen zoom button (mobile only) -->
              <button
                class="absolute bottom-2 right-2 z-20 rounded-lg bg-black/60 p-2 text-sw-text/60 hover:text-sw-text backdrop-blur-sm transition-colors md:hidden"
                @click="isFullscreen = true"
              >⛶</button>
            </div>

            <!-- Flip button -->
            <div class="p-3 pt-2">
              <button
                v-if="hasBack"
                class="w-full rounded-lg border border-sw-gold/20 bg-white/5 py-1.5 text-xs text-sw-text/50 hover:border-sw-gold hover:text-sw-text transition-colors"
                @click="isFlipped = !isFlipped"
              >{{ isFlipped ? '↩ Front' : '↪ Flip' }}</button>
            </div>
          </div>

          <!-- ── RIGHT: Stats column ────────────────────────── -->
          <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4 min-w-0 md:gap-5 md:p-6">

            <!-- Name + era + meta -->
            <div class="space-y-2 pr-8">
              <h2 class="text-2xl font-bold leading-tight text-sw-gold">{{ character.name }}</h2>
              <div class="flex items-center gap-2 flex-wrap">
                <img
                  v-for="era in eras"
                  :key="era"
                  :src="eraIconMap[era] ?? ''"
                  :alt="era"
                  :title="era"
                  class="era-icon h-6 w-6"
                />
                <span class="text-xs text-sw-text/50">{{ character.characterType }}</span>
              </div>
              <p class="text-xs text-sw-text/30">{{ character.swp }}</p>
            </div>

            <!-- Type + points -->
            <div class="flex flex-wrap gap-2">
              <div class="flex flex-col items-center rounded-lg border border-sw-gold/20 bg-black/20 px-4 py-2">
                <span class="text-[10px] uppercase tracking-wider text-sw-text/40">Type</span>
                <span class="text-base font-bold text-sw-text">{{ character.unitType }}</span>
              </div>
              <div v-if="character.sp != null" class="flex flex-col items-center rounded-lg border border-sw-gold/20 bg-black/20 px-4 py-2">
                <span class="text-[10px] uppercase tracking-wider text-sw-text/40">SP</span>
                <span class="text-base font-bold text-sw-gold">{{ character.sp }}</span>
              </div>
              <div v-if="character.pc != null" class="flex flex-col items-center rounded-lg border border-sw-gold/20 bg-black/20 px-4 py-2">
                <span class="text-[10px] uppercase tracking-wider text-sw-text/40">PC</span>
                <span class="text-base font-bold text-sw-gold">{{ character.pc }}</span>
              </div>
            </div>

            <!-- Combat stats -->
            <div>
              <p class="mb-2 text-[10px] uppercase tracking-wider text-sw-text/40">Combat Stats</p>
              <div class="flex gap-2">
                <div class="flex flex-col items-center rounded-lg border border-sw-gold/10 bg-black/20 px-4 py-2">
                  <span class="text-[10px] uppercase tracking-wider text-sw-text/40">Dur</span>
                  <span class="text-lg font-bold text-sw-text">{{ character.durability }}</span>
                </div>
                <div class="flex flex-col items-center rounded-lg border border-sw-gold/10 bg-black/20 px-4 py-2">
                  <span class="text-[10px] uppercase tracking-wider text-sw-text/40">Sta</span>
                  <span class="text-lg font-bold text-sw-text">{{ character.stamina }}</span>
                </div>
                <div class="flex flex-col items-center rounded-lg border border-sw-gold/10 bg-black/20 px-4 py-2">
                  <span class="text-[10px] uppercase tracking-wider text-sw-text/40">FP</span>
                  <span class="text-lg font-bold text-sw-text">{{ character.fp }}</span>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="character.tags.length">
              <p class="mb-2 text-[10px] uppercase tracking-wider text-sw-text/40">Tags</p>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="tag in character.tags"
                  :key="tag"
                  class="rounded-full border border-sw-gold/20 px-2 py-0.5 text-xs text-sw-text/70"
                >{{ tag }}</span>
              </div>
            </div>

            <!-- Stances -->
            <div v-if="character.stances.length">
              <p class="mb-2 text-[10px] uppercase tracking-wider text-sw-text/40">Stances</p>
              <ul class="space-y-0.5">
                <li v-for="stance in character.stances" :key="stance" class="text-sm text-sw-text/70">• {{ stance }}</li>
              </ul>
            </div>

            <!-- Balance History -->
            <details class="rounded-xl border border-white/8 bg-black/20 px-4 py-3">
              <summary class="cursor-pointer select-none text-[10px] font-bold uppercase tracking-[0.15em] text-sw-text/40">
                Balance History
              </summary>
              <div v-if="errata.length === 0" class="mt-2 text-xs text-sw-text/30">
                No balance changes recorded.
              </div>
              <div v-else class="mt-3 space-y-3">
                <div v-for="entry in errata" :key="entry.version" class="text-xs">
                  <div class="font-semibold text-sw-text/50">v{{ entry.version }} — {{ entry.date }}</div>
                  <ul class="mt-1 list-disc list-inside text-sw-text/40 space-y-0.5">
                    <li v-for="change in entry.changes" :key="change">{{ change }}</li>
                  </ul>
                </div>
              </div>
            </details>
          </div>
        </div>

        <!-- ── FULLSCREEN OVERLAY (mobile only) ──────────────── -->
        <Transition name="fs">
          <div
            v-if="isFullscreen"
            class="fixed inset-0 z-60 flex items-center justify-center overflow-hidden bg-black md:hidden"
            @click="isFullscreen = false"
          >
            <img
              v-if="visibleImage"
              :src="visibleImage"
              :alt="character.name"
              :class="needsRotation ? 'fs-img-rotated' : 'fs-img'"
            />
            <button
              class="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/70 hover:text-white transition-colors"
              @click.stop="isFullscreen = false"
            >✕</button>
          </div>
        </Transition>
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

.fs-enter-active,
.fs-leave-active {
  transition: opacity 0.15s ease;
}
.fs-enter-from,
.fs-leave-to {
  opacity: 0;
}

/* Era icons: dark symbol → white on dark bg */
.era-icon {
  filter: brightness(0) invert(1);
  opacity: 0.7;
}

/* Flip mechanics — parent is relative flex-1, children fill it absolutely */
.card-flip-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}
.card-flip-inner.flipped {
  transform: rotateY(180deg);
}
.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.card-face-back {
  transform: rotateY(180deg);
}

/* Fullscreen image — portrait card fills screen normally */
.fs-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Fullscreen image — landscape card (abilities / stances) rotated 90° to fill portrait screen */
.fs-img-rotated {
  transform: rotate(90deg);
  width: 100vh;
  height: 100vw;
  max-width: none;
  max-height: none;
  object-fit: contain;
}
</style>
