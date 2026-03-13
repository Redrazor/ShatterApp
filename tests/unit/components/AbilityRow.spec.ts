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

  it('highlights activeTag keyword in amber even when not in unitTags', () => {
    const wrapper = mount(AbilityRow, {
      props: {
        ability: { ...baseAbility, description: 'Gains Enrage when wounded.' },
        unitTags: [],
        keywords,
        activeTag: 'Enrage',
      },
    })
    const html = wrapper.html()
    expect(html).toContain('text-amber-400')
    expect(html).toContain('Enrage')
  })

  it('highlights activeTag in amber even when it is not in the keywords map', () => {
    const wrapper = mount(AbilityRow, {
      props: {
        ability: { ...baseAbility, description: 'This unit is a Jedi and gains power.' },
        unitTags: [],
        keywords, // keywords map does NOT contain 'Jedi'
        activeTag: 'Jedi',
      },
    })
    const html = wrapper.html()
    expect(html).toContain('text-amber-400')
    expect(html).toContain('Jedi')
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

  it('renders a rule keyword as a clickable amber button', () => {
    const wrapper = mount(AbilityRow, {
      props: {
        ability: { ...baseAbility, description: 'This unit has Protection.' },
        unitTags: [],
        keywords,
      },
    })
    const html = wrapper.html()
    expect(html).toContain('data-rule-kw="Protection"')
    expect(html).toContain('text-amber-400')
    expect(html).toContain('Protection')
  })

  it('renders rule keyword with [X] notation highlighted (e.g. Immunity [exposed])', () => {
    const wrapper = mount(AbilityRow, {
      props: {
        ability: { ...baseAbility, description: 'Has Immunity [exposed] at all times.' },
        unitTags: [],
        keywords,
      },
    })
    const html = wrapper.html()
    expect(html).toContain('data-rule-kw="Immunity"')
    expect(html).toContain('Immunity [exposed]')
  })

  it('shows rule keyword tooltip when button in description is clicked', async () => {
    const wrapper = mount(AbilityRow, {
      props: {
        ability: { ...baseAbility, description: 'This unit has Protection.' },
        unitTags: [],
        keywords,
      },
      attachTo: document.body,
    })
    // Click the Protection button via event delegation on the <p>
    const p = wrapper.find('p')
    // Simulate click with a target that has data-rule-kw
    const btn = wrapper.find('[data-rule-kw="Protection"]')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    const html = wrapper.html()
    expect(html).toContain('When this character is defending')
  })

  it('dismisses rule keyword tooltip when backdrop is clicked', async () => {
    const wrapper = mount(AbilityRow, {
      props: {
        ability: { ...baseAbility, description: 'This unit has Protection.' },
        unitTags: [],
        keywords,
      },
      attachTo: document.body,
    })
    const btn = wrapper.find('[data-rule-kw="Protection"]')
    await btn.trigger('click')
    // tooltip visible
    expect(wrapper.html()).toContain('When this character is defending')
    // backdrop appears
    const backdrop = wrapper.find('.fixed.inset-0.z-40')
    expect(backdrop.exists()).toBe(true)
    await backdrop.trigger('click')
    expect(wrapper.html()).not.toContain('When this character is defending')
  })

  it('toggles rule keyword tooltip off when same keyword clicked twice', async () => {
    const wrapper = mount(AbilityRow, {
      props: {
        ability: { ...baseAbility, description: 'This unit has Scale.' },
        unitTags: [],
        keywords,
      },
      attachTo: document.body,
    })
    const btn = wrapper.find('[data-rule-kw="Scale"]')
    await btn.trigger('click')
    expect(wrapper.html()).toContain('advance or dash')
    await btn.trigger('click')
    expect(wrapper.html()).not.toContain('advance or dash')
  })

  it('does not interfere with icon tokens next to rule keywords', () => {
    const wrapper = mount(AbilityRow, {
      props: {
        ability: { ...baseAbility, description: 'Spend [force] and use Sharpshooter [2].' },
        unitTags: [],
        keywords,
      },
    })
    const html = wrapper.html()
    expect(html).toContain('icons/force.png')
    expect(html).toContain('data-rule-kw="Sharpshooter"')
    expect(html).toContain('Sharpshooter [2]')
  })
})
