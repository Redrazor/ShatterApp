<script setup lang="ts">
import { ref } from 'vue'
import { useHead } from '@vueuse/head'
import DiceRoller from '../components/dice/DiceRoller.vue'
import ProbabilityCalculator from '../components/dice/ProbabilityCalculator.vue'
import { useSettingsStore } from '../stores/settings.ts'

const settings = useSettingsStore()
const activeTab = ref<'roller' | 'probability'>('roller')

useHead({
  title: 'Dice Roller — ShatterApp',
  meta: [
    { name: 'description', content: 'Roll Star Wars: Shatterpoint attack and defense dice with profile-linked condition modifiers.' },
    { property: 'og:title', content: 'Dice Roller — ShatterApp' },
    { property: 'og:description', content: 'Roll Star Wars: Shatterpoint attack and defense dice with profile-linked condition modifiers.' },
    { property: 'og:url', content: 'https://shatterapp.com/roll' },
  ],
  link: [{ rel: 'canonical', href: 'https://shatterapp.com/roll' }],
})
</script>

<template>
  <div class="space-y-4">
    <h1 class="sr-only">Dice Roller</h1>

    <!-- Tab toggle — only when probability feature is enabled in settings -->
    <div v-if="settings.showProbabilityRoller" class="flex gap-1 rounded-xl bg-black/20 p-1">
      <button
        v-for="tab in [{ id: 'roller', label: 'Roller' }, { id: 'probability', label: 'Probability' }]"
        :key="tab.id"
        :class="[
          'flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
          activeTab === tab.id
            ? 'bg-sw-gold text-sw-dark'
            : 'text-sw-text/60 hover:text-sw-text',
        ]"
        @click="activeTab = tab.id as 'roller' | 'probability'"
      >{{ tab.label }}</button>
    </div>

    <DiceRoller v-if="!settings.showProbabilityRoller || activeTab === 'roller'" />
    <ProbabilityCalculator v-else-if="settings.showProbabilityRoller && activeTab === 'probability'" />
  </div>
</template>
