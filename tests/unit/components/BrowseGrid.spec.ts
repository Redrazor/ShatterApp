import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BrowseGrid from '../../../src/components/browse/BrowseGrid.vue'
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
    era: 'GCW',
    tags: [],
    swp: 'SWP01',
    thumbnail: '/images/luke.png',
    cardFront: '',
    cardBack: '',
    stances: [],
    releaseDate: '',
    ...overrides,
  }
}

describe('BrowseGrid', () => {
  it('shows empty state when characters array is empty', () => {
    const wrapper = mount(BrowseGrid, {
      props: { characters: [], ownedSwpSet: new Set() },
    })
    expect(wrapper.text()).toContain('No units match your filters')
  })

  it('renders a UnitCard for each character', () => {
    const chars = [
      makeChar({ id: 1, name: 'Luke' }),
      makeChar({ id: 2, name: 'Vader' }),
    ]
    const wrapper = mount(BrowseGrid, {
      props: { characters: chars, ownedSwpSet: new Set() },
    })
    expect(wrapper.text()).toContain('Luke')
    expect(wrapper.text()).toContain('Vader')
  })

  it('passes owned state correctly', () => {
    const chars = [makeChar({ id: 1, name: 'Luke', swp: 'SWP01' })]
    const wrapper = mount(BrowseGrid, {
      props: { characters: chars, ownedSwpSet: new Set(['SWP01']) },
    })
    // UnitCard shows owned indicator
    expect(wrapper.text()).toContain('✓')
  })

  it('emits select event when a card is clicked', async () => {
    const chars = [makeChar({ id: 1, name: 'Luke' })]
    const wrapper = mount(BrowseGrid, {
      props: { characters: chars, ownedSwpSet: new Set() },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    const emittedChar = wrapper.emitted('select')![0][0] as Character
    expect(emittedChar.name).toBe('Luke')
  })
})
