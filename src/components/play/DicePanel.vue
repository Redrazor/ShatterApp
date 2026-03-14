<script setup lang="ts">
import { ref, computed } from 'vue'
import DiceColumn from '../dice/DiceColumn.vue'
import DieFace from '../dice/DieFace.vue'
import { useDiceRoom } from '../../composables/useDiceRoom.ts'
import { useRollSessionStore } from '../../stores/rollSession.ts'
import type { DieState } from '../../utils/dice.ts'

const session = useRollSessionStore()
const diceRoom = useDiceRoom()

// Wire up role-related socket events
diceRoom.onRoleTaken(({ role }) => session.setRoleTaken(role))
diceRoom.onRoleAssigned(({ myRole }) => session.claimRole(myRole))
diceRoom.onRolesReset(() => {
  // Opponent triggered reset — commit active duel to history before clearing
  _commitActiveDuel()
  session.resetDuel()
})

// Summary refs used for hit calculation in solo mode
const atkSummary = ref<Record<string, number>>({})
const defSummary = ref<Record<string, number>>({})

// Current pool of my interactive column
const myPool = ref<DieState[]>([])

// Active duel pools — derived directly from known state
const atkPool = computed<DieState[]>(() =>
  session.isConnected && session.myRole
    ? session.myRole === 'attacker' ? myPool.value : session.opponentPool
    : []
)
const defPool = computed<DieState[]>(() =>
  session.isConnected && session.myRole
    ? session.myRole === 'defender' ? myPool.value : session.opponentPool
    : []
)

// Names for the active duel row
const activeAtkName = computed(() =>
  session.myRole === 'attacker' ? (session.playerName ?? 'You') : (session.opponentName ?? 'Opponent')
)
const activeDefName = computed(() =>
  session.myRole === 'defender' ? (session.playerName ?? 'You') : (session.opponentName ?? 'Opponent')
)

// Net hits — computed from pools in multiplayer; from summaries in solo
const netHits = computed<number>(() => {
  if (session.isConnected && session.myRole) {
    const crits   = atkPool.value.filter(d => d.face === 'crit').length
    const strikes = atkPool.value.filter(d => d.face === 'strike').length
    const blocks  = defPool.value.filter(d => d.face === 'block').length
    return crits + Math.max(0, strikes - blocks)
  }
  const crits   = atkSummary.value['crit']   ?? 0
  const strikes = atkSummary.value['strike'] ?? 0
  const blocks  = defSummary.value['block']  ?? 0
  return crits + Math.max(0, strikes - blocks)
})

const hasResult = computed<boolean>(() => {
  if (session.isConnected && session.myRole) {
    return myPool.value.length > 0 || session.opponentPool.length > 0
  }
  return Object.values(atkSummary.value).some(v => v > 0) ||
    Object.values(defSummary.value).some(v => v > 0)
})

const hasActiveDuel = computed(() =>
  session.isConnected && !!session.myRole &&
  (atkPool.value.length > 0 || defPool.value.length > 0)
)

function _commitActiveDuel() {
  if (!hasActiveDuel.value) return
  session.commitDuel(
    [...atkPool.value],
    [...defPool.value],
    activeAtkName.value,
    activeDefName.value,
  )
}

function claimRole(role: 'attacker' | 'defender') {
  diceRoom.claimRole(role)
}

function onAtkPoolUpdated(pool: DieState[]) {
  myPool.value = pool
  if (!session.isConnected || session.myRole !== 'attacker') return
  diceRoom.sendPoolUpdate('attacker', pool, session.playerName ?? 'Me', 'change')
}

function onDefPoolUpdated(pool: DieState[]) {
  myPool.value = pool
  if (!session.isConnected || session.myRole !== 'defender') return
  diceRoom.sendPoolUpdate('defender', pool, session.playerName ?? 'Me', 'change')
}

function onAtkRolled() {
  if (!session.isConnected || session.myRole !== 'attacker') return
  diceRoom.sendPoolUpdate('attacker', myPool.value, session.playerName ?? 'Me', 'roll')
}

function onDefRolled() {
  if (!session.isConnected || session.myRole !== 'defender') return
  diceRoom.sendPoolUpdate('defender', myPool.value, session.playerName ?? 'Me', 'roll')
}

function resetDuel() {
  _commitActiveDuel()
  myPool.value = []
  session.resetDuel()
  diceRoom.resetDuel()
}
</script>

<template>
  <div class="space-y-4">

    <!-- Role picker (multiplayer, no role claimed yet) -->
    <div v-if="session.isConnected && !session.myRole"
      class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 p-4 space-y-3"
    >
      <div class="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 text-center">
        Choose your role for this duel
      </div>
      <div class="grid grid-cols-2 gap-3">
        <button
          :disabled="session.roleTaken === 'attacker'"
          :class="session.roleTaken === 'attacker'
            ? 'rounded-xl border border-zinc-700/40 bg-zinc-900/30 px-4 py-3 font-bold text-zinc-600 cursor-not-allowed'
            : 'rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 font-bold text-amber-400 transition-all hover:bg-amber-900/40 hover:border-amber-500/70 active:scale-95'"
          @click="claimRole('attacker')"
        >⚔ Attacker{{ session.roleTaken === 'attacker' ? ' — opponent\'s role' : '' }}</button>
        <button
          :disabled="session.roleTaken === 'defender'"
          :class="session.roleTaken === 'defender'
            ? 'rounded-xl border border-zinc-700/40 bg-zinc-900/30 px-4 py-3 font-bold text-zinc-600 cursor-not-allowed'
            : 'rounded-xl border border-blue-500/40 bg-blue-950/30 px-4 py-3 font-bold text-blue-400 transition-all hover:bg-blue-900/40 hover:border-blue-500/70 active:scale-95'"
          @click="claimRole('defender')"
        >🛡 Defender{{ session.roleTaken === 'defender' ? ' — opponent\'s role' : '' }}</button>
      </div>
    </div>

    <!-- Dice columns (solo always; multiplayer only when role claimed) -->
    <template v-if="!session.isConnected || session.myRole">
      <div class="grid grid-cols-2 gap-4">
        <!-- Attack column: interactive for attacker or solo; readonly for defender -->
        <DiceColumn
          type="attack"
          :readonly="session.isConnected && session.myRole === 'defender'"
          :external-pool="session.isConnected && session.myRole === 'defender' ? session.opponentPool : undefined"
          @update:summary="s => { atkSummary = s }"
          @update:pool="onAtkPoolUpdated"
          @rolled="onAtkRolled"
        />
        <!-- Defense column: interactive for defender or solo; readonly for attacker -->
        <DiceColumn
          type="defense"
          :readonly="session.isConnected && session.myRole === 'attacker'"
          :external-pool="session.isConnected && session.myRole === 'attacker' ? session.opponentPool : undefined"
          @update:summary="s => { defSummary = s }"
          @update:pool="onDefPoolUpdated"
          @rolled="onDefRolled"
        />
      </div>

      <!-- Net Hits -->
      <div v-if="hasResult" class="rounded-xl border border-amber-500/20 bg-amber-950/20 px-4 py-3 text-center">
        <div class="text-[10px] font-bold uppercase tracking-widest text-amber-500/50 mb-1">Net Hits</div>
        <div class="text-3xl font-bold" :class="netHits > 0 ? 'text-amber-400' : 'text-zinc-500'">{{ netHits }}</div>
      </div>

      <!-- Reset Duel + role label (multiplayer with role) -->
      <div v-if="session.isConnected && session.myRole" class="flex items-center justify-between gap-2">
        <span class="text-[10px] font-bold uppercase tracking-wider"
          :class="session.myRole === 'attacker' ? 'text-amber-400' : 'text-blue-400'">
          {{ session.myRole === 'attacker' ? '⚔ You are Attacker' : '🛡 You are Defender' }}
        </span>
        <button
          class="rounded-lg border border-zinc-600/60 px-2.5 py-1 text-[10px] font-semibold text-zinc-500
                 transition-all hover:border-zinc-400 hover:text-zinc-300 active:scale-95"
          @click="resetDuel"
        >Reset Duel</button>
      </div>
    </template>

    <!-- Duel history (multiplayer only) -->
    <template v-if="session.isConnected && session.myRole">
      <div class="space-y-1.5">
        <div class="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Duel History</div>

        <!-- Active duel row (live, updates in real time) -->
        <div class="rounded-lg border border-amber-500/20 bg-zinc-900/60 px-3 py-2 space-y-1.5">
          <div class="text-[9px] font-bold uppercase tracking-wider text-amber-500/60">Active</div>
          <div class="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
            <div>
              <div class="text-[9px] text-amber-400 font-bold mb-1">⚔ {{ activeAtkName }}</div>
              <div class="flex flex-wrap gap-1">
                <DieFace v-for="(die, j) in atkPool" :key="j" type="attack" :face="die.face" :size="22" />
                <span v-if="atkPool.length === 0" class="text-xs text-zinc-600">—</span>
              </div>
            </div>
            <div>
              <div class="text-[9px] text-blue-400 font-bold mb-1">🛡 {{ activeDefName }}</div>
              <div class="flex flex-wrap gap-1">
                <DieFace v-for="(die, j) in defPool" :key="j" type="defense" :face="die.face" :size="22" />
                <span v-if="defPool.length === 0" class="text-xs text-zinc-600">—</span>
              </div>
            </div>
            <div class="text-center pt-3 min-w-[32px]">
              <div class="text-lg font-bold" :class="netHits > 0 ? 'text-amber-400' : 'text-zinc-500'">{{ netHits }}</div>
              <div class="text-[8px] text-zinc-600">hits</div>
            </div>
          </div>
        </div>

        <!-- Committed past duels -->
        <div
          v-for="(row, i) in session.duelHistory"
          :key="i"
          class="rounded-lg border border-zinc-700/30 bg-zinc-900/40 px-3 py-2"
        >
          <div class="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
            <div>
              <div class="text-[9px] text-amber-400 font-bold mb-1">⚔ {{ row.atkName }}</div>
              <div class="flex flex-wrap gap-1">
                <DieFace v-for="(die, j) in row.atkPool" :key="j" type="attack" :face="die.face" :size="18" />
                <span v-if="row.atkPool.length === 0" class="text-xs text-zinc-600">—</span>
              </div>
            </div>
            <div>
              <div class="text-[9px] text-blue-400 font-bold mb-1">🛡 {{ row.defName }}</div>
              <div class="flex flex-wrap gap-1">
                <DieFace v-for="(die, j) in row.defPool" :key="j" type="defense" :face="die.face" :size="18" />
                <span v-if="row.defPool.length === 0" class="text-xs text-zinc-600">—</span>
              </div>
            </div>
            <div class="text-center pt-3 min-w-[32px]">
              <div class="text-lg font-bold" :class="row.netHits > 0 ? 'text-amber-400' : 'text-zinc-500'">{{ row.netHits }}</div>
              <div class="text-[8px] text-zinc-600">hits</div>
            </div>
          </div>
        </div>

      </div>
    </template>

  </div>
</template>
