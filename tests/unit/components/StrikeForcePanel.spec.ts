import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StrikeForcePanel from '../../../src/components/build/StrikeForcePanel.vue'
import type { Mission } from '../../../src/types/index.ts'

function makeMission(): Mission {
  return { id: 1, name: 'Outer Rim Siege', card: '', swp: 'SWP05', struggles: {} }
}

function defaultProps(overrides = {}) {
  return { name: '', mission: null, isComplete: false, buildMode: 'standard' as const, ownedOnly: false, ...overrides }
}

describe('StrikeForcePanel', () => {
  it('renders Strike Force heading', () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps() })
    expect(wrapper.text()).toContain('Strike Force')
  })

  it('renders name input with current value', () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps({ name: 'My List' }) })
    const input = wrapper.find('input[type="text"]')
    expect((input.element as HTMLInputElement).value).toBe('My List')
  })

  it('emits update:name when name input changes', async () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps() })
    const input = wrapper.find('input[type="text"]')
    await input.setValue('New Name')
    const emitted = wrapper.emitted('update:name')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toBe('New Name')
  })

  it('shows mission name when mission is set', () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps({ mission: makeMission() }) })
    expect(wrapper.text()).toContain('Outer Rim Siege')
  })

  it('shows placeholder when no mission', () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps() })
    expect(wrapper.text()).toContain('Select mission')
  })

  it('emits pick-mission when mission button clicked', async () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps() })
    await wrapper.find('button.flex-1').trigger('click')
    expect(wrapper.emitted('pick-mission')).toBeTruthy()
  })

  it('shows complete badge when isComplete is true', () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps({ isComplete: true }) })
    expect(wrapper.text()).toContain('Complete')
  })

  it('does not show complete badge when not complete', () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps() })
    expect(wrapper.text()).not.toContain('Complete')
  })

  it('emits reset when reset button clicked', async () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps() })
    const resetBtn = wrapper.findAll('button').find((b) => b.text().includes('Reset'))!
    await resetBtn.trigger('click')
    expect(wrapper.emitted('reset')).toBeTruthy()
  })

  it('emits save when Save button clicked', async () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps() })
    const saveBtn = wrapper.findAll('button').find((b) => b.text() === 'Save')!
    expect(saveBtn).toBeTruthy()
    await saveBtn.trigger('click')
    expect(wrapper.emitted('save')).toBeTruthy()
  })

  it('emits share when Share button clicked', async () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps() })
    const shareBtn = wrapper.findAll('button').find((b) => b.text() === 'Share')!
    expect(shareBtn).toBeTruthy()
    await shareBtn.trigger('click')
    expect(wrapper.emitted('share')).toBeTruthy()
  })

  // ---------- build mode selector ----------

  it('renders three format buttons (Standard, Threemiere, Premiere)', () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps() })
    expect(wrapper.text()).toContain('Standard')
    expect(wrapper.text()).toContain('Threemiere')
    expect(wrapper.text()).toContain('Premiere')
  })

  it('highlights the active build mode button', () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps({ buildMode: 'threemiere' }) })
    const buttons = wrapper.findAll('button').filter(b => ['Standard', 'Threemiere', 'Premiere'].some(label => b.text().includes(label)))
    const threemiereBtn = buttons.find(b => b.text().includes('Threemiere'))!
    expect(threemiereBtn.classes()).toContain('bg-sw-gold/20')
  })

  it('emits update:buildMode with "premiere" when Premiere button clicked', async () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps({ buildMode: 'standard' }) })
    const premiereBtn = wrapper.findAll('button').find(b => b.text().includes('Premiere'))!
    await premiereBtn.trigger('click')
    const emitted = wrapper.emitted('update:buildMode')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toBe('premiere')
  })

  it('emits update:buildMode with "threemiere" when Threemiere button clicked', async () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps({ buildMode: 'standard' }) })
    const threemiereBtn = wrapper.findAll('button').find(b => b.text().includes('Threemiere'))!
    await threemiereBtn.trigger('click')
    const emitted = wrapper.emitted('update:buildMode')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toBe('threemiere')
  })

  it('emits update:buildMode with "standard" when Standard button clicked', async () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps({ buildMode: 'premiere' }) })
    const standardBtn = wrapper.findAll('button').find(b => b.text().includes('Standard'))!
    await standardBtn.trigger('click')
    const emitted = wrapper.emitted('update:buildMode')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toBe('standard')
  })

  it('shows squad count labels for each mode', () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps() })
    expect(wrapper.text()).toContain('(2)')
    expect(wrapper.text()).toContain('(3)')
    expect(wrapper.text()).toContain('(4)')
  })

  it('shows Format label', () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps() })
    expect(wrapper.text()).toContain('Format')
  })
})
