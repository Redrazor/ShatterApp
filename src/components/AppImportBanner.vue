<script setup lang="ts">
import type { CompactProfile } from '../types/index.ts'

defineProps<{
  profile: CompactProfile
}>()

const emit = defineEmits<{
  (e: 'import'): void
  (e: 'dismiss'): void
}>()
</script>

<template>
  <div class="border-b border-sw-gold/30 bg-sw-card/80 px-4 py-3">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4">
      <p class="text-sm text-sw-text">
        Profile found in link —
        <span class="text-sw-gold font-medium">
          {{ profile.owned.length }} pack{{ profile.owned.length !== 1 ? 's' : '' }},
          {{ profile.lists.length }} build{{ profile.lists.length !== 1 ? 's' : '' }}
        </span>
        ready to import.
      </p>
      <div class="flex gap-2 shrink-0">
        <button
          class="rounded-lg bg-sw-gold/20 px-3 py-1 text-xs font-medium text-sw-gold hover:bg-sw-gold/30"
          @click="$emit('import')"
        >
          Import all data
        </button>
        <button
          class="rounded-lg px-3 py-1 text-xs text-sw-text/50 hover:text-sw-text"
          @click="$emit('dismiss')"
        >
          Dismiss
        </button>
      </div>
    </div>
  </div>
</template>
