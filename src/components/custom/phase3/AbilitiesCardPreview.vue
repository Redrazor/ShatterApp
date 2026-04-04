<script setup lang="ts">
import { ref, toRef } from 'vue'
import type { FrontCardData, StatsData, AbilitiesData } from '../../../types/index.ts'
import { useAbilitiesCanvas, BACK_CANVAS_W, BACK_CANVAS_H } from '../../../composables/useAbilitiesCanvas.ts'

const props = defineProps<{
  frontCard: FrontCardData | null
  stats: StatsData | null
  abilities: AbilitiesData | null
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const { fontReady } = useAbilitiesCanvas(
  canvasRef,
  toRef(props, 'frontCard'),
  toRef(props, 'stats'),
  toRef(props, 'abilities'),
)
</script>

<template>
  <div class="w-full" :style="`aspect-ratio: ${BACK_CANVAS_W} / ${BACK_CANVAS_H}`">
    <div class="relative w-full h-full">
      <canvas
        ref="canvasRef"
        :width="BACK_CANVAS_W"
        :height="BACK_CANVAS_H"
        class="absolute inset-0 w-full h-full rounded-xl shadow-lg select-none"
        :class="{ 'opacity-80': !fontReady }"
      />
    </div>
  </div>
</template>
