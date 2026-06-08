<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRollSessionStore } from '../../../stores/rollSession.ts'
import OpponentRoster from './OpponentRoster.vue'
import type { PlayUnit, ForcePoolPayload, OrderDeckState } from '../../../types/index.ts'

const session = useRollSessionStore()

// Teammates first, then opponents (ordered by the store).
const players = computed(() => session.otherPlayers)
const selectedId = ref<string | null>(players.value[0]?.socketId ?? null)

// Keep the selection valid as players join / leave.
watch(players, (list) => {
  if (!list.some((p) => p.socketId === selectedId.value)) {
    selectedId.value = list[0]?.socketId ?? null
  }
})

const selected = computed(() => players.value.find((p) => p.socketId === selectedId.value) ?? null)
const selectedUnits = computed<PlayUnit[]>(() =>
  selectedId.value ? session.playerUnits[selectedId.value] ?? [] : [],
)
const selectedForcePool = computed<ForcePoolPayload | null>(() =>
  selectedId.value ? session.playerForcePools[selectedId.value] ?? null : null,
)
const selectedDeck = computed<OrderDeckState | null>(() =>
  selectedId.value ? session.playerDecks[selectedId.value] ?? null : null,
)

function relation(team?: string | null): string {
  if (!team) return ''
  return team === session.myTeam ? 'teammate' : 'opponent'
}
</script>

<template>
  <div class="space-y-2">
    <div v-if="players.length === 0" class="rounded-xl border border-zinc-700/30 bg-zinc-900/40 px-4 py-5 text-center text-xs text-zinc-600">
      Waiting for other players…
    </div>

    <template v-else>
      <!-- Player sub-tabs -->
      <div class="flex gap-1 rounded-lg border border-zinc-700/40 bg-zinc-900/40 p-1">
        <button
          v-for="p in players"
          :key="p.socketId"
          type="button"
          class="flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 text-[11px] font-bold transition-all min-w-0"
          :class="selectedId === p.socketId
            ? (p.team === 'red' ? 'bg-red-500/15 text-red-300' : p.team === 'blue' ? 'bg-sky-500/15 text-sky-300' : 'bg-zinc-700 text-zinc-100')
            : (p.team === 'red' ? 'text-red-400/70 hover:text-red-300' : p.team === 'blue' ? 'text-sky-400/70 hover:text-sky-300' : 'text-zinc-500 hover:text-zinc-300')"
          @click="selectedId = p.socketId"
        >
          <span
            class="h-1.5 w-1.5 shrink-0 rounded-full"
            :class="p.team === 'red' ? 'bg-red-400' : p.team === 'blue' ? 'bg-sky-400' : 'bg-zinc-500'"
          />
          <span class="truncate">{{ p.name ?? 'Player' }}</span>
        </button>
      </div>

      <!-- Selected player's roster -->
      <div
        class="rounded-xl border overflow-hidden"
        :class="selected?.team === 'red' ? 'border-red-500/30' : selected?.team === 'blue' ? 'border-sky-500/30' : 'border-zinc-700/30'"
      >
        <div
          class="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em]"
          :class="selected?.team === 'red' ? 'bg-red-500/10 text-red-300/90' : selected?.team === 'blue' ? 'bg-sky-500/10 text-sky-300/90' : 'bg-zinc-800/40 text-zinc-400'"
        >
          {{ selected?.team ?? '—' }} · {{ selected?.name ?? 'Player' }}
          <span v-if="relation(selected?.team)" class="text-zinc-500 normal-case font-semibold">({{ relation(selected?.team) }})</span>
          <span v-if="selected && !selected.connected" class="text-zinc-600 normal-case font-semibold">· offline</span>
        </div>
        <div class="p-2">
          <OpponentRoster
            :units="selectedUnits"
            :display-name="selected?.name"
            :force-pool="selectedForcePool"
            :team="selected?.team ?? null"
            :deck-state="selectedDeck"
          />
        </div>
      </div>
    </template>
  </div>
</template>
