<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  'update:imageData': [value: string | null]
  'update:imageScale': [value: number]
  'update:imageOffsetX': [value: number]
  'update:imageOffsetY': [value: number]
}>()

const props = defineProps<{
  imageData: string | null
  imageScale: number
  imageOffsetX: number
  imageOffsetY: number
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
let lastPointerX = 0
let lastPointerY = 0

const MAX_BYTES = 2 * 1024 * 1024 // 2MB
const COMPRESS_THRESHOLD = 500 * 1024 // 500KB

function triggerUpload() {
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > MAX_BYTES) {
    alert('Image must be under 2MB.')
    return
  }
  const reader = new FileReader()
  reader.onload = async (ev) => {
    let dataUrl = ev.target?.result as string
    if (file.size > COMPRESS_THRESHOLD) {
      dataUrl = await compressImage(dataUrl)
    }
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
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.src = dataUrl
  })
}

function clearImage() {
  emit('update:imageData', null)
  if (fileInput.value) fileInput.value.value = ''
}

function onPointerDown(e: PointerEvent) {
  isDragging.value = true
  lastPointerX = e.clientX
  lastPointerY = e.clientY
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  const dx = (e.clientX - lastPointerX) / 200
  const dy = (e.clientY - lastPointerY) / 200
  lastPointerX = e.clientX
  lastPointerY = e.clientY
  emit('update:imageOffsetX', clamp(props.imageOffsetX + dx, -0.5, 0.5))
  emit('update:imageOffsetY', clamp(props.imageOffsetY + dy, -0.5, 0.5))
}

function onPointerUp(e: PointerEvent) {
  isDragging.value = false
  ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}
</script>

<template>
  <div class="space-y-3">
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileChange"
    />

    <div v-if="!imageData" class="flex gap-2">
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium bg-sw-gold/10 text-sw-gold border border-sw-gold/30 hover:bg-sw-gold/20 transition-colors"
        @click="triggerUpload"
      >
        Upload Artwork
      </button>
    </div>

    <div v-else class="space-y-2">
      <!-- Thumbnail drag area -->
      <div
        class="relative rounded-lg overflow-hidden border border-sw-gold/20 cursor-grab active:cursor-grabbing select-none"
        style="aspect-ratio: 3/4; max-height: 180px; background: #111;"
        :class="{ 'cursor-grabbing': isDragging }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
      >
        <img
          :src="imageData"
          :style="{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${imageOffsetX * 200}px), calc(-50% + ${imageOffsetY * 200}px)) scale(${imageScale})`,
            transformOrigin: 'center',
            maxWidth: 'none',
            width: '100%',
            pointerEvents: 'none',
          }"
          alt="Artwork preview"
          draggable="false"
        />
        <div class="absolute bottom-1 right-1 text-[10px] text-white/50 pointer-events-none">drag to reposition</div>
      </div>

      <!-- Zoom slider -->
      <div class="flex items-center gap-2">
        <span class="text-xs text-sw-text/50 w-8">Zoom</span>
        <input
          type="range"
          min="1"
          max="3"
          step="0.05"
          :value="imageScale"
          class="flex-1 accent-sw-gold"
          @input="emit('update:imageScale', parseFloat(($event.target as HTMLInputElement).value))"
        />
        <span class="text-xs text-sw-text/50 w-8 text-right">{{ imageScale.toFixed(1) }}×</span>
      </div>

      <!-- Replace / clear -->
      <div class="flex gap-2">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-medium bg-sw-gold/10 text-sw-gold border border-sw-gold/20 hover:bg-sw-gold/20 transition-colors"
          @click="triggerUpload"
        >
          Replace
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-400/10 transition-colors"
          @click="clearImage"
        >
          Remove
        </button>
      </div>
    </div>
  </div>
</template>
