<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { toPng } from 'html-to-image'
import type { HomebrewProfile, HomebrewFaction } from '../../types/index.ts'
import { useCardCanvas, CANVAS_W, CANVAS_H } from '../../composables/useCardCanvas.ts'
import { useAbilitiesCanvas } from '../../composables/useAbilitiesCanvas.ts'
import { useStanceCanvas, STANCE_CANVAS_W, STANCE_CANVAS_H, PORTRAIT_CX, PORTRAIT_CY, PORTRAIT_R } from '../../composables/useStanceCanvas.ts'
import type { PortraitOptions } from '../../composables/useStanceCanvas.ts'
import { BACK_CANVAS_W, BACK_CANVAS_H } from '../../composables/useStatsCanvas.ts'
import { generateOrderCard } from '../../utils/generateOrderCard.ts'

const props = defineProps<{
  profile: HomebrewProfile
  faction: HomebrewFaction
}>()

const emit = defineEmits<{
  close: []
  pdf: [cards: CardImages]
  publish: [cards: CardImages]
}>()

export interface CardImages {
  front: string
  abilities: string
  stance1: string
  stance2: string | null
  orderFront: string
  orderBack: string
  thumbnail: string
}

const frontCanvasRef = ref<HTMLCanvasElement | null>(null)
const abilitiesCanvasRef = ref<HTMLCanvasElement | null>(null)
const stance1CanvasRef = ref<HTMLCanvasElement | null>(null)
const stance2CanvasRef = ref<HTMLCanvasElement | null>(null)

const frontCardRef = computed(() => props.profile.frontCard)
const statsRef = computed(() => props.profile.stats)
const abilitiesRef = computed(() => props.profile.abilities)
const factionRef = computed(() => props.faction)

const stance1Ref = computed(() => props.profile.stances?.stance1 ?? null)
const stance2Ref = computed(() => props.profile.stances?.stance2 ?? null)
const portraitRef = computed<PortraitOptions | null>(() => {
  const s = props.profile.stances
  if (!s) return null
  return {
    imageData: props.profile.frontCard?.imageData ?? null,
    offsetX: s.portraitOffsetX,
    offsetY: s.portraitOffsetY,
    scale: s.portraitScale,
  }
})
const unitNameRef = computed(() => props.profile.frontCard?.name ?? '')
const unitTitleRef = computed(() => props.profile.frontCard?.title ?? '')

const isPrimary = computed(() => props.profile.frontCard?.unitType === 'Primary')

// Canvas composables
const { toDataURL: frontToDataURL, readyPromise: frontReady } = useCardCanvas(frontCanvasRef, frontCardRef, factionRef)
const { toDataURL: abilitiesToDataURL, readyPromise: abilitiesReady } = useAbilitiesCanvas(abilitiesCanvasRef, frontCardRef, statsRef, abilitiesRef, factionRef)
const { toDataURL: stance1ToDataURL, readyPromise: stance1Ready } = useStanceCanvas(stance1CanvasRef, stance1Ref, factionRef, portraitRef, unitNameRef, unitTitleRef)
const { toDataURL: stance2ToDataURL, readyPromise: stance2Ready } = useStanceCanvas(stance2CanvasRef, stance2Ref, factionRef, portraitRef, unitNameRef, unitTitleRef)

// Captured card images
const cardImages = ref<CardImages | null>(null)
const capturing = ref(true)
const downloading = ref(false)
const captureRef = ref<HTMLElement | null>(null)

const hasTactic = computed(() =>
  props.profile.abilities?.blocks.some(b => b.iconType === 'tactic') ?? false,
)

function extractPortraitThumbnail(canvas: HTMLCanvasElement | null): string {
  if (!canvas) return ''
  const diameter = PORTRAIT_R * 2
  const size = diameter * 4  // 320px — high-res enough for browse thumbnails
  const out = document.createElement('canvas')
  out.width = size
  out.height = size
  const ctx = out.getContext('2d')!
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(
    canvas,
    PORTRAIT_CX - PORTRAIT_R, PORTRAIT_CY - PORTRAIT_R,  // source crop
    diameter, diameter,
    0, 0, size, size,                                      // dest fill
  )
  return out.toDataURL('image/png')
}

async function captureCards() {
  // Wait for all canvases to complete their first full render (fonts + icons painted)
  await nextTick()
  await Promise.all([
    frontReady,
    abilitiesReady,
    stance1Ready,
    isPrimary.value ? stance2Ready : Promise.resolve(),
  ])

  const front = frontToDataURL('image/jpeg')
  const abilities = abilitiesToDataURL('image/jpeg')
  const stance1 = stance1ToDataURL('image/jpeg')
  const stance2 = isPrimary.value ? stance2ToDataURL('image/jpeg') : null
  const thumbnail = extractPortraitThumbnail(stance1CanvasRef.value)

  const orderFront = await generateOrderCard(
    props.profile.frontCard?.imageData ?? '',
    hasTactic.value,
  )
  const orderBack = '/images/order-deck-back.png'

  cardImages.value = { front, abilities, stance1, stance2, orderFront, orderBack, thumbnail }
  capturing.value = false
}

onMounted(() => {
  captureCards()
})

async function downloadPng() {
  if (!captureRef.value) return
  downloading.value = true
  try {
    const dataUrl = await toPng(captureRef.value, {
      backgroundColor: '#111318',
      pixelRatio: 2,
    })
    const link = document.createElement('a')
    link.download = `${props.profile.name || 'custom-profile'}.png`
    link.href = dataUrl
    link.click()
  } finally {
    downloading.value = false
  }
}

function handlePrint() {
  const pageStyle = document.createElement('style')
  pageStyle.textContent = '@page { size: A4 landscape; margin: 10mm; }'
  document.head.appendChild(pageStyle)

  const cleanup = () => {
    document.body.classList.remove('custom-card-print')
    document.head.removeChild(pageStyle)
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  document.body.classList.add('custom-card-print')
  window.print()
}

function handlePdf() {
  if (cardImages.value) emit('pdf', cardImages.value)
}

function handlePublish() {
  if (cardImages.value) emit('publish', cardImages.value)
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-4xl rounded-xl border border-sw-gold/30 bg-sw-card shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-3 border-b border-sw-gold/15">
        <h3 class="text-base font-bold text-sw-gold">{{ profile.name }} — Full Profile</h3>
        <button class="text-sw-text/40 hover:text-sw-text/80 text-lg leading-none" @click="emit('close')">&#x2715;</button>
      </div>

      <!-- Hidden offscreen canvases for rendering -->
      <div class="absolute -left-[9999px] top-0 pointer-events-none">
        <canvas ref="frontCanvasRef" :width="CANVAS_W" :height="CANVAS_H" />
        <canvas ref="abilitiesCanvasRef" :width="BACK_CANVAS_W" :height="BACK_CANVAS_H" />
        <canvas ref="stance1CanvasRef" :width="STANCE_CANVAS_W" :height="STANCE_CANVAS_H" />
        <canvas v-if="isPrimary" ref="stance2CanvasRef" :width="STANCE_CANVAS_W" :height="STANCE_CANVAS_H" />
      </div>

      <!-- Loading state -->
      <div v-if="capturing" class="flex items-center justify-center py-16">
        <div class="text-sw-text/50 text-sm">Rendering cards...</div>
      </div>

      <!-- Card layout -->
      <div v-else-if="cardImages" class="p-4 space-y-4">
        <div ref="captureRef" class="bg-[#111318] p-4 rounded-lg space-y-3">
          <!-- Top row: Front + Abilities -->
          <div class="flex gap-3 justify-center items-start">
            <img
              :src="cardImages.front"
              alt="Front card"
              class="rounded shadow-lg"
              :style="{ width: '240px', height: '360px', objectFit: 'cover' }"
            />
            <img
              :src="cardImages.abilities"
              alt="Abilities card"
              class="rounded shadow-lg"
              :style="{ width: '360px', height: '240px', objectFit: 'cover' }"
            />
          </div>

          <!-- Bottom row: Stance(s) -->
          <div class="flex gap-3 justify-center items-start">
            <img
              :src="cardImages.stance1"
              alt="Stance 1"
              class="rounded shadow-lg"
              :style="{ width: '360px', height: '207px', objectFit: 'cover' }"
            />
            <img
              v-if="cardImages.stance2"
              :src="cardImages.stance2"
              alt="Stance 2"
              class="rounded shadow-lg"
              :style="{ width: '360px', height: '207px', objectFit: 'cover' }"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-2 justify-center pb-2">
          <button
            class="rounded-lg px-4 py-2 text-sm font-semibold bg-sw-gold/10 text-sw-gold hover:bg-sw-gold/20 transition-colors"
            :disabled="downloading"
            @click="downloadPng"
          >
            {{ downloading ? 'Downloading...' : 'Download PNG' }}
          </button>
          <button
            class="rounded-lg px-4 py-2 text-sm font-semibold bg-sw-gold/10 text-sw-gold hover:bg-sw-gold/20 transition-colors"
            @click="handlePrint"
          >
            Print
          </button>
          <button
            class="rounded-lg px-4 py-2 text-sm font-semibold bg-sw-gold/10 text-sw-gold hover:bg-sw-gold/20 transition-colors"
            @click="handlePdf"
          >
            Download PDF
          </button>
          <button
            class="rounded-lg px-4 py-2 text-sm font-semibold bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30 transition-colors"
            @click="handlePublish"
          >
            Publish to Browse &amp; Build
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Teleported to <body> so #app can be hidden at print time without affecting this layout -->
  <Teleport v-if="cardImages" to="body">
    <div class="modal-print-layout">
      <div class="modal-print-page">
        <img :src="cardImages.front" alt="Front card" class="modal-print-card-front" />
        <img :src="cardImages.abilities" alt="Abilities card" class="modal-print-card-abilities" />
      </div>
      <div class="modal-print-page modal-print-page-2 modal-print-stances">
        <img :src="cardImages.stance1" alt="Stance 1" class="modal-print-card-stance" />
        <img v-if="cardImages.stance2" :src="cardImages.stance2" alt="Stance 2" class="modal-print-card-stance" />
      </div>
      <div class="modal-print-page modal-print-page-3">
        <img :src="cardImages.orderFront" alt="Order card front" class="modal-print-card-order-front" />
        <img :src="cardImages.orderBack" alt="Order card back" class="modal-print-card-order-back" />
      </div>
    </div>
  </Teleport>
</template>

<style>
.modal-print-layout {
  display: none;
}

@media print {
  /* Only apply custom-card print rules when triggered from this modal */
  body.custom-card-print {
    /* Force landscape A4 */
    /* @page cannot be nested, so it's handled via a separate scoped rule below */
  }

  body.custom-card-print #app {
    display: none !important;
  }

  body.custom-card-print .modal-print-layout {
    display: block !important;
    background: white;
  }

  body.custom-card-print .modal-print-page {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8mm;
    padding: 0;
    width: 100%;
    box-sizing: border-box;
  }

  body.custom-card-print .modal-print-page-2,
  body.custom-card-print .modal-print-page-3 {
    page-break-before: always;
    break-before: page;
  }

  body.custom-card-print .modal-print-stances {
    flex-direction: column;
    gap: 6mm;
  }

  /* Front card: portrait 100×153mm */
  body.custom-card-print .modal-print-card-front     { width: 100mm; height: 153mm; }
  /* Abilities card: landscape — same physical card, rotated (153×100mm) */
  body.custom-card-print .modal-print-card-abilities { width: 153mm; height: 100mm; }
  /* Stance cards: landscape 118×70mm */
  body.custom-card-print .modal-print-card-stance    { width: 118mm; height: 70mm;  }
  /* Order cards: portrait 70×118mm */
  body.custom-card-print .modal-print-card-order-front { width: 70mm; height: 118mm; }
  body.custom-card-print .modal-print-card-order-back  { width: 70mm; height: 118mm; }
}
</style>
