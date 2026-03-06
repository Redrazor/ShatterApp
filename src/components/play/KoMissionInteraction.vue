<script setup lang="ts">
import { useKeyopsStore } from '../../stores/keyops.ts'
import ExploreTheRuins from './ko/ExploreTheRuins.vue'
import FoilTheHeist from './ko/FoilTheHeist.vue'
import TriggerAChainReaction from './ko/TriggerAChainReaction.vue'
import ExtractTheAgent from './ko/ExtractTheAgent.vue'
import Jailbreak from './ko/Jailbreak.vue'
import CrashLanding from './ko/CrashLanding.vue'

const koStore = useKeyopsStore()
</script>

<template>
  <div v-if="koStore.selectedKoMission">
    <ExploreTheRuins v-if="koStore.selectedKoMission.id === 1" />
    <FoilTheHeist v-else-if="koStore.selectedKoMission.id === 2" />
    <TriggerAChainReaction v-else-if="koStore.selectedKoMission.id === 3" />
    <ExtractTheAgent v-else-if="koStore.selectedKoMission.id === 4" />
    <Jailbreak v-else-if="koStore.selectedKoMission.id === 5" />
    <CrashLanding v-else-if="koStore.selectedKoMission.id === 6" />
  </div>
</template>
