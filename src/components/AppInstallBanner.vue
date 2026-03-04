<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// Already installed as standalone — never show
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone
const DISMISSED_KEY = 'shatterapp-install-dismissed'

const visible   = ref(false)
const isIOSHint = ref(false)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let deferredPrompt: any = null

function dismiss() {
  visible.value = false
  localStorage.setItem(DISMISSED_KEY, '1')
}

async function install() {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  if (outcome === 'accepted') localStorage.setItem(DISMISSED_KEY, '1')
  deferredPrompt = null
  visible.value = false
}

function onBeforeInstallPrompt(e: Event) {
  e.preventDefault()
  deferredPrompt = e
  if (!localStorage.getItem(DISMISSED_KEY)) {
    isIOSHint.value = false
    visible.value = true
  }
}

onMounted(() => {
  if (isStandalone || localStorage.getItem(DISMISSED_KEY)) return

  if (isIOS) {
    isIOSHint.value = true
    visible.value = true
    return
  }

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
})
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="visible"
      class="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border border-sw-gold/30 bg-sw-card/95 px-4 py-3 shadow-xl backdrop-blur-sm"
    >
      <div class="flex items-start gap-3">
        <span class="mt-0.5 text-2xl">📱</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-sw-text">Install ShatterApp</p>
          <p v-if="!isIOSHint" class="mt-0.5 text-xs text-sw-text/60">
            Add to your home screen for quick access at the table.
          </p>
          <p v-else class="mt-0.5 text-xs text-sw-text/60">
            Tap <span class="font-medium text-sw-text/80">Share</span> then
            <span class="font-medium text-sw-text/80">Add to Home Screen</span> to install.
          </p>
        </div>
        <button
          class="mt-0.5 shrink-0 text-sw-text/30 hover:text-sw-text"
          aria-label="Dismiss"
          @click="dismiss"
        >✕</button>
      </div>

      <div v-if="!isIOSHint" class="mt-3 flex gap-2">
        <button
          class="flex-1 rounded-lg bg-sw-gold py-1.5 text-sm font-bold text-sw-dark"
          @click="install"
        >Install</button>
        <button
          class="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-sw-text/50 hover:text-sw-text"
          @click="dismiss"
        >Not now</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from,
.slide-up-leave-to  { opacity: 0; transform: translate(-50%, 1rem); }
</style>
