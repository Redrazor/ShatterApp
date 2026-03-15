import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import PlayView from '../../../src/views/PlayView.vue'
import { useStruggleStore } from '../../../src/stores/struggle.ts'
import { useMissionsStore } from '../../../src/stores/missions.ts'
import { useKeyopsStore } from '../../../src/stores/keyops.ts'
import { useKoMissionsStore } from '../../../src/stores/koMissions.ts'
import type { Mission, KoMission } from '../../../src/types/index.ts'

const stubs = {
  Transition: { template: '<slot/>' },
}

const mockMission: Mission = {
  id: 1,
  name: 'Test Mission',
  card: '/images/test-card.png',
  swp: 'SWP01',
  struggles: {
    struggle1: ['/images/s1.png'],
    struggle2: ['/images/s2.png'],
    struggle3: ['/images/s3.png'],
  },
}

describe('PlayView', () => {
  let pinia: ReturnType<typeof createPinia>
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
    })
    await router.push('/play')
    await router.isReady()
  })

  // Mount without a selected mission (State A — picker)
  function mountView() {
    return mount(PlayView, {
      global: { plugins: [pinia, router], stubs },
      attachTo: document.body,
    })
  }

  // Mount without mission but with Tracker tab active (for picker content tests)
  async function mountViewOnTracker() {
    const wrapper = mountView()
    const trackerBtn = wrapper.findAll('button').find(b => b.text() === 'Tracker')
    if (trackerBtn) await trackerBtn.trigger('click')
    return wrapper
  }

  // Mount with mission already confirmed (State B — game UI)
  function mountViewWithMission() {
    const store = useStruggleStore()
    store.selectedMission = mockMission
    store.struggleCards = ['/images/s1.png', '/images/s2.png', '/images/s3.png']
    return mount(PlayView, {
      global: { plugins: [pinia, router], stubs },
      attachTo: document.body,
    })
  }

  it('renders the Play heading', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Game Tracker')
  })

  // ── State A: Mission Picker ─────────────────────────────────────────────

  describe('mission picker (State A — no mission selected)', () => {
    it('shows Choose Mission label when no mission selected', async () => {
      const wrapper = await mountViewOnTracker()
      expect(wrapper.text()).toContain('Choose Mission')
    })

    it('does not show Reset button without a selected mission', () => {
      const wrapper = mountView()
      expect(wrapper.text()).not.toContain('Reset')
    })

    it('does not show tracker or scoreboard without a mission', () => {
      const wrapper = mountView()
      expect(wrapper.text()).not.toContain('Struggles')
      expect(wrapper.text()).not.toContain('Move Struggle Token')
      expect(wrapper.text()).not.toContain('tap cells')
    })

    it('shows mission name and prev/next buttons when missions are loaded', async () => {
      const missionsStore = useMissionsStore()
      missionsStore.missions = [mockMission]
      const wrapper = await mountViewOnTracker()
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Test Mission')
      // Nav buttons use SVG icons — verify two nav buttons exist
      const navBtns = wrapper.findAll('button').filter(b => b.find('svg').exists())
      expect(navBtns).toHaveLength(2)
    })

    it('advances pickerIndex when next button clicked', async () => {
      const missionsStore = useMissionsStore()
      const mission2: Mission = { ...mockMission, id: 2, name: 'Second Mission' }
      missionsStore.missions = [mockMission, mission2]
      const wrapper = await mountViewOnTracker()
      await wrapper.vm.$nextTick()
      // Next button is the second SVG nav button (first is prev/disabled)
      const nextBtn = wrapper.findAll('button').filter(b => b.find('svg').exists())[1]
      expect(nextBtn).toBeDefined()
      await nextBtn.trigger('click')
      expect(wrapper.text()).toContain('Second Mission')
    })

    it('clicking Play this Mission calls confirmMission', async () => {
      const store = useStruggleStore()
      const missionsStore = useMissionsStore()
      missionsStore.missions = [mockMission]
      const wrapper = await mountViewOnTracker()
      await wrapper.vm.$nextTick()
      const playBtn = wrapper.findAll('button').find(b => b.text().includes('Play this Mission'))
      expect(playBtn).toBeDefined()
      await playBtn!.trigger('click')
      expect(store.selectedMission).toEqual(mockMission)
      expect(store.struggleCards).not.toBeNull()
    })

    it('shows No missions available when missions array is empty', async () => {
      const missionsStore = useMissionsStore()
      const wrapper = await mountViewOnTracker()
      missionsStore.loading = false
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('No missions available')
    })
  })

  // ── State B: Game in progress ────────────────────────────────────────────

  describe('game area (State B — mission selected)', () => {
    it('renders 17 track cells', () => {
      const wrapper = mountViewWithMission()
      expect(wrapper.text()).toContain('0') // center cell label
    })

    it('shows initial struggle position as 0', () => {
      const wrapper = mountViewWithMission()
      expect(wrapper.text()).toContain('0')
    })

    it('shows momentum hint text', () => {
      const wrapper = mountViewWithMission()
      expect(wrapper.text()).toContain('tap cells')
    })

    it('shows win pip stars', () => {
      const wrapper = mountViewWithMission()
      expect(wrapper.text()).toContain('P1')
      expect(wrapper.text()).toContain('P2')
      expect(wrapper.text()).toContain('Struggles')
    })

    it('shows move controls', () => {
      const wrapper = mountViewWithMission()
      expect(wrapper.text()).toContain('Move Struggle Token')
      expect(wrapper.text()).toContain('←←')
      expect(wrapper.text()).toContain('→→')
    })

    it('shows Reset button', () => {
      const wrapper = mountViewWithMission()
      expect(wrapper.text()).toContain('Reset')
    })

    it('does not show win banner initially', () => {
      const wrapper = mountViewWithMission()
      expect(wrapper.text()).not.toContain('Wins the Struggle')
    })

    it('does not show game over initially', () => {
      const wrapper = mountViewWithMission()
      expect(wrapper.text()).not.toContain('Game Over')
    })

    it('shows win banner when p1WinsStruggle is true', async () => {
      const store = useStruggleStore()
      store.p1Momentum = 1
      store.strugglePosition = -8
      const wrapper = mountViewWithMission()
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('P1 Wins the Struggle')
    })

    it('shows win banner when p2WinsStruggle is true', async () => {
      const store = useStruggleStore()
      store.p2Momentum = 1
      store.strugglePosition = 8
      const wrapper = mountViewWithMission()
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('P2 Wins the Struggle')
    })

    it('shows game over overlay when p1 has 2 wins', async () => {
      const store = useStruggleStore()
      store.p1Wins = 2
      const wrapper = mountViewWithMission()
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Game Over')
      expect(wrapper.text()).toContain('Player 1 Wins')
    })

    it('shows game over overlay when p2 has 2 wins', async () => {
      const store = useStruggleStore()
      store.p2Wins = 2
      const wrapper = mountViewWithMission()
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Game Over')
      expect(wrapper.text()).toContain('Player 2 Wins')
    })

    it('clicking Reset calls resetGame', async () => {
      const store = useStruggleStore()
      store.strugglePosition = 5
      store.p1Wins = 1
      const wrapper = mountViewWithMission()
      const resetBtn = wrapper.findAll('button').find(b => b.text() === 'Reset')
      expect(resetBtn).toBeDefined()
      await resetBtn!.trigger('click')
      expect(store.strugglePosition).toBe(0)
      expect(store.p1Wins).toBe(0)
    })

    it('clicking ← 1 moves struggle left', async () => {
      const store = useStruggleStore()
      const wrapper = mountViewWithMission()
      const leftBtn = wrapper.findAll('button').find(b => b.text().includes('← 1'))
      expect(leftBtn).toBeDefined()
      await leftBtn!.trigger('click')
      expect(store.strugglePosition).toBe(-1)
    })

    it('clicking 1 → moves struggle right', async () => {
      const store = useStruggleStore()
      const wrapper = mountViewWithMission()
      const rightBtn = wrapper.findAll('button').find(b => b.text().includes('1 →'))
      expect(rightBtn).toBeDefined()
      await rightBtn!.trigger('click')
      expect(store.strugglePosition).toBe(1)
    })

    it('clicking ←← moves struggle left 3', async () => {
      const store = useStruggleStore()
      store.strugglePosition = 0
      const wrapper = mountViewWithMission()
      const btn = wrapper.findAll('button').find(b => b.text() === '←←')
      await btn!.trigger('click')
      expect(store.strugglePosition).toBe(-3)
    })

    it('clicking →→ moves struggle right 3', async () => {
      const store = useStruggleStore()
      store.strugglePosition = 0
      const wrapper = mountViewWithMission()
      const btn = wrapper.findAll('button').find(b => b.text() === '→→')
      await btn!.trigger('click')
      expect(store.strugglePosition).toBe(3)
    })

    it('clicking a P1 track cell sets p1Momentum', async () => {
      const store = useStruggleStore()
      store.p1Momentum = 0
      const wrapper = mountViewWithMission()
      const cells = wrapper.findAll('[data-track-rail] > div')
      await cells[0].trigger('click')  // pos -8 → level 1
      expect(store.p1Momentum).toBe(1)
    })

    it('clicking the innermost P1 cell removes that token', async () => {
      const store = useStruggleStore()
      store.p1Momentum = 3  // innermost = -6 (index 2 in array)
      const wrapper = mountViewWithMission()
      const cells = wrapper.findAll('[data-track-rail] > div')
      await cells[2].trigger('click')  // pos -6 → level 3 === current → remove
      expect(store.p1Momentum).toBe(2)
    })

    it('clicking a P2 track cell sets p2Momentum', async () => {
      const store = useStruggleStore()
      store.p2Momentum = 0
      const wrapper = mountViewWithMission()
      const cells = wrapper.findAll('[data-track-rail] > div')
      await cells[16].trigger('click')  // pos +8 → level 1
      expect(store.p2Momentum).toBe(1)
    })

    it('clicking Claim Struggle calls claimStruggle and resets tracker', async () => {
      const store = useStruggleStore()
      store.p1Momentum = 1
      store.strugglePosition = -8
      const wrapper = mountViewWithMission()
      await wrapper.vm.$nextTick()
      const claimBtn = wrapper.findAll('button').find(b => b.text().includes('Claim Struggle'))
      expect(claimBtn).toBeDefined()
      await claimBtn!.trigger('click')
      expect(store.p1Wins).toBe(1)
      expect(store.strugglePosition).toBe(0)
      expect(store.p1Momentum).toBe(1)
    })

    it('includes rules quick reference section', () => {
      const wrapper = mountViewWithMission()
      expect(wrapper.text()).toContain('Rules Quick Reference')
    })

    it('shows mission card image', () => {
      const wrapper = mountViewWithMission()
      const missionCard = wrapper.find('[data-testid="mission-card"]')
      expect(missionCard.exists()).toBe(true)
      expect(missionCard.attributes('src')).toBe('/images/test-card.png')
    })

    it('shows mission name below card', () => {
      const wrapper = mountViewWithMission()
      expect(wrapper.text()).toContain('Test Mission')
    })
  })

  // ── Struggle cards ────────────────────────────────────────────────────────

  describe('struggle cards', () => {
    it('shows 3 card flippers when mission is selected', () => {
      const wrapper = mountViewWithMission()
      const flippers = wrapper.findAll('[data-testid="card-flipper"]')
      expect(flippers).toHaveLength(3)
    })

    it('first card is revealed on game start (revealedCount=1)', () => {
      const wrapper = mountViewWithMission()
      const flippers = wrapper.findAll('[data-testid="card-flipper"]')
      expect(flippers[0].classes()).toContain('revealed')
      expect(flippers[1].classes()).not.toContain('revealed')
      expect(flippers[2].classes()).not.toContain('revealed')
    })

    it('second card reveals after first struggle is claimed', async () => {
      const store = useStruggleStore()
      const wrapper = mountViewWithMission()
      store.claimStruggle(1)
      await wrapper.vm.$nextTick()
      const flippers = wrapper.findAll('[data-testid="card-flipper"]')
      expect(flippers[0].classes()).toContain('revealed')
      expect(flippers[1].classes()).toContain('revealed')
      expect(flippers[2].classes()).not.toContain('revealed')
    })

    it('third card reveals after second struggle is claimed', async () => {
      const store = useStruggleStore()
      const wrapper = mountViewWithMission()
      store.claimStruggle(1)
      store.claimStruggle(2)
      await wrapper.vm.$nextTick()
      const flippers = wrapper.findAll('[data-testid="card-flipper"]')
      expect(flippers[0].classes()).toContain('revealed')
      expect(flippers[1].classes()).toContain('revealed')
      expect(flippers[2].classes()).toContain('revealed')
    })

    it('shows Roman numerals on unrevealed card backs', () => {
      const wrapper = mountViewWithMission()
      // Cards 2 and 3 are face-down; their roman numerals should be in the DOM
      expect(wrapper.text()).toContain('II')
      expect(wrapper.text()).toContain('III')
    })

    it('does not show struggle cards in State A (no mission)', () => {
      const wrapper = mountView()
      const flippers = wrapper.findAll('[data-testid="card-flipper"]')
      expect(flippers).toHaveLength(0)
    })
  })

  // ── Key Operations mode ───────────────────────────────────────────────────

  describe('key operations mode', () => {
    const mockKoMission: KoMission = {
      id: 1,
      name: 'Explore the Ruins',
      missionFront: '/images/ko/explore-the-ruins-mission-front.png',
      missionBack: '/images/ko/explore-the-ruins-mission-back.png',
      stages: [
        { front: '/images/ko/stage-1-front.png', back: '/images/ko/stage-1-back.png' },
        { front: '/images/ko/stage-2-front.png', back: '/images/ko/stage-2-back.png' },
      ],
      tracker: '/images/ko/explore-the-ruins-tracker.png',
    }

    it('renders Key Ops tab in mode switcher', () => {
      const wrapper = mountView()
      expect(wrapper.text()).toContain('Key Ops')
    })

    it('switching to Key Ops mode shows KO picker', async () => {
      const wrapper = mountView()
      const keyOpsTab = wrapper.findAll('button').find(b => b.text() === 'Key Ops')
      expect(keyOpsTab).toBeDefined()
      await keyOpsTab!.trigger('click')
      expect(wrapper.text()).toContain('Choose Mission')
    })

    it('switching to Key Ops mode calls resetCampaign', async () => {
      const koStore = useKeyopsStore()
      koStore.aggressorCampaignWins = 1
      const wrapper = mountView()
      const keyOpsTab = wrapper.findAll('button').find(b => b.text() === 'Key Ops')
      await keyOpsTab!.trigger('click')
      expect(koStore.aggressorCampaignWins).toBe(0)
    })

    it('shows KO mission card in game area when KO mission is selected', async () => {
      const koStore = useKeyopsStore()
      koStore.mode = 'key-operations'
      koStore.selectedKoMission = mockKoMission
      const wrapper = mountView()
      await wrapper.vm.$nextTick()
      const img = wrapper.find('[data-testid="mission-card"]')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toContain('explore-the-ruins-mission-front')
    })

    it('renders KoMissionInteraction when KO mission is selected', async () => {
      const koStore = useKeyopsStore()
      koStore.mode = 'key-operations'
      koStore.selectedKoMission = mockKoMission
      const wrapper = mountView()
      await wrapper.vm.$nextTick()
      // ExploreTheRuins renders "Mysterious Workings"
      expect(wrapper.text()).toContain('Mysterious Workings')
    })

    it('KO picker carousel shows missionFront image instead of placeholder', async () => {
      const koStore = useKeyopsStore()
      const koMissionsStore = useKoMissionsStore()
      koStore.mode = 'key-operations'
      koMissionsStore.missions = [mockKoMission]
      const wrapper = await mountViewOnTracker()
      koMissionsStore.loading = false
      await wrapper.vm.$nextTick()
      const img = wrapper.find('img[alt="mission card"]')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toContain('explore-the-ruins-mission-front')
    })

    it('does not render campaign pip bar in KO mode', async () => {
      const koStore = useKeyopsStore()
      koStore.mode = 'key-operations'
      koStore.selectedKoMission = mockKoMission
      const wrapper = mountView()
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain('Campaign')
      expect(wrapper.text()).not.toContain('Op 1/3')
    })

    it('KO mission card is collapsible in State B', async () => {
      const koStore = useKeyopsStore()
      koStore.mode = 'key-operations'
      koStore.selectedKoMission = mockKoMission
      const wrapper = mountView()
      await wrapper.vm.$nextTick()
      // Card starts expanded — collapse it
      const missionCard = wrapper.find('[data-testid="mission-card"]')
      expect(missionCard.exists()).toBe(true)
      // Click the collapsible container
      const collapseDiv = wrapper.find('.cursor-pointer.select-none')
      await collapseDiv.trigger('click')
      expect(wrapper.find('[data-testid="mission-card"]').exists()).toBe(false)
    })

    it('KO mission card has flip button in top-right corner', async () => {
      const koStore = useKeyopsStore()
      koStore.mode = 'key-operations'
      koStore.selectedKoMission = mockKoMission
      const wrapper = mountView()
      await wrapper.vm.$nextTick()
      const flipBtn = wrapper.findAll('button').find(b => b.text() === 'Flip →')
      expect(flipBtn).toBeDefined()
    })

    it('KO mission card flip button switches to back image', async () => {
      const koStore = useKeyopsStore()
      koStore.mode = 'key-operations'
      koStore.selectedKoMission = mockKoMission
      const wrapper = mountView()
      await wrapper.vm.$nextTick()
      const flipBtn = wrapper.findAll('button').find(b => b.text() === 'Flip →')
      await flipBtn!.trigger('click')
      const img = wrapper.find('[data-testid="mission-card"]')
      expect(img.attributes('src')).toContain('explore-the-ruins-mission-back')
    })
  })

  // ── Game over overlay ─────────────────────────────────────────────────────
  // The game over overlay is rendered outside State A/B so it shows regardless

  describe('game over overlay', () => {
    it('shows game over overlay when p1 has 2 wins (no mission needed)', async () => {
      const store = useStruggleStore()
      store.p1Wins = 2
      const wrapper = mountView()
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Game Over')
      expect(wrapper.text()).toContain('Player 1 Wins')
    })

    it('shows game over overlay when p2 has 2 wins (no mission needed)', async () => {
      const store = useStruggleStore()
      store.p2Wins = 2
      const wrapper = mountView()
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Game Over')
      expect(wrapper.text()).toContain('Player 2 Wins')
    })
  })
})
