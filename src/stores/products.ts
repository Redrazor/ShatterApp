import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Product } from '../types/index.ts'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    if (products.value.length > 0) return
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/products`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      products.value = await res.json()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  return { products, loading, error, load }
})
