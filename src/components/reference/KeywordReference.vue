<script setup lang="ts">
import { ref, computed } from 'vue'
import { RULE_KEYWORDS } from '../../utils/ruleKeywords.ts'

const search = ref('')

const sorted = computed(() => {
  const q = search.value.toLowerCase().trim()
  return Object.entries(RULE_KEYWORDS)
    .filter(([key, kw]) =>
      !q || key.toLowerCase().includes(q) || kw.description.toLowerCase().includes(q)
    )
    .sort(([a], [b]) => a.localeCompare(b))
})
</script>

<template>
  <div class="space-y-4">
    <!-- Search -->
    <input
      v-model="search"
      type="search"
      placeholder="Search keywords…"
      class="w-full rounded-lg border border-sw-gold/30 bg-sw-dark px-3 py-2 text-sm text-sw-text placeholder-sw-text/30 focus:border-sw-gold focus:outline-none"
    />

    <!-- No results -->
    <div v-if="sorted.length === 0" class="py-8 text-center text-sw-text/40">
      No keywords match "{{ search }}"
    </div>

    <!-- Keyword list -->
    <div v-else class="space-y-2">
      <div
        v-for="([, kw]) in sorted"
        :key="kw.label"
        class="rounded-lg border border-sw-gold/10 bg-sw-card/40 px-4 py-3"
      >
        <div class="font-bold text-amber-400 text-sm mb-1">{{ kw.label }}</div>
        <p class="text-xs text-sw-text/70 leading-relaxed">{{ kw.description }}</p>
      </div>
    </div>
  </div>
</template>
