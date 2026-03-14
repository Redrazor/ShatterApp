import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BuildListPicker from '../../../src/components/play/units/BuildListPicker.vue'
import type { Character, CompactBuild } from '../../../src/types/index.ts'

function makeChar(id: number, name: string): Character {
  return {
    id,
    name,
    characterType: `Type${id}`,
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
  }
}

const chars = [
  makeChar(1, 'Rex'),
  makeChar(2, 'Cody'),
  makeChar(3, 'Fives'),
  makeChar(4, 'Vader'),
  makeChar(5, 'Inquisitor'),
  makeChar(6, 'Trooper'),
  makeChar(7, 'Ahsoka'),
  makeChar(8, 'Ezra'),
  makeChar(9, 'Sabine'),
  makeChar(10, 'Maul'),
  makeChar(11, 'Ventress'),
  makeChar(12, 'Savage'),
]

const standardBuild: CompactBuild = {
  name: 'My Build',
  mid: null,
  pre: false,
  s: [[1, 2, 3], [4, 5, 6]],
}

const premiereBuild: CompactBuild = {
  name: 'Premiere Build',
  mid: null,
  pre: true,
  s: [[1, 2, 3], [4, 5, 6]],
  ex: [[7, 8, 9], [10, 11, 12]],
}

// Stub Teleport so content renders inline (no real DOM teleport in happy-dom tests)
const mountOptions = (savedLists: CompactBuild[], characters = chars) => ({
  props: { savedLists, characters },
  global: { stubs: { Teleport: true } },
})

afterEach(() => {
  // Clean up any attached elements
})

describe('BuildListPicker', () => {
  it('shows empty state when no builds', () => {
    const wrapper = mount(BuildListPicker, mountOptions([]))
    expect(wrapper.text()).toContain('No saved builds found')
  })

  it('renders a standard build by name', () => {
    const wrapper = mount(BuildListPicker, mountOptions([standardBuild]))
    expect(wrapper.text()).toContain('My Build')
  })

  it('does not show premiere badge for standard builds', () => {
    const wrapper = mount(BuildListPicker, mountOptions([standardBuild]))
    expect(wrapper.text()).not.toContain('★ Premiere')
  })

  it('shows premiere badge for premiere builds', () => {
    const wrapper = mount(BuildListPicker, mountOptions([premiereBuild]))
    expect(wrapper.text()).toContain('★ Premiere')
  })

  it('clicking a standard complete build emits select', async () => {
    const wrapper = mount(BuildListPicker, mountOptions([standardBuild]))
    const btn = wrapper.find('button.w-full.rounded-xl')
    await btn.trigger('click')
    const emitted = wrapper.emitted('select')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toHaveLength(3)
  })

  it('clicking a premiere build opens squad picker panel', async () => {
    const wrapper = mount(BuildListPicker, mountOptions([premiereBuild]))
    await wrapper.find('button.w-full.rounded-xl').trigger('click')
    expect(wrapper.text()).toContain('Pick 2 squads to play')
  })

  it('squad picker shows all 4 squads', async () => {
    const wrapper = mount(BuildListPicker, mountOptions([premiereBuild]))
    await wrapper.find('button.w-full.rounded-xl').trigger('click')
    expect(wrapper.text()).toContain('Squad 1')
    expect(wrapper.text()).toContain('Squad 2')
    expect(wrapper.text()).toContain('Squad 3')
    expect(wrapper.text()).toContain('Squad 4')
  })

  it('import button is disabled when fewer than 2 squads are selected', async () => {
    const wrapper = mount(BuildListPicker, mountOptions([premiereBuild]))
    await wrapper.find('button.w-full.rounded-xl').trigger('click')
    const importBtn = wrapper.findAll('button').find(b => b.text().startsWith('Import'))!
    expect(importBtn.attributes('disabled')).toBeDefined()
  })

  it('import button enables after selecting exactly 2 squads', async () => {
    const wrapper = mount(BuildListPicker, mountOptions([premiereBuild]))
    await wrapper.find('button.w-full.rounded-xl').trigger('click')
    const squadBtns = wrapper.findAll('button.w-full.rounded-xl')
    await squadBtns[0].trigger('click') // squad 1
    await squadBtns[1].trigger('click') // squad 2
    const importBtn = wrapper.findAll('button').find(b => b.text().startsWith('Import'))!
    expect(importBtn.attributes('disabled')).toBeUndefined()
  })

  it('confirming premiere selection emits select with 2 chosen squads', async () => {
    const wrapper = mount(BuildListPicker, mountOptions([premiereBuild]))
    await wrapper.find('button.w-full.rounded-xl').trigger('click')
    const squadBtns = wrapper.findAll('button.w-full.rounded-xl')
    await squadBtns[0].trigger('click') // squad 1: Rex, Cody, Fives
    await squadBtns[2].trigger('click') // squad 3: Ahsoka, Ezra, Sabine
    const importBtn = wrapper.findAll('button').find(b => b.text().startsWith('Import'))!
    await importBtn.trigger('click')
    const emitted = wrapper.emitted('select')
    expect(emitted).toBeTruthy()
    const [sq0, sq1] = emitted![0] as [Character[], Character[]]
    expect(sq0.map(c => c.name)).toContain('Rex')
    expect(sq1.map(c => c.name)).toContain('Ahsoka')
  })

  it('back button returns to list view', async () => {
    const wrapper = mount(BuildListPicker, mountOptions([premiereBuild]))
    await wrapper.find('button.w-full.rounded-xl').trigger('click')
    expect(wrapper.text()).toContain('Pick 2 squads to play')
    const backBtn = wrapper.findAll('button').find(b => b.text().includes('Back'))!
    await backBtn.trigger('click')
    expect(wrapper.text()).not.toContain('Pick 2 squads to play')
    expect(wrapper.text()).toContain('Premiere Build')
  })

  it('close button emits close', async () => {
    const wrapper = mount(BuildListPicker, mountOptions([standardBuild]))
    const closeBtn = wrapper.findAll('button').find(b => b.text() === '✕')!
    await closeBtn.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
