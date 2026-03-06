import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import KoStageCards from '../../../src/components/play/KoStageCards.vue'
import { useKeyopsStore } from '../../../src/stores/keyops.ts'
import type { KoMission } from '../../../src/types/index.ts'

const stubs = {
  Transition: { template: '<slot/>' },
  Teleport: { template: '<slot/>' },
}

const mockMission: KoMission = {
  id: 1,
  name: 'Explore the Ruins',
  missionFront: '/images/ko/mission-front.png',
  missionBack: '/images/ko/mission-back.png',
  stages: [
    { front: '/images/ko/stage-1-front.png', back: '/images/ko/stage-1-back.png' },
    { front: '/images/ko/stage-2-front.png', back: '/images/ko/stage-2-back.png' },
  ],
  tracker: '/images/ko/tracker.png',
}

describe('KoStageCards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function mountComp() {
    return mount(KoStageCards, {
      global: { stubs },
      attachTo: document.body,
    })
  }

  it('renders Stage Cards header', () => {
    const wrapper = mountComp()
    expect(wrapper.text()).toContain('Stage Cards')
  })

  it('shows placeholder when no mission selected', () => {
    const wrapper = mountComp()
    expect(wrapper.text()).toContain('Stage cards coming soon')
  })

  it('shows placeholder when mission has empty stages', () => {
    const koStore = useKeyopsStore()
    koStore.selectedKoMission = { ...mockMission, stages: [] }
    const wrapper = mountComp()
    expect(wrapper.text()).toContain('Stage cards coming soon')
  })

  it('renders one card element per stage', () => {
    const koStore = useKeyopsStore()
    koStore.selectedKoMission = mockMission
    const wrapper = mountComp()
    const imgs = wrapper.findAll('img')
    expect(imgs).toHaveLength(2)
  })

  it('active card (index 0) has cursor-pointer class', () => {
    const koStore = useKeyopsStore()
    koStore.selectedKoMission = mockMission
    koStore.koStageIndex = 0
    const wrapper = mountComp()
    const cards = wrapper.findAll('[style*="max-width"]')
    expect(cards[0].classes()).toContain('cursor-pointer')
  })

  it('inactive future card has cursor-default class', () => {
    const koStore = useKeyopsStore()
    koStore.selectedKoMission = mockMission
    koStore.koStageIndex = 0
    const wrapper = mountComp()
    const cards = wrapper.findAll('[style*="max-width"]')
    expect(cards[1].classes()).toContain('cursor-default')
  })

  it('shows ACTIVE badge only on active card', () => {
    const koStore = useKeyopsStore()
    koStore.selectedKoMission = mockMission
    koStore.koStageIndex = 0
    const wrapper = mountComp()
    const badges = wrapper.findAll('div').filter(d => d.text() === 'ACTIVE')
    expect(badges).toHaveLength(1)
  })

  it('clicking active card opens zoom overlay', async () => {
    const koStore = useKeyopsStore()
    koStore.selectedKoMission = mockMission
    koStore.koStageIndex = 0
    const wrapper = mountComp()
    const cards = wrapper.findAll('[style*="max-width"]')
    await cards[0].trigger('click')
    expect(wrapper.text()).toContain('Close')
  })

  it('clicking inactive card does not open zoom overlay', async () => {
    const koStore = useKeyopsStore()
    koStore.selectedKoMission = mockMission
    koStore.koStageIndex = 0
    const wrapper = mountComp()
    const cards = wrapper.findAll('[style*="max-width"]')
    await cards[1].trigger('click')
    expect(wrapper.text()).not.toContain('Close')
  })

  it('zoom overlay shows front image by default', async () => {
    const koStore = useKeyopsStore()
    koStore.selectedKoMission = mockMission
    koStore.koStageIndex = 0
    const wrapper = mountComp()
    await wrapper.findAll('[style*="max-width"]')[0].trigger('click')
    const overlayImg = wrapper.findAll('img').find(img =>
      img.attributes('src')?.includes('stage-1-front')
    )
    expect(overlayImg).toBeDefined()
  })

  it('flip button in zoom overlay switches to back image', async () => {
    const koStore = useKeyopsStore()
    koStore.selectedKoMission = mockMission
    koStore.koStageIndex = 0
    const wrapper = mountComp()
    await wrapper.findAll('[style*="max-width"]')[0].trigger('click')
    const flipBtn = wrapper.findAll('button').find(b => b.text() === 'Flip →')
    await flipBtn!.trigger('click')
    const overlayImg = wrapper.findAll('img').find(img =>
      img.attributes('src')?.includes('stage-1-back')
    )
    expect(overlayImg).toBeDefined()
  })

  it('close button dismisses zoom overlay', async () => {
    const koStore = useKeyopsStore()
    koStore.selectedKoMission = mockMission
    koStore.koStageIndex = 0
    const wrapper = mountComp()
    await wrapper.findAll('[style*="max-width"]')[0].trigger('click')
    const closeBtn = wrapper.findAll('button').find(b => b.text().includes('Close'))
    await closeBtn!.trigger('click')
    expect(wrapper.text()).not.toContain('Close')
  })

  it('small flip button on card flips without opening zoom', async () => {
    const koStore = useKeyopsStore()
    koStore.selectedKoMission = mockMission
    koStore.koStageIndex = 0
    const wrapper = mountComp()
    const flipBtns = wrapper.findAll('button').filter(b => b.text() === 'Flip →')
    // First flip button is the small one on the card (before zoom opens)
    await flipBtns[0].trigger('click')
    // Card image should now show back
    const imgs = wrapper.findAll('img')
    expect(imgs[0].attributes('src')).toContain('stage-1-back')
    // Zoom should NOT be open
    expect(wrapper.text()).not.toContain('Close')
  })

  it('Advance Stage button is disabled on last stage', () => {
    const koStore = useKeyopsStore()
    koStore.selectedKoMission = mockMission
    koStore.koStageIndex = 1 // last stage (index 1 of 2)
    const wrapper = mountComp()
    const advBtn = wrapper.findAll('button').find(b => b.text().includes('Advance Stage'))
    expect(advBtn!.attributes('disabled')).toBeDefined()
  })

  it('Advance Stage button advances the stage', async () => {
    const koStore = useKeyopsStore()
    koStore.selectedKoMission = mockMission
    koStore.koStageIndex = 0
    const wrapper = mountComp()
    const advBtn = wrapper.findAll('button').find(b => b.text().includes('Advance Stage'))
    await advBtn!.trigger('click')
    expect(koStore.koStageIndex).toBe(1)
  })
})
