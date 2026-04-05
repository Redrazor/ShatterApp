import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProfilePrintLayout from '../../../../src/components/custom/ProfilePrintLayout.vue'

const baseCards = {
  front: 'data:image/jpeg;base64,front',
  abilities: 'data:image/jpeg;base64,abilities',
  stance1: 'data:image/jpeg;base64,stance1',
  stance2: null as string | null,
  orderFront: 'data:image/jpeg;base64,order',
  orderBack: '/images/order-deck-back.png',
}

describe('ProfilePrintLayout', () => {
  it('renders front card image', () => {
    const wrapper = mount(ProfilePrintLayout, {
      props: { cards: baseCards, name: 'Test Unit' },
    })
    const imgs = wrapper.findAll('img')
    const front = imgs.find(i => i.attributes('src') === baseCards.front)
    expect(front).toBeDefined()
  })

  it('renders abilities card image', () => {
    const wrapper = mount(ProfilePrintLayout, {
      props: { cards: baseCards, name: 'Test Unit' },
    })
    const imgs = wrapper.findAll('img')
    const abilities = imgs.find(i => i.attributes('src') === baseCards.abilities)
    expect(abilities).toBeDefined()
  })

  it('renders stance1 image', () => {
    const wrapper = mount(ProfilePrintLayout, {
      props: { cards: baseCards, name: 'Test Unit' },
    })
    const imgs = wrapper.findAll('img')
    const stance1 = imgs.find(i => i.attributes('src') === baseCards.stance1)
    expect(stance1).toBeDefined()
  })

  it('does not render stance2 image when null', () => {
    const wrapper = mount(ProfilePrintLayout, {
      props: { cards: { ...baseCards, stance2: null }, name: 'Test Unit' },
    })
    const imgs = wrapper.findAll('img')
    const imgSrcs = imgs.map(i => i.attributes('src'))
    expect(imgSrcs).not.toContain('data:image/jpeg;base64,stance2')
  })

  it('renders stance2 image when provided', () => {
    const cards = { ...baseCards, stance2: 'data:image/jpeg;base64,stance2' }
    const wrapper = mount(ProfilePrintLayout, {
      props: { cards, name: 'Test Unit' },
    })
    const imgs = wrapper.findAll('img')
    const stance2 = imgs.find(i => i.attributes('src') === 'data:image/jpeg;base64,stance2')
    expect(stance2).toBeDefined()
  })

  it('renders order card front and back images', () => {
    const wrapper = mount(ProfilePrintLayout, {
      props: { cards: baseCards, name: 'Test Unit' },
    })
    const imgs = wrapper.findAll('img')
    const orderFront = imgs.find(i => i.attributes('src') === baseCards.orderFront)
    const orderBack = imgs.find(i => i.attributes('src') === baseCards.orderBack)
    expect(orderFront).toBeDefined()
    expect(orderBack).toBeDefined()
  })

  it('renders correct total images for non-primary (no stance2)', () => {
    const wrapper = mount(ProfilePrintLayout, {
      props: { cards: { ...baseCards, stance2: null }, name: 'Test Unit' },
    })
    // front, abilities, stance1, orderFront, orderBack = 5 images
    expect(wrapper.findAll('img')).toHaveLength(5)
  })

  it('renders correct total images for primary (with stance2)', () => {
    const cards = { ...baseCards, stance2: 'data:image/jpeg;base64,stance2' }
    const wrapper = mount(ProfilePrintLayout, {
      props: { cards, name: 'Test Unit' },
    })
    // front, abilities, stance1, stance2, orderFront, orderBack = 6 images
    expect(wrapper.findAll('img')).toHaveLength(6)
  })
})
