import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppImportBanner from '../../../src/components/AppImportBanner.vue'
import type { CompactProfile } from '../../../src/types/index.ts'

function makeProfile(overrides: Partial<CompactProfile> = {}): CompactProfile {
  return {
    v: 1,
    owned: ['SWP01', 'SWP02'],
    fav: [],
    lists: [
      { name: 'Build A', mid: null, pre: false, s: [[0, 0, 0], [0, 0, 0]] },
    ],
    ...overrides,
  }
}

describe('AppImportBanner', () => {
  it('shows pack count from profile', () => {
    const wrapper = mount(AppImportBanner, {
      props: { profile: makeProfile() },
    })
    expect(wrapper.text()).toContain('2 packs')
  })

  it('shows singular pack when count is 1', () => {
    const wrapper = mount(AppImportBanner, {
      props: { profile: makeProfile({ owned: ['SWP01'] }) },
    })
    expect(wrapper.text()).toContain('1 pack')
    expect(wrapper.text()).not.toContain('1 packs')
  })

  it('shows build count from profile', () => {
    const wrapper = mount(AppImportBanner, {
      props: { profile: makeProfile() },
    })
    expect(wrapper.text()).toContain('1 build')
  })

  it('shows plural builds when count is more than one', () => {
    const wrapper = mount(AppImportBanner, {
      props: {
        profile: makeProfile({
          lists: [
            { name: 'A', mid: null, pre: false, s: [[0, 0, 0], [0, 0, 0]] },
            { name: 'B', mid: null, pre: false, s: [[0, 0, 0], [0, 0, 0]] },
          ],
        }),
      },
    })
    expect(wrapper.text()).toContain('2 builds')
  })

  it('shows zero packs when owned is empty', () => {
    const wrapper = mount(AppImportBanner, {
      props: { profile: makeProfile({ owned: [] }) },
    })
    expect(wrapper.text()).toContain('0 packs')
  })

  it('renders Import all data button', () => {
    const wrapper = mount(AppImportBanner, {
      props: { profile: makeProfile() },
    })
    const importBtn = wrapper.findAll('button').find((b) => b.text().includes('Import'))!
    expect(importBtn).toBeTruthy()
  })

  it('renders Dismiss button', () => {
    const wrapper = mount(AppImportBanner, {
      props: { profile: makeProfile() },
    })
    const dismissBtn = wrapper.findAll('button').find((b) => b.text() === 'Dismiss')!
    expect(dismissBtn).toBeTruthy()
  })

  it('emits import when Import button clicked', async () => {
    const wrapper = mount(AppImportBanner, {
      props: { profile: makeProfile() },
    })
    const importBtn = wrapper.findAll('button').find((b) => b.text().includes('Import'))!
    await importBtn.trigger('click')
    expect(wrapper.emitted('import')).toBeTruthy()
  })

  it('emits dismiss when Dismiss button clicked', async () => {
    const wrapper = mount(AppImportBanner, {
      props: { profile: makeProfile() },
    })
    const dismissBtn = wrapper.findAll('button').find((b) => b.text() === 'Dismiss')!
    await dismissBtn.trigger('click')
    expect(wrapper.emitted('dismiss')).toBeTruthy()
  })
})
