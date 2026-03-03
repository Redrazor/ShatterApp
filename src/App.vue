<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { decodeProfile } from './utils/profileShare.ts'
import type { CompactProfile } from './types/index.ts'
import AppImportBanner from './components/AppImportBanner.vue'
import { useCollectionStore } from './stores/collection.ts'
import { useStrikeForceStore } from './stores/strikeForce.ts'

const route = useRoute()
const router = useRouter()
const collectionStore = useCollectionStore()
const sfStore = useStrikeForceStore()

const pendingProfile = ref<CompactProfile | null>(null)

onMounted(async () => {
  // Attempt programmatic portrait lock (works in PWA / fullscreen contexts)
  screen.orientation?.lock?.('portrait-primary').catch(() => {})

  // Wait for the initial navigation (including / → /browse redirect) to settle
  // before reading query params, otherwise route.query may still be empty.
  await router.isReady()

  // Check for profile import link
  const p = route.query.p as string | undefined
  if (p) {
    const profile = decodeProfile(p)
    if (profile) pendingProfile.value = profile
    router.replace({ query: { ...route.query, p: undefined } })
  }
})

function handleImport() {
  if (!pendingProfile.value) return
  collectionStore.importOwned(pendingProfile.value.owned)
  sfStore.importLists(pendingProfile.value.lists)
  pendingProfile.value = null
}

function handleDismiss() {
  pendingProfile.value = null
}
</script>

<template>
  <div class="min-h-screen bg-sw-bg text-sw-text">
    <!-- Nav -->
    <nav class="border-b border-sw-gold/20 bg-sw-card/80 backdrop-blur-sm sticky top-0 z-40">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <span class="text-xl font-bold tracking-wide text-sw-gold">⚔ ShatterApp</span>
        <div class="flex gap-1">
          <RouterLink
            v-for="route in [
              { to: '/browse', label: 'Browse' },
              { to: '/build', label: 'Build' },
              { to: '/play', label: 'Play' },
              { to: '/collection', label: 'Collection' },
              { to: '/reference', label: 'Reference', short: 'Ref' },
            ]"
            :key="route.to"
            :to="route.to"
            class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors text-sw-text/70 hover:text-sw-gold"
            active-class="text-sw-gold bg-sw-gold/10"
          >
            <span v-if="route.short" class="sm:hidden">{{ route.short }}</span>
            <span :class="route.short ? 'hidden sm:inline' : ''">{{ route.label }}</span>
          </RouterLink>
        </div>
      </div>
    </nav>

    <!-- Profile import banner -->
    <AppImportBanner
      v-if="pendingProfile"
      :profile="pendingProfile"
      @import="handleImport"
      @dismiss="handleDismiss"
    />

    <!-- Main content -->
    <main class="mx-auto max-w-7xl px-4 py-6">
      <RouterView />
    </main>
  </div>

  <!-- Landscape blocker (CSS-only, always reliable) -->
  <div class="landscape-block">
    <div class="flex flex-col items-center gap-4 text-center px-8">
      <span class="text-5xl">📱</span>
      <p class="text-lg font-semibold text-white">Please rotate your device</p>
      <p class="text-sm text-white/60">ShatterApp works in portrait mode only</p>
    </div>
  </div>
</template>

<style>
/* Show full-screen blocker in landscape — always reliable, no JS needed */
.landscape-block {
  display: none;
}

@media screen and (orientation: landscape) and (pointer: coarse) {
  .landscape-block {
    display: flex;
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: #0f1117;
    align-items: center;
    justify-content: center;
  }
}
</style>
