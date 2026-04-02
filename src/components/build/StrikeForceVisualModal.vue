<script setup lang="ts">
import { ref } from 'vue'
import { toPng } from 'html-to-image'
import type { Squad } from '../../types/index.ts'
import { imageUrl } from '../../utils/imageUrl.ts'

const props = defineProps<{
  squads: [Squad, Squad]
  name: string
  shareUrl: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const captureRef = ref<HTMLElement | null>(null)
const downloading = ref(false)
const copied = ref(false)

const ROLES = ['primary', 'secondary', 'support'] as const

async function download() {
  if (!captureRef.value) return
  downloading.value = true
  try {
    const dataUrl = await toPng(captureRef.value, {
      backgroundColor: '#111318',
      pixelRatio: 2,
    })
    const link = document.createElement('a')
    link.download = `${props.name || 'strike-force'}.png`
    link.href = dataUrl
    link.click()
  } finally {
    downloading.value = false
  }
}

function share() {
  navigator.clipboard.writeText(props.shareUrl)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-2xl rounded-xl border border-sw-gold/30 bg-sw-card shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-3 border-b border-sw-gold/15">
        <h3 class="text-base font-bold text-sw-gold">Strike Force</h3>
        <button class="text-sw-text/40 hover:text-sw-text/80 text-lg leading-none" @click="emit('close')">✕</button>
      </div>

      <!-- Capture area -->
      <div ref="captureRef" class="bg-[#111318] px-5 py-5 space-y-5">
        <!-- List name -->
        <p class="text-center text-lg font-bold text-sw-gold tracking-wide">{{ name || 'Strike Force' }}</p>

        <!-- Squads -->
        <div v-for="(squad, si) in squads" :key="si" class="space-y-2">
          <p class="text-xs font-semibold text-sw-gold/60 uppercase tracking-widest">Squad {{ si + 1 }}</p>
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="role in ROLES"
              :key="role"
              class="flex flex-col items-center gap-1.5"
            >
              <div class="w-full rounded-lg overflow-hidden border border-sw-gold/20 aspect-[2.5/3.5] bg-sw-dark flex items-center justify-center">
                <img
                  v-if="squad[role]"
                  :src="imageUrl(squad[role]!.cardFront)"
                  :alt="squad[role]!.name"
                  class="w-full h-full object-cover"
                  crossorigin="anonymous"
                />
                <span v-else class="text-sw-text/20 text-xs capitalize">{{ role }}</span>
              </div>
              <p class="text-center text-[11px] text-sw-text/60 leading-tight px-0.5 truncate w-full">
                {{ squad[role]?.name ?? '—' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 px-5 py-3 border-t border-sw-gold/15">
        <button
          class="flex-1 rounded-lg border border-sw-gold/30 bg-sw-gold/10 px-4 py-2 text-sm font-medium text-sw-gold hover:bg-sw-gold/20 transition-colors disabled:opacity-50"
          :disabled="downloading"
          @click="download"
        >
          {{ downloading ? 'Saving…' : '↓ Download PNG' }}
        </button>
        <button
          class="flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          :class="copied
            ? 'border-green-500/30 bg-green-500/10 text-green-400'
            : 'border-sw-blue/30 bg-sw-blue/10 text-sw-blue hover:bg-sw-blue/20'"
          @click="share"
        >
          {{ copied ? '✓ Copied!' : 'Share Link' }}
        </button>
      </div>
    </div>
  </div>
</template>
