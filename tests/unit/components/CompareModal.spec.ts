import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CompareModal from '../../../src/components/browse/CompareModal.vue'
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
    tags: ['Rebel', 'Jedi'],
    swp: 'SWP01',
    thumbnail: '',
    cardFront: '',
    cardBack: '',
    stance1: 'stance1.png',
    stance2: 'stance2.png',
    stances: [],
    releaseDate: '',
    ...overrides,
  }
}

const char1 = makeChar({ id: 1, name: 'Luke', fp: 2, tags: ['Rebel', 'Jedi'], stance1: 'a.png', stance2: 'b.png' })
const char2 = makeChar({ id: 2, name: 'Vader', fp: 3, tags: ['Sith'], era: 'GCW;CW', stance1: 'c.png', stance2: undefined })

const mountModal = (chars = [char1, char2]) =>
  mount(CompareModal, {
    props: { chars },
    global: { stubs: { Teleport: true } },
  })

describe('CompareModal', () => {
  it('renders "Compare" heading', () => {
    expect(mountModal().text()).toContain('Compare')
  })

  it('renders character names', () => {
    const w = mountModal()
    expect(w.text()).toContain('Luke')
    expect(w.text()).toContain('Vader')
  })

  it('renders stat rows including Durability, Stamina, FP', () => {
    const w = mountModal()
    expect(w.text()).toContain('Durability')
    expect(w.text()).toContain('Stamina')
    expect(w.text()).toContain('FP')
  })

  it('renders Stances row', () => {
    const w = mountModal()
    expect(w.text()).toContain('Stances')
  })

  it('renders Eras row', () => {
    const w = mountModal()
    expect(w.text()).toContain('Eras')
  })

  it('renders Tags row with tag chips', () => {
    const w = mountModal()
    expect(w.text()).toContain('Tags')
    expect(w.text()).toContain('Rebel')
    expect(w.text()).toContain('Jedi')
    expect(w.text()).toContain('Sith')
  })

  it('shows "None" for a character with no tags', () => {
    const noTags = makeChar({ id: 3, name: 'Trooper', tags: [] })
    const w = mountModal([char1, noTags])
    expect(w.text()).toContain('None')
  })

  it('emits close when close button clicked', async () => {
    const w = mountModal()
    await w.find('button').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
