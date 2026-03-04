<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCharactersStore } from '../../stores/characters.ts'
import { useErrataStore } from '../../stores/errata.ts'
import KeywordChip from '../ui/KeywordChip.vue'
import { imageUrl, eraIconMap } from '../../utils/imageUrl.ts'

const route  = useRoute()
const router = useRouter()
const store  = useCharactersStore()
const errataStore = useErrataStore()

onMounted(() => {
  if (!store.characters.length) store.load()
  errataStore.load()
})

const character = computed(() =>
  store.characters.find(c => c.id === Number(route.params.id)) ?? null
)

function close() { router.push('/browse') }

function goToTag(tag: string) {
  router.push({ path: '/browse', query: { tag } })
}

// ── Card flip / view state ────────────────────────────────
type CardView = 'card' | 'stance'
const activeView   = ref<CardView>('card')
const isFlipped    = ref(false)
const isFullscreen = ref(false)

watch(() => route.params.id, () => {
  activeView.value   = 'card'
  isFlipped.value    = false
  isFullscreen.value = false
})
watch(activeView, () => { isFlipped.value = false })

const frontImage = computed((): string => {
  if (!character.value) return ''
  if (activeView.value === 'card')   return imageUrl(character.value.cardFront)
  if (activeView.value === 'stance') return imageUrl(character.value.stance1)
  return ''
})
const backImage = computed((): string => {
  if (!character.value) return ''
  if (activeView.value === 'card')   return imageUrl(character.value.cardBack)
  if (activeView.value === 'stance') return imageUrl(character.value.stance2)
  return ''
})
const hasBack       = computed(() => !!backImage.value)
const visibleImage  = computed(() => isFlipped.value && backImage.value ? backImage.value : frontImage.value)
const needsRotation = computed(() =>
  (activeView.value === 'card' && isFlipped.value) || activeView.value === 'stance'
)

// ── Related units ────────────────────────────────────────
const related = computed(() =>
  store.characters.filter(
    c => c.swpCode && c.swpCode === character.value?.swpCode && c.id !== character.value?.id
  )
)

// ── Era icons ─────────────────────────────────────────────
const eras = computed(() =>
  character.value?.era.split(';').map(e => e.trim()).filter(Boolean) ?? []
)

// ── Errata ────────────────────────────────────────────────
const artStatus = computed(() =>
  character.value ? errataStore.isCardArtCurrent(character.value.id) : true
)
const errata = computed(() =>
  character.value ? errataStore.getErrata(character.value.id) : []
)
</script>

<template>
  <!-- Panel: full screen on mobile, left drawer on desktop -->
  <div class="panel fixed inset-0 z-50 flex flex-col bg-sw-card shadow-2xl
    md:inset-y-0 md:left-0 md:right-auto md:w-[min(100vw,680px)]
    md:rounded-r-2xl md:border-r md:border-sw-gold/20">

    <div v-if="!character" class="flex flex-1 items-center justify-center text-sw-text/40">
      Loading…
    </div>

    <template v-else>

      <!-- ── IMAGE SECTION (full width) ───────────────────── -->
      <div class="flex h-[42vh] w-full flex-shrink-0 flex-col bg-sw-dark
        md:h-[56vh] md:rounded-tr-2xl">

        <!-- Tab bar -->
        <div class="flex items-center gap-2 p-3 pb-1">
          <!-- Back — mobile -->
          <button
            class="mr-1 rounded-lg bg-white/5 px-2 py-1 text-sm text-sw-text/60 hover:text-sw-text md:hidden"
            @click="close"
          >← Back</button>

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

          <div class="flex-1" />

          <!-- Close — desktop -->
          <button
            class="hidden rounded-full bg-black/40 p-1.5 text-sw-text/60 hover:text-sw-text transition-colors md:flex"
            @click="close"
          >✕</button>
        </div>

        <!-- Card freshness badge -->
        <div class="px-3 pb-1">
          <span v-if="artStatus" class="text-[10px] font-semibold text-green-400">✓ Card Updated</span>
          <span v-else class="text-[10px] font-semibold text-amber-400">⚠ Card Not Updated</span>
        </div>

        <!-- Flip card -->
        <div class="relative flex-1 overflow-hidden">
          <div :class="['card-flip-inner', { flipped: isFlipped }]">
            <div class="card-face">
              <img v-if="frontImage" :src="frontImage" :alt="`${character.name} ${activeView}`"
                class="h-full w-full object-contain" />
              <div v-else class="flex h-full items-center justify-center text-6xl text-sw-text/10">⚔</div>
            </div>
            <div class="card-face card-face-back">
              <img v-if="backImage" :src="backImage" :alt="`${character.name} ${activeView} back`"
                class="h-full w-full object-contain" />
              <div v-else class="flex h-full items-center justify-center text-6xl text-sw-text/10">⚔</div>
            </div>
          </div>

          <!-- Fullscreen zoom (mobile only) -->
          <button
            class="absolute bottom-2 right-2 z-20 rounded-lg bg-black/60 p-2 text-sw-text/60
              backdrop-blur-sm transition-colors hover:text-sw-text md:hidden"
            @click="isFullscreen = true"
          >⛶</button>
        </div>

        <!-- Flip button -->
        <div class="p-3 pt-2">
          <button
            v-if="hasBack"
            class="w-full rounded-lg border border-sw-gold/20 bg-white/5 py-1.5 text-xs
              text-sw-text/50 transition-colors hover:border-sw-gold hover:text-sw-text"
            @click="isFlipped = !isFlipped"
          >{{ isFlipped ? '↩ Front' : '↪ Flip' }}</button>
        </div>
      </div>

      <!-- ── STATS SECTION (below image, scrollable) ───────── -->
      <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">

        <!-- Name + era -->
        <div class="space-y-2">
          <h2 class="text-2xl font-bold leading-tight text-sw-gold">{{ character.name }}</h2>
          <div class="flex flex-wrap items-center gap-2">
            <img v-for="era in eras" :key="era"
              :src="eraIconMap[era] ?? ''" :alt="era" :title="era"
              class="era-icon h-6 w-6" />
            <span class="text-xs text-sw-text/50">{{ character.characterType }}</span>
          </div>
          <p class="text-xs text-sw-text/30">{{ character.swp }}</p>
        </div>

        <!-- Type + points -->
        <div class="flex flex-wrap gap-2">
          <div class="stat-box">
            <span class="stat-label">Type</span>
            <span class="text-base font-bold text-sw-text">{{ character.unitType }}</span>
          </div>
          <div v-if="character.sp != null" class="stat-box">
            <span class="stat-label">SP</span>
            <span class="text-base font-bold text-sw-gold">{{ character.sp }}</span>
          </div>
          <div v-if="character.pc != null" class="stat-box">
            <span class="stat-label">PC</span>
            <span class="text-base font-bold text-sw-gold">{{ character.pc }}</span>
          </div>
        </div>

        <!-- Combat stats -->
        <div>
          <p class="stat-label mb-2">Combat Stats</p>
          <div class="flex gap-2">
            <div class="stat-box">
              <span class="stat-label">Dur</span>
              <span class="text-lg font-bold text-sw-text">{{ character.durability }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Sta</span>
              <span class="text-lg font-bold text-sw-text">{{ character.stamina }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">FP</span>
              <span class="text-lg font-bold text-sw-text">{{ character.fp }}</span>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="character.tags.length">
          <p class="stat-label mb-2">Tags</p>
          <div class="flex flex-wrap gap-1">
            <KeywordChip
              v-for="tag in character.tags"
              :key="tag"
              :tag="tag"
              variant="profile"
              @navigate="goToTag"
            />
          </div>
        </div>

        <!-- Related units (same pack) -->
        <div v-if="related.length">
          <p class="stat-label mb-2">In the same pack</p>
          <div class="flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="rel in related"
              :key="rel.id"
              class="flex-shrink-0 flex flex-col items-center gap-1 rounded-lg border border-sw-gold/20 bg-sw-dark/60 p-2 hover:border-sw-gold transition-colors w-20"
              @click="router.push(`/browse/${rel.id}`)"
            >
              <img
                v-if="rel.thumbnail"
                :src="rel.thumbnail"
                :alt="rel.name"
                class="h-14 w-14 rounded object-contain"
              />
              <div v-else class="h-14 w-14 flex items-center justify-center text-2xl text-sw-text/20">⚔</div>
              <span class="text-[9px] text-sw-text/60 text-center leading-tight line-clamp-2">{{ rel.name }}</span>
            </button>
          </div>
        </div>

        <!-- Stances -->
        <div v-if="character.stances.length">
          <p class="stat-label mb-2">Stances</p>
          <ul class="space-y-0.5">
            <li v-for="stance in character.stances" :key="stance" class="text-sm text-sw-text/70">
              • {{ stance }}
            </li>
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

    </template>
  </div>

  <!-- Fullscreen overlay (mobile only) -->
  <Teleport to="body">
    <Transition name="fs">
      <div v-if="isFullscreen"
        class="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-black md:hidden"
        @click="isFullscreen = false">
        <img v-if="visibleImage" :src="visibleImage" :alt="character?.name"
          :class="needsRotation ? 'fs-img-rotated md:fs-img' : 'fs-img'" />
        <button
          class="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:text-white"
          @click.stop="isFullscreen = false">✕</button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 0.5rem;
  border: 1px solid rgb(255 255 255 / 0.08);
  background: rgb(0 0 0 / 0.2);
  padding: 0.5rem 1rem;
}
.stat-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgb(255 255 255 / 0.4);
}
.era-icon {
  filter: brightness(0) invert(1);
  opacity: 0.7;
}

/* Flip */
.card-flip-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}
.card-flip-inner.flipped { transform: rotateY(180deg); }
.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.card-face-back { transform: rotateY(180deg); }

/* Fullscreen */
.fs-img { max-width: 100%; max-height: 100%; object-fit: contain; }
.fs-img-rotated {
  transform: rotate(90deg);
  width: 100vh; height: 100vw;
  max-width: none; max-height: none;
  object-fit: contain;
}
.fs-enter-active, .fs-leave-active { transition: opacity 0.15s ease; }
.fs-enter-from, .fs-leave-to { opacity: 0; }
</style>
