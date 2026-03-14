<script setup lang="ts">
import { useRollSessionStore } from '../../../stores/rollSession.ts'
import { useDiceRoom } from '../../../composables/useDiceRoom.ts'

const emit = defineEmits<{ (e: 'left'): void }>()
const session = useRollSessionStore()
const diceRoom = useDiceRoom()

function leave() {
  diceRoom.leaveRoom()
  session.reset()
  emit('left')
}
</script>

<template>
  <div class="flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2">
    <!-- Room code -->
    <span class="font-mono text-sm font-bold text-amber-400">{{ session.roomCode }}</span>

    <!-- Player names -->
    <div class="flex flex-1 items-center gap-1.5 min-w-0">
      <span class="text-[11px] font-semibold text-zinc-300 truncate">{{ session.playerName ?? '…' }}</span>
      <span class="text-[10px] text-zinc-600">vs</span>
      <span class="text-[11px] font-semibold truncate"
        :class="session.opponentOnline ? 'text-zinc-300' : 'text-zinc-600'">
        {{ session.opponentName ?? (session.opponentOnline ? '…' : 'Waiting…') }}
      </span>
      <span
        class="inline-block h-2 w-2 rounded-full shrink-0 transition-colors"
        :class="session.opponentOnline ? 'bg-green-400 animate-pulse' : 'bg-zinc-600'"
      />
    </div>

    <!-- Leave button -->
    <button
      class="rounded-lg border border-zinc-600/60 px-2.5 py-1 text-[10px] font-semibold text-zinc-500
             transition-all hover:border-red-500/40 hover:text-red-400 active:scale-95"
      @click="leave"
    >Leave</button>
  </div>
</template>
