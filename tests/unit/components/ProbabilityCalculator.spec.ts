import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProbabilityCalculator from '../../../src/components/dice/ProbabilityCalculator.vue'

describe('ProbabilityCalculator', () => {
  it('renders the heading', () => {
    const wrapper = mount(ProbabilityCalculator)
    expect(wrapper.text()).toContain('Probability')
  })

  it('renders attack and defense stepper labels', () => {
    const wrapper = mount(ProbabilityCalculator)
    expect(wrapper.text()).toContain('Attack Dice')
    expect(wrapper.text()).toContain('Defense Dice')
  })

  it('renders the results table after mount (immediate sim)', async () => {
    const wrapper = mount(ProbabilityCalculator)
    // sim runs immediately via watch { immediate: true }
    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 350)) // wait for debounce
    expect(wrapper.text()).toContain('Avg Hits')
    expect(wrapper.text()).toContain('P(≥ n)')
  })

  it('decrement button is disabled at 0', async () => {
    const wrapper = mount(ProbabilityCalculator)
    await wrapper.vm.$nextTick()
    // Find all minus buttons — first is attack dice decrement
    const minusBtns = wrapper.findAll('button').filter(b => b.text() === '−')
    // Click down to 0 from default 6
    for (let i = 0; i < 7; i++) await minusBtns[0].trigger('click')
    expect(minusBtns[0].attributes('disabled')).toBeDefined()
  })

  it('increment button is disabled at max (14 for attack)', async () => {
    const wrapper = mount(ProbabilityCalculator)
    await wrapper.vm.$nextTick()
    const plusBtns = wrapper.findAll('button').filter(b => b.text() === '+')
    // Click up to 14 from default 6
    for (let i = 0; i < 9; i++) await plusBtns[0].trigger('click')
    expect(plusBtns[0].attributes('disabled')).toBeDefined()
  })

  it('shows expertise footnote', async () => {
    const wrapper = mount(ProbabilityCalculator)
    await new Promise(r => setTimeout(r, 350))
    expect(wrapper.text()).toContain('Expertise treated as failure')
  })
})
