<script setup lang="ts">
import { ref } from 'vue'
import type { HomebrewProfile } from '../../types/index.ts'

const props = defineProps<{
  profile: HomebrewProfile
  status: 'empty' | 'draft' | 'complete'
}>()

const emit = defineEmits<{
  load: []
  print: []
  visualize: []
  delete: []
}>()

const expanded = ref(false)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="rounded-lg border border-sw-gold/20 bg-sw-card overflow-hidden">
    <!-- Row header -->
    <button
      class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-sw-gold/5 transition-colors"
      @click="expanded = !expanded"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 text-sw-gold/60 shrink-0 transition-transform duration-200"
        :class="expanded ? 'rotate-90' : ''"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
      <span class="flex-1 font-medium text-sw-text truncate">{{ props.profile.name }}</span>

      <!-- Status badge -->
      <span
        v-if="status === 'draft'"
        class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30"
      >
        Draft
      </span>
      <span
        v-else-if="status === 'complete'"
        class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-green-600/20 text-green-400 border border-green-500/30"
      >
        Complete
      </span>

      <span class="text-xs text-sw-text/40 shrink-0">{{ formatDate(props.profile.createdAt) }}</span>
    </button>

    <!-- Expanded actions -->
    <div v-if="expanded" class="border-t border-sw-gold/10 px-4 py-3 flex flex-wrap gap-2">
      <button
        class="rounded-lg px-3 py-1.5 text-sm font-medium bg-sw-gold/10 text-sw-gold hover:bg-sw-gold/20 transition-colors"
        @click="emit('load')"
      >
        Load
      </button>
      <button
        class="rounded-lg px-3 py-1.5 text-sm font-medium bg-sw-gold/10 text-sw-gold hover:bg-sw-gold/20 transition-colors"
        @click="emit('print')"
      >
        Print
      </button>
      <button
        class="rounded-lg px-3 py-1.5 text-sm font-medium bg-sw-gold/10 text-sw-gold hover:bg-sw-gold/20 transition-colors"
        @click="emit('visualize')"
      >
        Visualize
      </button>
      <button
        class="ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors"
        @click="emit('delete')"
      >
        Delete
      </button>
    </div>
  </div>
</template>
