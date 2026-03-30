<script setup lang="ts">
import { ref } from 'vue'
import type { Product, Character } from '../../types/index.ts'
import { imageUrl } from '../../utils/imageUrl.ts'

defineProps<{
  product: Product
  owned: boolean
  chars: Character[]
  ownedCharacterIds: Set<number>
  showPainted?: boolean
  showBased?: boolean
  paintedCharacterIds?: Set<number>
  basedCharacterIds?: Set<number>
}>()

defineEmits<{
  (e: 'toggle'): void
  (e: 'toggleCharacter', id: number): void
  (e: 'togglePainted', id: number): void
  (e: 'toggleBased', id: number): void
}>()

const expanded = ref(false)
</script>

<template>
  <div
    :class="[
      'flex flex-col overflow-hidden rounded-xl border shadow-lg transition-all',
      owned
        ? 'border-sw-gold bg-sw-card shadow-sw-gold/20'
        : 'border-sw-gold/20 bg-sw-card',
    ]"
  >
    <!-- Product image -->
    <div class="aspect-[4/3] w-full overflow-hidden bg-sw-dark pt-[15px]">
      <img
        v-if="product.mainImage || product.thumbnail"
        :src="imageUrl(product.mainImage || product.thumbnail)"
        :alt="product.name"
        class="h-full w-full object-contain"
        loading="lazy"
      />
      <div v-else class="flex h-full items-center justify-center text-4xl text-sw-text/20">📦</div>
    </div>

    <!-- Info -->
    <div class="flex flex-1 flex-col gap-2 p-3">
      <h3 class="text-sm font-semibold leading-tight text-sw-text">{{ product.name }}</h3>
      <p class="text-xs text-sw-text/50">{{ product.era }} · {{ product.swp }}</p>

      <!-- Models list -->
      <ul v-if="product.models.length" class="flex-1 space-y-0.5">
        <li
          v-for="model in product.models"
          :key="model"
          class="text-xs text-sw-text/70"
        >
          • {{ model }}
        </li>
      </ul>

      <!-- Toggle button -->
      <button
        :class="[
          'mt-auto w-full rounded-lg py-1.5 text-sm font-medium transition-colors',
          owned
            ? 'bg-sw-gold text-sw-dark hover:bg-sw-gold/80'
            : 'border border-sw-gold/30 text-sw-text hover:border-sw-gold',
        ]"
        @click="$emit('toggle')"
      >
        {{ owned ? '✓ Owned' : '+ Mark Owned' }}
      </button>

      <!-- Characters expand toggle -->
      <button
        v-if="chars.length > 0"
        class="text-xs text-sw-text/40 hover:text-sw-text/70 transition-colors text-center"
        @click="expanded = !expanded"
      >
        {{ expanded ? '▲ Hide units' : `▼ Units (${chars.length})` }}
      </button>

      <!-- Individual character ownership -->
      <div v-if="expanded && chars.length > 0" class="space-y-1 pt-1 border-t border-sw-gold/10">
        <div
          v-for="char in chars"
          :key="char.id"
          class="space-y-0.5"
        >
          <!-- Owned row -->
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs text-sw-text/70 truncate">{{ char.name }}</span>
            <button
              :class="[
                'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                ownedCharacterIds.has(char.id)
                  ? 'bg-sw-gold/20 text-sw-gold'
                  : 'border border-sw-gold/20 text-sw-text/40 hover:border-sw-gold/50',
              ]"
              @click="$emit('toggleCharacter', char.id)"
            >
              {{ ownedCharacterIds.has(char.id) ? '✓' : '+' }}
            </button>
          </div>

          <!-- Painted row -->
          <div v-if="showPainted" class="flex items-center justify-between gap-2 pl-2">
            <span class="text-[10px] text-cyan-400/60">Painted</span>
            <button
              :class="[
                'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                paintedCharacterIds?.has(char.id)
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'border border-cyan-500/20 text-sw-text/30 hover:border-cyan-500/40',
              ]"
              @click="$emit('togglePainted', char.id)"
            >
              {{ paintedCharacterIds?.has(char.id) ? '✓' : '+' }}
            </button>
          </div>

          <!-- Based row -->
          <div v-if="showBased" class="flex items-center justify-between gap-2 pl-2">
            <span class="text-[10px] text-emerald-400/60">Based</span>
            <button
              :class="[
                'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                basedCharacterIds?.has(char.id)
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'border border-emerald-500/20 text-sw-text/30 hover:border-emerald-500/40',
              ]"
              @click="$emit('toggleBased', char.id)"
            >
              {{ basedCharacterIds?.has(char.id) ? '✓' : '+' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
