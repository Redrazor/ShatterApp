<script setup lang="ts">
import type { FrontCardData, HomebrewUnitType } from '../../../types/index.ts'

const props = defineProps<{
  frontCard: FrontCardData | null
}>()

const emit = defineEmits<{
  update: [patch: Partial<FrontCardData>]
}>()

const ERA_OPTIONS: string[] = ['Clone Wars', 'Empire', 'Civil War', 'New Republic']

const UNIT_TYPES: { value: HomebrewUnitType; label: string; color: string }[] = [
  { value: 'Primary', label: 'Primary', color: 'bg-sw-blue text-white' },
  { value: 'Secondary', label: 'Secondary', color: 'bg-purple-700 text-white' },
  { value: 'Support', label: 'Support', color: 'bg-green-700 text-white' },
]

function patch(data: Partial<FrontCardData>) {
  emit('update', data)
}

function toggleEra(era: string) {
  const current = (props.frontCard?.era ?? '').split(';').map(e => e.trim()).filter(Boolean)
  const idx = current.indexOf(era)
  if (idx === -1) current.push(era)
  else current.splice(idx, 1)
  patch({ era: current.join(';') })
}

function hasEra(era: string): boolean {
  return (props.frontCard?.era ?? '').split(';').map(e => e.trim()).includes(era)
}
</script>

<template>
  <div class="space-y-5">

    <!-- Unit Type -->
    <div class="space-y-2">
      <label class="text-xs font-semibold text-sw-text/50 uppercase tracking-wider">Unit Type</label>
      <div class="flex gap-2">
        <button
          v-for="type in UNIT_TYPES"
          :key="type.value"
          type="button"
          class="flex-1 rounded-lg py-2 text-sm font-semibold transition-all"
          :class="[
            frontCard?.unitType === type.value
              ? type.color + ' ring-2 ring-sw-gold'
              : 'bg-sw-card text-sw-text/60 border border-sw-gold/20 hover:border-sw-gold/50',
          ]"
          @click="patch({ unitType: type.value })"
        >
          {{ type.label }}
        </button>
      </div>
    </div>

    <!-- Name + Title -->
    <div class="space-y-2">
      <label class="text-xs font-semibold text-sw-text/50 uppercase tracking-wider">Unit Name</label>
      <input
        type="text"
        placeholder="e.g. Darth Vader"
        :value="frontCard?.name ?? ''"
        maxlength="40"
        class="w-full rounded-lg px-3 py-2 text-sm bg-sw-dark border border-sw-gold/20 text-sw-text placeholder:text-sw-text/30 focus:outline-none focus:border-sw-gold/60"
        @input="patch({ name: ($event.target as HTMLInputElement).value })"
      />
    </div>
    <div class="space-y-2">
      <label class="text-xs font-semibold text-sw-text/50 uppercase tracking-wider">
        Unit Title <span class="text-sw-text/30 font-normal normal-case">(optional)</span>
      </label>
      <input
        type="text"
        placeholder="e.g. Dark Lord of the Sith"
        :value="frontCard?.title ?? ''"
        maxlength="60"
        class="w-full rounded-lg px-3 py-2 text-sm bg-sw-dark border border-sw-gold/20 text-sw-text placeholder:text-sw-text/30 focus:outline-none focus:border-sw-gold/60"
        @input="patch({ title: ($event.target as HTMLInputElement).value })"
      />
    </div>

    <!-- Cost + FP -->
    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-2">
        <label class="text-xs font-semibold text-sw-text/50 uppercase tracking-wider">
          {{ frontCard?.unitType === 'Primary' ? 'Squad Points (SP)' : 'Point Cost (PC)' }}
        </label>
        <input
          type="number"
          min="0"
          max="99"
          :value="frontCard?.cost ?? 0"
          class="w-full rounded-lg px-3 py-2 text-sm bg-sw-dark border border-sw-gold/20 text-sw-text focus:outline-none focus:border-sw-gold/60"
          @input="patch({ cost: Math.max(0, parseInt(($event.target as HTMLInputElement).value) || 0) })"
        />
      </div>
      <div class="space-y-2">
        <label class="text-xs font-semibold text-sw-text/50 uppercase tracking-wider">
          Force Points (FP)
        </label>
        <input
          type="number"
          min="0"
          max="99"
          :value="frontCard?.fp ?? 0"
          class="w-full rounded-lg px-3 py-2 text-sm bg-sw-dark border border-sw-gold/20 text-sw-text focus:outline-none focus:border-sw-gold/60"
          @input="patch({ fp: Math.max(0, parseInt(($event.target as HTMLInputElement).value) || 0) })"
        />
      </div>
    </div>

    <!-- Era -->
    <div class="space-y-2">
      <label class="text-xs font-semibold text-sw-text/50 uppercase tracking-wider">Era</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="era in ERA_OPTIONS"
          :key="era"
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-medium transition-all border"
          :class="hasEra(era)
            ? 'bg-sw-gold text-sw-bg border-sw-gold'
            : 'bg-sw-card text-sw-text/60 border-sw-gold/20 hover:border-sw-gold/50'"
          @click="toggleEra(era)"
        >
          {{ era }}
        </button>
      </div>
    </div>


</div>
</template>
