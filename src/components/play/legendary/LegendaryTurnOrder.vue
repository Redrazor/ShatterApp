<script setup lang="ts">
defineProps<{
  phase: 'cadre1' | 'cadre2' | 'legend'
  round: number
}>()

const emit = defineEmits<{
  next: [incrementRound: boolean]
}>()

const PHASES: { value: 'cadre1' | 'cadre2' | 'legend'; label: string }[] = [
  { value: 'cadre1', label: 'Cadre 1' },
  { value: 'cadre2', label: 'Cadre 2' },
  { value: 'legend', label: 'Galactic Legend' },
]

function handleNext(phase: 'cadre1' | 'cadre2' | 'legend') {
  if (phase === 'legend') {
    // GL → Cadre 1 transition = new round
    if (window.confirm('End round and begin next round?')) {
      emit('next', true)
    }
  } else {
    emit('next', false)
  }
}

function pillClass(value: 'cadre1' | 'cadre2' | 'legend', current: 'cadre1' | 'cadre2' | 'legend'): string {
  const isActive = value === current
  if (!isActive) {
    return 'flex-1 rounded-lg px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-zinc-700 bg-zinc-800/50 border border-zinc-700/30 transition-all'
  }
  if (value === 'cadre1') {
    return 'flex-1 rounded-lg px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-sky-200 bg-sky-900/70 border border-sky-700/50 shadow-[0_0_10px_rgba(56,189,248,0.2)] transition-all'
  }
  if (value === 'cadre2') {
    return 'flex-1 rounded-lg px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-indigo-200 bg-indigo-900/70 border border-indigo-700/50 shadow-[0_0_10px_rgba(129,140,248,0.2)] transition-all'
  }
  return 'flex-1 rounded-lg px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-amber-200 bg-amber-900/70 border border-amber-700/50 shadow-[0_0_10px_rgba(251,191,36,0.2)] transition-all'
}
</script>

<template>
  <div class="rounded-xl border border-zinc-700/50 bg-zinc-900/80 px-4 py-3 space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Turn Order</div>
      <span class="rounded border border-zinc-700/50 bg-zinc-800 px-2 py-0.5 text-[10px] font-bold tabular-nums text-zinc-400">
        Round {{ round }}
      </span>
    </div>

    <!-- Phase pills -->
    <div class="flex gap-1.5">
      <div
        v-for="p in PHASES"
        :key="p.value"
        :class="pillClass(p.value, phase)"
      >
        <div>{{ p.label }}</div>
        <div
          v-if="p.value === phase"
          class="mt-0.5 text-[8px] font-normal normal-case tracking-normal opacity-70"
        >active</div>
      </div>
    </div>

    <!-- Next phase button -->
    <button
      class="w-full rounded-lg border border-zinc-600/50 bg-gradient-to-b from-zinc-700 to-zinc-800 px-3 py-2
             text-xs font-bold text-zinc-300 transition-all
             shadow-[0_3px_0_0_rgba(0,0,0,0.5)] hover:from-zinc-600 hover:to-zinc-700
             active:shadow-[0_1px_0_0_rgba(0,0,0,0.5)] active:translate-y-[2px]"
      @click="handleNext(phase)"
    >
      <span v-if="phase === 'cadre1'">Cadre 1 done → Cadre 2</span>
      <span v-else-if="phase === 'cadre2'">Cadre 2 done → Galactic Legend</span>
      <span v-else>GL done → End Round</span>
    </button>
  </div>
</template>
