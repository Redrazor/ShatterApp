<script setup lang="ts">
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'

const props = defineProps<{ url: string }>()
defineEmits<{ (e: 'close'): void }>()

const canvas = ref<HTMLCanvasElement | null>(null)
const copied = ref(false)

onMounted(async () => {
  if (canvas.value) {
    await QRCode.toCanvas(canvas.value, props.url, {
      width: 240,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
  }
})

function copy() {
  navigator.clipboard.writeText(props.url)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-xs rounded-xl border border-sw-gold/30 bg-sw-card p-5 space-y-4 shadow-xl">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-sw-gold">Share Build</h3>
        <button class="text-sw-text/40 hover:text-sw-text/80 text-lg leading-none" @click="$emit('close')">✕</button>
      </div>

      <div class="flex justify-center rounded-lg bg-white p-3">
        <canvas ref="canvas" />
      </div>

      <p class="break-all rounded border border-sw-gold/15 bg-sw-dark px-2 py-1.5 text-[11px] text-sw-text/60 font-mono select-all">
        {{ url }}
      </p>

      <button
        class="w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors border"
        :class="copied
          ? 'bg-green-500/20 text-green-400 border-green-500/30'
          : 'bg-sw-gold/10 text-sw-gold border-sw-gold/30 hover:bg-sw-gold/20'"
        @click="copy"
      >
        {{ copied ? '✓ Copied!' : 'Copy Link' }}
      </button>
    </div>
  </div>
</template>
