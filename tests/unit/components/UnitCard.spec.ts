import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UnitCard from '../../../src/components/ui/UnitCard.vue'
import type { Character } from '../../../src/types/index.ts'

function makeChar(overrides: Partial<Character> = {}): Character {
  return {
    id: 1,
    name: 'Luke Skywalker',
    characterType: 'Hero',
    unitType: 'Primary',
    pc: null,
    sp: 5,
    durability: 4,
    stamina: 6,
    fp: 2,
    era: 'Galactic Civil War',
    tags: ['Rebel'],
    swp: 'SWP01',
    thumbnail: '/images/luke.png',
    cardFront: '',
    cardBack: '',
    stances: [],
    releaseDate: '',
    ...overrides,
  }
}

describe('UnitCard', () => {
  it('renders the character name', () => {
    const wrapper = mount(UnitCard, { props: { character: makeChar() } })
    expect(wrapper.text()).toContain('Luke Skywalker')
  })

  it('renders Primary badge for primary unit', () => {
    const wrapper = mount(UnitCard, { props: { character: makeChar({ unitType: 'Primary' }) } })
    expect(wrapper.text()).toContain('Primary')
  })

  it('renders Secondary badge for secondary unit', () => {
    const wrapper = mount(UnitCard, {
      props: { character: makeChar({ unitType: 'Secondary', pc: 3, sp: null }) },
    })
    expect(wrapper.text()).toContain('Secondary')
  })

  it('renders Support badge for support unit', () => {
    const wrapper = mount(UnitCard, {
      props: { character: makeChar({ unitType: 'Support', pc: 2, sp: null }) },
    })
    expect(wrapper.text()).toContain('Support')
  })

  it('shows SP cost for primary unit', () => {
    const wrapper = mount(UnitCard, { props: { character: makeChar({ unitType: 'Primary', sp: 5 }) } })
    expect(wrapper.text()).toContain('SP 5')
  })

  it('shows PC cost for secondary unit', () => {
    const wrapper = mount(UnitCard, {
      props: { character: makeChar({ unitType: 'Secondary', pc: 3, sp: null }) },
    })
    expect(wrapper.text()).toContain('PC 3')
  })

  it('shows PC cost for support unit', () => {
    const wrapper = mount(UnitCard, {
      props: { character: makeChar({ unitType: 'Support', pc: 2, sp: null }) },
    })
    expect(wrapper.text()).toContain('PC 2')
  })

  it('shows Owned badge when owned=true', () => {
    const wrapper = mount(UnitCard, { props: { character: makeChar(), owned: true } })
    expect(wrapper.text()).toContain('✓')
  })

  it('does not show Owned badge when owned=false', () => {
    const wrapper = mount(UnitCard, { props: { character: makeChar(), owned: false } })
    const badge = wrapper.find('.bg-sw-gold')
    expect(badge.exists()).toBe(false)
  })

  it('emits click event when button clicked', async () => {
    const wrapper = mount(UnitCard, { props: { character: makeChar() } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('renders thumbnail img when thumbnail is set', () => {
    const wrapper = mount(UnitCard, { props: { character: makeChar({ thumbnail: '/images/luke.png' }) } })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/images/luke.png')
  })

  it('renders fallback icon when no thumbnail', () => {
    const wrapper = mount(UnitCard, { props: { character: makeChar({ thumbnail: '' }) } })
    const imgs = wrapper.findAll('img')
    const thumbnailImg = imgs.find(i => i.attributes('alt') === 'Luke Skywalker')
    expect(thumbnailImg).toBeUndefined()
  })
})
