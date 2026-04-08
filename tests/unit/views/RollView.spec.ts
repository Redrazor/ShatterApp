import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import RollView from '../../../src/views/RollView.vue'
import { useSettingsStore } from '../../../src/stores/settings.ts'

const stubs = {
  DiceRoller: { template: '<div data-testid="dice-roller"/>' },
  ProbabilityCalculator: { template: '<div data-testid="probability-calculator"/>' },
}

describe('RollView', () => {
  let pinia: ReturnType<typeof createPinia>
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
    })
    await router.push('/roll')
    await router.isReady()
  })

  function mountView() {
    return mount(RollView, { global: { plugins: [pinia, router], stubs } })
  }

  it('renders DiceRoller by default', () => {
    const wrapper = mountView()
    expect(wrapper.find('[data-testid="dice-roller"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="probability-calculator"]').exists()).toBe(false)
  })

  it('does not show tab toggle when showProbabilityRoller is false', () => {
    const settings = useSettingsStore()
    settings.showProbabilityRoller = false
    const wrapper = mountView()
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('shows tab buttons when showProbabilityRoller is enabled', () => {
    const settings = useSettingsStore()
    settings.showProbabilityRoller = true
    const wrapper = mountView()
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].text()).toBe('Roller')
    expect(buttons[1].text()).toBe('Probability')
  })

  it('clicking Probability tab switches to ProbabilityCalculator', async () => {
    const settings = useSettingsStore()
    settings.showProbabilityRoller = true
    const wrapper = mountView()
    const probBtn = wrapper.findAll('button').find(b => b.text() === 'Probability')!
    await probBtn.trigger('click')
    expect(wrapper.find('[data-testid="dice-roller"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="probability-calculator"]').exists()).toBe(true)
  })

  it('clicking Roller tab restores DiceRoller', async () => {
    const settings = useSettingsStore()
    settings.showProbabilityRoller = true
    const wrapper = mountView()
    const [rollerBtn, probBtn] = wrapper.findAll('button')
    await probBtn.trigger('click')
    await rollerBtn.trigger('click')
    expect(wrapper.find('[data-testid="dice-roller"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="probability-calculator"]').exists()).toBe(false)
  })
})
