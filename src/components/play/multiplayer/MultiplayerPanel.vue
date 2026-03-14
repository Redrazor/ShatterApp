<script setup lang="ts">
import { ref } from 'vue'
import { useDiceRoom } from '../../../composables/useDiceRoom.ts'
import { useRollSessionStore } from '../../../stores/rollSession.ts'
import { randomSwName } from '../../../utils/starWarsNames.ts'

const emit = defineEmits<{ (e: 'connected'): void }>()

const diceRoom = useDiceRoom()
const session = useRollSessionStore()

const playerName = ref(randomSwName())
const joinCode = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function handleCreate() {
  loading.value = true
  error.value = null
  try {
    const name = playerName.value.trim() || randomSwName()
    session.setPlayerName(name)
    const code = await diceRoom.createRoom(name)
    session.setRoom(code, true)
    emit('connected')
  } catch (e) {
    error.value = 'Failed to create room'
  } finally {
    loading.value = false
  }
}

async function handleJoin() {
  const code = joinCode.value.trim().toUpperCase()
  if (code.length !== 4) {
    error.value = 'Enter a 4-character room code'
    return
  }
  loading.value = true
  error.value = null
  try {
    const name = playerName.value.trim() || randomSwName()
    session.setPlayerName(name)
    const result = await diceRoom.joinRoom(code, name)
    if (result.success) {
      session.setRoom(code, false)
      if (result.opponentName) session.setOpponentName(result.opponentName)
      emit('connected')
    } else {
      error.value = result.error ?? 'Failed to join room'
    }
  } catch {
    error.value = 'Connection failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="rounded-2xl border border-zinc-700/40 bg-zinc-900/60 p-5 space-y-5">
    <div class="text-center space-y-1">
      <div class="text-2xl">🔗</div>
      <div class="text-sm font-bold text-zinc-200">Multiplayer</div>
      <div class="text-xs text-zinc-600">Play with a friend at the same table or remotely</div>
    </div>

    <!-- Player name -->
    <div>
      <label class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Your name</label>
      <input
        v-model="playerName"
        type="text"
        maxlength="20"
        placeholder="Enter your name…"
        class="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100
               placeholder:text-zinc-600 focus:border-amber-500/60 focus:outline-none"
      />
    </div>

    <div v-if="error" class="rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-xs text-red-400">
      {{ error }}
    </div>

    <!-- Create room -->
    <button
      :disabled="loading"
      class="w-full rounded-xl bg-amber-500 px-4 py-3 font-bold text-zinc-900
             shadow-[0_4px_0_0_rgba(0,0,0,0.4)] transition-all
             hover:bg-amber-400 active:shadow-[0_1px_0_0_rgba(0,0,0,0.4)] active:translate-y-[3px]
             disabled:opacity-50 disabled:cursor-not-allowed"
      @click="handleCreate"
    >
      {{ loading ? 'Connecting…' : 'Create Room' }}
    </button>

    <div class="flex items-center gap-2">
      <div class="flex-1 h-px bg-zinc-700/50" />
      <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-600">or</span>
      <div class="flex-1 h-px bg-zinc-700/50" />
    </div>

    <!-- Join room -->
    <div class="flex gap-2">
      <input
        v-model="joinCode"
        type="text"
        maxlength="4"
        placeholder="ABCD"
        class="flex-1 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-center
               font-mono text-lg font-bold uppercase tracking-widest text-zinc-100
               placeholder:text-zinc-700 focus:border-amber-500/60 focus:outline-none"
        @keydown.enter="handleJoin"
      />
      <button
        :disabled="loading || joinCode.length !== 4"
        class="rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2 font-semibold text-zinc-300
               transition-all hover:border-zinc-500 hover:text-zinc-100 active:scale-95
               disabled:opacity-40 disabled:cursor-not-allowed"
        @click="handleJoin"
      >Join</button>
    </div>
  </div>
</template>
