<script setup lang="ts">
import { ref, computed } from 'vue'

// 3 Shield Generators — track damage tokens on each (non-Exposed get damage from Wrench in the Gears)
// exposed: which generator is currently Exposed (0, 1, or 2 = generator index; -1 = all destroyed)
const exposed = ref(0)  // starts at Generator 1 (index 0)
const generatorDamage = ref([0, 0, 0])  // pre-damage tokens on each generator
const GENERATOR_LABELS = ['Generator 1', 'Generator 2', 'Generator 3']

// Exposed Shield Generator Armored Target track
// The dashboard shows 8 boxes; each box has a combat-tree icon
// We track how many boxes have been filled
const ARMORED_TRACK_SIZE = 8
const armoredDamage = ref(0)

// Power Junctions controlled by cadre (0–5, used for Wrench in the Gears)
const powerJunctions = ref(0)

const allDestroyed = computed(() => exposed.value >= 3)

function damageArmored(n = 1) {
  const newVal = armoredDamage.value + n
  if (newVal >= ARMORED_TRACK_SIZE) {
    // Generator destroyed — advance exposed token
    armoredDamage.value = 0
    generatorDamage.value[exposed.value] = 0
    exposed.value++
    // If the next generator already has damage tokens, apply them to the new track
    if (exposed.value < 3 && generatorDamage.value[exposed.value] > 0) {
      armoredDamage.value = Math.min(generatorDamage.value[exposed.value], ARMORED_TRACK_SIZE - 1)
      generatorDamage.value[exposed.value] = 0
    }
  } else {
    armoredDamage.value = newVal
  }
}

function addPreDamage(gen: number) {
  if (gen !== exposed.value && generatorDamage.value[gen] < ARMORED_TRACK_SIZE - 1) {
    generatorDamage.value[gen]++
  }
}
function removePreDamage(gen: number) {
  if (generatorDamage.value[gen] > 0) generatorDamage.value[gen]--
}
</script>

<template>
  <div class="space-y-3">

    <!-- Cadre wins banner -->
    <div
      v-if="allDestroyed"
      class="rounded-lg border border-emerald-600/40 bg-emerald-950/50 px-3 py-2 text-center"
    >
      <div class="text-sm font-bold text-emerald-400">Cadre Wins!</div>
      <div class="text-[10px] text-emerald-600">All Shield Generators destroyed.</div>
    </div>

    <!-- Shield Generators status -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
      <div class="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
        Shield Generators
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="(label, i) in GENERATOR_LABELS"
          :key="i"
          class="flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-colors"
          :class="[
            i > exposed ? 'border-zinc-700/40 bg-zinc-800/40' :
            i === exposed ? 'border-amber-600/40 bg-amber-950/30' :
            'border-emerald-700/30 bg-emerald-950/20 opacity-50'
          ]"
        >
          <div
            class="text-[9px] font-bold uppercase tracking-wider"
            :class="i < exposed ? 'text-emerald-600 line-through' : i === exposed ? 'text-amber-400' : 'text-zinc-500'"
          >{{ label }}</div>
          <div
            v-if="i < exposed"
            class="text-xs font-bold text-emerald-500"
          >Destroyed</div>
          <div
            v-else-if="i === exposed"
            class="rounded border border-amber-700/40 bg-amber-950/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-400"
          >Exposed</div>
          <!-- Pre-damage (from Wrench in the Gears) -->
          <template v-else>
            <div class="text-[9px] text-zinc-600">Pre-damage</div>
            <div class="text-sm font-bold tabular-nums text-zinc-400">{{ generatorDamage[i] }}</div>
            <div class="flex gap-1">
              <button
                class="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-bold text-zinc-400
                       border border-zinc-700/50 hover:bg-zinc-700 active:scale-95
                       disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="generatorDamage[i] <= 0"
                @click="removePreDamage(i)"
              >−</button>
              <button
                class="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-bold text-amber-400
                       border border-zinc-700/50 hover:bg-zinc-700 active:scale-95"
                @click="addPreDamage(i)"
              >+</button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Exposed Generator Armored Target Track -->
    <div v-if="!allDestroyed" class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
      <div class="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
        {{ GENERATOR_LABELS[exposed] }} — Armored Target Track
      </div>
      <div class="mb-1 text-[9px] text-zinc-600">Defense: 4 ranged / 3 melee · Plating</div>

      <!-- Track boxes -->
      <div class="mb-3 flex gap-1">
        <div
          v-for="box in ARMORED_TRACK_SIZE"
          :key="box"
          class="flex h-8 flex-1 items-center justify-center rounded border text-[10px] font-bold transition-colors"
          :class="box <= armoredDamage
            ? 'border-red-700/50 bg-red-900/50 text-red-400'
            : 'border-zinc-700/40 bg-zinc-800/60 text-zinc-700'"
        >{{ box <= armoredDamage ? '✕' : box }}</div>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="rounded-lg border border-red-700/50 bg-red-900/30 px-3 py-1.5 text-xs font-bold text-red-300
                 shadow-[0_2px_0_0_rgba(0,0,0,0.4)] transition-all hover:bg-red-800/40
                 active:shadow-none active:translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
          :disabled="armoredDamage >= ARMORED_TRACK_SIZE"
          @click="damageArmored()"
        >+ Damage</button>
        <button
          class="rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-400
                 transition-colors hover:border-zinc-500 hover:text-zinc-200
                 disabled:opacity-30 disabled:cursor-not-allowed"
          :disabled="armoredDamage <= 0"
          @click="armoredDamage > 0 && armoredDamage--"
        >− Undo</button>
        <div class="ml-auto text-[10px] text-zinc-600">
          {{ armoredDamage }}/{{ ARMORED_TRACK_SIZE }} filled
        </div>
      </div>
    </div>

    <!-- Wrench in the Gears — Power Junction counter -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
      <div class="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
        Wrench in the Gears
      </div>
      <p class="mb-3 text-[10px] leading-relaxed text-zinc-600">
        End of each GL Turn: each cadre player rolls dice equal to Power Junctions cadre controls.
        Each ⬦ result → place 1 Damage token on any non-Exposed Generator or next Armored Track space.
      </p>
      <div class="flex items-center gap-3">
        <div class="text-[10px] font-semibold text-zinc-400">Power Junctions controlled:</div>
        <div class="flex items-center gap-1.5">
          <button
            class="rounded bg-zinc-800 px-2 py-0.5 text-sm font-bold text-zinc-400
                   border border-zinc-700/50 transition-colors hover:bg-zinc-700 active:scale-95
                   disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="powerJunctions <= 0"
            @click="powerJunctions--"
          >−</button>
          <span class="w-6 text-center text-lg font-bold tabular-nums text-zinc-200">{{ powerJunctions }}</span>
          <button
            class="rounded bg-zinc-800 px-2 py-0.5 text-sm font-bold text-zinc-400
                   border border-zinc-700/50 transition-colors hover:bg-zinc-700 active:scale-95"
            @click="powerJunctions++"
          >+</button>
        </div>
      </div>
    </div>

    <!-- Tracking the Struggle -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
      <div class="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
        Tracking the Struggle
      </div>
      <div class="space-y-1 text-[11px] text-zinc-500">
        <div class="flex items-start gap-2">
          <span class="mt-0.5 text-sky-400">→</span>
          <span><span class="text-zinc-300">Cadre unit Wounded</span> → Struggle Token advances right</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="mt-0.5 text-amber-400">←</span>
          <span><span class="text-zinc-300">GL Unit Wounded</span> → Struggle Token advances left</span>
        </div>
      </div>
    </div>

    <!-- Victory conditions -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
      <div class="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
        Victory Conditions
      </div>
      <div class="space-y-1 text-[11px] text-zinc-500">
        <div class="flex items-start gap-2">
          <span class="text-red-400">⚡</span>
          <span><span class="text-zinc-300">GL wins</span> if Struggle Token reaches space 8 after GL Turn</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-emerald-400">✓</span>
          <span><span class="text-zinc-300">Cadre wins</span> if all Shield Generators destroyed after GL Turn</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-emerald-400">✓</span>
          <span><span class="text-zinc-300">Cadre wins</span> if GL Unit is Defeated</span>
        </div>
      </div>
    </div>

  </div>
</template>
