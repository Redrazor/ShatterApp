<script setup lang="ts">
import { ref, computed } from 'vue'
import DiceColumn from '../dice/DiceColumn.vue'
import DieFace from '../dice/DieFace.vue'
import { useDiceRoom } from '../../composables/useDiceRoom.ts'
import { useRollSessionStore } from '../../stores/rollSession.ts'
import type { DieState } from '../../utils/dice.ts'

const atkSummary = ref<Record<string, number>>({})
const defSummary = ref<Record<string, number>>({})

const hits = computed(() => {
  const crits   = atkSummary.value['crit']   ?? 0
  const strikes = atkSummary.value['strike'] ?? 0
  const blocks  = defSummary.value['block']  ?? 0
  return crits + Math.max(0, strikes - blocks)
})

const hasRolled = computed(() =>
  Object.values(atkSummary.value).some(v => v > 0) ||
  Object.values(defSummary.value).some(v => v > 0)
)

const session = useRollSessionStore()
const diceRoom = useDiceRoom()

const pendingAtk = ref(false)
const pendingDef = ref(false)

// Track current pools so we can send them
const currentAtkPool = ref<DieState[]>([])
const currentDefPool = ref<DieState[]>([])

function onAtkRolled() {
  pendingAtk.value = true
  trySendRoll()
}

function onDefRolled() {
  pendingDef.value = true
  trySendRoll()
}

function trySendRoll() {
  if (!session.isConnected) return
  if (!pendingAtk.value || !pendingDef.value) return
  const roll = {
    atkPool: currentAtkPool.value,
    defPool: currentDefPool.value,
    hits: hits.value,
    timestamp: Date.now(),
  }
  diceRoom.sendDiceResult(roll)
  pendingAtk.value = false
  pendingDef.value = false
}

// Opponent dice from session
const opponentDice = computed(() => session.lastOpponentDice)
</script>

<template>
  <div class="space-y-4">
    <!-- My dice -->
    <div class="grid grid-cols-2 gap-4">
      <DiceColumn
        type="attack"
        @update:summary="(s) => { atkSummary = s }"
        @rolled="onAtkRolled"
      />
      <DiceColumn
        type="defense"
        @update:summary="(s) => { defSummary = s }"
        @rolled="onDefRolled"
      />
    </div>

    <!-- Hits -->
    <div v-if="hasRolled" class="rounded-xl border border-amber-500/20 bg-amber-950/20 px-4 py-3 text-center">
      <div class="text-[10px] font-bold uppercase tracking-widest text-amber-500/50 mb-1">Net Hits</div>
      <div class="text-3xl font-bold" :class="hits > 0 ? 'text-amber-400' : 'text-zinc-500'">{{ hits }}</div>
    </div>

    <!-- Opponent's last roll (multiplayer only) -->
    <template v-if="session.isConnected && opponentDice">
      <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 p-3 space-y-2">
        <div class="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Opponent's last roll</div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <div class="text-[9px] text-sw-gold/60 mb-1 font-bold uppercase tracking-wider">Attack</div>
            <div class="flex flex-wrap gap-1.5">
              <div v-for="(die, i) in opponentDice.atkPool" :key="i">
                <DieFace type="attack" :face="die.face" :size="40" />
              </div>
              <span v-if="opponentDice.atkPool.length === 0" class="text-xs text-zinc-600">—</span>
            </div>
          </div>
          <div>
            <div class="text-[9px] text-blue-400/60 mb-1 font-bold uppercase tracking-wider">Defense</div>
            <div class="flex flex-wrap gap-1.5">
              <div v-for="(die, i) in opponentDice.defPool" :key="i">
                <DieFace type="defense" :face="die.face" :size="40" />
              </div>
              <span v-if="opponentDice.defPool.length === 0" class="text-xs text-zinc-600">—</span>
            </div>
          </div>
        </div>
        <div class="text-right text-xs text-zinc-500">
          Hits: <span :class="opponentDice.hits > 0 ? 'text-amber-400 font-bold' : 'text-zinc-500'">{{ opponentDice.hits }}</span>
        </div>
      </div>
    </template>
  </div>
</template>
