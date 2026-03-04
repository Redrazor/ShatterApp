<script setup lang="ts">
import type { Character } from '../../types/index.ts'
import { imageUrl, eraIconMap } from '../../utils/imageUrl.ts'

const props = defineProps<{
  a: Character
  b: Character
}>()

defineEmits<{ (e: 'close'): void }>()


function eras(char: Character) {
  return char.era.split(';').map(e => e.trim()).filter(Boolean)
}

const rows: { label: string; key: (c: Character) => string | number }[] = [
  { label: 'Type',       key: c => c.unitType },
  { label: 'SP',         key: c => c.sp ?? '–' },
  { label: 'PC',         key: c => c.pc ?? '–' },
  { label: 'Durability', key: c => c.durability },
  { label: 'Stamina',    key: c => c.stamina },
  { label: 'FP',         key: c => c.fp },
]

function better(field: { key: (c: Character) => string | number }, side: 'a' | 'b') {
  const va = Number(field.key(props.a))
  const vb = Number(field.key(props.b))
  if (isNaN(va) || isNaN(vb)) return false
  return side === 'a' ? va > vb : vb > va
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        class="fixed inset-0 z-[70] flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/70" @click="$emit('close')" />

        <div class="relative z-10 w-full max-w-lg rounded-xl border border-sw-gold/30 bg-sw-card shadow-2xl overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-sw-gold/20 px-4 py-3">
            <h2 class="font-semibold text-sw-gold">Compare</h2>
            <button class="text-sw-text/60 hover:text-sw-text" @click="$emit('close')">✕</button>
          </div>

          <!-- Unit headers -->
          <div class="grid grid-cols-2 gap-px bg-sw-gold/10">
            <div v-for="char in [a, b]" :key="char.id" class="flex flex-col items-center gap-2 bg-sw-card p-4">
              <img
                v-if="char.thumbnail"
                :src="imageUrl(char.thumbnail)"
                :alt="char.name"
                class="h-20 w-20 rounded-lg object-contain bg-sw-dark"
              />
              <div v-else class="flex h-20 w-20 items-center justify-center rounded-lg bg-sw-dark text-4xl text-sw-text/20">⚔</div>
              <p class="text-center text-sm font-semibold text-sw-text leading-snug">{{ char.name }}</p>
              <div class="flex gap-1">
                <img v-for="era in eras(char)" :key="era" :src="eraIconMap[era] ?? ''" :alt="era"
                  class="h-4 w-4" style="filter:brightness(0) invert(1); opacity:0.7" />
              </div>
              <div class="flex flex-wrap gap-1 justify-center">
                <span v-for="tag in char.tags.slice(0, 4)" :key="tag"
                  class="rounded-full border border-sw-gold/20 px-1.5 py-0.5 text-[9px] text-sw-text/60">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>

          <!-- Stat rows -->
          <div class="divide-y divide-sw-gold/10">
            <div v-for="row in rows" :key="row.label" class="grid grid-cols-[1fr_auto_1fr] items-center">
              <div
                :class="['px-4 py-2 text-right text-sm font-medium transition-colors',
                  better(row, 'a') ? 'text-green-400' : 'text-sw-text/70']"
              >{{ row.key(a) }}</div>
              <div class="px-3 py-2 text-center text-[10px] uppercase tracking-widest text-sw-text/40 whitespace-nowrap">{{ row.label }}</div>
              <div
                :class="['px-4 py-2 text-left text-sm font-medium transition-colors',
                  better(row, 'b') ? 'text-green-400' : 'text-sw-text/70']"
              >{{ row.key(b) }}</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
