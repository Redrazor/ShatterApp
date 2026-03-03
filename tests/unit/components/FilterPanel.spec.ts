import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterPanel from '../../../src/components/ui/FilterPanel.vue'
import type { SearchFilters } from '../../../src/composables/useSearch.ts'

function defaultFilters(overrides: Partial<SearchFilters> = {}): SearchFilters {
  return {
    query: '',
    type: '',
    era: '',
    tags: [],
    ownedOnly: false,
    ownedSwpSet: new Set(),
    ...overrides,
  }
}

describe('FilterPanel', () => {
  it('renders type filter buttons', () => {
    const wrapper = mount(FilterPanel, {
      props: { filters: defaultFilters(), eras: [] },
    })
    expect(wrapper.text()).toContain('All')
    expect(wrapper.text()).toContain('Primary')
    expect(wrapper.text()).toContain('Secondary')
    expect(wrapper.text()).toContain('Support')
  })

  it('renders era select with "All Eras" default', () => {
    const wrapper = mount(FilterPanel, {
      props: { filters: defaultFilters(), eras: ['GCW', 'Clone Wars'] },
    })
    const select = wrapper.find('select')
    expect(select.exists()).toBe(true)
    expect(wrapper.text()).toContain('All Eras')
  })

  it('renders all provided eras in select', () => {
    const wrapper = mount(FilterPanel, {
      props: { filters: defaultFilters(), eras: ['GCW', 'Clone Wars', 'New Order'] },
    })
    expect(wrapper.text()).toContain('GCW')
    expect(wrapper.text()).toContain('Clone Wars')
    expect(wrapper.text()).toContain('New Order')
  })

  it('emits update:filters when type button clicked', async () => {
    const wrapper = mount(FilterPanel, {
      props: { filters: defaultFilters(), eras: [] },
    })
    const primaryBtn = wrapper.findAll('button').find((b) => b.text() === 'Primary')!
    await primaryBtn.trigger('click')
    const emitted = wrapper.emitted('update:filters')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as SearchFilters).type).toBe('Primary')
  })

  it('emits update:filters with empty type when All clicked', async () => {
    const wrapper = mount(FilterPanel, {
      props: { filters: defaultFilters({ type: 'Primary' }), eras: [] },
    })
    const allBtn = wrapper.findAll('button').find((b) => b.text() === 'All')!
    await allBtn.trigger('click')
    const emitted = wrapper.emitted('update:filters')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as SearchFilters).type).toBe('')
  })

  it('emits update:filters with era on select change', async () => {
    const wrapper = mount(FilterPanel, {
      props: { filters: defaultFilters(), eras: ['GCW'] },
    })
    const select = wrapper.find('select')
    await select.setValue('GCW')
    const emitted = wrapper.emitted('update:filters')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as SearchFilters).era).toBe('GCW')
  })

  it('emits update:filters with ownedOnly on checkbox change', async () => {
    const wrapper = mount(FilterPanel, {
      props: { filters: defaultFilters(), eras: [] },
    })
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(true)
    const emitted = wrapper.emitted('update:filters')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as SearchFilters).ownedOnly).toBe(true)
  })

  it('renders owned-only checkbox', () => {
    const wrapper = mount(FilterPanel, {
      props: { filters: defaultFilters(), eras: [] },
    })
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Owned only')
  })
})
