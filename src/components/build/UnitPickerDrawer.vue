<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Character } from '../../types/index.ts'
import type { Squad } from '../../types/index.ts'
import { imageUrl } from '../../utils/imageUrl.ts'
import SearchBar from '../ui/SearchBar.vue'
import { useCollectionStore } from '../../stores/collection.ts'

const props = defineProps<{
  show: boolean
  characters: Character[]
  role: keyof Squad | null
  excludedNames?: Set<string>
  excludedCharacterTypes?: Set<string>
}>()

const emit = defineEmits<{
  (e: 'select', char: Character): void
  (e: 'close'): void
}>()

const query = ref('')
const ownedOnly = ref(false)

const collectionStore = useCollectionStore()

const roleFilter = computed<'Primary' | 'Secondary' | 'Support' | ''>(() => {
  if (props.role === 'primary') return 'Primary'
  if (props.role === 'secondary') return 'Secondary'
  if (props.role === 'support') return 'Support'
  return ''
})

const filtered = computed(() => {
  const q = query.value.toLowerCase().trim()
  return props.characters.filter((c) => {
    if (roleFilter.value && c.unitType !== roleFilter.value) return false
    if (ownedOnly.value && !collectionStore.ownedSwpSet.has(c.swpCode ?? '')) return false
    if (q) {
      return c.name.toLowerCase().includes(q) || c.tags.some((t) => t.toLowerCase().includes(q))
    }
    return true
  })
})

function isConflicting(char: Character): boolean {
  if (props.excludedNames?.has(char.name)) return true
  if (char.characterType && props.excludedCharacterTypes?.has(char.characterType)) return true
  return false
}

function select(char: Character) {
  emit('select', char)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex justify-end"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/60" @click="$emit('close')" />

        <div class="relative z-10 flex w-full max-w-md flex-col bg-sw-card shadow-2xl">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-sw-gold/20 p-4">
            <h2 class="font-semibold text-sw-gold">
              Pick {{ role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Unit' }}
            </h2>
            <button class="text-sw-text/60 hover:text-sw-text" @click="$emit('close')">✕</button>
          </div>

          <!-- Search -->
          <div class="p-3 border-b border-sw-gold/10 space-y-2">
            <SearchBar v-model="query" />
            <label class="flex cursor-pointer items-center gap-2 text-xs text-sw-text/60">
              <input type="checkbox" v-model="ownedOnly" class="accent-sw-gold" />
              Owned only
            </label>
          </div>

          <!-- Unit list -->
          <div class="flex-1 overflow-y-auto">
            <div v-if="filtered.length === 0" class="py-8 text-center text-sw-text/40">
              No units found.
            </div>
            <button
              v-for="char in filtered"
              :key="char.id"
              :disabled="isConflicting(char)"
              class="flex w-full items-center gap-3 border-b border-sw-gold/10 px-4 py-3 text-left transition-colors"
              :class="isConflicting(char) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-sw-gold/10'"
              @click="select(char)"
            >
              <img
                v-if="char.thumbnail"
                :src="imageUrl(char.thumbnail)"
                :alt="char.name"
                class="h-10 w-10 rounded object-cover"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-sw-text">{{ char.name }}</p>
                <p class="text-xs text-sw-text/50">{{ char.unitType }} · {{ char.era }}</p>
              </div>
              <span v-if="isConflicting(char)" class="shrink-0 text-xs text-sw-text/40">In team</span>
              <span v-else class="shrink-0 text-sm font-bold text-sw-gold">
                {{ char.unitType === 'Primary' ? `SP ${char.sp}` : `PC ${char.pc}` }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.25s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
</style>
