import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductCard from '../../../src/components/collection/ProductCard.vue'
import type { Product, Character } from '../../../src/types/index.ts'

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: 'Core Set',
    swp: 'SWP00',
    era: 'Galactic Civil War',
    thumbnail: '/images/core.jpg',
    images: [],
    models: ['Luke Skywalker', 'Darth Vader'],
    description: 'The core set',
    assemblyUrl: '',
    storeLink: '',
    ...overrides,
  }
}

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
    era: 'GCW',
    tags: [],
    swp: 'SWP00',
    swpCode: 'SWP00',
    thumbnail: '',
    cardFront: '',
    cardBack: '',
    stances: [],
    releaseDate: '',
    ...overrides,
  }
}

const defaultProps = {
  product: makeProduct(),
  owned: false,
  chars: [],
  ownedCharacterIds: new Set<number>(),
}

describe('ProductCard', () => {
  it('renders the product name', () => {
    const wrapper = mount(ProductCard, { props: defaultProps })
    expect(wrapper.text()).toContain('Core Set')
  })

  it('renders era and swp', () => {
    const wrapper = mount(ProductCard, { props: defaultProps })
    expect(wrapper.text()).toContain('Galactic Civil War')
    expect(wrapper.text()).toContain('SWP00')
  })

  it('renders model list', () => {
    const wrapper = mount(ProductCard, { props: defaultProps })
    expect(wrapper.text()).toContain('Luke Skywalker')
    expect(wrapper.text()).toContain('Darth Vader')
  })

  it('shows "+ Mark Owned" button when not owned', () => {
    const wrapper = mount(ProductCard, { props: defaultProps })
    expect(wrapper.text()).toContain('+ Mark Owned')
  })

  it('shows "✓ Owned" button when owned', () => {
    const wrapper = mount(ProductCard, { props: { ...defaultProps, owned: true } })
    expect(wrapper.text()).toContain('✓ Owned')
  })

  it('emits toggle event when button is clicked', async () => {
    const wrapper = mount(ProductCard, { props: defaultProps })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('toggle')).toBeTruthy()
  })

  it('emits toggle when already owned and clicked', async () => {
    const wrapper = mount(ProductCard, { props: { ...defaultProps, owned: true } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('toggle')).toBeTruthy()
  })

  it('renders thumbnail img when thumbnail is set', () => {
    const wrapper = mount(ProductCard, { props: defaultProps })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/images/core.jpg')
  })

  it('renders fallback icon when no thumbnail', () => {
    const wrapper = mount(ProductCard, {
      props: { ...defaultProps, product: makeProduct({ thumbnail: '' }) },
    })
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('has owned border styling when owned', () => {
    const wrapper = mount(ProductCard, { props: { ...defaultProps, owned: true } })
    expect(wrapper.find('div').classes().some((c) => c.includes('border-sw-gold') && !c.includes('/'))).toBe(true)
  })

  it('renders mainImage src when mainImage is set and thumbnail is empty', () => {
    const wrapper = mount(ProductCard, {
      props: { ...defaultProps, product: makeProduct({ thumbnail: '', mainImage: '/images/main.png' }) },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/images/main.png')
  })

  it('mainImage takes precedence over thumbnail when both are set', () => {
    const wrapper = mount(ProductCard, {
      props: { ...defaultProps, product: makeProduct({ thumbnail: '/images/thumb.jpg', mainImage: '/images/main.png' }) },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/images/main.png')
  })

  describe('pack contents expansion', () => {
    const chars = [
      makeChar({ id: 1, name: 'Luke Skywalker' }),
      makeChar({ id: 2, name: 'Han Solo' }),
    ]

    it('does not show expand button when no chars', () => {
      const wrapper = mount(ProductCard, { props: { ...defaultProps, chars: [] } })
      expect(wrapper.text()).not.toContain('Units')
    })

    it('shows expand button with unit count when chars are provided', () => {
      const wrapper = mount(ProductCard, { props: { ...defaultProps, chars } })
      expect(wrapper.text()).toContain('Units (2)')
    })

    it('does not show character list before expanding', () => {
      const wrapper = mount(ProductCard, { props: { ...defaultProps, chars } })
      expect(wrapper.text()).not.toContain('Luke Skywalker\n')
      // character names are hidden until expanded
      expect(wrapper.find('.border-sw-gold\\/10').exists()).toBe(false)
    })

    it('shows character names after clicking expand', async () => {
      const wrapper = mount(ProductCard, { props: { ...defaultProps, chars } })
      const expandBtn = wrapper.findAll('button').find(b => b.text().includes('Units'))!
      await expandBtn.trigger('click')
      expect(wrapper.text()).toContain('Luke Skywalker')
      expect(wrapper.text()).toContain('Han Solo')
    })

    it('hides character list after toggling expand twice', async () => {
      const wrapper = mount(ProductCard, { props: { ...defaultProps, chars } })
      const expandBtn = wrapper.findAll('button').find(b => b.text().includes('Units'))!
      await expandBtn.trigger('click')
      await expandBtn.trigger('click')
      expect(wrapper.text()).not.toContain('Hide units')
    })

    it('shows check for owned character', async () => {
      const wrapper = mount(ProductCard, {
        props: { ...defaultProps, chars, ownedCharacterIds: new Set([1]) },
      })
      const expandBtn = wrapper.findAll('button').find(b => b.text().includes('Units'))!
      await expandBtn.trigger('click')
      // Luke (id=1) should show ✓
      const lukeRow = wrapper.findAll('div').find(d => d.text().includes('Luke Skywalker'))!
      expect(lukeRow.text()).toContain('✓')
    })

    it('emits toggleCharacter with correct id when character button clicked', async () => {
      const wrapper = mount(ProductCard, { props: { ...defaultProps, chars } })
      const expandBtn = wrapper.findAll('button').find(b => b.text().includes('Units'))!
      await expandBtn.trigger('click')
      // find the + button for the first character
      const charBtns = wrapper.findAll('button').filter(b => b.text() === '+' || b.text() === '✓')
      await charBtns[0].trigger('click')
      expect(wrapper.emitted('toggleCharacter')).toBeTruthy()
      expect(wrapper.emitted('toggleCharacter')![0][0]).toBe(1)
    })
  })
})
