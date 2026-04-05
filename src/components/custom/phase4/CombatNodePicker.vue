<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'

// Icons that have no _orange_bg variant — fall back to plain .png for starting nodes
const NO_ORANGE_BG = new Set(['22_SHV_DMG_DMG', '43_PIN_SHV'])

// Icons whose plain .png has an orange background — use _white_bg.png for c2+ columns
const USE_WHITE_BG = new Set(['09_DMG_DMG', '22_SHV_DMG_DMG', '43_PIN_SHV', '61_SHV_HEA_HEA_HEA', '70_SHV_DASH'])

// All known base icon names in numeric order
const ALL_ICONS = [
  '01_DMG', '02_STR', '03_SHV', '04_REP', '05_EXP', '06_ADV', '08_ACT',
  '09_DMG_DMG', '10_STR_DMG', '11_SHV_DMG', '12_REP_DMG', '13_EXP_DMG',
  '14_PIN_DMG', '15_DIS_DMG', '16_HEA_DMG', '17_JMP_DMG', '18_ADV_DMG',
  '19_HEA_HEA', '20_PIN_HEA', '21_DMG_DMG_DMG', '22_SHV_DMG_DMG',
  '23_REP_HEA', '24_REP_DMG_DMG', '25_SHV_ADV', '26_DMG_HEA_HEA',
  '27_HEA_DMG_DMG', '28_JMP_DMG_DMG', '30_DIS_DMG_DMG', '35_PIN',
  '36_REP_HEA_HEA_HEA', '37_EXP_DMG_DMG', '38_PIN_DMG_DMG', '39_REP_HEA_HEA',
  '40_ADV_DMG_HEA', '41_EXP_STR', '42_STR_DMG_DMG', '43_PIN_SHV',
  '44_SHV_HEA', '45_SHV_HEA_HEA', '46_HEA_HEA_HEA', '47_JMP_HEA',
  '48_SHV_SHV', '49_DMG_DMG_DMG_DMG', '50_HEA', '51_SHV_DMG_DMG_DMG',
  '52_HEA_HEA_DMG', '53_JMP_DMG_DMG_DMG', '54_CLM_DMG_DMG', '55_SHV_JMP_DMG',
  '56_PIN_SHV_DMG', '57_STR_PIN', '58_REP_HEA_HEA', '59_SHV_STR_DMG',
  '60_ADV_DMG_DMG', '61_SHV_HEA_HEA_HEA', '62_HEA_DMG_DMG_DMG',
  '63_HEA_HEA_HEA_DMG', '64_HEA', '65_CLM', '67_DASH_DMG', '68_ACT_HEA_DMG',
  '69_DASH', '70_SHV_DASH', '71_DMG_HEA_HEA', '73_REP_DMG_HEA',
]

const props = defineProps<{
  modelValue: string | null
  isStartingNode: boolean
  iconUsage: Record<string, number>
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const dropdownRef = ref<HTMLDivElement | null>(null)
const dropdownStyle = ref({ top: '0px', left: '0px' })

function iconFilename(base: string): string {
  if (props.isStartingNode) {
    return NO_ORANGE_BG.has(base) ? `${base}.png` : `${base}_orange_bg.png`
  }
  return USE_WHITE_BG.has(base) ? `${base}_white_bg.png` : `${base}.png`
}

function iconPath(base: string): string {
  return `/images/combat_tree_icons/crops/${iconFilename(base)}`
}

const sortedIcons = computed(() => {
  const usage = props.iconUsage
  return [...ALL_ICONS].sort((a, b) => {
    const fa = iconFilename(a)
    const fb = iconFilename(b)
    return (usage[fb] ?? 0) - (usage[fa] ?? 0)
  })
})

const filteredIcons = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return sortedIcons.value
  return sortedIcons.value.filter(name =>
    name.toLowerCase().includes(q) ||
    name.replace(/_/g, ' ').toLowerCase().includes(q)
  )
})

// The current base name (reverse-lookup from modelValue)
const currentBase = computed(() => {
  if (!props.modelValue) return null
  // Strip suffix to find base
  const v = props.modelValue.replace('_orange_bg.png', '').replace('_white_bg.png', '').replace('.png', '')
  return v || null
})

async function openDropdown() {
  if (props.disabled) return
  if (triggerRef.value) {
    const rect = triggerRef.value.getBoundingClientRect()
    dropdownStyle.value = {
      top: `${rect.bottom + 6}px`,
      left: `${rect.left}px`,
    }
  }
  isOpen.value = true
  searchQuery.value = ''
  window.addEventListener('scroll', onWindowScroll, { capture: true, passive: true })
  await nextTick()
  searchInput.value?.focus()
}

function onWindowScroll(e: Event) {
  // Ignore scrolls that happen inside the dropdown itself
  if (dropdownRef.value && e.target instanceof Node && dropdownRef.value.contains(e.target)) return
  closeDropdown()
}

function closeDropdown() {
  if (!isOpen.value) return
  isOpen.value = false
  searchQuery.value = ''
  window.removeEventListener('scroll', onWindowScroll, { capture: true })
}

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onWindowScroll, { capture: true })
})

function selectIcon(base: string) {
  emit('update:modelValue', iconFilename(base))
  closeDropdown()
}
</script>

<template>
  <div class="relative">
    <!-- Trigger button -->
    <button
      ref="triggerRef"
      type="button"
      :disabled="disabled"
      class="w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all"
      :class="modelValue
        ? 'border-white/30 bg-white/5 hover:border-white/50'
        : 'border-dashed border-white/20 bg-white/5 hover:border-sw-gold/50 hover:bg-sw-gold/5'"
      @click="openDropdown"
    >
      <img
        v-if="modelValue"
        :src="`/images/combat_tree_icons/crops/${modelValue}`"
        class="w-10 h-10 object-contain"
        alt=""
      />
      <span v-else class="text-white/30 text-lg leading-none">+</span>
    </button>

    <!-- Teleport dropdown to body to escape overflow clipping -->
    <Teleport to="body">
      <!-- Backdrop -->
      <div
        v-if="isOpen"
        class="fixed inset-0 z-40"
        @click="closeDropdown"
      />

      <!-- Dropdown -->
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="fixed z-50 w-72 rounded-xl border border-white/10 bg-sw-dark shadow-2xl overflow-hidden"
        :style="dropdownStyle"
      >
        <!-- Search -->
        <div class="p-2 border-b border-white/10">
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="Search icons…"
            class="w-full rounded-lg bg-sw-card border border-white/10 px-3 py-1.5 text-xs text-sw-text placeholder:text-sw-text/30 focus:outline-none focus:border-sw-gold/40"
          />
        </div>

        <!-- Icon grid -->
        <div class="p-2 grid grid-cols-5 gap-1 max-h-64 overflow-y-auto">
          <button
            v-for="base in filteredIcons"
            :key="base"
            type="button"
            :title="base.replace(/_/g, ' ')"
            class="w-11 h-11 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
            :class="currentBase === base ? 'ring-2 ring-sw-gold bg-sw-gold/10' : ''"
            @click="selectIcon(base)"
          >
            <img
              :src="iconPath(base)"
              class="w-9 h-9 object-contain"
              alt=""
            />
          </button>
          <p v-if="filteredIcons.length === 0" class="col-span-5 text-center text-xs text-sw-text/30 py-4">
            No icons match "{{ searchQuery }}"
          </p>
        </div>
      </div>
    </Teleport>
  </div>
</template>
