<script setup lang="ts">
import { ref } from 'vue'
import { useHead } from '@vueuse/head'
import IconGrid from '../components/reference/IconGrid.vue'
import KeywordReference from '../components/reference/KeywordReference.vue'
import RulebookViewer from '../components/reference/RulebookViewer.vue'

type Tab = 'icons' | 'keywords' | 'rulebook'
const activeTab = ref<Tab>('icons')

useHead({
  title: 'Rules Reference — ShatterApp',
  meta: [
    { name: 'description', content: 'Quick-reference for Star Wars: Shatterpoint keywords, icons, and game rules.' },
    { property: 'og:title', content: 'Rules Reference — ShatterApp' },
    { property: 'og:description', content: 'Quick-reference for Star Wars: Shatterpoint keywords, icons, and game rules.' },
    { property: 'og:url', content: 'https://shatterapp.com/reference' },
  ],
  link: [{ rel: 'canonical', href: 'https://shatterapp.com/reference' }],
})
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-sw-gold">Reference</h1>

    <!-- Tab bar -->
    <div class="flex gap-1 border-b border-sw-gold/20 pb-0">
      <button
        v-for="tab in [{ id: 'icons', label: 'Icon Reference' }, { id: 'keywords', label: 'Keyword Reference' }, { id: 'rulebook', label: 'Rulebook' }]"
        :key="tab.id"
        :class="[
          'rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
          activeTab === tab.id
            ? 'bg-sw-gold/10 text-sw-gold border border-b-0 border-sw-gold/30'
            : 'text-sw-text/60 hover:text-sw-gold',
        ]"
        @click="activeTab = tab.id as Tab"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab content -->
    <IconGrid v-if="activeTab === 'icons'" />
    <KeywordReference v-else-if="activeTab === 'keywords'" />
    <RulebookViewer v-else-if="activeTab === 'rulebook'" />
  </div>
</template>
