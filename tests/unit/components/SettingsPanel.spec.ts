import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SettingsPanel from '../../../src/components/collection/SettingsPanel.vue'
import { useSettingsStore } from '../../../src/stores/settings.ts'

describe('SettingsPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders when open', () => {
    const wrapper = mount(SettingsPanel, { props: { open: true } })
    expect(wrapper.text()).toContain('Settings')
  })

  it('does not render content when closed', () => {
    const wrapper = mount(SettingsPanel, { props: { open: false } })
    expect(wrapper.text()).not.toContain('Collection')
  })

  it('probability toggle is disabled when showRollTab is off', () => {
    const settings = useSettingsStore()
    settings.showRollTab = false
    const wrapper = mount(SettingsPanel, { props: { open: true } })
    const buttons = wrapper.findAll('[role="switch"]')
    const probBtn = buttons.find(b => {
      const row = b.element.closest('.flex')
      return row?.textContent?.includes('Probability Calculator')
    })
    expect(probBtn?.attributes('disabled')).toBeDefined()
  })

  it('shows dependency warning when showRollTab is off', () => {
    const settings = useSettingsStore()
    settings.showRollTab = false
    const wrapper = mount(SettingsPanel, { props: { open: true } })
    expect(wrapper.text()).toContain('Requires "Enable General Roll" to be on.')
  })

  it('no dependency warning when showRollTab is on', () => {
    const settings = useSettingsStore()
    settings.showRollTab = true
    const wrapper = mount(SettingsPanel, { props: { open: true } })
    expect(wrapper.text()).not.toContain('Requires')
  })

  it('emits close when backdrop is clicked', async () => {
    const wrapper = mount(SettingsPanel, { props: { open: true } })
    // backdrop is the first div with fixed inset-0
    const backdrop = wrapper.find('.fixed.inset-0')
    await backdrop.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
