<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PlayUnit } from '../../../types/index.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'

const props = defineProps<{
  unit: PlayUnit | null
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const localFlipped = ref(false)

watch(() => props.show, (val) => {
  if (val) localFlipped.value = false
})

const currentImage = () => {
  if (!props.unit) return ''
  return localFlipped.value && props.unit.stance2
    ? props.unit.stance2
    : props.unit.stance1 ?? ''
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show && unit"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="relative flex flex-col items-center gap-3 max-w-sm w-full">
        <!-- Header: name + close -->
        <div class="flex items-center justify-between w-full">
          <div class="text-sm font-bold text-zinc-200">{{ unit.name }}</div>
          <button
            class="h-10 w-10 rounded-full border border-zinc-600 bg-zinc-800 text-zinc-400
                   flex items-center justify-center text-sm transition-all hover:border-zinc-400 hover:text-zinc-200 active:scale-90"
            @click="emit('close')"
          >✕</button>
        </div>

        <!-- Stance image -->
        <img
          :src="imageUrl(currentImage())"
          class="w-full rounded-xl shadow-2xl"
          :alt="unit.name"
        />

        <!-- Flip button -->
        <button
          v-if="unit.stance2"
          class="rounded-xl border border-zinc-600 bg-zinc-800 px-5 py-2 text-sm font-semibold text-zinc-300
                 transition-all hover:border-zinc-400 hover:text-zinc-100 active:scale-95"
          @click="localFlipped = !localFlipped"
        >↪ Flip</button>
      </div>
    </div>
  </Teleport>
</template>
