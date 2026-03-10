<script setup lang="ts">
import { computed } from 'vue'
import type { CompactBuild, Character } from '../../../types/index.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'

const props = defineProps<{ savedLists: CompactBuild[]; characters: Character[] }>()
const emit = defineEmits<{
  (e: 'select', squad0: Character[], squad1: Character[], squad1Complete: boolean): void
  (e: 'close'): void
}>()

interface ResolvedBuild {
  name: string
  squad0: (Character | null)[]
  squad1: (Character | null)[]
  squad0Complete: boolean
  squad1Complete: boolean
}

function resolve(id: number): Character | null {
  return id ? (props.characters.find(c => c.id === id) ?? null) : null
}

const resolved = computed<ResolvedBuild[]>(() =>
  props.savedLists.map(b => {
    const sq0 = b.s[0].map(resolve)
    const sq1 = b.s[1].map(resolve)
    return {
      name: b.name,
      squad0: sq0,
      squad1: sq1,
      squad0Complete: sq0.every(c => c !== null),
      squad1Complete: sq1.every(c => c !== null),
    }
  })
)

function select(build: ResolvedBuild) {
  if (!build.squad0Complete) return
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
          <span class="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Choose a build to import</span>
          <button class="text-zinc-600 hover:text-zinc-300 transition-colors text-sm" @click="$emit('close')">✕</button>
        </div>

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
            <!-- Build name + completion badge -->
            <div class="flex items-center justify-between mb-2.5">
              <span class="text-sm font-bold text-zinc-200 truncate">{{ build.name }}</span>
              <span
                class="ml-2 flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                :class="build.squad1Complete
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : build.squad0Complete
                    ? 'bg-zinc-700/60 text-zinc-500 border border-zinc-600/30'
                    : 'bg-red-900/20 text-red-600 border border-red-800/30'"
              >
                {{ build.squad1Complete ? 'Both squads' : build.squad0Complete ? '1 squad' : 'Incomplete' }}
              </span>
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
                <!-- Unit names below thumbnails -->
                <div class="flex flex-col gap-0">
                  <span
                    v-for="(char, ci) in build.squad0"
                    :key="ci"
                    class="text-[9px] text-zinc-500 leading-tight truncate max-w-[120px]"
                  >{{ char?.name ?? '—' }}</span>
                </div>
              </div>

              <!-- Squad 1 thumbnails (if any units filled) -->
              <div
                v-if="build.squad1.some(c => c !== null)"
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
            </div>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
