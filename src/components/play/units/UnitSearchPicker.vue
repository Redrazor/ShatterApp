<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Character } from '../../../types/index.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'

const props = defineProps<{ characters: Character[]; excludeIds: number[] }>()
const emit = defineEmits<{ (e: 'add', character: Character): void; (e: 'close'): void }>()

const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return props.characters
    .filter(c => !props.excludeIds.includes(c.id))
    .filter(c => !q || c.name.toLowerCase().includes(q))
    .slice(0, 40)
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      @click.self="$emit('close')"
    >
      <div class="absolute inset-0 bg-black/70" @click="$emit('close')" />
      <div class="relative z-10 w-full max-w-sm flex flex-col rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl max-h-[50vh]">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <span class="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Add Unit</span>
          <button class="text-zinc-600 hover:text-zinc-300 transition-colors text-sm" @click="$emit('close')">✕</button>
        </div>

        <!-- Search -->
        <div class="px-4 pt-3 pb-2">
          <input
            v-model="query"
            type="text"
            placeholder="Search by name…"
            class="w-full rounded-lg border border-zinc-700/60 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-amber-500/60 transition-colors"
            autofocus
          />
        </div>

        <!-- List -->
        <div class="overflow-y-auto flex-1 px-4 pb-4 space-y-1">
          <div
            v-if="filtered.length === 0"
            class="py-6 text-center text-xs text-zinc-600"
          >No units found</div>
          <button
            v-for="c in filtered"
            :key="c.id"
            class="flex w-full items-center gap-3 rounded-xl border border-zinc-700/40 bg-zinc-800/60 px-3 py-2.5 text-left transition-all hover:border-zinc-600 hover:bg-zinc-700/60 active:scale-[0.98]"
            @click="emit('add', c); $emit('close')"
          >
            <img
              v-if="c.thumbnail"
              :src="imageUrl(c.thumbnail)"
              class="h-8 w-8 rounded-full border border-zinc-700/60 object-cover flex-shrink-0"
              :alt="c.name"
            />
            <div v-else class="h-8 w-8 rounded-full bg-zinc-700 flex-shrink-0" />
            <div class="min-w-0">
              <div class="text-sm font-semibold text-zinc-200 truncate">{{ c.name }}</div>
              <div class="text-[10px] text-zinc-500">{{ c.unitType }} · {{ c.swpCode }}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
