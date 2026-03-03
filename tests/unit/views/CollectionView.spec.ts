import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CollectionView from '../../../src/views/CollectionView.vue'
import { useProductsStore } from '../../../src/stores/products.ts'
import { useCharactersStore } from '../../../src/stores/characters.ts'
import { useCollectionStore } from '../../../src/stores/collection.ts'
import type { Product, Character } from '../../../src/types/index.ts'

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: 'Starter Set',
    swp: 'SWP01',
    era: 'GCW',
    thumbnail: '',
    images: [],
    models: [],
    description: '',
    assemblyUrl: '',
    storeLink: '',
    ...overrides,
  }
}

function makeChar(overrides: Partial<Character> = {}): Character {
  return {
    id: 1,
    name: 'Luke Skywalker',
    characterType: 'Hero',
    unitType: 'Primary',
    pc: null,
    sp: 5,
    durability: 4,
    stamina: 6,
    fp: 2,
    era: 'GCW',
    tags: [],
    swp: 'SWP01: Starter Set',
    swpCode: 'SWP01',
    thumbnail: '',
    cardFront: '',
    cardBack: '',
    stances: [],
    releaseDate: '',
    ...overrides,
  }
}

describe('CollectionView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    })
  })

  function mountView(storeSetup?: () => void) {
    if (storeSetup) storeSetup()
    return mount(CollectionView, {
      global: {
        plugins: [pinia],
        stubs: {
          ProductCard: { template: '<div class="product-card" @click="$emit(\'toggle\')"/>' },
          Transition: { template: '<slot/>' },
        },
      },
    })
  }

  it('renders "Collection" heading', () => {
    const wrapper = mountView(() => {
      useProductsStore().products = [makeProduct()]
    })
    expect(wrapper.text()).toContain('Collection')
  })

  it('shows loading text when productsStore.loading is true', () => {
    const wrapper = mountView(() => {
      const store = useProductsStore()
      store.products = []
      store.loading = true
    })
    expect(wrapper.text()).toContain('Loading')
  })

  it('shows error text when productsStore.error is set', () => {
    const wrapper = mountView(() => {
      const store = useProductsStore()
      store.products = []
      store.loading = false
      store.error = 'Network error'
    })
    expect(wrapper.text()).toContain('Network error')
  })

  it('renders one .product-card per product', () => {
    const wrapper = mountView(() => {
      useProductsStore().products = [makeProduct({ id: 1 }), makeProduct({ id: 2 })]
    })
    expect(wrapper.findAll('.product-card')).toHaveLength(2)
  })

  it('clicking ProductCard stub emits toggle, calling collectionStore.toggleOwned', async () => {
    const wrapper = mountView(() => {
      useProductsStore().products = [makeProduct({ swp: 'SWP01' })]
    })
    const collectionStore = useCollectionStore()
    const toggleSpy = vi.spyOn(collectionStore, 'toggleOwned')
    // The stub emits 'toggle' on click, which CollectionView handles with @toggle="collectionStore.toggleOwned(product.swp)"
    await wrapper.find('.product-card').trigger('click')
    expect(toggleSpy).toHaveBeenCalledWith('SWP01')
  })

  it('shows correct owned/total packs count in stats', () => {
    const wrapper = mountView(() => {
      const ps = useProductsStore()
      ps.products = [makeProduct({ swp: 'SWP01' }), makeProduct({ id: 2, swp: 'SWP02' })]
      const cs = useCollectionStore()
      cs.toggleOwned('SWP01')
    })
    expect(wrapper.text()).toContain('1/2')
  })

  it('totalUnitsOwned counts characters by swpCode', () => {
    const wrapper = mountView(() => {
      const ps = useProductsStore()
      ps.products = [makeProduct({ swp: 'SWP01' })]
      const chars = useCharactersStore()
      chars.characters = [
        makeChar({ id: 1, swp: 'SWP01: Starter Set', swpCode: 'SWP01' }),
        makeChar({ id: 2, swp: 'SWP01: Starter Set', swpCode: 'SWP01' }),
        makeChar({ id: 3, swp: 'SWP02: Other Set', swpCode: 'SWP02' }),
      ]
      useCollectionStore().toggleOwned('SWP01')
    })
    // 2 units with swpCode 'SWP01' are owned
    expect(wrapper.text()).toContain('2')
  })

  it('"Copy Profile Link" button exists', () => {
    const wrapper = mountView(() => {
      useProductsStore().products = [makeProduct()]
    })
    const btn = wrapper.findAll('button').find(b => b.text().includes('Copy Profile Link'))
    expect(btn).toBeTruthy()
  })

  it('era breakdown renders era names', () => {
    const wrapper = mountView(() => {
      useProductsStore().products = [
        makeProduct({ swp: 'SWP01', era: 'GCW' }),
        makeProduct({ id: 2, swp: 'SWP02', era: 'Clone Wars' }),
      ]
    })
    expect(wrapper.text()).toContain('GCW')
    expect(wrapper.text()).toContain('Clone Wars')
  })
})
