<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { imageUrl } from '../../utils/imageUrl.ts'

interface IconDef {
  name: string
  category: string
  file: string
  description?: string
}

const icons = ref<IconDef[]>([])
const search = ref('')
const error = ref(false)
const collapsed = ref<Set<string>>(new Set())

onMounted(async () => {
  try {
    const res = await fetch('/data/icons.json')
    if (!res.ok) throw new Error('not found')
    icons.value = await res.json()
  } catch {
    error.value = true
  }
})

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  return icons.value.filter(i =>
    !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)
  )
})

const categories = computed(() => {
  const seen = new Set<string>()
  const result: string[] = []
  for (const icon of filtered.value) {
    if (!seen.has(icon.category)) {
      seen.add(icon.category)
      result.push(icon.category)
    }
  }
  return result
})

function iconsInCategory(cat: string) {
  return filtered.value.filter(i => i.category === cat)
}

function toggle(name: string) {
  if (collapsed.value.has(name)) {
    collapsed.value.delete(name)
  } else {
    collapsed.value.add(name)
  }
  collapsed.value = new Set(collapsed.value)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Search -->
    <input
      v-model="search"
      type="search"
      placeholder="Search icons…"
      class="w-full rounded-lg border border-sw-gold/30 bg-sw-dark px-3 py-2 text-sm text-sw-text placeholder-sw-text/30 focus:border-sw-gold focus:outline-none"
    />

    <!-- Empty / error state -->
    <div v-if="error || icons.length === 0" class="rounded-lg border border-sw-gold/10 bg-sw-card/40 p-8 text-center text-sw-text/40">
      <p class="text-4xl mb-3">🔮</p>
      <p class="font-medium">No icons loaded</p>
    </div>

    <!-- No results after filtering -->
    <div v-else-if="filtered.length === 0" class="py-8 text-center text-sw-text/40">
      No icons match "{{ search }}"
    </div>

    <!-- Category sections -->
    <template v-else>
      <section v-for="cat in categories" :key="cat" class="space-y-2">
        <h2 class="text-xs font-semibold uppercase tracking-widest text-sw-gold/60">{{ cat }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-1">
          <div
            v-for="icon in iconsInCategory(cat)"
            :key="icon.name"
            class="rounded-lg border border-sw-gold/10 bg-sw-card/40 overflow-hidden"
          >
            <!-- Row (always visible) -->
            <button
              class="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-sw-gold/5 transition-colors"
              @click="toggle(icon.name)"
            >
              <img
                :src="imageUrl(`/images/icons/${icon.file}`)"
                :alt="icon.name"
                class="h-8 w-8 object-contain flex-shrink-0"
              />
              <span class="text-sm font-semibold text-sw-gold">{{ icon.name }}</span>
              <svg
                class="ml-auto flex-shrink-0 w-4 h-4 text-sw-gold/60 transition-transform"
                :class="collapsed.has(icon.name) ? '' : 'rotate-180'"
                viewBox="0 0 16 16" fill="currentColor"
              >
                <path d="M8 10.5 L3 5.5 L4.4 4.1 L8 7.7 L11.6 4.1 L13 5.5 Z"/>
              </svg>
            </button>

            <!-- Expanded description -->
            <div v-if="!collapsed.has(icon.name) && icon.description" class="px-3 pb-3 pt-0">
              <p class="text-xs text-sw-text/70 leading-relaxed border-t border-sw-gold/10 pt-2">
                {{ icon.description }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
