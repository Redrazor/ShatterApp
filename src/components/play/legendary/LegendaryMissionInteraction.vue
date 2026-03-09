<script setup lang="ts">
import type { LegendaryMission } from '../../../types/index.ts'
import MakeAnEntrance from './MakeAnEntrance.vue'
import UninvitedGuests from './UninvitedGuests.vue'

defineProps<{
  mission: LegendaryMission
}>()
</script>

<template>
  <MakeAnEntrance v-if="mission.id === 1" />
  <UninvitedGuests v-else-if="mission.id === 2" />

  <!-- Fallback for future missions -->
  <div
    v-else
    class="rounded-xl border border-zinc-700/30 bg-zinc-900/60 px-4 py-6 text-center"
  >
    <div class="text-2xl mb-2">⚡</div>
    <div class="text-[11px] font-semibold text-zinc-500">{{ mission.name }}</div>
    <div class="mt-1 text-[10px] text-zinc-700">Mission dashboard coming soon</div>
  </div>
</template>
