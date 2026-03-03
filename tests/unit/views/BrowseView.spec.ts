import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import BrowseView from '../../../src/views/BrowseView.vue'
import { useCharactersStore } from '../../../src/stores/characters.ts'
import { useFavoritesStore } from '../../../src/stores/favorites.ts'
import type { Character } from '../../../src/types/index.ts'

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
    tags: ['Rebel'],
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

describe('BrowseView', () => {
  let pinia: ReturnType<typeof createPinia>
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
    })
    await router.push('/browse')
    await router.isReady()
  })

  const stubs = {
    SearchBar: true,
    FilterPanel: true,
    BrowseGrid: { template: '<div class="browse-grid" @toggle-favorite="$emit(\'toggle-favorite\', $event)"/>' },
    CompareModal: true,
    RouterView: true,
    Teleport: { props: ['to'], template: '<div><slot/></div>' },
    Transition: { template: '<slot/>' },
  }

  function mountView() {
    return mount(BrowseView, {
      global: { plugins: [pinia, router], stubs },
    })
  }

  it('renders "Units" heading', () => {
    const store = useCharactersStore()
    store.characters = [makeChar()]
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Units')
  })

  it('calls characterStore.load() on mount', () => {
    const store = useCharactersStore()
    const loadSpy = vi.spyOn(store, 'load').mockResolvedValue(undefined)
    mountView()
    expect(loadSpy).toHaveBeenCalled()
  })

  it('shows loading text when characterStore.loading is true', () => {
    const store = useCharactersStore()
    store.characters = []
    store.loading = true
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Loading')
  })

  it('shows error text when characterStore.error is set', () => {
    const store = useCharactersStore()
    store.characters = []
    store.loading = false
    store.error = 'Server error'
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Server error')
  })

  it('renders BrowseGrid stub when characters loaded', () => {
    const store = useCharactersStore()
    store.characters = [makeChar()]
    store.loading = false
    store.error = null
    const wrapper = mountView()
    expect(wrapper.find('.browse-grid').exists()).toBe(true)
  })

  it('shows result count in parens', () => {
    const store = useCharactersStore()
    store.characters = [makeChar({ id: 1 }), makeChar({ id: 2, name: 'Vader' })]
    store.loading = false
    store.error = null
    const wrapper = mountView()
    expect(wrapper.text()).toContain('(2)')
  })

  it('sets tags filter from route.query.tag immediately', async () => {
    await router.push('/browse?tag=Rebel')
    await router.isReady()
    const store = useCharactersStore()
    store.characters = [makeChar({ tags: ['Rebel'] })]
    // BrowseView watches route.query.tag with immediate: true — mounting should pick it up
    const wrapper = mountView()
    // The result count should reflect filtered results (1 char with Rebel tag)
    expect(wrapper.text()).toContain('(1)')
  })

  it('sets swpFilter from route.query.swp immediately', async () => {
    await router.push('/browse?swp=SWP01')
    await router.isReady()
    const store = useCharactersStore()
    store.characters = [
      makeChar({ id: 1, swpCode: 'SWP01' }),
      makeChar({ id: 2, swpCode: 'SWP02' }),
    ]
    const wrapper = mountView()
    // Only SWP01 char should match
    expect(wrapper.text()).toContain('(1)')
  })

  it('calls favoritesStore.toggleFavorite when BrowseGrid emits toggle-favorite', async () => {
    const store = useCharactersStore()
    store.characters = [makeChar({ id: 99 })]
    store.loading = false
    store.error = null
    const favStore = useFavoritesStore()
    const spy = vi.spyOn(favStore, 'toggleFavorite')

    const wrapper = mountView()
    // BrowseGrid stub emits toggle-favorite with the character
    await wrapper.find('.browse-grid').trigger('toggle-favorite')
    // The event passes the char; BrowseView calls favoritesStore.toggleFavorite(char.id)
    // Since stub triggers with no payload, the char will be undefined, but the spy should be called
    expect(spy).toHaveBeenCalled()
  })
})
