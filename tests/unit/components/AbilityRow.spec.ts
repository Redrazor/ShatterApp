import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AbilityRow from '../../../src/components/play/units/AbilityRow.vue'

const baseAbility = {
  name: 'Chosen One',
  type: 'innate',
  description: 'This unit ignores Strained.',
}

const keywords = {
  Strained: 'Cannot spend Force this activation.',
  Enrage: 'Gains +2 attack when wounded.',
}

describe('AbilityRow', () => {
  it('renders the ability name', () => {
    const wrapper = mount(AbilityRow, {
      props: { ability: baseAbility, unitTags: [], keywords },
    })
    expect(wrapper.text()).toContain('Chosen One')
  })

  it('renders the ability description text', () => {
    const wrapper = mount(AbilityRow, {
      props: { ability: baseAbility, unitTags: [], keywords },
    })
    expect(wrapper.text()).toContain('This unit ignores Strained.')
  })

  it('renders ability type icon img', () => {
    const wrapper = mount(AbilityRow, {
      props: { ability: baseAbility, unitTags: [], keywords },
    })
    const icon = wrapper.find('img')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('src')).toContain('innate')
  })

  it('highlights a keyword that matches a unit tag in amber', () => {
    const wrapper = mount(AbilityRow, {
      props: {
        ability: { ...baseAbility, description: 'Gains Enrage when wounded.' },
        unitTags: ['Enrage'],
        keywords,
      },
    })
    const html = wrapper.html()
    expect(html).toContain('text-amber-400')
    expect(html).toContain('Enrage')
  })

  it('highlights a known keyword not in tags in bold white', () => {
    const wrapper = mount(AbilityRow, {
      props: {
        ability: { ...baseAbility, description: 'Gains Enrage when wounded.' },
        unitTags: [],
        keywords,
      },
    })
    const html = wrapper.html()
    expect(html).toContain('text-zinc-200')
    expect(html).toContain('Enrage')
  })

  it('does not highlight unknown words', () => {
    const wrapper = mount(AbilityRow, {
      props: {
        ability: { ...baseAbility, description: 'A regular sentence.' },
        unitTags: [],
        keywords,
      },
    })
    expect(wrapper.html()).not.toContain('<strong')
  })

  it('renders [icon_name] tokens as inline img elements', () => {
    const wrapper = mount(AbilityRow, {
      props: {
        ability: { ...baseAbility, description: 'Spend [force] to activate.' },
        unitTags: [],
        keywords,
      },
    })
    const html = wrapper.html()
    // Should render an img with force in src, not as a literal text node
    expect(html).toContain('icons/force.png')
    expect(html).not.toContain('>Spend [force] to')
  })

  it('shows tooltip on icon click', async () => {
    const wrapper = mount(AbilityRow, {
      props: { ability: baseAbility, unitTags: [], keywords },
      attachTo: document.body,
    })
    const icon = wrapper.find('img')
    await icon.trigger('click')
    expect(wrapper.text()).toContain('Innate')
  })

  it('dismisses tooltip when backdrop is clicked', async () => {
    const wrapper = mount(AbilityRow, {
      props: { ability: baseAbility, unitTags: [], keywords },
      attachTo: document.body,
    })
    const icon = wrapper.find('img')
    await icon.trigger('click')
    // backdrop div appears
    const backdrop = wrapper.find('.fixed.inset-0')
    expect(backdrop.exists()).toBe(true)
    await backdrop.trigger('click')
    // tooltip should be gone
    expect(wrapper.text()).not.toContain('Always active')
  })

  it('renders correctly for active ability type', () => {
    const wrapper = mount(AbilityRow, {
      props: {
        ability: { name: 'Force Push', type: 'active', description: 'Push a model back 2.' },
        unitTags: [],
        keywords,
      },
    })
    const icon = wrapper.find('img')
    expect(icon.attributes('src')).toContain('active')
  })

  it('renders correctly for reactive ability type', () => {
    const wrapper = mount(AbilityRow, {
      props: {
        ability: { name: 'Deflect', type: 'reactive', description: 'Deflect an incoming attack.' },
        unitTags: [],
        keywords,
      },
    })
    const icon = wrapper.find('img')
    expect(icon.attributes('src')).toContain('reactive')
  })
})
