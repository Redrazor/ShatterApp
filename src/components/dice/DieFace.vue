<script setup lang="ts">
import type { DieType, AttackFace, DefenseFace } from '../../utils/dice.ts'

const props = defineProps<{
  type: DieType
  face: AttackFace | DefenseFace
  size?: number
}>()

const bg = props.type === 'attack' ? '#6b7280' : '#1d4ed8'
</script>

<template>
  <svg
    :width="size ?? 64"
    :height="size ?? 64"
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Die body: tall diamond/hexagon for attack d8, rounded square for defense d6 -->
    <polygon
      v-if="type === 'attack'"
      points="32,2 60,16 60,48 32,62 4,48 4,16"
      :fill="bg"
      stroke="rgba(255,255,255,0.3)"
      stroke-width="1.5"
    />
    <rect
      v-else
      x="3" y="3" width="58" height="58" rx="10"
      :fill="bg"
      stroke="rgba(255,255,255,0.3)"
      stroke-width="1.5"
    />

    <!-- ── CRIT: 8-pointed star inside a circle ring ── -->
    <g v-if="face === 'crit'">
      <!-- circle ring -->
      <circle cx="32" cy="32" r="19" fill="none" stroke="white" stroke-width="2.5"/>
      <!-- 8-pointed star (outer r=15, inner r=6) -->
      <polygon
        points="32,17 34.3,26.5 42.6,21.4 37.5,29.7 47,32 37.5,34.3 42.6,42.6 34.3,37.5 32,47 29.7,37.5 21.4,42.6 26.5,34.3 17,32 26.5,29.7 21.4,21.4 29.7,26.5"
        fill="white"
      />
    </g>

    <!-- ── STRIKE: plain 8-pointed star, no circle ── -->
    <g v-else-if="face === 'strike'">
      <!-- 8-pointed star (outer r=19, inner r=8) -->
      <polygon
        points="32,13 35,25.5 43.4,18.6 38.5,28.5 51,32 38.5,35.5 43.4,45.4 35,38.5 32,51 29,38.5 20.6,45.4 25.5,35.5 13,32 25.5,28.5 20.6,18.6 29,25.5"
        fill="white"
      />
    </g>

    <!-- ── EXPERTISE: outer diamond outline + small inner diamond ── -->
    <g v-else-if="face === 'expertise'">
      <!-- outer diamond (filled white) -->
      <polygon points="32,9 55,32 32,55 9,32" fill="white"/>
      <!-- middle cutout (die color) -->
      <polygon points="32,17 47,32 32,47 17,32" :fill="bg"/>
      <!-- small center diamond (filled white) -->
      <polygon points="32,23 41,32 32,41 23,32" fill="white"/>
    </g>

    <!-- ── FAILURE: broken bowtie — two wings with jagged center crack ── -->
    <g v-else-if="face === 'failure'">
      <!-- left wing -->
      <polygon points="12,18 28,27 26,32 28,37 12,46 19,32" fill="white"/>
      <!-- right wing -->
      <polygon points="52,18 36,27 38,32 36,37 52,46 45,32" fill="white"/>
      <!-- jagged crack (die color over the centre gap) -->
      <polygon points="28,27 30,30 28,32 31,35 29,37 36,37 34,35 36,32 33,30 36,27"
        :fill="bg"/>
    </g>

    <!-- ── BLOCK (defense only): crosshair bullseye ── -->
    <g v-else-if="face === 'block'">
      <!-- white filled circle -->
      <circle cx="32" cy="32" r="22" fill="white"/>
      <!-- crosshair lines (die color cuts through circle) -->
      <rect x="29.5" y="10" width="5" height="44" :fill="bg"/>
      <rect x="10" y="29.5" width="44" height="5" :fill="bg"/>
      <!-- inner bullseye ring -->
      <circle cx="32" cy="32" r="10" :fill="bg"/>
      <circle cx="32" cy="32" r="6" fill="white"/>
    </g>
  </svg>
</template>
