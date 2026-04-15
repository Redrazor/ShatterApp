<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { StatsData } from '../../../types/index.ts'

const props = defineProps<{
  stats: StatsData | null
  allKnownTags: string[]
}>()

const emit = defineEmits<{
  update: [patch: Partial<StatsData>]
}>()

// ── Tag multi-pick ────────────────────────────────────────────────────────────
const filterInput = ref('')
const dropdownOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const filterRef = ref<HTMLInputElement | null>(null)

const selectedTags = computed<string[]>(() => props.stats?.tags ?? [])

const filteredOptions = computed(() => {
  const q = filterInput.value.trim().toLowerCase()
  return props.allKnownTags.filter(t =>
    !selectedTags.value.includes(t) &&
    (q === '' || t.toLowerCase().includes(q)),
  )
})

const canAddNew = computed(() => {
  const q = filterInput.value.trim()
  return q.length > 0 && !selectedTags.value.includes(q) && !props.allKnownTags.includes(q)
})

const noResults = computed(() => filteredOptions.value.length === 0 && !canAddNew.value)

async function openDropdown() {
  dropdownOpen.value = true
  filterInput.value = ''
  await nextTick()
  filterRef.value?.focus()
}

function onFocusOut(e: FocusEvent) {
  // Close only if focus leaves the entire container
  if (!containerRef.value?.contains(e.relatedTarget as Node)) {
    dropdownOpen.value = false
    filterInput.value = ''
  }
}

function addTag(tag: string) {
  const cleaned = tag.trim()
  if (!cleaned || selectedTags.value.includes(cleaned)) return
  emit('update', { tags: [...selectedTags.value, cleaned] })
  filterInput.value = ''
}

function removeTag(tag: string) {
  emit('update', { tags: selectedTags.value.filter(t => t !== tag) })
}

function onFilterKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { dropdownOpen.value = false; filterInput.value = '' }
  if (e.key === 'Enter' && filterInput.value.trim()) {
    e.preventDefault()
    if (canAddNew.value) addTag(filterInput.value)
    else if (filteredOptions.value.length > 0) addTag(filteredOptions.value[0])
  }
}

// ── Stamina / Durability ──────────────────────────────────────────────────────
function patch(data: Partial<StatsData>) {
  emit('update', data)
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}
</script>

<template>
  <div class="space-y-6">

    <!-- Stamina + Durability row -->
    <div class="grid grid-cols-2 gap-4">

      <!-- Stamina -->
      <div class="space-y-2">
        <label class="text-xs font-semibold text-sw-text/50 uppercase tracking-wider">Stamina</label>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="w-8 h-8 rounded-lg bg-sw-card border border-sw-gold/20 text-sw-text/70 hover:border-sw-gold/60 transition-colors flex items-center justify-center text-lg font-bold"
            @click="patch({ stamina: clamp((stats?.stamina ?? 4) - 1, 1, 13) })"
          >−</button>
          <span class="flex-1 text-center text-2xl font-bold text-sw-gold tabular-nums">
            {{ stats?.stamina ?? 4 }}
          </span>
          <button
            type="button"
            class="w-8 h-8 rounded-lg bg-sw-card border border-sw-gold/20 text-sw-text/70 hover:border-sw-gold/60 transition-colors flex items-center justify-center text-lg font-bold"
            @click="patch({ stamina: clamp((stats?.stamina ?? 4) + 1, 1, 13) })"
          >+</button>
        </div>
      </div>

      <!-- Durability -->
      <div class="space-y-2">
        <label class="text-xs font-semibold text-sw-text/50 uppercase tracking-wider">Durability</label>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="w-8 h-8 rounded-lg bg-sw-card border border-sw-gold/20 text-sw-text/70 hover:border-sw-gold/60 transition-colors flex items-center justify-center text-lg font-bold"
            @click="patch({ durability: clamp((stats?.durability ?? 3) - 1, 1, 5) })"
          >−</button>
          <span class="flex-1 text-center text-2xl font-bold text-sw-gold tabular-nums">
            {{ stats?.durability ?? 3 }}
          </span>
          <button
            type="button"
            class="w-8 h-8 rounded-lg bg-sw-card border border-sw-gold/20 text-sw-text/70 hover:border-sw-gold/60 transition-colors flex items-center justify-center text-lg font-bold"
            @click="patch({ durability: clamp((stats?.durability ?? 3) + 1, 1, 5) })"
          >+</button>
        </div>
      </div>
    </div>

    <!-- Tags multi-pick -->
    <div class="space-y-2">
      <label class="text-xs font-semibold text-sw-text/50 uppercase tracking-wider">Tags</label>

      <!-- Selected chips -->
      <div v-if="selectedTags.length" class="flex flex-wrap gap-1.5">
        <span
          v-for="tag in selectedTags"
          :key="tag"
          class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-sw-gold/20 text-sw-gold border border-sw-gold/30"
        >
          {{ tag }}
          <button
            type="button"
            class="w-5 h-5 flex items-center justify-center rounded-full hover:text-red-400 hover:bg-red-400/10 transition-colors leading-none touch-manipulation"
            @click="removeTag(tag)"
          >×</button>
        </span>
      </div>

      <!-- Dropdown trigger -->
      <div ref="containerRef" class="relative" @focusout="onFocusOut">
        <button
          type="button"
          class="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm bg-sw-dark border transition-colors text-left"
          :class="dropdownOpen ? 'border-sw-gold/60' : 'border-sw-gold/20 hover:border-sw-gold/40'"
          @click="openDropdown"
        >
          <span class="text-sw-text/40">
            {{ selectedTags.length ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected` : 'Select tags…' }}
          </span>
          <svg class="w-4 h-4 text-sw-text/30 shrink-0 transition-transform" :class="{ 'rotate-180': dropdownOpen }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Dropdown panel -->
        <div
          v-if="dropdownOpen"
          class="absolute z-20 mt-1 w-full rounded-lg border border-sw-gold/20 bg-sw-dark shadow-xl overflow-hidden"
        >
          <!-- Filter input -->
          <div class="p-2 border-b border-sw-gold/10">
            <input
              ref="filterRef"
              type="text"
              tabindex="0"
              placeholder="Filter or type new tag…"
              :value="filterInput"
              class="w-full rounded-md px-3 py-1.5 text-sm bg-sw-bg border border-sw-gold/20 text-sw-text placeholder:text-sw-text/30 focus:outline-none focus:border-sw-gold/50"
              @input="filterInput = ($event.target as HTMLInputElement).value"
              @keydown="onFilterKeydown"
              @mousedown.stop
            />
          </div>

          <!-- Tag list -->
          <ul class="max-h-48 overflow-y-auto">
            <li
              v-for="tag in filteredOptions"
              :key="tag"
              class="px-3 py-2 text-sm text-sw-text hover:bg-sw-gold/10 cursor-pointer flex items-center justify-between"
              @mousedown.prevent="addTag(tag)"
            >
              {{ tag }}
              <svg class="w-4 h-4 text-sw-gold/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </li>

            <!-- No match but can add new -->
            <li
              v-if="canAddNew"
              class="px-3 py-2 text-sm text-sw-gold hover:bg-sw-gold/10 cursor-pointer flex items-center gap-2 border-t border-sw-gold/10"
              @mousedown.prevent="addTag(filterInput)"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add "{{ filterInput.trim() }}" as new tag
            </li>

            <!-- Truly empty -->
            <li v-if="noResults" class="px-3 py-3 text-sm text-sw-text/30 text-center">
              No tags yet — type to add one
            </li>
          </ul>
        </div>
      </div>
    </div>

  </div>
</template>
