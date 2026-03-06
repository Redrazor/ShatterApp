import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ExploreTheRuins from '../../../src/components/play/ko/ExploreTheRuins.vue'
import { useKeyopsStore } from '../../../src/stores/keyops.ts'
import type { KoMission } from '../../../src/types/index.ts'

const stubs = {
  Transition: { template: '<slot/>' },
  DieFace: { template: '<div class="die-face" />' },
}

const mockMission: KoMission = {
  id: 1,
  name: 'Explore the Ruins',
  missionFront: '/images/ko/mission-front.png',
  missionBack: '/images/ko/mission-back.png',
  stages: [
    { front: '/images/ko/stage-1-front.png', back: '/images/ko/stage-1-back.png' },
  ],
  tracker: '/images/ko/tracker.png',
}

describe('ExploreTheRuins', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function mountComp() {
    return mount(ExploreTheRuins, { global: { stubs } })
  }

  // ── Section A removed ────────────────────────────────────────────────────

  it('does not render a standalone mission card image (Section A removed)', () => {
    const koStore = useKeyopsStore()
    koStore.selectedKoMission = mockMission
    const wrapper = mountComp()
    expect(wrapper.text()).not.toContain('Mission Card')
    // No flip button for a standalone mission card section
    const flipBtns = wrapper.findAll('button').filter(b =>
      b.text() === 'Flip →' && !wrapper.text().includes('Stage')
    )
    // Mysterious Workings and stage flips may exist; only check mission card header absent
    expect(wrapper.find('[alt="Mission card front"]').exists()).toBe(false)
  })

  // ── Section C: Tracker ───────────────────────────────────────────────────

  it('renders tracker image when mission has tracker', () => {
    const koStore = useKeyopsStore()
    koStore.selectedKoMission = mockMission
    const wrapper = mountComp()
    expect(wrapper.text()).toContain('Dashboard')
    const img = wrapper.find('img[alt="Explore the Ruins Dashboard"]')
    expect(img.exists()).toBe(true)
  })

  it('tracker image has w-[70%] class (30% smaller)', () => {
    const koStore = useKeyopsStore()
    koStore.selectedKoMission = mockMission
    const wrapper = mountComp()
    const img = wrapper.find('img[alt="Explore the Ruins Dashboard"]')
    expect(img.classes()).toContain('w-[70%]')
  })

  it('does not render tracker section when mission has no tracker', () => {
    const koStore = useKeyopsStore()
    koStore.selectedKoMission = { ...mockMission, tracker: undefined }
    const wrapper = mountComp()
    expect(wrapper.find('img[alt="Explore the Ruins Dashboard"]').exists()).toBe(false)
  })

  // ── Section D: Mysterious Workings ───────────────────────────────────────

  it('renders Mysterious Workings section', () => {
    const wrapper = mountComp()
    expect(wrapper.text()).toContain('Mysterious Workings')
  })

  it('renders all 4 effect rows', () => {
    const wrapper = mountComp()
    expect(wrapper.text()).toContain('Ancient Traps')
    expect(wrapper.text()).toContain('Collapse')
    expect(wrapper.text()).toContain('Refresh')
  })

  it('Resolve button is enabled before rolling', () => {
    const wrapper = mountComp()
    const resolveBtn = wrapper.findAll('button').find(b =>
      b.text().includes('Resolve Mysterious Working')
    )
    expect(resolveBtn!.attributes('disabled')).toBeUndefined()
  })

  it('clicking Resolve shows a die result and disables the button', async () => {
    const wrapper = mountComp()
    const resolveBtn = wrapper.findAll('button').find(b =>
      b.text().includes('Resolve Mysterious Working')
    )
    await resolveBtn!.trigger('click')
    expect(wrapper.find('.die-face').exists()).toBe(true)
    expect(resolveBtn!.attributes('disabled')).toBeDefined()
  })

  it('Clear button dismisses the die result', async () => {
    const wrapper = mountComp()
    const resolveBtn = wrapper.findAll('button').find(b =>
      b.text().includes('Resolve Mysterious Working')
    )
    await resolveBtn!.trigger('click')
    // Clear button appears only while a result is shown
    const clearBtn = wrapper.findAll('button').find(b => b.text() === 'Clear')
    expect(clearBtn).toBeDefined()
    await clearBtn!.trigger('click')
    // After clearing, Clear button should be gone and Resolve re-enabled
    expect(wrapper.findAll('button').find(b => b.text() === 'Clear')).toBeUndefined()
    expect(resolveBtn!.attributes('disabled')).toBeUndefined()
  })

  // ── Section E: Operation Pool ─────────────────────────────────────────────

  it('renders Operation Pool with 6 tokens initially', () => {
    const wrapper = mountComp()
    expect(wrapper.text()).toContain('Operation Pool')
    // 6 A buttons (assign to aggressor)
    const aBtns = wrapper.findAll('button').filter(b => b.text() === 'A')
    expect(aBtns).toHaveLength(6)
  })

  it('assigning a token to Aggressor moves it out of pool', async () => {
    const wrapper = mountComp()
    const firstA = wrapper.findAll('button').find(b => b.text() === 'A')
    await firstA!.trigger('click')
    const aBtns = wrapper.findAll('button').filter(b => b.text() === 'A')
    expect(aBtns).toHaveLength(5)
  })

  it('assigning a token to Sentinel moves it out of pool', async () => {
    const wrapper = mountComp()
    const firstS = wrapper.findAll('button').find(b => b.text() === 'S')
    await firstS!.trigger('click')
    const sBtns = wrapper.findAll('button').filter(b => b.text() === 'S')
    expect(sBtns).toHaveLength(5)
  })

  it('Return All returns tokens back to pool', async () => {
    const wrapper = mountComp()
    // Assign two tokens to aggressor
    for (let i = 0; i < 2; i++) {
      const btn = wrapper.findAll('button').find(b => b.text() === 'A')
      await btn!.trigger('click')
    }
    const returnAll = wrapper.findAll('button').find(b => b.text() === 'Return All')
    await returnAll!.trigger('click')
    const aBtns = wrapper.findAll('button').filter(b => b.text() === 'A')
    expect(aBtns).toHaveLength(6)
  })

  // ── Section F: Used Objectives ────────────────────────────────────────────

  it('renders 5 objective pills', () => {
    const wrapper = mountComp()
    expect(wrapper.text()).toContain('Objectives Used This Turn')
    const pills = wrapper.findAll('button').filter(b => /^[1-5]$/.test(b.text()))
    expect(pills).toHaveLength(5)
  })

  it('tapping an objective pill marks it as used', async () => {
    const wrapper = mountComp()
    const pill1 = wrapper.findAll('button').find(b => b.text() === '1')
    await pill1!.trigger('click')
    expect(wrapper.text()).toContain('Tap a used objective again to unmark it.')
  })

  it('Reset Turn clears all used objectives', async () => {
    const wrapper = mountComp()
    const pill1 = wrapper.findAll('button').find(b => b.text() === '1')
    await pill1!.trigger('click')
    const resetBtn = wrapper.findAll('button').find(b => b.text() === 'Reset Turn')
    await resetBtn!.trigger('click')
    expect(wrapper.text()).not.toContain('Tap a used objective again to unmark it.')
  })
})
