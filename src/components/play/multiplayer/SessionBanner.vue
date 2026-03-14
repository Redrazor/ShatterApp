<script setup lang="ts">
import { useRollSessionStore } from '../../../stores/rollSession.ts'
import { useDiceRoom } from '../../../composables/useDiceRoom.ts'

const session = useRollSessionStore()
const diceRoom = useDiceRoom()

function leave() {
  diceRoom.leaveRoom()
  session.reset()
}
</script>

<template>
  <div class="flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2">
    <!-- Room code -->
    <span class="font-mono text-sm font-bold text-amber-400">{{ session.roomCode }}</span>

    <!-- Opponent status -->
    <div class="flex flex-1 items-center gap-1.5">
      <span
        class="inline-block h-2 w-2 rounded-full transition-colors"
        :class="session.opponentOnline ? 'bg-green-400 animate-pulse' : 'bg-zinc-600'"
      />
      <span class="text-[11px] text-zinc-400">
        {{ session.opponentOnline ? 'Opponent connected' : 'Waiting for opponent…' }}
      </span>
    </div>

    <!-- Leave button -->
    <button
      class="rounded-lg border border-zinc-600/60 px-2.5 py-1 text-[10px] font-semibold text-zinc-500
             transition-all hover:border-red-500/40 hover:text-red-400 active:scale-95"
      @click="leave"
    >Leave</button>
  </div>
</template>
