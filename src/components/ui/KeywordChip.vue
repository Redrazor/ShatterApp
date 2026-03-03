<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKeywords } from '../../composables/useKeywords.ts'

const props = defineProps<{
  tag: string
  variant?: 'profile' | 'filter'  // profile = navigate on main click; filter = remove on click
}>()

const emit = defineEmits<{
  (e: 'navigate', tag: string): void
  (e: 'remove', tag: string): void
}>()

const { getDefinition } = useKeywords()
const definition = computed(() => getDefinition(props.tag))

const popoverOpen = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | null = null

function openPopover() {
  if (closeTimer) clearTimeout(closeTimer)
  popoverOpen.value = true
}

function closePopover() {
  closeTimer = setTimeout(() => { popoverOpen.value = false }, 150)
}

function togglePopover(e: Event) {
  e.stopPropagation()
  popoverOpen.value = !popoverOpen.value
}

function handleMainClick() {
  if (props.variant === 'filter') {
    emit('remove', props.tag)
  } else {
    emit('navigate', props.tag)
  }
}
</script>

<template>
  <span class="relative inline-flex items-center gap-0.5">
    <button
      :class="[
        'rounded-full border px-2 py-0.5 text-xs transition-colors',
        variant === 'filter'
          ? 'bg-sw-gold/20 border-sw-gold text-sw-gold hover:bg-sw-gold/30'
          : 'border-sw-gold/20 text-sw-text/70 hover:border-sw-gold hover:text-sw-gold',
      ]"
      @click="handleMainClick"
    >
      {{ tag }}<span v-if="variant === 'filter'" class="ml-1 font-bold">×</span>
    </button>

    <!-- Info icon — only show when a definition exists -->
    <button
      v-if="definition"
      class="text-[9px] text-sw-text/30 hover:text-sw-gold transition-colors leading-none"
      :title="definition"
      @click.stop="togglePopover"
      @mouseenter="openPopover"
      @mouseleave="closePopover"
    >ⓘ</button>

    <!-- Popover -->
    <Teleport to="body">
      <Transition name="kw-pop">
        <div
          v-if="popoverOpen && definition"
          class="fixed z-[100] max-w-xs rounded-lg border border-sw-gold/30 bg-sw-card p-3 shadow-xl text-sm text-sw-text/80 pointer-events-none"
          style="top: 50%; left: 50%; transform: translate(-50%, -50%)"
          @mouseenter="openPopover"
          @mouseleave="closePopover"
        >
          <p class="font-semibold text-sw-gold mb-1">{{ tag }}</p>
          <p>{{ definition }}</p>
        </div>
      </Transition>
    </Teleport>
  </span>
</template>

<style scoped>
.kw-pop-enter-active, .kw-pop-leave-active { transition: opacity 0.15s ease; }
.kw-pop-enter-from, .kw-pop-leave-to { opacity: 0; }
</style>
