import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import KeywordGlossary from '../../../src/components/reference/KeywordGlossary.vue'

// Mock useKeywords to return controlled data
vi.mock('../../../src/composables/useKeywords.ts', () => ({
  useKeywords: () => ({
    keywords: { value: { Jedi: 'A member of the Jedi Order.', Sith: 'A dark side practitioner.', Droid: 'A mechanical being.' } },
    getDefinition: (tag: string) => ({ Jedi: 'A member of the Jedi Order.', Sith: 'A dark side practitioner.', Droid: 'A mechanical being.' }[tag]),
  }),
}))

describe('KeywordGlossary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all keywords when query is empty', () => {
    const wrapper = mount(KeywordGlossary)
    expect(wrapper.text()).toContain('Jedi')
    expect(wrapper.text()).toContain('Sith')
    expect(wrapper.text()).toContain('Droid')
  })

  it('renders keyword definitions', () => {
    const wrapper = mount(KeywordGlossary)
    expect(wrapper.text()).toContain('A member of the Jedi Order.')
  })

  it('renders a search input', () => {
    const wrapper = mount(KeywordGlossary)
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
  })

  it('filters keywords by name when searching', async () => {
    const wrapper = mount(KeywordGlossary)
    await wrapper.find('input').setValue('jedi')
    expect(wrapper.text()).toContain('Jedi')
    expect(wrapper.text()).not.toContain('Sith')
    expect(wrapper.text()).not.toContain('Droid')
  })

  it('filters keywords by definition text when searching', async () => {
    const wrapper = mount(KeywordGlossary)
    await wrapper.find('input').setValue('dark side')
    expect(wrapper.text()).toContain('Sith')
    expect(wrapper.text()).not.toContain('Jedi')
  })

  it('shows no-results message when nothing matches', async () => {
    const wrapper = mount(KeywordGlossary)
    await wrapper.find('input').setValue('zzznomatch')
    expect(wrapper.text()).toContain('No keywords match')
  })
})
