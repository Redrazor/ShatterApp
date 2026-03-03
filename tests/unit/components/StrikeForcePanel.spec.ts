import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StrikeForcePanel from '../../../src/components/build/StrikeForcePanel.vue'
import type { Mission } from '../../../src/types/index.ts'

function makeMission(): Mission {
  return { id: 1, name: 'Outer Rim Siege', card: '', swp: 'SWP05', struggles: {} }
}

describe('StrikeForcePanel', () => {
  it('renders Strike Force heading', () => {
    const wrapper = mount(StrikeForcePanel, {
      props: { name: '', mission: null, premiere: false, isComplete: false },
    })
    expect(wrapper.text()).toContain('Strike Force')
  })

  it('renders name input with current value', () => {
    const wrapper = mount(StrikeForcePanel, {
      props: { name: 'My List', mission: null, premiere: false, isComplete: false },
    })
    const input = wrapper.find('input[type="text"]')
    expect((input.element as HTMLInputElement).value).toBe('My List')
  })

  it('emits update:name when name input changes', async () => {
    const wrapper = mount(StrikeForcePanel, {
      props: { name: '', mission: null, premiere: false, isComplete: false },
    })
    const input = wrapper.find('input[type="text"]')
    await input.setValue('New Name')
    const emitted = wrapper.emitted('update:name')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toBe('New Name')
  })

  it('shows mission name when mission is set', () => {
    const wrapper = mount(StrikeForcePanel, {
      props: { name: '', mission: makeMission(), premiere: false, isComplete: false },
    })
    expect(wrapper.text()).toContain('Outer Rim Siege')
  })

  it('shows placeholder when no mission', () => {
    const wrapper = mount(StrikeForcePanel, {
      props: { name: '', mission: null, premiere: false, isComplete: false },
    })
    expect(wrapper.text()).toContain('Select mission')
  })

  it('emits pick-mission when mission button clicked', async () => {
    const wrapper = mount(StrikeForcePanel, {
      props: { name: '', mission: null, premiere: false, isComplete: false },
    })
    await wrapper.find('button.w-full').trigger('click')
    expect(wrapper.emitted('pick-mission')).toBeTruthy()
  })

  it('renders premiere checkbox', () => {
    const wrapper = mount(StrikeForcePanel, {
      props: { name: '', mission: null, premiere: false, isComplete: false },
    })
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Premiere event')
  })

  it('emits update:premiere when checkbox changes', async () => {
    const wrapper = mount(StrikeForcePanel, {
      props: { name: '', mission: null, premiere: false, isComplete: false },
    })
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(true)
    const emitted = wrapper.emitted('update:premiere')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toBe(true)
  })

  it('shows complete badge when isComplete is true', () => {
    const wrapper = mount(StrikeForcePanel, {
      props: { name: '', mission: null, premiere: false, isComplete: true },
    })
    expect(wrapper.text()).toContain('Complete')
  })

  it('does not show complete badge when not complete', () => {
    const wrapper = mount(StrikeForcePanel, {
      props: { name: '', mission: null, premiere: false, isComplete: false },
    })
    expect(wrapper.text()).not.toContain('Complete')
  })

  it('emits reset when reset button clicked', async () => {
    const wrapper = mount(StrikeForcePanel, {
      props: { name: '', mission: null, premiere: false, isComplete: false },
    })
    const resetBtn = wrapper.findAll('button').find((b) => b.text().includes('Reset'))!
    await resetBtn.trigger('click')
    expect(wrapper.emitted('reset')).toBeTruthy()
  })

  it('emits save when Save button clicked', async () => {
    const wrapper = mount(StrikeForcePanel, {
      props: { name: '', mission: null, premiere: false, isComplete: false },
    })
    const saveBtn = wrapper.findAll('button').find((b) => b.text() === 'Save')!
    expect(saveBtn).toBeTruthy()
    await saveBtn.trigger('click')
    expect(wrapper.emitted('save')).toBeTruthy()
  })

  it('emits share when Share button clicked', async () => {
    const wrapper = mount(StrikeForcePanel, {
      props: { name: '', mission: null, premiere: false, isComplete: false },
    })
    const shareBtn = wrapper.findAll('button').find((b) => b.text() === 'Share')!
    expect(shareBtn).toBeTruthy()
    await shareBtn.trigger('click')
    expect(wrapper.emitted('share')).toBeTruthy()
  })
})
