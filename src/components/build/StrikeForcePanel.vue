<script setup lang="ts">
import type { Mission } from '../../types/index.ts'

const props = defineProps<{
  name: string
  mission: Mission | null
  premiere: boolean
  isComplete: boolean
}>()

const emit = defineEmits<{
  (e: 'update:name', val: string): void
  (e: 'update:premiere', val: boolean): void
  (e: 'pick-mission'): void
  (e: 'reset'): void
  (e: 'save'): void
  (e: 'share'): void
}>()
</script>

<template>
  <div class="rounded-xl border border-sw-gold/20 bg-sw-card p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-sw-gold">Strike Force</h2>
      <div class="flex items-center gap-2">
        <span
          v-if="isComplete"
          class="rounded-full bg-green-500/20 px-3 py-0.5 text-xs font-medium text-green-400"
        >
          ✓ Complete
        </span>
        <button
          class="rounded px-2 py-1 text-xs text-sw-gold/70 hover:text-sw-gold"
          @click="$emit('save')"
        >
          Save
        </button>
        <button
          class="rounded px-2 py-1 text-xs text-sw-blue/70 hover:text-sw-blue"
          @click="$emit('share')"
        >
          Share
        </button>
        <button
          class="rounded px-2 py-1 text-xs text-sw-text/50 hover:text-red-400"
          @click="$emit('reset')"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- Name -->
    <div>
      <label class="mb-1 block text-xs text-sw-text/50">List Name</label>
      <input
        type="text"
        :value="name"
        placeholder="My Strike Force"
        class="w-full rounded-lg border border-sw-gold/30 bg-sw-dark px-3 py-2 text-sw-text placeholder-sw-text/30 focus:border-sw-gold focus:outline-none"
        @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Mission -->
    <div>
      <label class="mb-1 block text-xs text-sw-text/50">Mission</label>
      <button
        class="w-full rounded-lg border border-sw-gold/30 bg-sw-dark px-3 py-2 text-left transition-colors hover:border-sw-gold"
        @click="$emit('pick-mission')"
      >
        <span v-if="mission" class="text-sw-text">{{ mission.name }}</span>
        <span v-else class="text-sw-text/40">Select mission…</span>
      </button>
    </div>

    <!-- Premiere -->
    <label class="flex cursor-pointer items-center gap-2 text-sm text-sw-text">
      <input
        type="checkbox"
        class="accent-sw-gold"
        :checked="premiere"
        @change="$emit('update:premiere', ($event.target as HTMLInputElement).checked)"
      />
      Premiere event
    </label>
  </div>
</template>
