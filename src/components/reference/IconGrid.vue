<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface IconDef {
  name: string
  category: string
  file: string
  description?: string
}

const icons = ref<IconDef[]>([])
const search = ref('')
const error = ref(false)

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
    !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
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

    <!-- Empty / placeholder state -->
    <div v-if="error || icons.length === 0" class="rounded-lg border border-sw-gold/10 bg-sw-card/40 p-8 text-center text-sw-text/40">
      <p class="text-4xl mb-3">🔮</p>
      <p class="font-medium">No icons loaded</p>
      <p class="text-sm mt-1">
        Add icon definitions to <code class="text-sw-gold/70">/public/data/icons.json</code>
        and place icon files in <code class="text-sw-gold/70">/public/images/icons/</code>
      </p>
    </div>

    <!-- No results after filtering -->
    <div v-else-if="filtered.length === 0" class="py-8 text-center text-sw-text/40">
      No icons match "{{ search }}"
    </div>

    <!-- Category sections -->
    <template v-else>
      <section v-for="cat in categories" :key="cat" class="space-y-2">
        <h2 class="text-xs font-semibold uppercase tracking-widest text-sw-text/40">{{ cat }}</h2>
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          <div
            v-for="icon in iconsInCategory(cat)"
            :key="icon.name"
            class="flex flex-col items-center gap-1 rounded-lg border border-sw-gold/10 bg-sw-card/40 p-3 text-center"
            :title="icon.description"
          >
            <img
              :src="`/images/icons/${icon.file}`"
              :alt="icon.name"
              class="h-8 w-8 object-contain"
              style="filter: brightness(0) invert(1); opacity: 0.8"
            />
            <span class="text-xs text-sw-text/70 leading-tight">{{ icon.name }}</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
