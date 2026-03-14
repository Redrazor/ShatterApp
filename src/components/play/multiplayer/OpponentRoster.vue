<script setup lang="ts">
import type { PlayUnit } from '../../../types/index.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'

defineProps<{ units: PlayUnit[] }>()
</script>

<template>
  <div class="space-y-2">
    <div class="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 pt-1">
      Opponent's Team
    </div>

    <div v-if="units.length === 0"
      class="rounded-xl border border-zinc-700/30 bg-zinc-900/40 px-4 py-5 text-center text-xs text-zinc-600"
    >
      Waiting for opponent…
    </div>

    <template v-else>
      <div
        v-for="unit in units"
        :key="unit.id"
        class="flex items-center gap-3 rounded-xl border border-zinc-700/30 bg-zinc-900/60 px-3 py-2.5"
        :class="{ 'opacity-50': unit.wounds >= unit.durability }"
      >
        <!-- Thumbnail -->
        <img
          :src="imageUrl(unit.thumbnail)"
          :alt="unit.name"
          class="h-10 w-10 rounded-full border border-zinc-700 object-cover flex-shrink-0"
        />

        <!-- Name + status -->
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-zinc-200 truncate">{{ unit.name }}</div>
          <div class="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500">
            <span>DMG {{ unit.damage }}/{{ unit.stamina }}</span>
            <span v-if="unit.wounds > 0" class="text-red-400">{{ unit.wounds }} wound{{ unit.wounds !== 1 ? 's' : '' }}</span>
          </div>
        </div>

        <!-- Conditions -->
        <div class="flex gap-1 flex-shrink-0">
          <span
            v-for="c in unit.conditions"
            :key="c"
            class="rounded bg-zinc-700/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-400"
          >{{ c[0] }}</span>
        </div>

        <!-- Removed badge -->
        <div
          v-if="unit.wounds >= unit.durability"
          class="rounded-full bg-red-900/60 border border-red-700/40 px-2 py-0.5 text-[9px] font-bold text-red-400 flex-shrink-0"
        >OUT</div>
      </div>
    </template>
  </div>
</template>
