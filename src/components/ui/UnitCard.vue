<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Character } from '../../types/index.ts'

const props = defineProps<{
  character: Character
  owned?: boolean
  favorited?: boolean
  comparing?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'toggle-favorite'): void
  (e: 'toggle-compare'): void
}>()

const router = useRouter()

const typeBadgeClass = {
  Primary:   'bg-sw-blue text-white',
  Secondary: 'bg-purple-700 text-white',
  Support:   'bg-green-700 text-white',
} as const

const costLabel = props.character.unitType === 'Primary'
  ? `SP ${props.character.sp}`
  : `PC ${props.character.pc}`

const eraIconMap: Record<string, string> = {
  'Clone Wars':   '/images/era/clone-wars.png',
  'Empire':       '/images/era/empire.png',
  'Civil War':    '/images/era/civil-war.png',
  'New Republic': '/images/era/new-republic.png',
}

const eras = computed(() =>
  props.character.era.split(';').map(e => e.trim()).filter(Boolean)
)

function goToSwp(e: MouseEvent) {
  e.stopPropagation()
  if (props.character.swpCode) {
    router.push({ path: '/browse', query: { swp: props.character.swpCode } })
  }
}
</script>

<template>
  <button
    class="group relative flex w-full flex-col overflow-hidden rounded-xl border border-sw-gold/20 bg-sw-card shadow-md transition-all hover:border-sw-gold hover:shadow-sw-gold/20 text-left sm:flex-row"
    @click="$emit('click')"
  >
    <!-- SWP badge (top-left) -->
    <button
      v-if="character.swpCode"
      class="absolute left-1.5 top-1.5 z-10 rounded bg-black/60 px-1 py-0.5 text-[8px] font-bold text-sw-gold/80 leading-none hover:text-sw-gold transition-colors backdrop-blur-sm"
      :title="`Browse ${character.swpCode}`"
      @click="goToSwp"
    >{{ character.swpCode }}</button>

    <!-- Owned badge (top-right) -->
    <span
      v-if="owned"
      class="absolute right-1.5 top-1.5 z-10 rounded-full bg-sw-gold px-1.5 py-0.5 text-[9px] font-bold text-sw-dark leading-none"
    >✓</span>

    <!-- Favorite + Compare buttons (bottom-right, hover reveal) -->
    <div class="absolute bottom-1.5 right-1.5 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        class="rounded bg-black/60 p-1 text-xs leading-none backdrop-blur-sm transition-colors hover:bg-black/80"
        :class="favorited ? 'text-red-400' : 'text-sw-text/50'"
        :title="favorited ? 'Remove from favorites' : 'Add to favorites'"
        @click.stop="emit('toggle-favorite')"
      >♥</button>
      <button
        class="rounded bg-black/60 p-1 text-xs leading-none backdrop-blur-sm transition-colors hover:bg-black/80"
        :class="comparing ? 'text-sw-gold' : 'text-sw-text/50'"
        title="Compare"
        @click.stop="emit('toggle-compare')"
      >=</button>
    </div>

    <!-- Thumbnail: portrait on mobile, slim strip on sm+ -->
    <div class="aspect-[13/10] w-full overflow-hidden bg-sw-dark sm:aspect-auto sm:w-16 sm:flex-shrink-0">
      <img
        v-if="character.thumbnail"
        :src="character.thumbnail"
        :alt="character.name"
        class="h-full w-full object-contain transition-transform group-hover:scale-105"
        loading="lazy"
      />
      <div v-else class="flex h-full w-full items-center justify-center text-4xl text-sw-text/20 sm:text-2xl">⚔</div>
    </div>

    <!-- Info -->
    <div class="flex min-w-0 flex-1 flex-col justify-between gap-2 p-3 sm:gap-1.5 sm:px-2.5 sm:py-2">
      <!-- Name: allow wrap on mobile, truncate on sm+ -->
      <span class="block text-sm font-semibold leading-snug text-sw-text sm:truncate">{{ character.name }}</span>

      <!-- Type + Cost -->
      <div class="flex items-center justify-between gap-1">
        <span :class="['rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', typeBadgeClass[character.unitType]]">
          {{ character.unitType }}
        </span>
        <span class="text-xs font-bold text-sw-gold">{{ costLabel }}</span>
      </div>

      <!-- Era icons + FP -->
      <div class="flex items-center justify-between gap-1">
        <div class="flex items-center gap-1.5 sm:gap-1">
          <img
            v-for="era in eras"
            :key="era"
            :src="eraIconMap[era] ?? ''"
            :alt="era"
            :title="era"
            class="era-icon h-5 w-5 sm:h-4 sm:w-4"
          />
        </div>
        <span class="text-xs text-sw-text/40 sm:text-[10px]">FP {{ character.fp }}</span>
      </div>
    </div>
  </button>
</template>

<style scoped>
.era-icon {
  filter: brightness(0) invert(1);
  opacity: 0.65;
}
</style>
