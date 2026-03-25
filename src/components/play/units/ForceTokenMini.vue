<script setup lang="ts">
withDefaults(defineProps<{ size?: string }>(), { size: 'h-4 w-4' })
</script>

<template>
  <svg :class="size" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Force cost">
    <circle cx="50" cy="50" r="49" fill="#1c1917"/>
    <circle cx="50" cy="50" r="43" fill="#fef9c3"/>
    <polygon
      points="50,10 54,40 74,26 60,46 90,50 60,54 74,74 54,60 50,90 46,60 26,74 40,54 10,50 40,46 26,26 46,40"
      fill="#f97316"
    />
    <circle cx="50" cy="50" r="9" fill="#fef9c3"/>
    <circle cx="50" cy="50" r="3.5" fill="#c2410c"/>
  </svg>
</template>
