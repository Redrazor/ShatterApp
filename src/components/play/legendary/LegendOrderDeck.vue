<script setup lang="ts">
import type { LegendaryOrderCard } from '../../../types/index.ts'

const props = defineProps<{
  orderCards: LegendaryOrderCard[]
  usedIds: string[]
  shatterpointRevealed: boolean
}>()

const emit = defineEmits<{
  toggleCard: [id: string]
  toggleShatterpoint: []
  reshuffle: []
}>()

function isUsed(id: string): boolean {
  return props.usedIds.includes(id)
}

function cardClass(id: string): string {
  const used = isUsed(id)
  return used
    ? 'rounded-lg border border-zinc-700/30 bg-zinc-800/40 p-2.5 opacity-40 cursor-pointer transition-all hover:opacity-60'
    : 'rounded-lg border border-zinc-600/50 bg-zinc-800 p-2.5 cursor-pointer transition-all hover:border-amber-600/40 hover:bg-zinc-700/60 active:scale-95'
}

// The Legend Ability that will trigger if Shatterpoint is drawn
const nextLegendAbility = props.orderCards.find(c => !props.usedIds.includes(c.id))?.legendAbility ?? null
</script>

<template>
  <div class="rounded-xl border border-zinc-700/50 bg-zinc-900/80 px-4 py-3 space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">GL Order Deck</div>
      <button
        class="rounded border border-zinc-600/40 bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400
               transition-colors hover:border-zinc-500 hover:text-zinc-200 active:scale-95"
        @click="emit('reshuffle')"
      >Reshuffle</button>
    </div>

    <!-- Reshuffle reminder shown when all cards are used -->
    <div
      v-if="usedIds.length === orderCards.length && orderCards.length > 0"
      class="rounded-lg border border-amber-700/30 bg-amber-950/40 px-3 py-2 text-[11px] text-amber-400"
    >
      Deck exhausted. On reshuffle, GL does <strong>not</strong> refresh Force.
    </div>

    <!-- Order cards grid -->
    <div v-if="orderCards.length > 0" class="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
      <div
        v-for="card in orderCards"
        :key="card.id"
        :class="cardClass(card.id)"
        @click="emit('toggleCard', card.id)"
      >
        <div class="flex items-start justify-between gap-1">
          <div class="text-[10px] font-bold leading-tight text-zinc-200">{{ card.name }}</div>
          <div
            v-if="card.forceRefresh > 0"
            class="shrink-0 rounded border border-sky-800/50 bg-sky-950/60 px-1 py-0.5 text-[9px] font-bold text-sky-400"
          >+{{ card.forceRefresh }}F</div>
          <div
            v-else
            class="shrink-0 rounded border border-zinc-700/40 bg-zinc-900 px-1 py-0.5 text-[9px] text-zinc-600"
          >0F</div>
        </div>
        <div class="mt-1 text-[9px] leading-tight text-zinc-500 line-clamp-2">{{ card.effect }}</div>
        <div
          v-if="isUsed(card.id)"
          class="mt-1 text-[9px] font-bold uppercase tracking-wide text-zinc-600"
        >Used</div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="rounded-lg border border-zinc-700/30 bg-zinc-800/40 px-3 py-4 text-center text-[11px] text-zinc-600"
    >
      No order cards configured for this Galactic Legend yet.
    </div>

    <!-- Shatterpoint card -->
    <div
      :class="[
        'rounded-lg border p-2.5 cursor-pointer transition-all',
        shatterpointRevealed
          ? 'border-amber-700/50 bg-amber-950/50 opacity-70'
          : 'border-amber-600/30 bg-amber-950/20 hover:border-amber-500/50 hover:bg-amber-950/40 active:scale-95'
      ]"
      @click="emit('toggleShatterpoint')"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="text-[10px] font-bold text-amber-400">⚡ Shatterpoint Card</div>
        <div
          v-if="shatterpointRevealed"
          class="text-[9px] font-bold uppercase tracking-wide text-amber-600"
        >Revealed</div>
      </div>
      <div class="mt-1 text-[9px] text-zinc-500">
        When revealed: other card is auto-chosen AND its Legend Ability triggers.
      </div>
      <!-- Show next Legend Ability if Shatterpoint comes up -->
      <div
        v-if="!shatterpointRevealed && nextLegendAbility && orderCards.length > 0"
        class="mt-1.5 rounded border border-amber-800/30 bg-amber-950/40 px-2 py-1"
      >
        <div class="text-[8px] font-bold uppercase tracking-wide text-amber-700">Next Legend Ability</div>
        <div class="mt-0.5 text-[9px] text-amber-500">{{ nextLegendAbility }}</div>
      </div>
    </div>
  </div>
</template>
