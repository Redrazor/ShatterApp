import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReferenceView from '../../../src/views/ReferenceView.vue'

describe('ReferenceView', () => {
  const stubs = { IconGrid: true, RulebookViewer: true }

  it('renders "Reference" heading', () => {
    const wrapper = mount(ReferenceView, { global: { stubs } })
    expect(wrapper.text()).toContain('Reference')
  })

  it('renders "Icon Reference" button', () => {
    const wrapper = mount(ReferenceView, { global: { stubs } })
    expect(wrapper.text()).toContain('Icon Reference')
  })

  it('renders "Rulebook" button', () => {
    const wrapper = mount(ReferenceView, { global: { stubs } })
    expect(wrapper.text()).toContain('Rulebook')
  })

  it('renders IconGrid stub by default', () => {
    const wrapper = mount(ReferenceView, { global: { stubs } })
    expect(wrapper.find('icon-grid-stub').exists()).toBe(true)
    expect(wrapper.find('rulebook-viewer-stub').exists()).toBe(false)
  })

  it('clicking "Rulebook" tab shows RulebookViewer stub', async () => {
    const wrapper = mount(ReferenceView, { global: { stubs } })
    const buttons = wrapper.findAll('button')
    const rulebookBtn = buttons.find(b => b.text() === 'Rulebook')!
    await rulebookBtn.trigger('click')
    expect(wrapper.find('rulebook-viewer-stub').exists()).toBe(true)
    expect(wrapper.find('icon-grid-stub').exists()).toBe(false)
  })

  it('clicking "Icon Reference" after switching back shows IconGrid stub', async () => {
    const wrapper = mount(ReferenceView, { global: { stubs } })
    // Go to rulebook
    const buttons = wrapper.findAll('button')
    await buttons.find(b => b.text() === 'Rulebook')!.trigger('click')
    // Go back to icons
    await buttons.find(b => b.text() === 'Icon Reference')!.trigger('click')
    expect(wrapper.find('icon-grid-stub').exists()).toBe(true)
    expect(wrapper.find('rulebook-viewer-stub').exists()).toBe(false)
  })
})
