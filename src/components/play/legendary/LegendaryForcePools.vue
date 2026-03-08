<script setup lang="ts">
defineProps<{
  cadre1Force: number
  cadre2Force: number
  legendForce: number
  cadreForceRefresh: number
}>()

const emit = defineEmits<{
  adjust: [player: 'cadre1' | 'cadre2' | 'legend', delta: number]
}>()
</script>

<template>
  <div class="rounded-xl border border-zinc-700/50 bg-zinc-900/80 px-4 py-3 space-y-2">
    <div class="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Force Pools</div>
    <div class="grid grid-cols-3 gap-2">

      <!-- Cadre 1 -->
      <div class="flex flex-col items-center gap-1.5 rounded-lg border border-sky-800/40 bg-sky-950/30 p-2">
        <div class="text-[9px] font-bold uppercase tracking-wider text-sky-400">Cadre 1</div>
        <div class="text-[9px]" :class="cadreForceRefresh > 0 ? 'text-sky-600' : 'invisible'">
          +{{ cadreForceRefresh }}/turn
        </div>
        <div class="text-xl font-bold tabular-nums text-sky-300">{{ cadre1Force }}</div>
        <div class="flex gap-1">
          <button
            class="rounded bg-zinc-800 px-2 py-0.5 text-sm font-bold text-sky-400
                   border border-zinc-700/50 transition-colors hover:bg-zinc-700 active:scale-95
                   disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="cadre1Force <= 0"
            @click="emit('adjust', 'cadre1', -1)"
          >−</button>
          <button
            class="rounded bg-zinc-800 px-2 py-0.5 text-sm font-bold text-sky-400
                   border border-zinc-700/50 transition-colors hover:bg-zinc-700 active:scale-95"
            @click="emit('adjust', 'cadre1', 1)"
          >+</button>
        </div>
      </div>

      <!-- Cadre 2 -->
      <div class="flex flex-col items-center gap-1.5 rounded-lg border border-indigo-800/40 bg-indigo-950/30 p-2">
        <div class="text-[9px] font-bold uppercase tracking-wider text-indigo-400">Cadre 2</div>
        <div class="text-[9px]" :class="cadreForceRefresh > 0 ? 'text-indigo-600' : 'invisible'">
          +{{ cadreForceRefresh }}/turn
        </div>
        <div class="text-xl font-bold tabular-nums text-indigo-300">{{ cadre2Force }}</div>
        <div class="flex gap-1">
          <button
            class="rounded bg-zinc-800 px-2 py-0.5 text-sm font-bold text-indigo-400
                   border border-zinc-700/50 transition-colors hover:bg-zinc-700 active:scale-95
                   disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="cadre2Force <= 0"
            @click="emit('adjust', 'cadre2', -1)"
          >−</button>
          <button
            class="rounded bg-zinc-800 px-2 py-0.5 text-sm font-bold text-indigo-400
                   border border-zinc-700/50 transition-colors hover:bg-zinc-700 active:scale-95"
            @click="emit('adjust', 'cadre2', 1)"
          >+</button>
        </div>
      </div>

      <!-- Galactic Legend -->
      <div class="flex flex-col items-center gap-1.5 rounded-lg border border-amber-800/40 bg-amber-950/30 p-2">
        <div class="text-[9px] font-bold uppercase tracking-wider text-amber-400">GL</div>
        <div class="text-[9px] invisible">—</div>
        <div class="text-xl font-bold tabular-nums text-amber-300">{{ legendForce }}</div>
        <div class="flex gap-1">
          <button
            class="rounded bg-zinc-800 px-2 py-0.5 text-sm font-bold text-amber-400
                   border border-zinc-700/50 transition-colors hover:bg-zinc-700 active:scale-95
                   disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="legendForce <= 0"
            @click="emit('adjust', 'legend', -1)"
          >−</button>
          <button
            class="rounded bg-zinc-800 px-2 py-0.5 text-sm font-bold text-amber-400
                   border border-zinc-700/50 transition-colors hover:bg-zinc-700 active:scale-95"
            @click="emit('adjust', 'legend', 1)"
          >+</button>
        </div>
      </div>

    </div>
  </div>
</template>
