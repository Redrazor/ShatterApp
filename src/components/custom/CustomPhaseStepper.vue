<script setup lang="ts">
import type { BuilderPhase } from '../../types/index.ts'

const props = defineProps<{
  activePhase: BuilderPhase
  unlockedPhases: BuilderPhase[]
  completion: { front: boolean; stats: boolean; abilities: boolean; stances: boolean }
}>()

const emit = defineEmits<{
  select: [phase: BuilderPhase]
}>()

const PHASES: { phase: BuilderPhase; label: string; completionKey: keyof typeof props.completion }[] = [
  { phase: 1, label: 'Front Card', completionKey: 'front' },
  { phase: 2, label: 'Stats', completionKey: 'stats' },
  { phase: 3, label: 'Abilities', completionKey: 'abilities' },
  { phase: 4, label: 'Stances', completionKey: 'stances' },
]

function isComplete(key: keyof typeof props.completion): boolean {
  return props.completion[key]
}

function isUnlocked(phase: BuilderPhase): boolean {
  return props.unlockedPhases.includes(phase)
}
</script>

<template>
  <div class="flex items-center gap-0">
    <template v-for="(step, i) in PHASES" :key="step.phase">
      <!-- Step circle + label -->
      <div class="flex flex-col items-center gap-1 min-w-0">
        <button
          type="button"
          :disabled="!isUnlocked(step.phase)"
          class="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
          :class="[
            step.phase === activePhase
              ? 'bg-sw-gold border-sw-gold text-sw-bg'
              : isComplete(step.completionKey) && isUnlocked(step.phase)
              ? 'bg-green-600 border-green-600 text-white cursor-pointer hover:opacity-90'
              : isUnlocked(step.phase)
              ? 'bg-sw-card border-sw-gold/40 text-sw-text/60 hover:border-sw-gold/80 cursor-pointer'
              : 'bg-sw-card border-sw-text/10 text-sw-text/20 cursor-not-allowed',
          ]"
          @click="isUnlocked(step.phase) && emit('select', step.phase)"
        >
          <svg
            v-if="isComplete(step.completionKey) && isUnlocked(step.phase)"
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="3"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span v-if="!isComplete(step.completionKey) || !isUnlocked(step.phase)">{{ step.phase }}</span>
        </button>
        <span
          class="text-[10px] font-medium whitespace-nowrap"
          :class="
            step.phase === activePhase
              ? 'text-sw-gold'
              : isUnlocked(step.phase)
              ? 'text-sw-text/50'
              : 'text-sw-text/20'
          "
        >
          {{ step.label }}
        </span>
      </div>

      <!-- Connector line -->
      <div
        v-if="i < PHASES.length - 1"
        class="flex-1 h-px mx-1 mb-4"
        :class="isComplete(step.completionKey) && isUnlocked(step.phase) ? 'bg-green-600' : 'bg-sw-gold/15'"
      />
    </template>
  </div>
</template>
