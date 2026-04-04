import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { HomebrewProfile, FrontCardData, StatsData, AbilitiesData, BuilderPhase } from '../types/index.ts'

export const useHomebrewStore = defineStore(
  'homebrew',
  () => {
    const profiles = ref<HomebrewProfile[]>([])
    const activeProfileId = ref<string | null>(null)

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

    function resetPhase(id: string, phase: BuilderPhase): void {
      const profile = profiles.value.find(p => p.id === id)
      if (!profile) return
      if (phase === 1) profile.frontCard = null
      if (phase === 2) profile.stats = null
      if (phase === 3) profile.abilities = null
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

    function resetAll(id: string): void {
      const profile = profiles.value.find(p => p.id === id)
      if (!profile) return
      profile.frontCard = null
      profile.stats = null
      profile.abilities = null
      profile.stances = null
      profile.name = 'New Profile'
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
      // Complete = all implemented phases done (1, 2, 3)
      if (isFrontCardComplete(profile) && isStatsComplete(profile) && isAbilitiesComplete(profile)) return 'complete'
      return 'draft'
    }

    return {
      profiles,
      activeProfileId,
      activeProfile,
      addProfile,
      deleteProfile,
      updateFrontCard,
      updateStats,
      updateAbilities,
      resetPhase,
      resetAll,
      setActiveProfile,
      isFrontCardComplete,
      isStatsComplete,
      isAbilitiesComplete,
      getProfileStatus,
      allTags,
    }
  },
  { persist: true },
)
