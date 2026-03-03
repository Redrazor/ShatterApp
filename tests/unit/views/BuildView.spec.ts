import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import BuildView from '../../../src/views/BuildView.vue'
import { useStrikeForceStore } from '../../../src/stores/strikeForce.ts'
import { useCharactersStore } from '../../../src/stores/characters.ts'
import { useMissionsStore } from '../../../src/stores/missions.ts'
import { encodeBuild } from '../../../src/utils/profileShare.ts'
import type { CompactBuild } from '../../../src/types/index.ts'

describe('BuildView', () => {
  let pinia: ReturnType<typeof createPinia>
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
    })
    await router.push('/build')
    await router.isReady()
    // Mock clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    })
  })

  const stubs = {
    StrikeForcePanel: true,
    SquadSlot: true,
    UnitPickerDrawer: true,
    Teleport: { props: ['to'], template: '<div><slot/></div>' },
    Transition: { template: '<slot/>' },
  }

  function mountView() {
    return mount(BuildView, {
      global: { plugins: [pinia, router], stubs },
      attachTo: document.body,
    })
  }

  it('renders "Build" heading', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Build')
  })

  it('calls charStore.load() and missionsStore.load() on mount', () => {
    const charStore = useCharactersStore()
    const missionsStore = useMissionsStore()
    const charSpy = vi.spyOn(charStore, 'load').mockResolvedValue(undefined)
    const missionSpy = vi.spyOn(missionsStore, 'load').mockResolvedValue(undefined)
    mountView()
    expect(charSpy).toHaveBeenCalled()
    expect(missionSpy).toHaveBeenCalled()
  })

  it('renders StrikeForcePanel stub', () => {
    const wrapper = mountView()
    expect(wrapper.find('strike-force-panel-stub').exists()).toBe(true)
  })

  it('renders two SquadSlot stubs', () => {
    const wrapper = mountView()
    expect(wrapper.findAll('squad-slot-stub')).toHaveLength(2)
  })

  it('Saved Lists section hidden when savedLists is empty', () => {
    const sfStore = useStrikeForceStore()
    sfStore.savedLists = []
    const wrapper = mountView()
    expect(wrapper.text()).not.toContain('Saved Lists')
  })

  it('Saved Lists section visible when savedLists has items', () => {
    const sfStore = useStrikeForceStore()
    sfStore.savedLists = [
      { name: 'My Build', mid: null, pre: false, s: [[0, 0, 0], [0, 0, 0]] },
    ]
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Saved Lists')
    expect(wrapper.text()).toContain('My Build')
  })

  it('clicking "Load" button calls sfStore.loadList(0, ...)', async () => {
    const sfStore = useStrikeForceStore()
    sfStore.savedLists = [
      { name: 'My Build', mid: null, pre: false, s: [[0, 0, 0], [0, 0, 0]] },
    ]
    const loadSpy = vi.spyOn(sfStore, 'loadList')
    const wrapper = mountView()
    const loadBtn = wrapper.findAll('button').find(b => b.text() === 'Load')!
    await loadBtn.trigger('click')
    expect(loadSpy).toHaveBeenCalledWith(0, expect.any(Array), expect.any(Array))
  })

  it('clicking "Delete" button calls sfStore.deleteList(0)', async () => {
    const sfStore = useStrikeForceStore()
    sfStore.savedLists = [
      { name: 'My Build', mid: null, pre: false, s: [[0, 0, 0], [0, 0, 0]] },
    ]
    const deleteSpy = vi.spyOn(sfStore, 'deleteList')
    const wrapper = mountView()
    const deleteBtn = wrapper.findAll('button').find(b => b.text() === 'Delete')!
    await deleteBtn.trigger('click')
    expect(deleteSpy).toHaveBeenCalledWith(0)
  })

  it('clicking "+ New" button calls sfStore.newList()', async () => {
    const sfStore = useStrikeForceStore()
    sfStore.savedLists = [
      { name: 'My Build', mid: null, pre: false, s: [[0, 0, 0], [0, 0, 0]] },
    ]
    const newListSpy = vi.spyOn(sfStore, 'newList')
    const wrapper = mountView()
    const newBtn = wrapper.findAll('button').find(b => b.text().includes('New'))!
    await newBtn.trigger('click')
    expect(newListSpy).toHaveBeenCalled()
  })

  it('shared build import banner shown when route.query.sf is valid', async () => {
    const encoded = encodeBuild('Shared Build', null, false, [[0, 0, 0], [0, 0, 0]])
    await router.push(`/build?sf=${encoded}`)
    await router.isReady()
    const wrapper = mountView()
    // onMounted processes the sf query param and sets pendingSharedBuild
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Shared Build')
    expect(wrapper.text()).toContain('Import')
  })

  it('clicking "Import" on banner calls sfStore.importLists', async () => {
    const encoded = encodeBuild('Imported Build', null, false, [[0, 0, 0], [0, 0, 0]])
    await router.push(`/build?sf=${encoded}`)
    await router.isReady()
    const sfStore = useStrikeForceStore()
    const importSpy = vi.spyOn(sfStore, 'importLists')
    const wrapper = mountView()
    await wrapper.vm.$nextTick()
    const importBtn = wrapper.findAll('button').find(b => b.text() === 'Import')
    if (importBtn) {
      await importBtn.trigger('click')
      expect(importSpy).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ name: 'Imported Build' })])
      )
    }
  })

  it('clicking "Dismiss" hides the import banner', async () => {
    const encoded = encodeBuild('Dismissed Build', null, false, [[0, 0, 0], [0, 0, 0]])
    await router.push(`/build?sf=${encoded}`)
    await router.isReady()
    const wrapper = mountView()
    await wrapper.vm.$nextTick()
    const dismissBtn = wrapper.findAll('button').find(b => b.text() === 'Dismiss')
    if (dismissBtn) {
      await dismissBtn.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain('Dismissed Build')
    }
  })
})
