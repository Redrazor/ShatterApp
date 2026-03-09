import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReferenceView from '../../../src/views/ReferenceView.vue'

describe('ReferenceView', () => {
  const stubs = { IconGrid: true, RulebookViewer: true, KeywordGlossary: true }

  it('renders "Reference" heading', () => {
    const wrapper = mount(ReferenceView, { global: { stubs } })
    expect(wrapper.text()).toContain('Reference')
  })

  it('renders "Icon Reference" button', () => {
    const wrapper = mount(ReferenceView, { global: { stubs } })
    expect(wrapper.text()).toContain('Icon Reference')
  })

  it('renders "Keywords" button', () => {
    const wrapper = mount(ReferenceView, { global: { stubs } })
    expect(wrapper.text()).toContain('Keywords')
  })

  it('renders "Rulebook" button', () => {
    const wrapper = mount(ReferenceView, { global: { stubs } })
    expect(wrapper.text()).toContain('Rulebook')
  })

  it('renders IconGrid stub by default', () => {
    const wrapper = mount(ReferenceView, { global: { stubs } })
    expect(wrapper.find('icon-grid-stub').exists()).toBe(true)
    expect(wrapper.find('rulebook-viewer-stub').exists()).toBe(false)
    expect(wrapper.find('keyword-glossary-stub').exists()).toBe(false)
  })

  it('clicking "Keywords" tab shows KeywordGlossary stub', async () => {
    const wrapper = mount(ReferenceView, { global: { stubs } })
    const buttons = wrapper.findAll('button')
    await buttons.find(b => b.text() === 'Keywords')!.trigger('click')
    expect(wrapper.find('keyword-glossary-stub').exists()).toBe(true)
    expect(wrapper.find('icon-grid-stub').exists()).toBe(false)
    expect(wrapper.find('rulebook-viewer-stub').exists()).toBe(false)
  })

  it('clicking "Rulebook" tab shows RulebookViewer stub', async () => {
    const wrapper = mount(ReferenceView, { global: { stubs } })
    const buttons = wrapper.findAll('button')
    await buttons.find(b => b.text() === 'Rulebook')!.trigger('click')
    expect(wrapper.find('rulebook-viewer-stub').exists()).toBe(true)
    expect(wrapper.find('icon-grid-stub').exists()).toBe(false)
  })

  it('clicking "Icon Reference" after switching shows IconGrid stub', async () => {
    const wrapper = mount(ReferenceView, { global: { stubs } })
    const buttons = wrapper.findAll('button')
    await buttons.find(b => b.text() === 'Keywords')!.trigger('click')
    await buttons.find(b => b.text() === 'Icon Reference')!.trigger('click')
    expect(wrapper.find('icon-grid-stub').exists()).toBe(true)
    expect(wrapper.find('keyword-glossary-stub').exists()).toBe(false)
  })
})
