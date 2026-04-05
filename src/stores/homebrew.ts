import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { HomebrewProfile, HomebrewFaction, FrontCardData, StatsData, AbilitiesData, StancesData, StanceData, BuilderPhase, ExpertiseColor, ExpertiseSection, ExpertiseTables } from '../types/index.ts'

export const useHomebrewStore = defineStore(
  'homebrew',
  () => {
    const profiles = ref<HomebrewProfile[]>([])
    const activeProfileId = ref<string | null>(null)
    const combatIconUsage = ref<Record<string, number>>({})

    const activeProfile = computed(() =>
      profiles.value.find(p => p.id === activeProfileId.value) ?? null,
    )

    function addProfile(name?: string): HomebrewProfile {
      const now = new Date().toISOString()
      const profile: HomebrewProfile = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: name || 'New Profile',
        createdAt: now,
        updatedAt: now,
        faction: 'rebel',
        frontCard: null,
        stats: null,
        abilities: null,
        stances: null,
      }
      profiles.value.push(profile)
      activeProfileId.value = profile.id
      return profile
    }

    function deleteProfile(id: string): void {
      const idx = profiles.value.findIndex(p => p.id === id)
      if (idx !== -1) profiles.value.splice(idx, 1)
      if (activeProfileId.value === id) activeProfileId.value = null
    }

    function updateFrontCard(id: string, data: Partial<FrontCardData>): void {
      const profile = profiles.value.find(p => p.id === id)
      if (!profile) return
      if (!profile.frontCard) {
        profile.frontCard = {
          unitType: 'Primary',
          name: '',
          title: '',
          imageData: null,
          imageOffsetX: 0,
          imageOffsetY: 0,
          imageScale: 1,
          cost: 0,
          fp: 0,
          era: '',
          ...data,
        }
      } else {
        Object.assign(profile.frontCard, data)
      }
      // Keep profile name in sync with frontCard name
      if (data.name !== undefined) {
        profile.name = data.name || 'New Profile'
      }
      profile.updatedAt = new Date().toISOString()
    }

    function updateStats(id: string, data: Partial<StatsData>): void {
      const profile = profiles.value.find(p => p.id === id)
      if (!profile) return
      if (!profile.stats) {
        profile.stats = {
          stamina: 4,
          durability: 3,
          tags: [],
          imageOffsetX: 0,
          imageOffsetY: 0,
          imageScale: 1,
          ...data,
        }
      } else {
        Object.assign(profile.stats, data)
      }
      profile.updatedAt = new Date().toISOString()
    }

    function updateAbilities(id: string, data: AbilitiesData): void {
      const profile = profiles.value.find(p => p.id === id)
      if (!profile) return
      profile.abilities = data
      profile.updatedAt = new Date().toISOString()
    }

    function isAbilitiesComplete(profile: HomebrewProfile): boolean {
      return profile.abilities !== null && (profile.abilities?.blocks?.length ?? 0) > 0
    }

    function blankExpertiseSection(color: ExpertiseColor): ExpertiseSection {
      return {
        color,
        entries: [
          { from: 1, to: 2, isPlus: false, icons: [] },
          { from: 3, to: 3, isPlus: false, icons: [] },
          { from: 4, to: null, isPlus: true,  icons: [] },
        ],
      }
    }

    function blankExpertiseTables(): ExpertiseTables {
      return {
        ranged:  blankExpertiseSection('blue'),
        melee:   blankExpertiseSection('red'),
        defense: blankExpertiseSection('grey'),
      }
    }

    function trackIconUsage(iconFile: string): void {
      combatIconUsage.value[iconFile] = (combatIconUsage.value[iconFile] ?? 0) + 1
    }

    const BLANK_STANCE: StanceData = {
      title: '', range: 0, rangeAttack: 0, rangeDefense: 0, meleeAttack: 0, meleeDefense: 0,
      rangedWeapon: '', meleeWeapon: '', defensiveEquipment: '',
      expertise: null,
      combatTree: null,
    }

    function initStances(id: string): void {
      const profile = profiles.value.find(p => p.id === id)
      if (!profile || profile.stances) return
      const isPrimary = profile.frontCard?.unitType === 'Primary'
      const expertise = blankExpertiseTables()
      profile.stances = {
        stance1: { ...BLANK_STANCE, expertise: JSON.parse(JSON.stringify(expertise)) },
        stance2: isPrimary ? { ...BLANK_STANCE, expertise: JSON.parse(JSON.stringify(expertise)) } : null,
        portraitOffsetX: 0,
        portraitOffsetY: 0,
        portraitScale: 1.0,
      }
      profile.updatedAt = new Date().toISOString()
    }

    function updateStance(id: string, which: 1 | 2, patch: Partial<StanceData>): void {
      const profile = profiles.value.find(p => p.id === id)
      if (!profile?.stances) return
      const key = which === 1 ? 'stance1' : 'stance2'
      if (which === 2 && profile.stances.stance2 === null) return
      profile.stances[key] = { ...(profile.stances[key] ?? BLANK_STANCE), ...patch }
      profile.updatedAt = new Date().toISOString()
    }

    function isStancesComplete(profile: HomebrewProfile): boolean {
      if (!profile.stances) return false
      const s1 = profile.stances.stance1
      const s1ok = s1.title.trim().length > 0
      if (!s1ok) return false
      if (profile.stances.stance2 !== null) {
        return profile.stances.stance2.title.trim().length > 0
      }
      return true
    }

    function resetPhase(id: string, phase: BuilderPhase): void {
      const profile = profiles.value.find(p => p.id === id)
      if (!profile) return
      if (phase === 1) profile.frontCard = null
      if (phase === 2) profile.stats = null
      if (phase === 3) profile.abilities = null
      if (phase === 4) profile.stances = null
      profile.updatedAt = new Date().toISOString()
    }

    function isStatsComplete(profile: HomebrewProfile): boolean {
      return profile.stats !== null
    }

    function allTags(excludeId?: string): string[] {
      const set = new Set<string>()
      for (const p of profiles.value) {
        if (p.id === excludeId) continue
        for (const tag of p.stats?.tags ?? []) set.add(tag)
      }
      return [...set].sort()
    }

    function setFaction(id: string, faction: HomebrewFaction): void {
      const profile = profiles.value.find(p => p.id === id)
      if (!profile) return
      profile.faction = faction
      profile.updatedAt = new Date().toISOString()
    }

    function resetAll(id: string): void {
      const profile = profiles.value.find(p => p.id === id)
      if (!profile) return
      profile.faction = 'rebel'
      profile.frontCard = null
      profile.stats = null
      profile.abilities = null
      profile.stances = null
      profile.name = 'New Profile'
      profile.updatedAt = new Date().toISOString()
    }

    function updateStances(id: string, data: Partial<StancesData>): void {
      const profile = profiles.value.find(p => p.id === id)
      if (!profile) return
      profile.stances = { ...(profile.stances ?? { stance1: { ...BLANK_STANCE }, stance2: null, portraitOffsetX: 0, portraitOffsetY: 0, portraitScale: 1.0 }), ...data }
      profile.updatedAt = new Date().toISOString()
    }

    function setActiveProfile(id: string | null): void {
      activeProfileId.value = id
    }

function isFrontCardComplete(profile: HomebrewProfile): boolean {
      const fc = profile.frontCard
      if (!fc) return false
      return (
        !!fc.unitType &&
        fc.name.trim().length > 0 &&
        fc.cost >= 0 &&
        fc.fp >= 0 &&
        fc.era.trim().length > 0
      )
    }

    function getProfileStatus(profile: HomebrewProfile): 'empty' | 'draft' | 'complete' {
      const hasAnyData = !!profile.frontCard
      if (!hasAnyData) return 'empty'
      if (
        isFrontCardComplete(profile) &&
        isStatsComplete(profile) &&
        isAbilitiesComplete(profile) &&
        isStancesComplete(profile)
      ) return 'complete'
      return 'draft'
    }

    return {
      profiles,
      activeProfileId,
      activeProfile,
      combatIconUsage,
      trackIconUsage,
      addProfile,
      deleteProfile,
      setFaction,
      updateFrontCard,
      updateStats,
      updateAbilities,
      initStances,
      updateStance,
      updateStances,
      resetPhase,
      resetAll,
      setActiveProfile,
      isFrontCardComplete,
      isStatsComplete,
      isAbilitiesComplete,
      isStancesComplete,
      getProfileStatus,
      allTags,
    }
  },
  { persist: true },
)
