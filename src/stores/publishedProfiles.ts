import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Character } from '../types/index.ts'
import type { AbilityEntry } from '../composables/useAbilities.ts'
import type { HomebrewProfile } from '../types/index.ts'
import type { PublishCardImages } from '../utils/homebrewToCharacter.ts'
import { homebrewToCharacter, homebrewToAbilityEntry } from '../utils/homebrewToCharacter.ts'

// Negative IDs starting from -1000 to avoid collision with:
// - Official character IDs (positive integers)
// - SHATTERPOINT_ID = -1 used in order deck
let nextId = -1000

export const usePublishedProfilesStore = defineStore(
  'publishedProfiles',
  () => {
    const profiles = ref<Character[]>([])
    const abilities = ref<Record<number, AbilityEntry>>({})
    const visibility = ref<Record<number, boolean>>({})
    // Maps homebrew profile.id (string) → Character.id (number)
    const homebrewIdMap = ref<Record<string, number>>({})

    const visibleProfiles = computed(() =>
      profiles.value.filter(p => visibility.value[p.id] !== false),
    )

    function publish(profile: HomebrewProfile, images: PublishCardImages): Character {
      // Reuse existing ID if already published
      const existingId = homebrewIdMap.value[profile.id]
      if (existingId !== undefined) {
        // Remove old entry to re-publish with fresh images
        unpublish(existingId)
      }

      const id = nextId--
      const character = homebrewToCharacter(profile, id, images)
      const abilityEntry = homebrewToAbilityEntry(profile, id)

      profiles.value.push(character)
      abilities.value[id] = abilityEntry
      visibility.value[id] = true
      homebrewIdMap.value[profile.id] = id

      return character
    }

    function unpublish(characterId: number): void {
      const idx = profiles.value.findIndex(p => p.id === characterId)
      if (idx !== -1) profiles.value.splice(idx, 1)
      delete abilities.value[characterId]
      delete visibility.value[characterId]
      // Remove from homebrewIdMap
      for (const [homebrewId, cId] of Object.entries(homebrewIdMap.value)) {
        if (cId === characterId) {
          delete homebrewIdMap.value[homebrewId]
          break
        }
      }
    }

    function unpublishByHomebrewId(homebrewProfileId: string): void {
      const cId = homebrewIdMap.value[homebrewProfileId]
      if (cId !== undefined) unpublish(cId)
    }

    function setVisibility(characterId: number, visible: boolean): void {
      visibility.value[characterId] = visible
    }

    function isPublished(homebrewProfileId: string): boolean {
      return homebrewProfileId in homebrewIdMap.value
    }

    function isVisible(homebrewProfileId: string): boolean {
      const cId = homebrewIdMap.value[homebrewProfileId]
      if (cId === undefined) return false
      return visibility.value[cId] !== false
    }

    function getPublishedId(homebrewProfileId: string): number | undefined {
      return homebrewIdMap.value[homebrewProfileId]
    }

    return {
      profiles,
      abilities,
      visibility,
      homebrewIdMap,
      visibleProfiles,
      publish,
      unpublish,
      unpublishByHomebrewId,
      setVisibility,
      isPublished,
      isVisible,
      getPublishedId,
    }
  },
  { persist: true },
)
