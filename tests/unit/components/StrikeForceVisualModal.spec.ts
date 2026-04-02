import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StrikeForceVisualModal from '../../../src/components/build/StrikeForceVisualModal.vue'
import type { Character, Squad } from '../../../src/types/index.ts'

vi.mock('html2canvas', () => ({ default: vi.fn() }))

function makeChar(id: number, name: string, unitType: 'Primary' | 'Secondary' | 'Support'): Character {
  return {
    id, slug: `char-${id}`, name, characterType: `Type${id}`, unitType,
    pc: unitType === 'Primary' ? null : 4, sp: unitType === 'Primary' ? 10 : null,
    durability: 2, stamina: 8, fp: 0, era: 'Clone Wars', tags: [],
    swp: 'SWP01', swpCode: 'SWP01', thumbnail: '', cardFront: `/images/${name}.png`,
    cardBack: '', stances: [], releaseDate: '2024-01-01',
  }
}

const squads: [Squad, Squad] = [
  {
    primary: makeChar(1, 'Ahsoka Tano', 'Primary'),
    secondary: makeChar(2, 'Rex', 'Secondary'),
    support: makeChar(3, 'Anakin', 'Support'),
  },
  {
    primary: makeChar(4, 'Grievous', 'Primary'),
    secondary: makeChar(5, 'Dooku', 'Secondary'),
    support: makeChar(6, 'Asajj', 'Support'),
  },
]

function mountModal(overrides = {}) {
  return mount(StrikeForceVisualModal, {
    props: {
      squads,
      name: 'My Strike Force',
      shareUrl: 'https://shatterapp.com/build?sf=abc123',
      ...overrides,
    },
  })
}

describe('StrikeForceVisualModal', () => {
  it('displays the list name', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('My Strike Force')
  })

  it('shows Squad 1 and Squad 2 labels', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('Squad 1')
    expect(wrapper.text()).toContain('Squad 2')
  })

  it('renders all 6 unit names', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('Ahsoka Tano')
    expect(wrapper.text()).toContain('Rex')
    expect(wrapper.text()).toContain('Anakin')
    expect(wrapper.text()).toContain('Grievous')
    expect(wrapper.text()).toContain('Dooku')
    expect(wrapper.text()).toContain('Asajj')
  })

  it('renders card front images', () => {
    const wrapper = mountModal()
    const imgs = wrapper.findAll('img')
    expect(imgs.length).toBe(6)
  })

  it('emits close when ✕ is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows placeholder for empty slot', () => {
    const sparseSquads: [Squad, Squad] = [
      { primary: makeChar(1, 'Ahsoka Tano', 'Primary'), secondary: null, support: null },
      { primary: null, secondary: null, support: null },
    ]
    const wrapper = mountModal({ squads: sparseSquads })
    // Should show role placeholders for empty slots
    expect(wrapper.text()).toContain('secondary')
    expect(wrapper.text()).toContain('support')
    expect(wrapper.text()).toContain('primary')
  })

  it('has Download PNG and Share Link buttons', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('Download PNG')
    expect(wrapper.text()).toContain('Share Link')
  })
})
