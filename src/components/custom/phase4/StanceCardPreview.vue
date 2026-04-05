<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { StanceData, HomebrewFaction } from '../../../types/index.ts'
import { useStanceCanvas, STANCE_CANVAS_W, STANCE_CANVAS_H } from '../../../composables/useStanceCanvas.ts'
import type { PortraitOptions } from '../../../composables/useStanceCanvas.ts'

const props = defineProps<{
  stanceData: StanceData | null
  faction: HomebrewFaction
  unitName?: string
  unitTitle?: string
  label?: string
  portraitImageData?: string | null
  portraitOffsetX?: number
  portraitOffsetY?: number
  portraitScale?: number
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const stanceRef = computed(() => props.stanceData)
const factionRef = computed(() => props.faction)
const unitNameRef = computed(() => props.unitName ?? '')
const unitTitleRef = computed(() => props.unitTitle ?? '')
const portraitRef = computed<PortraitOptions | null>(() => ({
  imageData:  props.portraitImageData ?? null,
  offsetX:    props.portraitOffsetX   ?? 0,
  offsetY:    props.portraitOffsetY   ?? 0,
  scale:      props.portraitScale     ?? 1.0,
}))

const { scheduleRender } = useStanceCanvas(canvasRef, stanceRef, factionRef, portraitRef, unitNameRef, unitTitleRef)

// Belt-and-suspenders: force a redraw whenever portrait settings change
watch(
  () => [props.portraitOffsetX, props.portraitOffsetY, props.portraitScale, props.portraitImageData],
  () => scheduleRender(),
)
</script>

<template>
  <div class="space-y-1">
    <p v-if="label" class="text-xs text-sw-text/40 text-center">{{ label }}</p>
    <div class="w-full overflow-hidden rounded-lg border border-sw-gold/10 shadow-sm">
      <canvas
        ref="canvasRef"
        :width="STANCE_CANVAS_W"
        :height="STANCE_CANVAS_H"
        class="w-full h-auto block"
      />
    </div>
  </div>
</template>
