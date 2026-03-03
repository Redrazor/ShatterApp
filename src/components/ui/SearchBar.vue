<script setup lang="ts">
defineProps<{ modelValue: string }>()
defineEmits<{ (e: 'update:modelValue', val: string): void }>()
</script>

<template>
  <div class="relative">
    <input
      type="text"
      :value="modelValue"
      placeholder="Search units..."
      class="w-full rounded-lg border border-sw-gold/30 bg-sw-dark px-4 py-2 pl-10 text-sw-text placeholder-sw-text/40 focus:border-sw-gold focus:outline-none"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sw-text/50">🔍</span>
  </div>
</template>
