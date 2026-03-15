<script setup lang="ts">
import { useHead } from '@vueuse/head'
import DiceRoller from '../components/dice/DiceRoller.vue'

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
    <DiceRoller />
  </div>
</template>
