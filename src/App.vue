<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { Analytics } from '@vercel/analytics/vue'
import AppInstallBanner from './components/AppInstallBanner.vue'
import ChangelogModal from './components/ChangelogModal.vue'
import SettingsPanel from './components/collection/SettingsPanel.vue'
import { useSettingsStore } from './stores/settings.ts'

const menuOpen = ref(false)
const showChangelog = ref(false)
const settingsOpen = ref(false)
const router = useRouter()
const settingsStore = useSettingsStore()

const allRoutes = [
  { to: '/browse',     label: 'Browse',     always: true },
  { to: '/build',      label: 'Build',      always: true },
  { to: '/play',       label: 'Play',       always: true },
  { to: '/collection', label: 'Collection', always: true },
  { to: '/reference',  label: 'Reference',  always: true },
  { to: '/roll',       label: 'Roll',       always: false, settingKey: 'showRollTab' as const },
]

const routes = computed(() =>
  allRoutes.filter(r => r.always || settingsStore[r.settingKey!])
)

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

        <!-- Desktop links + gear -->
        <div class="hidden sm:flex items-center gap-1">
          <RouterLink
            v-for="route in routes" :key="route.to"
            :to="route.to"
            class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors text-sw-text/70 hover:text-sw-gold"
            active-class="text-sw-gold bg-sw-gold/10"
          >{{ route.label }}</RouterLink>
          <button
            class="ml-1 rounded-lg p-1.5 text-sw-text/40 hover:text-sw-gold transition-colors"
            aria-label="Open settings"
            @click="settingsOpen = true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
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
          <button
            class="flex w-full items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors text-sw-text/70 hover:text-sw-gold hover:bg-white/5"
            @click="settingsOpen = true; closeMenu()"
          >Settings</button>
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
          class="text-sw-gold hover:underline">Buy me a coffee on Ko-fi ☕</a>
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
        >v2.9.0</button>
      </div>
    </footer>
  </div>

  <AppInstallBanner />
  <ChangelogModal :show="showChangelog" @close="showChangelog = false" />
  <SettingsPanel :open="settingsOpen" @close="settingsOpen = false" />

  <!-- Landscape blocker -->
  <div class="landscape-block">
    <div class="flex flex-col items-center gap-4 text-center px-8">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-sw-gold animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3" />
      </svg>
      <p class="text-xl font-bold text-sw-gold">Rotate Your Device</p>
      <p class="text-sm text-white/70">ShatterApp is designed for portrait mode.</p>
      <p class="text-xs text-white/40">Turn your phone upright to continue</p>
    </div>
  </div>
</template>

<style>
.landscape-block { display: none; }

@media screen and (orientation: landscape) and (pointer: coarse) {
  .landscape-block {
    display: flex; position: fixed; inset: 0; z-index: 9999;
    background: linear-gradient(135deg, #0f1117 0%, #1a1d2e 100%);
    align-items: center; justify-content: center;
    border: 2px solid rgba(196, 167, 75, 0.3);
  }
}

.menu-slide-enter-active,
.menu-slide-leave-active { transition: all 0.2s ease; }
.menu-slide-enter-from,
.menu-slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
