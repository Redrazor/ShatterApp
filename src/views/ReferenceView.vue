<script setup lang="ts">
import { ref } from 'vue'
import IconGrid from '../components/reference/IconGrid.vue'
import RulebookViewer from '../components/reference/RulebookViewer.vue'

type Tab = 'icons' | 'rulebook'
const activeTab = ref<Tab>('icons')
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-sw-gold">Reference</h1>

    <!-- Tab bar -->
    <div class="flex gap-1 border-b border-sw-gold/20 pb-0">
      <button
        v-for="tab in [{ id: 'icons', label: 'Icon Reference' }, { id: 'rulebook', label: 'Rulebook' }]"
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
    <RulebookViewer v-else-if="activeTab === 'rulebook'" />
  </div>
</template>
