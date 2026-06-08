import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StrikeForcePanel from '../../../src/components/build/StrikeForcePanel.vue'
import type { Mission } from '../../../src/types/index.ts'

function makeMission(): Mission {
  return { id: 1, name: 'Outer Rim Siege', card: '', swp: 'SWP05', struggles: {} }
}

function defaultProps(overrides = {}) {
  return {
    name: '',
    mission: null,
    isComplete: false,
    buildMode: 'standard' as const,
    ownedOnly: false,
    cohesion: 50 as const,
    randomizeMission: false,
    ...overrides,
  }
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

  // --- Skirmish mode + Random Generator (Feature #1) ---

  it('includes Skirmish (1) in the format selector', () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps() })
    expect(wrapper.text()).toContain('Skirmish')
    expect(wrapper.text()).toContain('(1)')
  })

  it('emits update:buildMode with "skirmish" when Skirmish clicked', async () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps() })
    const btn = wrapper.findAll('button').find(b => b.text().includes('Skirmish'))!
    await btn.trigger('click')
    expect(wrapper.emitted('update:buildMode')![0][0]).toBe('skirmish')
  })

  it('renders the Random Generator section with the current cohesion label', () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps({ cohesion: 50 }) })
    expect(wrapper.text()).toContain('Random Generator')
    expect(wrapper.text()).toContain('Tag-Aligned')
  })

  it('shows the cohesion label matching the current value', () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps({ cohesion: 0 }) })
    expect(wrapper.text()).toContain('Locked')
  })

  it('updates the "Will generate" count with the build mode', () => {
    const skirmish = mount(StrikeForcePanel, { props: defaultProps({ buildMode: 'skirmish' }) })
    expect(skirmish.text()).toContain('Will generate: 1 squad')
    const premiere = mount(StrikeForcePanel, { props: defaultProps({ buildMode: 'premiere' }) })
    expect(premiere.text()).toContain('Will generate: 4 squads')
  })

  it('emits update:cohesion when the slider changes', async () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps() })
    const slider = wrapper.find('input[type="range"]')
    await slider.setValue('100')
    const emitted = wrapper.emitted('update:cohesion')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toBe(100)
  })

  it('emits update:ownedOnly when the Owned toggle is clicked', async () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps({ ownedOnly: false }) })
    const toggle = wrapper.findAll('button[role="switch"]')[0]
    await toggle.trigger('click')
    expect(wrapper.emitted('update:ownedOnly')![0][0]).toBe(true)
  })

  it('emits update:randomizeMission when the mission toggle is clicked', async () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps({ randomizeMission: false }) })
    const toggle = wrapper.findAll('button[role="switch"]')[1]
    await toggle.trigger('click')
    expect(wrapper.emitted('update:randomizeMission')![0][0]).toBe(true)
  })

  it('emits random when Generate Strike Force is clicked', async () => {
    const wrapper = mount(StrikeForcePanel, { props: defaultProps() })
    const btn = wrapper.findAll('button').find(b => b.text().includes('Generate Strike Force'))!
    await btn.trigger('click')
    expect(wrapper.emitted('random')).toBeTruthy()
  })
})
