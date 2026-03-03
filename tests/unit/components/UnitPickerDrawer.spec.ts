import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UnitPickerDrawer from '../../../src/components/build/UnitPickerDrawer.vue'
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
    tags: ['Rebel'],
    swp: 'SWP01',
    thumbnail: '',
    cardFront: '',
    cardBack: '',
    stances: [],
    releaseDate: '',
    ...overrides,
  }
}

const defaultProps = {
  show: true,
  characters: [
    makeChar({ id: 1, name: 'Luke', unitType: 'Primary', sp: 5 }),
    makeChar({ id: 2, name: 'Han Solo', unitType: 'Secondary', pc: 3, sp: null }),
    makeChar({ id: 3, name: 'Leia', unitType: 'Support', pc: 2, sp: null }),
  ],
  role: 'primary' as const,
}

describe('UnitPickerDrawer', () => {
  it('does not render when show=false', () => {
    const wrapper = mount(UnitPickerDrawer, {
      props: { ...defaultProps, show: false },
      global: { stubs: { Teleport: true } },
    })
    // When show is false, content should not be present
    expect(wrapper.find('.flex.w-full.max-w-md').exists()).toBe(false)
  })

  it('renders drawer header with role name', () => {
    const wrapper = mount(UnitPickerDrawer, {
      props: defaultProps,
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.text()).toContain('Pick Primary')
  })

  it('shows all characters of the correct role type', () => {
    const wrapper = mount(UnitPickerDrawer, {
      props: defaultProps,
      global: { stubs: { Teleport: true } },
    })
    // Only Primary should show
    expect(wrapper.text()).toContain('Luke')
    expect(wrapper.text()).not.toContain('Han Solo')
    expect(wrapper.text()).not.toContain('Leia')
  })

  it('filters by search query', async () => {
    const wrapper = mount(UnitPickerDrawer, {
      props: { ...defaultProps, role: null, characters: defaultProps.characters },
      global: { stubs: { Teleport: true } },
    })
    const input = wrapper.find('input[type="text"]')
    await input.setValue('han')
    expect(wrapper.text()).toContain('Han Solo')
    expect(wrapper.text()).not.toContain('Luke')
  })

  it('shows no results message when search has no match', async () => {
    const wrapper = mount(UnitPickerDrawer, {
      props: { ...defaultProps, role: null },
      global: { stubs: { Teleport: true } },
    })
    const input = wrapper.find('input[type="text"]')
    await input.setValue('xyznonexistent')
    expect(wrapper.text()).toContain('No units found')
  })

  it('emits select event with correct character on click', async () => {
    const wrapper = mount(UnitPickerDrawer, {
      props: { ...defaultProps },
      global: { stubs: { Teleport: true } },
    })
    const unitButtons = wrapper.findAll('button').filter((b) => b.text().includes('Luke'))
    expect(unitButtons.length).toBeGreaterThan(0)
    await unitButtons[0].trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    const emittedChar = wrapper.emitted('select')![0][0] as Character
    expect(emittedChar.name).toBe('Luke')
  })

  it('emits close event when close button clicked', async () => {
    const wrapper = mount(UnitPickerDrawer, {
      props: defaultProps,
      global: { stubs: { Teleport: true } },
    })
    const closeBtn = wrapper.find('button.text-sw-text\\/60')
    await closeBtn.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows secondary role picker correctly', () => {
    const wrapper = mount(UnitPickerDrawer, {
      props: { ...defaultProps, role: 'secondary' as const },
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.text()).toContain('Pick Secondary')
    // Only secondary units
    expect(wrapper.text()).toContain('Han Solo')
    expect(wrapper.text()).not.toContain('Luke')
  })

  it('shows all units when role is null', () => {
    const wrapper = mount(UnitPickerDrawer, {
      props: { ...defaultProps, role: null },
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.text()).toContain('Luke')
    expect(wrapper.text()).toContain('Han Solo')
    expect(wrapper.text()).toContain('Leia')
  })
})
