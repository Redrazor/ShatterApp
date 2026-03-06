<script setup lang="ts">
import { ref } from 'vue'
import { useKeyopsStore } from '../../stores/keyops.ts'
import { imageUrl } from '../../utils/imageUrl.ts'

const koStore = useKeyopsStore()

const flippedStages = ref<Record<number, boolean>>({})
function flipStage(i: number) {
  flippedStages.value = { ...flippedStages.value, [i]: !flippedStages.value[i] }
}

const zoomedIndex = ref<number | null>(null)
const zoomedFlipped = ref(false)

function openZoom(i: number) {
  zoomedIndex.value = i
  zoomedFlipped.value = !!flippedStages.value[i]
}

function closeZoom() {
  zoomedIndex.value = null
}

function flipZoomed() {
  zoomedFlipped.value = !zoomedFlipped.value
}
</script>

<template>
  <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-3">
    <div class="mb-3 flex items-center justify-between">
      <div class="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
        Stage Cards
      </div>
      <button
        class="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1 text-xs font-medium text-zinc-400
               shadow-[0_2px_0_0_rgba(0,0,0,0.4)] transition-all
               hover:border-zinc-500 hover:text-zinc-200
               active:shadow-none active:translate-y-0.5
               disabled:cursor-not-allowed disabled:opacity-30"
        :disabled="!koStore.selectedKoMission || koStore.koStageIndex >= (koStore.selectedKoMission.stages.length - 1)"
        @click="koStore.advanceStage()"
      >
        Advance Stage →
      </button>
    </div>

    <!-- Placeholder: no stage images yet -->
    <template v-if="!koStore.selectedKoMission || koStore.selectedKoMission.stages.length === 0">
      <div class="flex items-center justify-center rounded-lg border border-dashed border-zinc-700/50 bg-zinc-900/40 px-4 py-8 text-center">
        <div>
          <div class="mb-1 text-sm font-semibold text-zinc-500">
            {{ koStore.selectedKoMission?.name ?? 'Mission' }}
          </div>
          <div class="text-[11px] text-zinc-700">Stage cards coming soon</div>
        </div>
      </div>
    </template>

    <!-- Stage card strip -->
    <template v-else>
      <div class="flex gap-3 overflow-x-auto pb-1">
        <div
          v-for="(stage, i) in koStore.selectedKoMission.stages"
          :key="i"
          class="relative flex-none transition-all duration-300"
          :class="[
            i === koStore.koStageIndex
              ? 'ring-2 ring-amber-400 rounded-lg shadow-[0_0_12px_rgba(245,158,11,0.3)] cursor-pointer'
              : i < koStore.koStageIndex
                ? 'opacity-40 cursor-default'
                : 'opacity-20 cursor-default'
          ]"
          style="width: 66vw; max-width: 390px;"
          @click="i === koStore.koStageIndex && openZoom(i)"
        >
          <img
            :src="imageUrl(flippedStages[i] ? stage.back : stage.front)"
            class="w-full h-auto object-contain rounded-lg bg-zinc-900"
            :alt="`Stage ${i + 1} ${flippedStages[i] ? 'back' : 'front'}`"
          />
          <div
            v-if="i === koStore.koStageIndex"
            class="absolute top-1 right-1 rounded bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold text-zinc-900"
          >
            ACTIVE
          </div>
          <button
            class="mt-1 w-full rounded border border-zinc-700 bg-zinc-800/60 py-0.5 text-[10px] font-medium text-zinc-500
                   hover:border-zinc-500 hover:text-zinc-300 transition-colors"
            @click.stop="flipStage(i)"
          >
            {{ flippedStages[i] ? '↩ Front' : 'Flip →' }}
          </button>
        </div>
      </div>
      <div class="mt-2 flex justify-center gap-1.5">
        <span
          v-for="(_, i) in koStore.selectedKoMission.stages"
          :key="i"
          class="block h-1.5 w-1.5 rounded-full transition-colors duration-200"
          :class="i === koStore.koStageIndex ? 'bg-amber-400' : i < koStore.koStageIndex ? 'bg-zinc-500' : 'bg-zinc-700'"
        />
      </div>
    </template>
  </div>

  <!-- ── Stage card zoom overlay ── -->
  <Teleport to="body">
    <Transition name="stage-zoom">
      <div
        v-if="zoomedIndex !== null && koStore.selectedKoMission"
        class="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 px-4"
        @click.self="closeZoom"
      >
        <Transition :name="zoomedFlipped ? 'zoom-flip-back' : 'zoom-flip-front'" mode="out-in">
          <img
            :key="zoomedFlipped ? 'back' : 'front'"
            :src="imageUrl(zoomedFlipped
              ? koStore.selectedKoMission.stages[zoomedIndex!].back
              : koStore.selectedKoMission.stages[zoomedIndex!].front)"
            class="w-full max-w-[614px] max-h-[75vh] object-contain rounded-xl shadow-2xl"
            :alt="`Stage ${zoomedIndex! + 1} ${zoomedFlipped ? 'back' : 'front'}`"
          />
        </Transition>
        <div class="mt-4 flex gap-3">
          <button
            class="rounded-lg border border-zinc-600 bg-zinc-800/80 px-5 py-2 text-sm font-medium text-zinc-300
                   hover:border-zinc-400 hover:text-zinc-100 transition-colors"
            @click="flipZoomed"
          >
            {{ zoomedFlipped ? '↩ Front' : 'Flip →' }}
          </button>
          <button
            class="rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-500
                   hover:border-zinc-500 hover:text-zinc-300 transition-colors"
            @click="closeZoom"
          >✕ Close</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.stage-zoom-enter-active, .stage-zoom-leave-active { transition: opacity 0.2s ease; }
.stage-zoom-enter-from, .stage-zoom-leave-to { opacity: 0; }

.zoom-flip-front-enter-active, .zoom-flip-front-leave-active,
.zoom-flip-back-enter-active,  .zoom-flip-back-leave-active  { transition: opacity 0.15s ease, transform 0.15s ease; }
.zoom-flip-front-enter-from { opacity: 0; transform: translateX(20px); }
.zoom-flip-front-leave-to   { opacity: 0; transform: translateX(-20px); }
.zoom-flip-back-enter-from  { opacity: 0; transform: translateX(-20px); }
.zoom-flip-back-leave-to    { opacity: 0; transform: translateX(20px); }
</style>
