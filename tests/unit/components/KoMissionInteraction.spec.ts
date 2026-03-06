import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import KoMissionInteraction from '../../../src/components/play/KoMissionInteraction.vue'
import { useKeyopsStore } from '../../../src/stores/keyops.ts'
import type { KoMission } from '../../../src/types/index.ts'

// Stub child mission components to avoid deep rendering
const stubs = {
  ExploreTheRuins: { template: '<div data-stub="ExploreTheRuins" />' },
  FoilTheHeist: { template: '<div data-stub="FoilTheHeist" />' },
  TriggerAChainReaction: { template: '<div data-stub="TriggerAChainReaction" />' },
  ExtractTheAgent: { template: '<div data-stub="ExtractTheAgent" />' },
  Jailbreak: { template: '<div data-stub="Jailbreak" />' },
  CrashLanding: { template: '<div data-stub="CrashLanding" />' },
}

function makeMission(id: number): KoMission {
  return { id, name: `Mission ${id}`, stages: [] }
}

describe('KoMissionInteraction', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function mountComp() {
    return mount(KoMissionInteraction, { global: { stubs } })
  }

  it('renders nothing when no mission is selected', () => {
    const wrapper = mountComp()
    expect(wrapper.html()).not.toContain('data-stub')
  })

  it('renders ExploreTheRuins for mission id 1', () => {
    const store = useKeyopsStore()
    store.selectedKoMission = makeMission(1)
    const wrapper = mountComp()
    expect(wrapper.find('[data-stub="ExploreTheRuins"]').exists()).toBe(true)
  })

  it('renders FoilTheHeist for mission id 2', () => {
    const store = useKeyopsStore()
    store.selectedKoMission = makeMission(2)
    const wrapper = mountComp()
    expect(wrapper.find('[data-stub="FoilTheHeist"]').exists()).toBe(true)
  })

  it('renders TriggerAChainReaction for mission id 3', () => {
    const store = useKeyopsStore()
    store.selectedKoMission = makeMission(3)
    const wrapper = mountComp()
    expect(wrapper.find('[data-stub="TriggerAChainReaction"]').exists()).toBe(true)
  })

  it('renders ExtractTheAgent for mission id 4', () => {
    const store = useKeyopsStore()
    store.selectedKoMission = makeMission(4)
    const wrapper = mountComp()
    expect(wrapper.find('[data-stub="ExtractTheAgent"]').exists()).toBe(true)
  })

  it('renders Jailbreak for mission id 5', () => {
    const store = useKeyopsStore()
    store.selectedKoMission = makeMission(5)
    const wrapper = mountComp()
    expect(wrapper.find('[data-stub="Jailbreak"]').exists()).toBe(true)
  })

  it('renders CrashLanding for mission id 6', () => {
    const store = useKeyopsStore()
    store.selectedKoMission = makeMission(6)
    const wrapper = mountComp()
    expect(wrapper.find('[data-stub="CrashLanding"]').exists()).toBe(true)
  })

  it('does not render wrong component for given id', () => {
    const store = useKeyopsStore()
    store.selectedKoMission = makeMission(1)
    const wrapper = mountComp()
    expect(wrapper.find('[data-stub="FoilTheHeist"]').exists()).toBe(false)
    expect(wrapper.find('[data-stub="CrashLanding"]').exists()).toBe(false)
  })
})
