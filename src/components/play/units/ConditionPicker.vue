<script setup lang="ts">
import type { ConditionKey } from '../../../types/index.ts'

defineProps<{ active: ConditionKey[] }>()
const emit = defineEmits<{ (e: 'toggle', condition: ConditionKey): void; (e: 'close'): void }>()

const CONDITIONS: { key: ConditionKey; label: string; icon: string; color: string }[] = [
  { key: 'hunker',   label: 'Hunker',   icon: '🛡', color: 'border-sky-600/60 bg-sky-950/50 text-sky-300' },
  { key: 'disarmed', label: 'Disarmed', icon: '⚔', color: 'border-red-600/60 bg-red-950/50 text-red-300' },
  { key: 'strained', label: 'Strained', icon: '⚡', color: 'border-yellow-600/60 bg-yellow-950/50 text-yellow-300' },
  { key: 'exposed',  label: 'Exposed',  icon: '👁', color: 'border-orange-600/60 bg-orange-950/50 text-orange-300' },
  { key: 'pinned',   label: 'Pinned',   icon: '📌', color: 'border-purple-600/60 bg-purple-950/50 text-purple-300' },
]
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      @click.self="$emit('close')"
    >
      <div class="absolute inset-0 bg-black/70" @click="$emit('close')" />
      <div class="relative z-10 w-full max-w-xs rounded-2xl border border-zinc-700/60 bg-zinc-900 p-4 shadow-2xl">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Conditions</span>
          <button class="text-zinc-600 hover:text-zinc-300 transition-colors text-sm" @click="$emit('close')">✕</button>
        </div>
        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="c in CONDITIONS"
            :key="c.key"
            class="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all active:scale-95"
            :class="active.includes(c.key)
              ? `${c.color} shadow-sm`
              : 'border-zinc-700/50 bg-zinc-800/60 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'"
            @click="emit('toggle', c.key)"
          >
            <span class="text-lg leading-none">{{ c.icon }}</span>
            <span class="text-sm font-semibold">{{ c.label }}</span>
            <span v-if="active.includes(c.key)" class="ml-auto text-[10px] font-bold uppercase tracking-wide opacity-70">Active</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
