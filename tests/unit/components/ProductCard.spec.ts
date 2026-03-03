import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductCard from '../../../src/components/collection/ProductCard.vue'
import type { Product } from '../../../src/types/index.ts'

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

describe('ProductCard', () => {
  it('renders the product name', () => {
    const wrapper = mount(ProductCard, {
      props: { product: makeProduct(), owned: false },
    })
    expect(wrapper.text()).toContain('Core Set')
  })

  it('renders era and swp', () => {
    const wrapper = mount(ProductCard, {
      props: { product: makeProduct(), owned: false },
    })
    expect(wrapper.text()).toContain('Galactic Civil War')
    expect(wrapper.text()).toContain('SWP00')
  })

  it('renders model list', () => {
    const wrapper = mount(ProductCard, {
      props: { product: makeProduct(), owned: false },
    })
    expect(wrapper.text()).toContain('Luke Skywalker')
    expect(wrapper.text()).toContain('Darth Vader')
  })

  it('shows "+ Mark Owned" button when not owned', () => {
    const wrapper = mount(ProductCard, {
      props: { product: makeProduct(), owned: false },
    })
    expect(wrapper.text()).toContain('+ Mark Owned')
  })

  it('shows "✓ Owned" button when owned', () => {
    const wrapper = mount(ProductCard, {
      props: { product: makeProduct(), owned: true },
    })
    expect(wrapper.text()).toContain('✓ Owned')
  })

  it('emits toggle event when button is clicked', async () => {
    const wrapper = mount(ProductCard, {
      props: { product: makeProduct(), owned: false },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('toggle')).toBeTruthy()
  })

  it('emits toggle when already owned and clicked', async () => {
    const wrapper = mount(ProductCard, {
      props: { product: makeProduct(), owned: true },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('toggle')).toBeTruthy()
  })

  it('renders thumbnail img when thumbnail is set', () => {
    const wrapper = mount(ProductCard, {
      props: { product: makeProduct({ thumbnail: '/images/core.jpg' }), owned: false },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/images/core.jpg')
  })

  it('renders fallback icon when no thumbnail', () => {
    const wrapper = mount(ProductCard, {
      props: { product: makeProduct({ thumbnail: '' }), owned: false },
    })
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('has owned border styling when owned', () => {
    const wrapper = mount(ProductCard, {
      props: { product: makeProduct(), owned: true },
    })
    // The outer div should have border-sw-gold class
    expect(wrapper.find('div').classes().some((c) => c.includes('border-sw-gold') && !c.includes('/'))).toBe(true)
  })
})
