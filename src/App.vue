<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { Analytics } from '@vercel/analytics/vue'
import AppInstallBanner from './components/AppInstallBanner.vue'
import ChangelogModal from './components/ChangelogModal.vue'

const menuOpen = ref(false)
const showChangelog = ref(false)
const router = useRouter()

const routes = [
  { to: '/browse',     label: 'Browse' },
  { to: '/build',      label: 'Build' },
  { to: '/play',       label: 'Play' },
  { to: '/collection', label: 'Collection' },
  { to: '/reference',  label: 'Reference' },
  { to: '/roll',       label: 'Roll' },
]

function closeMenu() { menuOpen.value = false }

// Close menu on route change
router.afterEach(closeMenu)

onMounted(() => {
  ;(screen.orientation as unknown as { lock?: (o: string) => Promise<void> })?.lock?.('portrait-primary')?.catch(() => {})
})
</script>

<template>
  <Analytics />
  <div class="min-h-screen bg-sw-bg text-sw-text">

    <!-- Nav -->
    <nav class="border-b border-sw-gold/20 bg-sw-card/80 backdrop-blur-sm sticky top-0 z-40">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">

        <!-- Logo -->
        <span class="text-xl font-bold tracking-wide text-sw-gold">⚔ ShatterApp</span>

        <!-- Desktop links -->
        <div class="hidden sm:flex gap-1">
          <RouterLink
            v-for="route in routes" :key="route.to"
            :to="route.to"
            class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors text-sw-text/70 hover:text-sw-gold"
            active-class="text-sw-gold bg-sw-gold/10"
          >{{ route.label }}</RouterLink>
        </div>

        <!-- Hamburger (mobile only) -->
        <button
          class="sm:hidden flex flex-col justify-center items-center gap-1.5 w-9 h-9 rounded-lg hover:bg-white/8 transition-colors"
          aria-label="Toggle menu"
          @click="menuOpen = !menuOpen"
        >
          <span :class="['block h-0.5 w-5 bg-sw-text/70 transition-all duration-200',
            menuOpen ? 'translate-y-2 rotate-45' : '']" />
          <span :class="['block h-0.5 w-5 bg-sw-text/70 transition-all duration-200',
            menuOpen ? 'opacity-0' : '']" />
          <span :class="['block h-0.5 w-5 bg-sw-text/70 transition-all duration-200',
            menuOpen ? '-translate-y-2 -rotate-45' : '']" />
        </button>

      </div>

      <!-- Mobile dropdown -->
      <Transition name="menu-slide">
        <div v-if="menuOpen" class="sm:hidden border-t border-sw-gold/10 bg-sw-card/95 px-2 py-2">
          <RouterLink
            v-for="route in routes" :key="route.to"
            :to="route.to"
            class="flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors text-sw-text/70 hover:text-sw-gold hover:bg-white/5"
            active-class="text-sw-gold bg-sw-gold/10"
            @click="closeMenu"
          >{{ route.label }}</RouterLink>
        </div>
      </Transition>
    </nav>

    <!-- Main content -->
    <main class="mx-auto max-w-7xl px-4 py-6">
      <RouterView />
    </main>

    <!-- Footer -->
    <footer class="border-t border-sw-gold/20 bg-sw-card/80 py-4 text-center text-sm text-sw-text/60 space-y-1">
      <div>
        <span>ShatterApp — fan-made companion for Star Wars: Shatterpoint</span>
        <span class="mx-2">·</span>
        <a href="https://ko-fi.com/redrazor" target="_blank" rel="noopener"
          class="text-sw-gold hover:underline">Support on Ko-fi ☕</a>
        <span class="mx-2">·</span>
        <a href="https://github.com/Redrazor/ShatterApp" target="_blank" rel="noopener"
          class="hover:underline">GitHub</a>
      </div>
      <div class="text-xs text-sw-text/40">
        All card images and associated artwork are copyright © Atomic Mass Games, Lucasfilm Ltd. and Disney. Used for fan reference purposes only.
        <span class="mx-2">·</span>
        <button
          class="text-sw-text/30 hover:text-sw-gold transition-colors"
          @click="showChangelog = true"
        >v1.5.10</button>
      </div>
    </footer>
  </div>

  <AppInstallBanner />
  <ChangelogModal :show="showChangelog" @close="showChangelog = false" />

  <!-- Landscape blocker -->
  <div class="landscape-block">
    <div class="flex flex-col items-center gap-4 text-center px-8">
      <span class="text-5xl">📱</span>
      <p class="text-lg font-semibold text-white">Please rotate your device</p>
      <p class="text-sm text-white/60">ShatterApp works in portrait mode only</p>
    </div>
  </div>
</template>

<style>
.landscape-block { display: none; }

@media screen and (orientation: landscape) and (pointer: coarse) {
  .landscape-block {
    display: flex; position: fixed; inset: 0; z-index: 9999;
    background: #0f1117; align-items: center; justify-content: center;
  }
}

.menu-slide-enter-active,
.menu-slide-leave-active { transition: all 0.2s ease; }
.menu-slide-enter-from,
.menu-slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
