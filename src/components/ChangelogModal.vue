<script setup lang="ts">
defineProps<{ show: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const entries = [
  {
    version: '1.5.10',
    date: '2026-03-08',
    changes: [
      'Fixed broken images in "In the same pack" section of unit profiles in production',
    ],
  },
  {
    version: '1.5.9',
    date: '2026-03-07',
    changes: [
      'Bumped version',
    ],
  },
  {
    version: '1.5.8',
    date: '2026-03-06',
    changes: [
      'Keepalive workflow: ping /api/health with timeout and continue-on-error',
    ],
  },
  {
    version: '1.5.7',
    date: '2026-03-05',
    changes: [
      'Fixed Jailbreak stage-1 image naming',
    ],
  },
  {
    version: '1.5.6',
    date: '2026-03-04',
    changes: [
      'Mission 6 Crash Landing — card images and tracker UI',
    ],
  },
]
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')" />

        <div class="relative z-10 w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl border border-sw-gold/30 bg-sw-card shadow-2xl">
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <h2 class="text-base font-bold text-sw-gold">What's New</h2>
            <button
              class="rounded-full bg-black/40 p-1.5 text-sw-text/50 hover:text-sw-text transition-colors"
              @click="$emit('close')"
            >✕</button>
          </div>

          <!-- Entries -->
          <div class="overflow-y-auto px-5 py-4 space-y-5">
            <div v-for="entry in entries" :key="entry.version">
              <div class="flex items-baseline gap-2 mb-1.5">
                <span class="text-xs font-bold text-sw-gold">v{{ entry.version }}</span>
                <span class="text-[10px] text-sw-text/30">{{ entry.date }}</span>
              </div>
              <ul class="space-y-1">
                <li
                  v-for="change in entry.changes"
                  :key="change"
                  class="text-xs text-sw-text/70 flex gap-2"
                >
                  <span class="text-sw-gold/40 flex-shrink-0">·</span>
                  {{ change }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
