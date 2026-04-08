import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import CustomView from '../../../src/views/CustomView.vue'
import { useHomebrewStore } from '../../../src/stores/homebrew.ts'
import { usePublishedProfilesStore } from '../../../src/stores/publishedProfiles.ts'
import type { HomebrewProfile } from '../../../src/types/index.ts'

vi.mock('../../../src/utils/generateProfilePdf.ts', () => ({
  generateProfilePdf: vi.fn().mockResolvedValue(undefined),
}))

const stubs = {
  CustomBuilder: { template: '<div data-testid="custom-builder"><slot/></div>' },
  CustomProfileCard: {
    template: '<div data-testid="custom-profile-card"><slot/></div>',
    props: ['profile', 'status', 'published', 'visible'],
    emits: ['load', 'visualize', 'unpublish', 'toggle-visibility', 'delete'],
  },
  ProfileVisualModal: {
    template: '<div data-testid="profile-visual-modal"><slot/></div>',
    props: ['profile', 'faction'],
    emits: ['close', 'pdf', 'publish'],
  },
}

function makeProfile(id = 'p1', name = 'Test Unit'): HomebrewProfile {
  return {
    id,
    name,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    faction: 'rebel',
    frontCard: {
      unitType: 'Primary',
      name,
      title: '',
      imageData: null,
      imageOffsetX: 0,
      imageOffsetY: 0,
      imageScale: 1,
      cost: 10,
      fp: 2,
      era: 'Clone Wars',
    },
    stats: { stamina: 5, durability: 3, tags: ['Leader'], imageOffsetX: 0, imageOffsetY: 0, imageScale: 1 },
    abilities: { blocks: [] },
    stances: {
      stance1: { title: 'Stance A', range: 2, rangeAttack: 3, rangeDefense: 2, meleeAttack: 4, meleeDefense: 3, rangedWeapon: '', meleeWeapon: '', defensiveEquipment: '', expertise: null, combatTree: null },
      stance2: null,
    },
    orderCard: null,
  }
}

describe('CustomView', () => {
  let pinia: ReturnType<typeof createPinia>
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
    })
    await router.push('/custom')
    await router.isReady()
  })

  function mountView() {
    return mount(CustomView, {
      global: { plugins: [pinia, router], stubs },
      attachTo: document.body,
    })
  }

  it('renders list mode by default', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Custom Profiles')
    expect(wrapper.find('[data-testid="custom-builder"]').exists()).toBe(false)
  })

  it('shows empty message when no profiles', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('No custom profiles yet')
  })

  it('shows profile cards when profiles exist', () => {
    const store = useHomebrewStore()
    store.profiles.push(makeProfile('p1', 'Rebel Hero'))
    const wrapper = mountView()
    expect(wrapper.findAll('[data-testid="custom-profile-card"]')).toHaveLength(1)
  })

  it('clicking Create button adds a profile and switches to builder mode', async () => {
    const store = useHomebrewStore()
    const wrapper = mountView()
    const btn = wrapper.find('button')
    await btn.trigger('click')
    expect(store.profiles).toHaveLength(1)
    expect(store.activeProfileId).not.toBeNull()
    expect(wrapper.find('[data-testid="custom-builder"]').exists()).toBe(true)
  })

  it('handleLoad sets active profile and enters builder mode', async () => {
    const store = useHomebrewStore()
    store.profiles.push(makeProfile('p1', 'Hero'))
    const wrapper = mount(CustomView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          ...stubs,
          CustomProfileCard: {
            template: '<div data-testid="custom-profile-card" @click="$emit(\'load\')"><slot/></div>',
            props: ['profile', 'status', 'published', 'visible'],
            emits: ['load', 'visualize', 'unpublish', 'toggle-visibility', 'delete'],
          },
        },
      },
    })
    await wrapper.find('[data-testid="custom-profile-card"]').trigger('click')
    expect(store.activeProfileId).toBe('p1')
    expect(wrapper.find('[data-testid="custom-builder"]').exists()).toBe(true)
  })

  it('handleBack returns to list mode and clears active profile', async () => {
    const store = useHomebrewStore()
    const backStubs = {
      ...stubs,
      CustomBuilder: {
        template: '<div data-testid="custom-builder"><button data-testid="back-btn" @click="$emit(\'back\')">Back</button></div>',
        emits: ['back', 'saved'],
      },
    }
    const wrapper = mount(CustomView, { global: { plugins: [pinia, router], stubs: backStubs } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('[data-testid="custom-builder"]').exists()).toBe(true)
    await wrapper.find('[data-testid="back-btn"]').trigger('click')
    expect(store.activeProfileId).toBeNull()
    expect(wrapper.find('[data-testid="custom-builder"]').exists()).toBe(false)
  })

  it('handleSaved returns to list mode and clears active profile', async () => {
    const store = useHomebrewStore()
    const savedStubs = {
      ...stubs,
      CustomBuilder: {
        template: '<div data-testid="custom-builder"><button data-testid="saved-btn" @click="$emit(\'saved\')">Save</button></div>',
        emits: ['back', 'saved'],
      },
    }
    const wrapper = mount(CustomView, { global: { plugins: [pinia, router], stubs: savedStubs } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('[data-testid="custom-builder"]').exists()).toBe(true)
    await wrapper.find('[data-testid="saved-btn"]').trigger('click')
    expect(store.activeProfileId).toBeNull()
    expect(wrapper.find('[data-testid="custom-builder"]').exists()).toBe(false)
  })

  it('handleVisualize opens the ProfileVisualModal', async () => {
    const homebrewStore = useHomebrewStore()
    const profile = makeProfile('p1', 'Jedi')
    homebrewStore.profiles.push(profile)

    const wrapper = mount(CustomView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          ...stubs,
          CustomProfileCard: {
            template: '<div data-testid="custom-profile-card" @click="$emit(\'visualize\', profile)"><slot/></div>',
            props: ['profile', 'status', 'published', 'visible'],
            emits: ['load', 'visualize', 'unpublish', 'toggle-visibility', 'delete'],
          },
        },
      },
    })

    expect(wrapper.find('[data-testid="profile-visual-modal"]').exists()).toBe(false)
    await wrapper.find('[data-testid="custom-profile-card"]').trigger('click')
    expect(wrapper.find('[data-testid="profile-visual-modal"]').exists()).toBe(true)
  })

  it('handleDelete removes the profile from the homebrew store', async () => {
    const homebrewStore = useHomebrewStore()
    const profile = makeProfile('p1', 'Sith')
    homebrewStore.profiles.push(profile)

    const wrapper = mount(CustomView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          ...stubs,
          CustomProfileCard: {
            template: '<div data-testid="custom-profile-card" @click="$emit(\'delete\')"><slot/></div>',
            props: ['profile', 'status', 'published', 'visible'],
            emits: ['load', 'visualize', 'unpublish', 'toggle-visibility', 'delete'],
          },
        },
      },
    })

    await wrapper.find('[data-testid="custom-profile-card"]').trigger('click')
    expect(homebrewStore.profiles).toHaveLength(0)
  })

  it('handlePublish publishes profile and closes modal', async () => {
    const homebrewStore = useHomebrewStore()
    const publishedStore = usePublishedProfilesStore()
    const profile = makeProfile('p1', 'Clone')
    homebrewStore.profiles.push(profile)

    const wrapper = mount(CustomView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          ...stubs,
          CustomProfileCard: {
            template: '<div data-testid="custom-profile-card" @click="$emit(\'visualize\', profile)"><slot/></div>',
            props: ['profile', 'status', 'published', 'visible'],
            emits: ['load', 'visualize', 'unpublish', 'toggle-visibility', 'delete'],
          },
          ProfileVisualModal: {
            template: '<div data-testid="profile-visual-modal" @click="$emit(\'publish\', { front: \'a\', abilities: \'b\', stance1: \'c\', stance2: \'d\', orderFront: \'e\', thumbnail: \'f\' })"><slot/></div>',
            props: ['profile', 'faction'],
            emits: ['close', 'pdf', 'publish'],
          },
        },
      },
    })

    // Open modal
    await wrapper.find('[data-testid="custom-profile-card"]').trigger('click')
    expect(wrapper.find('[data-testid="profile-visual-modal"]').exists()).toBe(true)

    // Publish
    await wrapper.find('[data-testid="profile-visual-modal"]').trigger('click')
    expect(publishedStore.isPublished('p1')).toBe(true)
    expect(wrapper.find('[data-testid="profile-visual-modal"]').exists()).toBe(false)
  })

  it('handleUnpublish calls unpublishByHomebrewId', async () => {
    const homebrewStore = useHomebrewStore()
    const publishedStore = usePublishedProfilesStore()
    const profile = makeProfile('p1', 'Trooper')
    homebrewStore.profiles.push(profile)

    // Publish first
    publishedStore.publish(profile, { front: 'a', abilities: 'b', stance1: 'c', stance2: 'd', orderFront: 'e', thumbnail: 'f' })
    expect(publishedStore.isPublished('p1')).toBe(true)

    const wrapper = mount(CustomView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          ...stubs,
          CustomProfileCard: {
            template: '<div data-testid="custom-profile-card" @click="$emit(\'unpublish\')"><slot/></div>',
            props: ['profile', 'status', 'published', 'visible'],
            emits: ['load', 'visualize', 'unpublish', 'toggle-visibility', 'delete'],
          },
        },
      },
    })

    await wrapper.find('[data-testid="custom-profile-card"]').trigger('click')
    expect(publishedStore.isPublished('p1')).toBe(false)
  })

  it('modal close event clears visualProfile', async () => {
    const homebrewStore = useHomebrewStore()
    const profile = makeProfile('p1', 'Pilot')
    homebrewStore.profiles.push(profile)

    const wrapper = mount(CustomView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          ...stubs,
          CustomProfileCard: {
            template: '<div data-testid="custom-profile-card" @click="$emit(\'visualize\', profile)"><slot/></div>',
            props: ['profile', 'status', 'published', 'visible'],
            emits: ['load', 'visualize', 'unpublish', 'toggle-visibility', 'delete'],
          },
          ProfileVisualModal: {
            template: '<div data-testid="profile-visual-modal" @click="$emit(\'close\')"><slot/></div>',
            props: ['profile', 'faction'],
            emits: ['close', 'pdf', 'publish'],
          },
        },
      },
    })

    await wrapper.find('[data-testid="custom-profile-card"]').trigger('click')
    expect(wrapper.find('[data-testid="profile-visual-modal"]').exists()).toBe(true)
    await wrapper.find('[data-testid="profile-visual-modal"]').trigger('click')
    expect(wrapper.find('[data-testid="profile-visual-modal"]').exists()).toBe(false)
  })
})
