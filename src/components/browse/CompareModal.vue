<script setup lang="ts">
import type { Character } from '../../types/index.ts'
import { imageUrl, eraIconMap } from '../../utils/imageUrl.ts'

const props = defineProps<{ chars: Character[] }>()
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

function isBest(field: { key: (c: Character) => string | number }, char: Character) {
  const values = props.chars.map(c => Number(field.key(c)))
  if (values.some(isNaN)) return false
  const val = Number(field.key(char))
  return val === Math.max(...values) && values.filter(v => v === val).length < values.length
}

const colClass = (n: number) => n === 2 ? 'grid-cols-2' : 'grid-cols-3'
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        class="fixed inset-0 z-[70] flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/70" @click="$emit('close')" />

        <div class="relative z-10 w-full max-w-2xl rounded-xl border border-sw-gold/30 bg-sw-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-sw-gold/20 px-4 py-3">
            <h2 class="font-semibold text-sw-gold">Compare</h2>
            <button class="text-sw-text/60 hover:text-sw-text" @click="$emit('close')">✕</button>
          </div>

          <!-- Unit headers -->
          <div :class="['grid gap-px bg-sw-gold/10', colClass(chars.length)]">
            <div v-for="char in chars" :key="char.id" class="flex flex-col items-center gap-2 bg-sw-card p-4">
              <img
                v-if="char.thumbnail"
                :src="imageUrl(char.thumbnail)"
                :alt="char.name"
                class="h-16 w-16 rounded-lg object-contain bg-sw-dark"
              />
              <div v-else class="flex h-16 w-16 items-center justify-center rounded-lg bg-sw-dark text-3xl text-sw-text/20">⚔</div>
              <p class="text-center text-xs font-semibold text-sw-text leading-snug">{{ char.name }}</p>
              <div class="flex gap-1">
                <img v-for="era in eras(char)" :key="era" :src="eraIconMap[era] ?? ''" :alt="era"
                  class="h-3 w-3" style="filter:brightness(0) invert(1); opacity:0.7" />
              </div>
            </div>
          </div>

          <!-- Stat rows -->
          <div class="divide-y divide-sw-gold/10 overflow-y-auto">
            <div v-for="row in rows" :key="row.label">
              <div class="px-4 pt-2 text-[9px] uppercase tracking-widest text-sw-text/40">{{ row.label }}</div>
              <div :class="['grid pb-2', colClass(chars.length)]">
                <div
                  v-for="char in chars"
                  :key="char.id"
                  :class="['px-4 py-1 text-center text-sm font-medium transition-colors',
                    isBest(row, char) ? 'text-green-400' : 'text-sw-text/70']"
                >{{ row.key(char) }}</div>
              </div>
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
