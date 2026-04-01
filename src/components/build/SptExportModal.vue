<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ code: string }>()
defineEmits<{ (e: 'close'): void }>()

const copied = ref(false)

function copy(code: string) {
  navigator.clipboard.writeText(code)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-sm rounded-xl border border-sw-gold/30 bg-sw-card p-5 space-y-4 shadow-xl">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-sw-gold">Export to Longshanks</h3>
        <button class="text-sw-text/40 hover:text-sw-text/80 text-lg leading-none" @click="$emit('close')">✕</button>
      </div>

      <p class="text-xs text-sw-text/50">
        Copy the code below and paste it into the
        <a
          href="https://shatterpoint.longshanks.org"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sw-blue hover:underline"
        >Longshanks</a>
        list registration form.
      </p>

      <div
        class="rounded-lg border border-sw-gold/20 bg-sw-dark px-3 py-2 font-mono text-xs text-sw-text break-all select-all"
      >
        {{ code }}
      </div>

      <button
        class="w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        :class="copied
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-sw-gold/10 text-sw-gold border border-sw-gold/30 hover:bg-sw-gold/20'"
        @click="copy(code)"
      >
        {{ copied ? '✓ Copied!' : 'Copy to Clipboard' }}
      </button>
    </div>
  </div>
</template>
