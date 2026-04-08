<script setup lang="ts">
import type { CardImages } from './ProfileVisualModal.vue'

defineProps<{
  cards: CardImages
  name: string
}>()
</script>

<template>
  <div class="profile-print-layout">
    <!-- Page 1: Front + Abilities -->
    <div class="print-page">
      <div class="print-page-content print-page-1">
        <img :src="cards.front" alt="Front card" class="print-card-front" />
        <img :src="cards.abilities" alt="Abilities card" class="print-card-abilities" />
      </div>
    </div>

    <!-- Page 2: Stance(s) -->
    <div class="print-page">
      <div class="print-page-content print-page-2">
        <img :src="cards.stance1" alt="Stance 1" class="print-card-stance" />
        <img v-if="cards.stance2" :src="cards.stance2" alt="Stance 2" class="print-card-stance" />
      </div>
    </div>

    <!-- Page 3: Order Card front + back -->
    <div class="print-page print-page-last">
      <div class="print-page-content print-page-3">
        <img :src="cards.orderFront" alt="Order card" class="print-card-order" />
        <img :src="cards.orderBack" alt="Order card back" class="print-card-order" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-print-layout {
  display: none;
}

.print-page-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 100%;
  padding: 10mm;
  box-sizing: border-box;
}

.print-page-1 {
  align-items: flex-start;
}

.print-card-front {
  width: 63mm;
  height: auto;
}

.print-card-abilities {
  width: 95mm;
  height: auto;
}

.print-card-stance {
  width: 95mm;
  height: auto;
}

.print-card-order {
  width: 63mm;
  height: auto;
}

@media print {
  .profile-print-layout {
    display: block !important;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 9999;
    background: white;
  }

  .print-page {
    page-break-after: always;
    width: 100%;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .print-page-last {
    page-break-after: auto;
  }
}
</style>
