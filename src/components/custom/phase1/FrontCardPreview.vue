<script setup lang="ts">
import { ref, toRef, onMounted, onUnmounted } from 'vue'
import type { FrontCardData } from '../../../types/index.ts'
import { useCardCanvas, CANVAS_W, CANVAS_H } from '../../../composables/useCardCanvas.ts'

const props = defineProps<{
  frontCard: FrontCardData | null
}>()

const emit = defineEmits<{
  'update:imageData': [value: string | null]
  'update:imageScale': [value: number]
  'update:imageOffsetX': [value: number]
  'update:imageOffsetY': [value: number]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const { fontReady } = useCardCanvas(canvasRef, toRef(props, 'frontCard'))

let isPanning = false
let hasMoved = false
let lastX = 0
let lastY = 0

const MAX_BYTES = 2 * 1024 * 1024
const COMPRESS_THRESHOLD = 500 * 1024

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > MAX_BYTES) { alert('Image must be under 2MB.'); return }
  const reader = new FileReader()
  reader.onload = async (ev) => {
    let dataUrl = ev.target?.result as string
    if (file.size > COMPRESS_THRESHOLD) dataUrl = await compressImage(dataUrl)
    emit('update:imageData', dataUrl)
    emit('update:imageOffsetX', 0)
    emit('update:imageOffsetY', 0)
    emit('update:imageScale', 1)
  }
  reader.readAsDataURL(file)
}

function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.src = dataUrl
  })
}

function onPointerDown(e: PointerEvent) {
  isPanning = true
  hasMoved = false
  lastX = e.clientX
  lastY = e.clientY
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!isPanning || !props.frontCard?.imageData) return
  const canvas = canvasRef.value
  if (!canvas) return
  const dx = (e.clientX - lastX) / canvas.offsetWidth
  const dy = (e.clientY - lastY) / canvas.offsetHeight
  if (Math.abs(e.clientX - lastX) > 3 || Math.abs(e.clientY - lastY) > 3) hasMoved = true
  lastX = e.clientX
  lastY = e.clientY
  emit('update:imageOffsetX', clamp((props.frontCard.imageOffsetX ?? 0) + dx, -0.5, 0.5))
  emit('update:imageOffsetY', clamp((props.frontCard.imageOffsetY ?? 0) + dy, -0.5, 0.5))
}

function onPointerUp(e: PointerEvent) {
  ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  isPanning = false
  if (!hasMoved) fileInput.value?.click()
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  if (!props.frontCard) return
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  emit('update:imageScale', clamp((props.frontCard.imageScale ?? 1) + delta, 0.1, 5))
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
  <div class="w-full">
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />

    <div class="relative w-full" style="aspect-ratio: 2/3;">
      <canvas
        ref="canvasRef"
        :width="CANVAS_W"
        :height="CANVAS_H"
        class="absolute inset-0 w-full h-full rounded-xl shadow-lg select-none"
        :class="[
          { 'opacity-80': !fontReady },
          frontCard?.imageData ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        ]"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
      />

      <div
        v-if="!frontCard"
        class="absolute inset-0 flex items-center justify-center rounded-xl bg-sw-card border-2 border-dashed border-sw-gold/20 pointer-events-none"
      >
        <span class="text-sw-text/30 text-sm text-center px-4">Choose a unit type to begin</span>
      </div>

      <div
        v-if="frontCard && !frontCard.imageData"
        class="absolute pointer-events-none"
        style="top: 38%; left: 50%; transform: translateX(-50%); white-space: nowrap;"
      >
        <span class="text-white/70 text-xs bg-black/50 rounded px-2 py-1">Click to add artwork</span>
      </div>
    </div>

    <div v-if="frontCard?.imageData" class="mt-2 space-y-1">
      <div class="flex items-center gap-2">
        <span class="text-xs text-sw-text/50 w-8">Size</span>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.05"
          :value="frontCard.imageScale"
          class="flex-1 accent-sw-gold"
          @input="emit('update:imageScale', parseFloat(($event.target as HTMLInputElement).value))"
        />
        <span class="text-xs text-sw-text/50 w-8 text-right">{{ frontCard.imageScale.toFixed(1) }}×</span>
      </div>
      <button
        type="button"
        class="text-xs text-red-400 hover:underline"
        @click="emit('update:imageData', null)"
      >
        Remove artwork
      </button>
    </div>
  </div>
</template>
