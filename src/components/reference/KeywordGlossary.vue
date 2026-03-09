<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKeywords } from '../../composables/useKeywords.ts'

const { keywords } = useKeywords()
const query = ref('')

const filtered = computed(() => {
  const q = query.value.toLowerCase().trim()
  return Object.entries(keywords.value).filter(([kw, def]) =>
    !q || kw.toLowerCase().includes(q) || def.toLowerCase().includes(q),
  )
})
</script>

<template>
  <div class="space-y-3">
    <!-- Search -->
    <input
      v-model="query"
      type="text"
      placeholder="Search keywords…"
      class="w-full rounded-lg border border-sw-gold/20 bg-sw-dark px-3 py-2 text-sm text-sw-text placeholder-sw-text/30 outline-none focus:border-sw-gold/50"
    />

    <!-- Loading -->
    <div v-if="Object.keys(keywords).length === 0" class="py-8 text-center text-sm text-sw-text/40">
      Loading keywords…
    </div>

    <!-- No results -->
    <div v-else-if="filtered.length === 0" class="py-8 text-center text-sm text-sw-text/40">
      No keywords match "{{ query }}"
    </div>

    <!-- Keyword list -->
    <div v-else class="divide-y divide-sw-gold/10 rounded-xl border border-sw-gold/20 bg-sw-card overflow-hidden">
      <div
        v-for="[kw, def] in filtered"
        :key="kw"
        class="px-4 py-3"
      >
        <p class="text-sm font-semibold text-sw-gold">{{ kw }}</p>
        <p class="mt-0.5 text-sm text-sw-text/70">{{ def }}</p>
      </div>
    </div>
  </div>
</template>
