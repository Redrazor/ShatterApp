import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomProfileCard from '../../../../src/components/custom/CustomProfileCard.vue'
import type { HomebrewProfile } from '../../../../src/types/index.ts'

function makeProfile(overrides: Partial<HomebrewProfile> = {}): HomebrewProfile {
  return {
    id: 'test-id-1',
    name: 'My Custom Unit',
    createdAt: '2026-04-03T12:00:00.000Z',
    ...overrides,
  }
}

describe('CustomProfileCard', () => {
  it('renders the profile name', () => {
    const wrapper = mount(CustomProfileCard, {
      props: { profile: makeProfile({ name: 'Darth Test' }) },
    })
    expect(wrapper.text()).toContain('Darth Test')
  })

  it('does not show action buttons when collapsed', () => {
    const wrapper = mount(CustomProfileCard, {
      props: { profile: makeProfile() },
    })
    expect(wrapper.find('button[data-action]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Load')
    expect(wrapper.text()).not.toContain('Print')
    expect(wrapper.text()).not.toContain('Visualize')
    expect(wrapper.text()).not.toContain('Delete')
  })

  it('shows action buttons after clicking the header', async () => {
    const wrapper = mount(CustomProfileCard, {
      props: { profile: makeProfile() },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('Load')
    expect(wrapper.text()).toContain('Print')
    expect(wrapper.text()).toContain('Visualize')
    expect(wrapper.text()).toContain('Delete')
  })

  it('collapses again on second header click', async () => {
    const wrapper = mount(CustomProfileCard, {
      props: { profile: makeProfile() },
    })
    await wrapper.find('button').trigger('click')
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).not.toContain('Load')
  })

  it('emits load when Load button clicked', async () => {
    const wrapper = mount(CustomProfileCard, {
      props: { profile: makeProfile() },
    })
    await wrapper.find('button').trigger('click')
    const buttons = wrapper.findAll('button')
    const loadBtn = buttons.find(b => b.text() === 'Load')
    await loadBtn!.trigger('click')
    expect(wrapper.emitted('load')).toHaveLength(1)
  })

  it('emits print when Print button clicked', async () => {
    const wrapper = mount(CustomProfileCard, {
      props: { profile: makeProfile() },
    })
    await wrapper.find('button').trigger('click')
    const buttons = wrapper.findAll('button')
    const printBtn = buttons.find(b => b.text() === 'Print')
    await printBtn!.trigger('click')
    expect(wrapper.emitted('print')).toHaveLength(1)
  })

  it('emits visualize when Visualize button clicked', async () => {
    const wrapper = mount(CustomProfileCard, {
      props: { profile: makeProfile() },
    })
    await wrapper.find('button').trigger('click')
    const buttons = wrapper.findAll('button')
    const vizBtn = buttons.find(b => b.text() === 'Visualize')
    await vizBtn!.trigger('click')
    expect(wrapper.emitted('visualize')).toHaveLength(1)
  })

  it('emits delete when Delete button clicked', async () => {
    const wrapper = mount(CustomProfileCard, {
      props: { profile: makeProfile() },
    })
    await wrapper.find('button').trigger('click')
    const buttons = wrapper.findAll('button')
    const delBtn = buttons.find(b => b.text() === 'Delete')
    await delBtn!.trigger('click')
    expect(wrapper.emitted('delete')).toHaveLength(1)
  })
})
