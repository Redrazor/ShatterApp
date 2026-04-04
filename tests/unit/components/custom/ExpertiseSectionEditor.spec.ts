import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ExpertiseSectionEditor from '../../../../src/components/custom/phase4/ExpertiseSectionEditor.vue'
import type { ExpertiseSection } from '../../../../src/types/index.ts'

function makeSection(overrides: Partial<ExpertiseSection> = {}): ExpertiseSection {
  return {
    color: 'blue',
    entries: [
      { from: 1, to: 2, isPlus: false, icons: [] },
      { from: 3, to: 3, isPlus: false, icons: [] },
      { from: 4, to: null, isPlus: true, icons: [] },
    ],
    ...overrides,
  }
}

describe('ExpertiseSectionEditor', () => {

  // ── Threshold badge logic ──────────────────────────────────────────────────

  it('renders "1–2" badge for a range entry (from=1, to=2, isPlus=false)', () => {
    const wrapper = mount(ExpertiseSectionEditor, {
      props: { section: makeSection(), sectionLabel: 'Ranged' },
    })
    expect(wrapper.text()).toContain('1–2')
  })

  it('renders "3" badge for an exact entry (from=3, to=3, isPlus=false)', () => {
    const wrapper = mount(ExpertiseSectionEditor, {
      props: { section: makeSection(), sectionLabel: 'Ranged' },
    })
    expect(wrapper.text()).toContain('3')
  })

  it('renders "4+" badge for a plus entry (from=4, isPlus=true)', () => {
    const wrapper = mount(ExpertiseSectionEditor, {
      props: { section: makeSection(), sectionLabel: 'Ranged' },
    })
    expect(wrapper.text()).toContain('4+')
  })

  it('renders section label', () => {
    const wrapper = mount(ExpertiseSectionEditor, {
      props: { section: makeSection(), sectionLabel: 'Defense' },
    })
    expect(wrapper.text()).toContain('Defense')
  })

  // ── Add entry button ─────────────────────────────────────────────────────

  it('Add Entry Row button is enabled when fewer than 4 entries', () => {
    const section = makeSection({ entries: [{ from: 1, to: 2, isPlus: false, icons: [] }] })
    const wrapper = mount(ExpertiseSectionEditor, {
      props: { section, sectionLabel: 'Ranged' },
    })
    const btn = wrapper.find('button[disabled]')
    expect(btn.exists()).toBe(false)
  })

  it('Add Entry Row button is disabled when 4 entries exist', () => {
    const section = makeSection({
      entries: [
        { from: 1, to: 1, isPlus: false, icons: [] },
        { from: 2, to: 2, isPlus: false, icons: [] },
        { from: 3, to: 3, isPlus: false, icons: [] },
        { from: 4, to: null, isPlus: true, icons: [] },
      ],
    })
    const wrapper = mount(ExpertiseSectionEditor, {
      props: { section, sectionLabel: 'Ranged' },
    })
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add Entry Row'))
    expect(addBtn?.attributes('disabled')).toBeDefined()
  })

  it('clicking Add Entry Row emits an updated section with one more entry', async () => {
    const section = makeSection({ entries: [{ from: 1, to: 2, isPlus: false, icons: [] }] })
    const wrapper = mount(ExpertiseSectionEditor, {
      props: { section, sectionLabel: 'Melee' },
    })
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add Entry Row'))
    await addBtn!.trigger('click')
    const emitted = wrapper.emitted('update') as ExpertiseSection[][]
    expect(emitted).toBeTruthy()
    expect(emitted[0][0].entries).toHaveLength(2)
  })

  // ── Delete entry ──────────────────────────────────────────────────────────

  it('delete button is hidden when only 1 entry remains', () => {
    const section = makeSection({ entries: [{ from: 1, to: null, isPlus: true, icons: [] }] })
    const wrapper = mount(ExpertiseSectionEditor, {
      props: { section, sectionLabel: 'Defense' },
    })
    // The delete ✕ button inside the header band should not appear
    const deleteBtns = wrapper.findAll('button').filter(b => b.text() === '✕')
    expect(deleteBtns).toHaveLength(0)
  })

  it('delete button appears when more than 1 entry', () => {
    const wrapper = mount(ExpertiseSectionEditor, {
      props: { section: makeSection(), sectionLabel: 'Ranged' },
    })
    const deleteBtns = wrapper.findAll('button').filter(b => b.text() === '✕')
    expect(deleteBtns.length).toBeGreaterThan(0)
  })

  it('clicking delete emits section with one fewer entry', async () => {
    const wrapper = mount(ExpertiseSectionEditor, {
      props: { section: makeSection(), sectionLabel: 'Ranged' },
    })
    const deleteBtn = wrapper.findAll('button').find(b => b.text() === '✕')
    await deleteBtn!.trigger('click')
    const emitted = wrapper.emitted('update') as ExpertiseSection[][]
    expect(emitted[0][0].entries).toHaveLength(2)
  })

  // ── Color picker ─────────────────────────────────────────────────────────

  it('renders 4 color swatch buttons', () => {
    const wrapper = mount(ExpertiseSectionEditor, {
      props: { section: makeSection(), sectionLabel: 'Ranged' },
    })
    // 4 color swatches are round buttons in the header row
    const swatches = wrapper.findAll('button[title]').filter(b =>
      ['Blue', 'Red', 'Purple', 'Grey'].includes(b.attributes('title') ?? '')
    )
    expect(swatches).toHaveLength(4)
  })

  it('clicking a color swatch emits section with updated color', async () => {
    const wrapper = mount(ExpertiseSectionEditor, {
      props: { section: makeSection({ color: 'blue' }), sectionLabel: 'Ranged' },
    })
    const redSwatch = wrapper.findAll('button[title]').find(b => b.attributes('title') === 'Red')
    await redSwatch!.trigger('click')
    const emitted = wrapper.emitted('update') as ExpertiseSection[][]
    expect(emitted[0][0].color).toBe('red')
  })

  // ── Icon picker excludes _to files ───────────────────────────────────────

  it('icon picker includes the _to die-result icons (crit, hit, block) as priority items', async () => {
    const wrapper = mount(ExpertiseSectionEditor, {
      props: { section: makeSection(), sectionLabel: 'Ranged' },
    })
    const addIconBtn = wrapper.find('button[title="Add icon"]')
    await addIconBtn.trigger('click')
    const imgSrcs = wrapper.findAll('img').map(img => img.attributes('src') ?? '')
    expect(imgSrcs.some(src => src.includes('crit_to.png'))).toBe(true)
    expect(imgSrcs.some(src => src.includes('hit_to.png'))).toBe(true)
    expect(imgSrcs.some(src => src.includes('block_to.png'))).toBe(true)
  })

  it('icon picker includes standard iconography files', async () => {
    const wrapper = mount(ExpertiseSectionEditor, {
      props: { section: makeSection(), sectionLabel: 'Ranged' },
    })
    const addIconBtn = wrapper.find('button[title="Add icon"]')
    await addIconBtn.trigger('click')
    const imgSrcs = wrapper.findAll('img').map(img => img.attributes('src') ?? '')
    expect(imgSrcs.some(src => src.includes('strike_crop.png'))).toBe(true)
    expect(imgSrcs.some(src => src.includes('damage_crop.png'))).toBe(true)
  })

  // ── Emit on icon add ──────────────────────────────────────────────────────

  it('clicking an icon in the picker emits section with that icon appended', async () => {
    const section = makeSection({ entries: [{ from: 1, to: null, isPlus: true, icons: [] }] })
    const wrapper = mount(ExpertiseSectionEditor, {
      props: { section, sectionLabel: 'Ranged' },
    })
    const addIconBtn = wrapper.find('button[title="Add icon"]')
    await addIconBtn.trigger('click')
    // Icon picker grid buttons have a title that corresponds to icon filenames (no "Blue"/"Red"/etc.)
    const pickerButtons = wrapper.findAll('button[title]').filter(b =>
      !['Blue', 'Red', 'Purple', 'Grey', 'Add icon', 'Close'].includes(b.attributes('title') ?? '')
    )
    await pickerButtons[0].trigger('click')
    const emitted = wrapper.emitted('update') as ExpertiseSection[][]
    expect(emitted[0][0].entries[0].icons).toHaveLength(1)
    expect(emitted[0][0].entries[0].icons[0].iconFile).toBeTruthy()
  })

  // ── isPlus mode ───────────────────────────────────────────────────────────

  it('when isPlus=true, the "to" input is not rendered', () => {
    const section = makeSection({ entries: [{ from: 4, to: null, isPlus: true, icons: [] }] })
    const wrapper = mount(ExpertiseSectionEditor, {
      props: { section, sectionLabel: 'Ranged' },
    })
    // Only one number input should be visible (the "from")
    const numInputs = wrapper.findAll('input[type="number"]')
    expect(numInputs).toHaveLength(1)
  })

  it('when isPlus=false with to set, both from and to inputs are rendered', () => {
    const section = makeSection({ entries: [{ from: 1, to: 2, isPlus: false, icons: [] }] })
    const wrapper = mount(ExpertiseSectionEditor, {
      props: { section, sectionLabel: 'Ranged' },
    })
    const numInputs = wrapper.findAll('input[type="number"]')
    expect(numInputs).toHaveLength(2)
  })
})
