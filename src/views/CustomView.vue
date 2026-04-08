<script setup lang="ts">
import { ref } from 'vue'
import { useHead } from '@vueuse/head'
import { useHomebrewStore } from '../stores/homebrew.ts'
import { usePublishedProfilesStore } from '../stores/publishedProfiles.ts'
import CustomProfileCard from '../components/custom/CustomProfileCard.vue'
import CustomBuilder from '../components/custom/CustomBuilder.vue'
import ProfileVisualModal from '../components/custom/ProfileVisualModal.vue'
import type { HomebrewProfile } from '../types/index.ts'
import type { CardImages } from '../components/custom/ProfileVisualModal.vue'
import { generateProfilePdf } from '../utils/generateProfilePdf.ts'

const homebrewStore = useHomebrewStore()
const publishedStore = usePublishedProfilesStore()

const builderMode = ref(false)
const visualProfile = ref<HomebrewProfile | null>(null)

function handleCreate() {
  homebrewStore.addProfile()
  builderMode.value = true
}

function handleLoad(id: string) {
  homebrewStore.setActiveProfile(id)
  builderMode.value = true
}

function handleVisualize(profile: HomebrewProfile) {
  visualProfile.value = profile
}

async function handlePdf(cards: CardImages) {
  await generateProfilePdf(visualProfile.value?.name ?? 'custom-profile', cards)
}

function handlePublish(cards: CardImages) {
  if (!visualProfile.value) return
  publishedStore.publish(visualProfile.value, {
    front: cards.front,
    abilities: cards.abilities,
    stance1: cards.stance1,
    stance2: cards.stance2,
    orderFront: cards.orderFront,
    thumbnail: cards.thumbnail,
  })
  visualProfile.value = null
}

function handleUnpublish(homebrewProfileId: string) {
  publishedStore.unpublishByHomebrewId(homebrewProfileId)
}

function handleToggleVisibility(homebrewProfileId: string) {
  const cId = publishedStore.getPublishedId(homebrewProfileId)
  if (cId === undefined) return
  const current = publishedStore.visibility[cId] !== false
  publishedStore.setVisibility(cId, !current)
}

function handleDelete(id: string) {
  publishedStore.unpublishByHomebrewId(id)
  homebrewStore.deleteProfile(id)
}

function handleBack() {
  builderMode.value = false
  homebrewStore.setActiveProfile(null)
}

function handleSaved() {
  builderMode.value = false
  homebrewStore.setActiveProfile(null)
}

useHead({
  title: 'Custom — ShatterApp',
  meta: [
    { name: 'description', content: 'Create and manage custom Shatterpoint unit profiles.' },
    { property: 'og:title', content: 'Custom — ShatterApp' },
    { property: 'og:description', content: 'Create and manage custom Shatterpoint unit profiles.' },
  ],
  link: [{ rel: 'canonical', href: 'https://shatterapp.com/custom' }],
})
</script>

<template>
  <div class="px-4 py-6 space-y-6">

    <!-- Builder mode -->
    <template v-if="builderMode && homebrewStore.activeProfileId">
      <CustomBuilder
        :profile-id="homebrewStore.activeProfileId"
        @back="handleBack"
        @saved="handleSaved"
      />
    </template>

    <!-- List mode -->
    <template v-else>
      <h1 class="text-2xl font-bold text-sw-gold">Custom Profiles</h1>

      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-sw-text/50 uppercase tracking-wider">Saved Profiles</h2>
        <p v-if="homebrewStore.profiles.length === 0" class="text-sw-text/50 text-sm">
          No custom profiles yet.
        </p>
        <CustomProfileCard
          v-for="profile in homebrewStore.profiles"
          :key="profile.id"
          :profile="profile"
          :status="homebrewStore.getProfileStatus(profile)"
          :published="publishedStore.isPublished(profile.id)"
          :visible="publishedStore.isVisible(profile.id)"
          @load="handleLoad(profile.id)"
          @visualize="handleVisualize(profile)"
          @unpublish="handleUnpublish(profile.id)"
          @toggle-visibility="handleToggleVisibility(profile.id)"
          @delete="handleDelete(profile.id)"
        />
      </section>

      <div class="flex justify-center">
        <button
          class="rounded-xl px-5 py-2.5 text-sm font-semibold bg-sw-gold text-sw-bg hover:opacity-90 transition-opacity"
          @click="handleCreate"
        >
          + Create Custom Profile
        </button>
      </div>
    </template>

    <!-- Visualization modal -->
    <ProfileVisualModal
      v-if="visualProfile"
      :profile="visualProfile"
      :faction="visualProfile.faction"
      @close="visualProfile = null"
      @pdf="handlePdf"
      @publish="handlePublish"
    />

  </div>
</template>
