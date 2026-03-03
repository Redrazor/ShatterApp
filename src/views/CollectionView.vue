<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductsStore } from '../stores/products.ts'
import { useCollectionStore } from '../stores/collection.ts'
import { useCharactersStore } from '../stores/characters.ts'
import { useStrikeForceStore } from '../stores/strikeForce.ts'
import ProductCard from '../components/collection/ProductCard.vue'
import { encodeProfile } from '../utils/profileShare.ts'

const productsStore = useProductsStore()
const collectionStore = useCollectionStore()
const charactersStore = useCharactersStore()
const sfStore = useStrikeForceStore()

onMounted(() => {
  productsStore.load()
  charactersStore.load()
})

const ownedCount = computed(() => productsStore.products.filter(
  (p) => collectionStore.isOwned(p.swp),
).length)

const totalUnitsOwned = computed(() => {
  const ownedSwps = collectionStore.ownedSwpSet
  return charactersStore.characters.filter(c => ownedSwps.has(c.swpCode ?? '')).length
})

const eraStats = computed(() => {
  const map = new Map<string, { total: number; owned: number }>()
  for (const p of productsStore.products) {
    const eras = p.era.split(';').map(e => e.trim()).filter(Boolean)
    for (const era of eras) {
      if (!map.has(era)) map.set(era, { total: 0, owned: 0 })
      const entry = map.get(era)!
      entry.total++
      if (collectionStore.isOwned(p.swp)) entry.owned++
    }
  }
  return [...map.entries()].map(([era, { total, owned }]) => ({ era, total, owned })).sort((a, b) => a.era.localeCompare(b.era))
})

const linkCopied = ref(false)

async function copyProfileLink() {
  const encoded = encodeProfile(collectionStore.owned, [], sfStore.savedLists)
  const url = `${window.location.origin}/?p=${encoded}`
  await navigator.clipboard.writeText(url)
  linkCopied.value = true
  setTimeout(() => { linkCopied.value = false }, 2000)
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-sw-gold">Collection</h1>

    <!-- Stats dashboard -->
    <div v-if="!productsStore.loading" class="rounded-xl border border-sw-gold/20 bg-sw-card/40 p-4 space-y-3">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex flex-wrap gap-4">
          <div class="stat-block">
            <span class="stat-num">{{ ownedCount }}/{{ productsStore.products.length }}</span>
            <span class="stat-lbl">Packs owned</span>
          </div>
          <div class="stat-block">
            <span class="stat-num">{{ totalUnitsOwned }}</span>
            <span class="stat-lbl">Units owned</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="rounded-lg border border-sw-gold/30 px-3 py-1.5 text-xs text-sw-gold/70 transition-colors hover:border-sw-gold hover:text-sw-gold"
            @click="copyProfileLink"
          >
            Copy Profile Link
          </button>
          <Transition name="fade">
            <span v-if="linkCopied" class="text-xs text-green-400">Link copied!</span>
          </Transition>
        </div>
      </div>

      <!-- Era breakdown -->
      <div v-if="eraStats.length > 0" class="space-y-1.5">
        <p class="text-[10px] uppercase tracking-widest text-sw-text/40">By era</p>
        <div v-for="s in eraStats" :key="s.era" class="space-y-0.5">
          <div class="flex items-center justify-between text-xs text-sw-text/60">
            <span>{{ s.era }}</span>
            <span>{{ s.owned }}/{{ s.total }}</span>
          </div>
          <div class="h-1.5 w-full rounded-full bg-sw-dark overflow-hidden">
            <div
              class="h-full rounded-full bg-sw-gold transition-all"
              :style="{ width: s.total ? `${(s.owned / s.total) * 100}%` : '0%' }"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="productsStore.loading" class="py-16 text-center text-sw-text/50">Loading…</div>
    <div v-else-if="productsStore.error" class="py-8 text-center text-red-400">
      {{ productsStore.error }}
    </div>

    <div
      v-else
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
    >
      <ProductCard
        v-for="product in productsStore.products"
        :key="product.id"
        :product="product"
        :owned="collectionStore.isOwned(product.swp)"
        @toggle="collectionStore.toggleOwned(product.swp)"
      />
    </div>
  </div>
</template>

<style scoped>
.stat-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.stat-num {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--sw-gold, 212 175 55));
  line-height: 1;
}
.stat-lbl {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgb(255 255 255 / 0.4);
  margin-top: 0.2rem;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
