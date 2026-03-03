import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SquadSlot from '../../../src/components/build/SquadSlot.vue'
import type { Squad, Character } from '../../../src/types/index.ts'

function makeChar(overrides: Partial<Character> = {}): Character {
  return {
    id: 1,
    name: 'Test Unit',
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
    thumbnail: '',
    cardFront: '',
    cardBack: '',
    stances: [],
    releaseDate: '',
    ...overrides,
  }
}

function emptySquad(): Squad {
  return { primary: null, secondary: null, support: null }
}

describe('SquadSlot', () => {
  it('shows empty state for all three roles', () => {
    const wrapper = mount(SquadSlot, {
      props: { squad: emptySquad(), squadIndex: 0 },
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.text()).toContain('Add Primary')
    expect(wrapper.text()).toContain('Add Secondary')
    expect(wrapper.text()).toContain('Add Support')
  })

  it('shows Squad 1 label for index 0', () => {
    const wrapper = mount(SquadSlot, {
      props: { squad: emptySquad(), squadIndex: 0 },
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.text()).toContain('Squad 1')
  })

  it('shows Squad 2 label for index 1', () => {
    const wrapper = mount(SquadSlot, {
      props: { squad: emptySquad(), squadIndex: 1 },
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.text()).toContain('Squad 2')
  })

  it('renders assigned primary unit name', () => {
    const squad: Squad = {
      primary: makeChar({ name: 'Luke', unitType: 'Primary', sp: 5 }),
      secondary: null,
      support: null,
    }
    const wrapper = mount(SquadSlot, {
      props: { squad, squadIndex: 0 },
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.text()).toContain('Luke')
  })

  it('renders SP value for primary unit', () => {
    const squad: Squad = {
      primary: makeChar({ unitType: 'Primary', sp: 5 }),
      secondary: null,
      support: null,
    }
    const wrapper = mount(SquadSlot, {
      props: { squad, squadIndex: 0 },
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.text()).toContain('SP: 5')
  })

  it('renders PC value for secondary unit', () => {
    const squad: Squad = {
      primary: null,
      secondary: makeChar({ id: 2, unitType: 'Secondary', pc: 3, sp: null }),
      support: null,
    }
    const wrapper = mount(SquadSlot, {
      props: { squad, squadIndex: 0 },
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.text()).toContain('PC: 3')
  })

  it('shows valid indicator when squad is valid (sp >= pc sum)', () => {
    const squad: Squad = {
      primary: makeChar({ unitType: 'Primary', sp: 5, pc: null }),
      secondary: makeChar({ id: 2, unitType: 'Secondary', sp: null, pc: 2 }),
      support: makeChar({ id: 3, unitType: 'Support', sp: null, pc: 2 }),
    }
    const wrapper = mount(SquadSlot, {
      props: { squad, squadIndex: 0 },
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.text()).toContain('✓')
  })

  it('shows invalid indicator for empty squad', () => {
    const wrapper = mount(SquadSlot, {
      props: { squad: emptySquad(), squadIndex: 0 },
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.text()).toContain('✗')
  })

  it('shows invalid indicator when pc sum > sp', () => {
    const squad: Squad = {
      primary: makeChar({ unitType: 'Primary', sp: 3, pc: null }),
      secondary: makeChar({ id: 2, unitType: 'Secondary', sp: null, pc: 3 }),
      support: makeChar({ id: 3, unitType: 'Support', sp: null, pc: 3 }),
    }
    const wrapper = mount(SquadSlot, {
      props: { squad, squadIndex: 0 },
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.text()).toContain('✗')
  })

  it('emits pick event with role when empty slot is clicked', async () => {
    const wrapper = mount(SquadSlot, {
      props: { squad: emptySquad(), squadIndex: 0 },
      global: { stubs: { Teleport: true } },
    })
    // Find the "Add Primary" button (first button in the component after header buttons)
    const addButtons = wrapper.findAll('button').filter((b) => b.text().includes('Add Primary'))
    expect(addButtons.length).toBeGreaterThan(0)
    await addButtons[0].trigger('click')
    expect(wrapper.emitted('pick')).toBeTruthy()
    expect(wrapper.emitted('pick')![0]).toEqual(['primary'])
  })

  it('emits clear event when remove button clicked', async () => {
    const squad: Squad = {
      primary: makeChar({ name: 'Luke', unitType: 'Primary', sp: 5 }),
      secondary: null,
      support: null,
    }
    const wrapper = mount(SquadSlot, {
      props: { squad, squadIndex: 0 },
      global: { stubs: { Teleport: true } },
    })
    const removeBtn = wrapper.find('button[aria-label="Remove unit"]')
    await removeBtn.trigger('click')
    expect(wrapper.emitted('clear')).toBeTruthy()
    expect(wrapper.emitted('clear')![0]).toEqual(['primary'])
  })
})
