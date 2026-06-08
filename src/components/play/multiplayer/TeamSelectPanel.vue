<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRollSessionStore } from '../../../stores/rollSession.ts'
import { useDiceRoom } from '../../../composables/useDiceRoom.ts'
import type { Team, RoomPlayerView } from '../../../types/index.ts'

const props = defineProps<{ skirmishOk: boolean }>()
const emit = defineEmits<{ (e: 'left'): void }>()

const session = useRollSessionStore()
const diceRoom = useDiceRoom()
const error = ref<string | null>(null)
const busy = ref(false)

function teamPlayers(team: Team): RoomPlayerView[] {
  return session.players.filter((p) => p.team === team && p.connected)
}
const redPlayers = computed(() => teamPlayers('red'))
const bluePlayers = computed(() => teamPlayers('blue'))
const connectedCount = computed(() => session.players.filter((p) => p.connected).length)

function teamFull(team: Team): boolean {
  return session.players.filter((p) => p.team === team && p.connected && p.socketId !== session.mySocketId).length >= 2
}

function initials(name?: string): string {
  if (!name) return '?'
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

async function pick(team: Team) {
  if (busy.value) return
  busy.value = true
  error.value = null
  const res = await diceRoom.selectTeam(team)
  if (!res.ok) {
    error.value = res.reason === 'team-full' ? 'That team is already full.' : 'Could not join that team.'
  }
  busy.value = false
}

function leave() {
  diceRoom.leaveRoom()
  session.reset()
  emit('left')
}
</script>

<template>
  <div class="rounded-2xl border border-zinc-700/40 bg-zinc-900/60 p-5 space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="font-mono text-lg font-bold tracking-widest text-amber-400">{{ session.roomCode }}</span>
        <span
          class="rounded-full border px-2 py-0.5 text-[10px] font-bold"
          :class="props.skirmishOk
            ? 'border-emerald-500/40 bg-emerald-900/20 text-emerald-400'
            : 'border-red-500/40 bg-red-900/20 text-red-400'"
        >{{ props.skirmishOk ? 'Skirmish ✓' : 'Not Skirmish' }}</span>
      </div>
      <span class="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">2v2</span>
    </div>

    <!-- Skirmish warning -->
    <div
      v-if="!props.skirmishOk"
      class="rounded-xl border border-red-500/30 bg-red-950/20 px-3 py-2.5 text-xs text-red-300"
    >
      Your build isn't in <span class="font-bold">Skirmish</span> mode. 2v2 needs exactly one squad —
      open <RouterLink to="/build" class="font-bold underline">Build → Skirmish</RouterLink> to switch before you can lock your roster.
    </div>

    <div class="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Choose your team</div>

    <!-- Team columns -->
    <div class="grid grid-cols-2 gap-3">
      <!-- RED -->
      <div class="rounded-xl border border-red-500/40 bg-red-950/20 p-2.5 space-y-2">
        <div class="text-center text-[10px] font-extrabold uppercase tracking-[0.2em] text-red-400">Red</div>
        <div
          v-for="p in redPlayers"
          :key="p.socketId"
          class="flex items-center gap-2 rounded-lg border border-red-500/30 bg-zinc-900/60 px-2 py-1.5"
        >
          <span class="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/20 text-[11px] font-bold text-red-300 ring-1 ring-red-400/40">{{ initials(p.name) }}</span>
          <div class="min-w-0 flex-1">
            <div class="truncate text-xs font-semibold text-zinc-100">{{ p.name ?? 'Player' }}</div>
            <div v-if="p.socketId === session.mySocketId" class="text-[9px] font-bold uppercase tracking-wider text-amber-400">you</div>
          </div>
          <span class="h-2 w-2 rounded-full bg-green-400"></span>
        </div>
        <div
          v-for="i in Math.max(0, 2 - redPlayers.length)"
          :key="`re-${i}`"
          class="flex items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-900/30 px-2 py-2 text-[10px] text-zinc-600"
        >empty slot</div>
      </div>
      <!-- BLUE -->
      <div class="rounded-xl border border-sky-500/40 bg-sky-950/20 p-2.5 space-y-2">
        <div class="text-center text-[10px] font-extrabold uppercase tracking-[0.2em] text-sky-400">Blue</div>
        <div
          v-for="p in bluePlayers"
          :key="p.socketId"
          class="flex items-center gap-2 rounded-lg border border-sky-500/30 bg-zinc-900/60 px-2 py-1.5"
        >
          <span class="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/20 text-[11px] font-bold text-sky-300 ring-1 ring-sky-400/40">{{ initials(p.name) }}</span>
          <div class="min-w-0 flex-1">
            <div class="truncate text-xs font-semibold text-zinc-100">{{ p.name ?? 'Player' }}</div>
            <div v-if="p.socketId === session.mySocketId" class="text-[9px] font-bold uppercase tracking-wider text-amber-400">you</div>
          </div>
          <span class="h-2 w-2 rounded-full bg-green-400"></span>
        </div>
        <div
          v-for="i in Math.max(0, 2 - bluePlayers.length)"
          :key="`be-${i}`"
          class="flex items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-900/30 px-2 py-2 text-[10px] text-zinc-600"
        >empty slot</div>
      </div>
    </div>

    <div v-if="error" class="rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-xs text-red-400">{{ error }}</div>

    <!-- Pick buttons -->
    <div class="grid grid-cols-2 gap-3">
      <button
        type="button"
        :disabled="busy || teamFull('red')"
        class="rounded-xl border px-3 py-2.5 text-sm font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        :class="session.myTeam === 'red'
          ? 'border-red-400 bg-red-500/25 text-red-200'
          : 'border-red-500/60 bg-red-500/15 text-red-300 hover:bg-red-500/25'"
        @click="pick('red')"
      >{{ teamFull('red') ? 'Red full' : session.myTeam === 'red' ? 'On Red ✓' : 'Join Red' }}</button>
      <button
        type="button"
        :disabled="busy || teamFull('blue')"
        class="rounded-xl border px-3 py-2.5 text-sm font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        :class="session.myTeam === 'blue'
          ? 'border-sky-400 bg-sky-500/25 text-sky-200'
          : 'border-sky-500/60 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'"
        @click="pick('blue')"
      >{{ teamFull('blue') ? 'Blue full' : session.myTeam === 'blue' ? 'On Blue ✓' : 'Join Blue' }}</button>
    </div>

    <!-- Status -->
    <div class="flex items-center justify-center gap-2 rounded-xl border border-zinc-700/50 bg-zinc-900/60 px-3 py-2.5">
      <span class="h-2.5 w-2.5 rounded-full" :class="session.matchReady ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'"></span>
      <span class="text-xs font-semibold" :class="session.matchReady ? 'text-emerald-400' : 'text-zinc-400'">
        {{ session.matchReady ? 'Match ready!' : `${connectedCount} / 4 players · waiting for full teams` }}
      </span>
    </div>

    <button
      class="w-full rounded-lg border border-zinc-700 px-3 py-2 text-[11px] font-semibold text-zinc-500 transition-colors hover:border-red-500/40 hover:text-red-400"
      @click="leave"
    >Leave room</button>
  </div>
</template>
