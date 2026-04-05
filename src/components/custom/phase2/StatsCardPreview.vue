<script setup lang="ts">
import { ref, toRef, computed, onMounted, onUnmounted } from 'vue'
import type { FrontCardData, StatsData, HomebrewFaction } from '../../../types/index.ts'
import { useStatsCanvas, BACK_CANVAS_W, BACK_CANVAS_H } from '../../../composables/useStatsCanvas.ts'

const props = defineProps<{
  frontCard: FrontCardData | null
  stats: StatsData | null
  faction: HomebrewFaction
}>()

const emit = defineEmits<{
  'update:imageScale': [value: number]
  'update:imageOffsetX': [value: number]
  'update:imageOffsetY': [value: number]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const factionRef = computed(() => props.faction)

const { fontReady } = useStatsCanvas(
  canvasRef,
  toRef(props, 'frontCard'),
  toRef(props, 'stats'),
  factionRef,
)

let isPanning = false
let lastX = 0
let lastY = 0

function onPointerDown(e: PointerEvent) {
  if (!props.frontCard?.imageData) return
  isPanning = true
  lastX = e.clientX
  lastY = e.clientY
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!isPanning || !props.frontCard?.imageData || !props.stats) return
  const canvas = canvasRef.value
  if (!canvas) return
  const dx = (e.clientX - lastX) / canvas.offsetWidth
  const dy = (e.clientY - lastY) / canvas.offsetHeight
  lastX = e.clientX
  lastY = e.clientY
  emit('update:imageOffsetX', clamp((props.stats.imageOffsetX ?? 0) + dx, -0.5, 0.5))
  emit('update:imageOffsetY', clamp((props.stats.imageOffsetY ?? 0) + dy, -0.5, 0.5))
}

function onPointerUp(e: PointerEvent) {
  ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  isPanning = false
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  if (!props.stats) return
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  emit('update:imageScale', clamp((props.stats.imageScale ?? 1) + delta, 0.1, 5))
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

onMounted(() => {
  canvasRef.value?.addEventListener('wheel', onWheel, { passive: false })
})
onUnmounted(() => {
  canvasRef.value?.removeEventListener('wheel', onWheel)
})
</script>

<template>
  <!-- 3:2 landscape aspect ratio wrapper -->
  <div class="w-full" :style="`aspect-ratio: ${BACK_CANVAS_W} / ${BACK_CANVAS_H}`">
    <div class="relative w-full h-full">
      <canvas
        ref="canvasRef"
        :width="BACK_CANVAS_W"
        :height="BACK_CANVAS_H"
        class="absolute inset-0 w-full h-full rounded-xl shadow-lg select-none"
        :class="[
          { 'opacity-80': !fontReady },
          frontCard?.imageData ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        ]"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
      />
    </div>
  </div>

  <!-- Image size slider — only shown when image exists -->
  <div v-if="stats && frontCard?.imageData" class="mt-2 space-y-1">
    <div class="flex items-center gap-2">
      <span class="text-xs text-sw-text/50 w-8">Size</span>
      <input
        type="range"
        min="0.1"
        max="5"
        step="0.05"
        :value="stats.imageScale"
        class="flex-1 accent-sw-gold"
        @input="emit('update:imageScale', parseFloat(($event.target as HTMLInputElement).value))"
      />
      <span class="text-xs text-sw-text/50 w-8 text-right">{{ stats.imageScale.toFixed(1) }}×</span>
    </div>
  </div>
</template>
