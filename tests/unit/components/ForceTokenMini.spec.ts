import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ForceTokenMini from '../../../src/components/play/units/ForceTokenMini.vue'

describe('ForceTokenMini', () => {
  it('renders an SVG element', () => {
    const wrapper = mount(ForceTokenMini)
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('aria-label')).toBe('Force cost')
  })

  it('applies the default size class', () => {
    const wrapper = mount(ForceTokenMini)
    const svg = wrapper.find('svg')
    expect(svg.classes()).toContain('h-4')
    expect(svg.classes()).toContain('w-4')
  })

  it('applies a custom size class', () => {
    const wrapper = mount(ForceTokenMini, { props: { size: 'h-6 w-6' } })
    const svg = wrapper.find('svg')
    expect(svg.classes()).toContain('h-6')
    expect(svg.classes()).toContain('w-6')
  })

  it('uses the orange starburst fill', () => {
    const wrapper = mount(ForceTokenMini)
    const polygon = wrapper.find('polygon')
    expect(polygon.attributes('fill')).toBe('#f97316')
  })
})
