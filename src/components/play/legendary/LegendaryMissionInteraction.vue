<script setup lang="ts">
import type { LegendaryMission } from '../../../types/index.ts'

defineProps<{
  mission: LegendaryMission
}>()
</script>

<template>
  <!-- Stub: mission-specific dashboard components will be added here per mission -->
  <div
    v-if="mission.dashboardImage"
    class="rounded-xl border border-zinc-700/50 bg-zinc-900/80 overflow-hidden"
  >
    <div class="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
      Mission Dashboard
    </div>
    <img
      :src="mission.dashboardImage"
      :alt="`${mission.name} dashboard`"
      class="w-full object-contain"
    />
  </div>

  <!-- Placeholder when no dashboard image is available -->
  <div
    v-else
    class="rounded-xl border border-zinc-700/30 bg-zinc-900/60 px-4 py-6 text-center"
  >
    <div class="text-2xl mb-2">⚔</div>
    <div class="text-[11px] font-semibold text-zinc-500">{{ mission.name }}</div>
    <div class="mt-1 text-[10px] text-zinc-700">Mission dashboard coming soon</div>
  </div>
</template>
