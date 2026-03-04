<script setup lang="ts">
import type { Product } from '../../types/index.ts'
import { imageUrl } from '../../utils/imageUrl.ts'

defineProps<{
  product: Product
  owned: boolean
}>()

defineEmits<{ (e: 'toggle'): void }>()
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
    <div class="aspect-[4/3] w-full overflow-hidden bg-sw-dark">
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
    </div>
  </div>
</template>
