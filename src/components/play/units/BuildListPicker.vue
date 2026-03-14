<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CompactBuild, Character } from '../../../types/index.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'

const props = defineProps<{ savedLists: CompactBuild[]; characters: Character[] }>()
const emit = defineEmits<{
  (e: 'select', squad0: Character[], squad1: Character[], squad1Complete: boolean): void
  (e: 'close'): void
}>()

interface ResolvedBuild {
  name: string
  pre: boolean
  squad0: (Character | null)[]
  squad1: (Character | null)[]
  squad2: (Character | null)[]
  squad3: (Character | null)[]
  squad0Complete: boolean
  squad1Complete: boolean
  squad2Complete: boolean
  squad3Complete: boolean
}

function resolve(id: number): Character | null {
  return id ? (props.characters.find(c => c.id === id) ?? null) : null
}

const resolved = computed<ResolvedBuild[]>(() =>
  props.savedLists.map(b => {
    const sq0 = b.s[0].map(resolve)
    const sq1 = b.s[1].map(resolve)
    const sq2 = b.ex ? b.ex[0].map(resolve) : []
    const sq3 = b.ex ? b.ex[1].map(resolve) : []
    return {
      name: b.name,
      pre: b.pre,
      squad0: sq0,
      squad1: sq1,
      squad2: sq2,
      squad3: sq3,
      squad0Complete: sq0.every(c => c !== null),
      squad1Complete: sq1.every(c => c !== null),
      squad2Complete: sq2.length === 3 && sq2.every(c => c !== null),
      squad3Complete: sq3.length === 3 && sq3.every(c => c !== null),
    }
  })
)

// Premiere selection state
const premierePickIdx = ref<number | null>(null)
const selectedSquadIndices = ref<Set<number>>(new Set())

const canConfirmPremiere = computed(() =>
  premierePickIdx.value !== null && selectedSquadIndices.value.size === 2
)

function toggleSquad(idx: number) {
  if (selectedSquadIndices.value.has(idx)) {
    selectedSquadIndices.value.delete(idx)
  } else if (selectedSquadIndices.value.size < 2) {
    selectedSquadIndices.value.add(idx)
  }
}

function openPremierePicker(buildIdx: number) {
  premierePickIdx.value = buildIdx
  selectedSquadIndices.value = new Set()
}

function backToList() {
  premierePickIdx.value = null
  selectedSquadIndices.value = new Set()
}

function confirmPremiere() {
  if (!canConfirmPremiere.value || premierePickIdx.value === null) return
  const build = resolved.value[premierePickIdx.value]
  const allSquads = [build.squad0, build.squad1, build.squad2, build.squad3]
  const chosen = [...selectedSquadIndices.value].sort()
  const sq0 = allSquads[chosen[0]].filter((c): c is Character => c !== null)
  const sq1 = allSquads[chosen[1]].filter((c): c is Character => c !== null)
  emit('select', sq0, sq1, sq1.length === 3)
}

function select(build: ResolvedBuild) {
  if (!build.squad0Complete) return
  if (build.pre) {
    const idx = resolved.value.indexOf(build)
    openPremierePicker(idx)
    return
  }
  const sq0 = build.squad0.filter((c): c is Character => c !== null)
  const sq1 = build.squad1Complete
    ? build.squad1.filter((c): c is Character => c !== null)
    : []
  emit('select', sq0, sq1, build.squad1Complete)
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      @click.self="$emit('close')"
    >
      <div class="absolute inset-0 bg-black/75" @click="$emit('close')" />

      <div class="relative z-10 w-full max-w-sm flex flex-col rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl max-h-[85vh]">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
          <template v-if="premierePickIdx === null">
            <span class="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Choose a build to import</span>
            <button class="text-zinc-600 hover:text-zinc-300 transition-colors text-sm" @click="$emit('close')">✕</button>
          </template>
          <template v-else>
            <button class="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1" @click="backToList">
              ← Back to lists
            </button>
            <button class="text-zinc-600 hover:text-zinc-300 transition-colors text-sm" @click="$emit('close')">✕</button>
          </template>
        </div>

        <!-- Premiere squad picker -->
        <template v-if="premierePickIdx !== null">
          <div class="px-4 py-3 border-b border-zinc-800 flex-shrink-0">
            <p class="text-sm font-semibold text-zinc-200">Pick 2 squads to play</p>
            <p class="text-xs text-zinc-500 mt-0.5">{{ resolved[premierePickIdx].name }}</p>
          </div>
          <div class="overflow-y-auto flex-1 p-3 space-y-2">
            <template v-for="(squadChars, si) in [
              resolved[premierePickIdx].squad0,
              resolved[premierePickIdx].squad1,
              resolved[premierePickIdx].squad2,
              resolved[premierePickIdx].squad3,
            ]" :key="si">
              <button
                class="w-full rounded-xl border px-3 py-2.5 text-left transition-all flex items-center gap-3"
                :class="selectedSquadIndices.has(si)
                  ? 'border-amber-500/60 bg-amber-900/20'
                  : 'border-zinc-700/50 bg-zinc-800/60 hover:border-zinc-500'"
                @click="toggleSquad(si)"
              >
                <div
                  class="h-4 w-4 rounded border flex items-center justify-center flex-shrink-0"
                  :class="selectedSquadIndices.has(si)
                    ? 'border-amber-400 bg-amber-400'
                    : 'border-zinc-600 bg-transparent'"
                >
                  <span v-if="selectedSquadIndices.has(si)" class="text-[10px] text-zinc-900 font-bold leading-none">✓</span>
                </div>
                <span class="text-[9px] font-bold uppercase tracking-wide text-zinc-500 w-10 flex-shrink-0">Squad {{ si + 1 }}</span>
                <div class="flex gap-1 flex-shrink-0">
                  <template v-for="(char, ci) in squadChars" :key="ci">
                    <img
                      v-if="char?.thumbnail"
                      :src="imageUrl(char.thumbnail)"
                      :alt="char.name"
                      :title="char.name"
                      class="h-7 w-7 rounded-full border border-zinc-700/60 object-cover"
                    />
                    <div v-else class="h-7 w-7 rounded-full border border-zinc-700/40 bg-zinc-800 flex items-center justify-center">
                      <span class="text-[8px] text-zinc-600">{{ char?.name?.[0] ?? '?' }}</span>
                    </div>
                  </template>
                </div>
                <div class="flex flex-col gap-0 min-w-0">
                  <span
                    v-for="(char, ci) in squadChars"
                    :key="ci"
                    class="text-[9px] text-zinc-500 leading-tight truncate max-w-[100px]"
                  >{{ char?.name ?? '—' }}</span>
                </div>
              </button>
            </template>
          </div>
          <div class="px-4 py-3 border-t border-zinc-800 flex-shrink-0">
            <button
              class="w-full rounded-xl py-2 text-sm font-semibold transition-colors"
              :class="canConfirmPremiere
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40'
                : 'bg-zinc-800/40 text-zinc-600 border border-zinc-700/30 cursor-not-allowed'"
              :disabled="!canConfirmPremiere"
              @click="confirmPremiere"
            >
              Import {{ selectedSquadIndices.size === 2 ? '2 squads' : `(${selectedSquadIndices.size}/2 selected)` }}
            </button>
          </div>
        </template>

        <!-- Build list -->
        <template v-else>
          <!-- Empty state -->
          <div
            v-if="resolved.length === 0"
            class="px-4 py-10 text-center text-xs text-zinc-600"
          >
            No saved builds found.<br>Save a list in the Build view first.
          </div>

          <!-- List -->
          <div v-else class="overflow-y-auto flex-1 p-3 space-y-2">
            <button
              v-for="(build, i) in resolved"
              :key="i"
              class="w-full rounded-xl border px-3 py-3 text-left transition-all"
              :class="build.squad0Complete
                ? 'border-zinc-700/50 bg-zinc-800/60 hover:border-zinc-500 hover:bg-zinc-700/60 active:scale-[0.98]'
                : 'border-zinc-800/40 bg-zinc-800/20 opacity-40 cursor-not-allowed'"
              :disabled="!build.squad0Complete"
              @click="select(build)"
            >
              <!-- Build name + badges -->
              <div class="flex items-center justify-between mb-2.5">
                <span class="text-sm font-bold text-zinc-200 truncate">{{ build.name }}</span>
                <div class="flex items-center gap-1 flex-shrink-0 ml-2">
                  <span
                    v-if="build.pre"
                    class="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  >
                    ★ Premiere
                  </span>
                  <span
                    v-else
                    class="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                    :class="build.squad1Complete
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : build.squad0Complete
                        ? 'bg-zinc-700/60 text-zinc-500 border border-zinc-600/30'
                        : 'bg-red-900/20 text-red-600 border border-red-800/30'"
                  >
                    {{ build.squad1Complete ? 'Both squads' : build.squad0Complete ? '1 squad' : 'Incomplete' }}
                  </span>
                </div>
              </div>

              <!-- Thumbnails: squad 0 -->
              <div class="space-y-1.5">
                <div class="flex items-center gap-1.5">
                  <span class="text-[9px] font-bold uppercase tracking-wide text-zinc-600 w-12 flex-shrink-0">Squad 1</span>
                  <div class="flex gap-1">
                    <template v-for="(char, ci) in build.squad0" :key="ci">
                      <img
                        v-if="char?.thumbnail"
                        :src="imageUrl(char.thumbnail)"
                        :alt="char.name"
                        :title="char.name"
                        class="h-8 w-8 rounded-full border border-zinc-700/60 object-cover"
                      />
                      <div
                        v-else
                        class="h-8 w-8 rounded-full border border-zinc-700/40 bg-zinc-800 flex items-center justify-center"
                      >
                        <span class="text-[8px] text-zinc-600">{{ char?.name?.[0] ?? '?' }}</span>
                      </div>
                    </template>
                  </div>
                  <div class="flex flex-col gap-0">
                    <span
                      v-for="(char, ci) in build.squad0"
                      :key="ci"
                      class="text-[9px] text-zinc-500 leading-tight truncate max-w-[120px]"
                    >{{ char?.name ?? '—' }}</span>
                  </div>
                </div>

                <!-- Squad 1 thumbnails (non-premiere) -->
                <div
                  v-if="!build.pre && build.squad1.some(c => c !== null)"
                  class="flex items-center gap-1.5"
                >
                  <span class="text-[9px] font-bold uppercase tracking-wide text-zinc-600 w-12 flex-shrink-0">Squad 2</span>
                  <div class="flex gap-1">
                    <template v-for="(char, ci) in build.squad1" :key="ci">
                      <img
                        v-if="char?.thumbnail"
                        :src="imageUrl(char.thumbnail)"
                        :alt="char.name"
                        :title="char.name"
                        class="h-8 w-8 rounded-full border border-zinc-600/40 object-cover opacity-80"
                      />
                      <div
                        v-else
                        class="h-8 w-8 rounded-full border border-zinc-700/30 bg-zinc-800/50 flex items-center justify-center"
                      >
                        <span class="text-[8px] text-zinc-600">{{ char?.name?.[0] ?? '?' }}</span>
                      </div>
                    </template>
                  </div>
                  <div class="flex flex-col gap-0">
                    <span
                      v-for="(char, ci) in build.squad1"
                      :key="ci"
                      class="text-[9px] text-zinc-500 leading-tight truncate max-w-[120px]"
                    >{{ char?.name ?? '—' }}</span>
                  </div>
                </div>

                <!-- Squads 1-3 (premiere preview) -->
                <template v-if="build.pre">
                  <div
                    v-for="(squadChars, si) in [build.squad1, build.squad2, build.squad3]"
                    :key="si"
                    class="flex items-center gap-1.5"
                  >
                    <span class="text-[9px] font-bold uppercase tracking-wide text-zinc-600 w-12 flex-shrink-0">Squad {{ si + 2 }}</span>
                    <div class="flex gap-1">
                      <template v-for="(char, ci) in squadChars" :key="ci">
                        <img
                          v-if="char?.thumbnail"
                          :src="imageUrl(char.thumbnail)"
                          :alt="char.name"
                          :title="char.name"
                          class="h-8 w-8 rounded-full border border-zinc-600/40 object-cover opacity-80"
                        />
                        <div
                          v-else
                          class="h-8 w-8 rounded-full border border-zinc-700/30 bg-zinc-800/50 flex items-center justify-center"
                        >
                          <span class="text-[8px] text-zinc-600">{{ char?.name?.[0] ?? '?' }}</span>
                        </div>
                      </template>
                    </div>
                    <div class="flex flex-col gap-0">
                      <span
                        v-for="(char, ci) in squadChars"
                        :key="ci"
                        class="text-[9px] text-zinc-500 leading-tight truncate max-w-[120px]"
                      >{{ char?.name ?? '—' }}</span>
                    </div>
                  </div>
                </template>
              </div>
            </button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>
