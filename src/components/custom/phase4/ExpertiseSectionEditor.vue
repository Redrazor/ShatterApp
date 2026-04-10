<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ExpertiseSection, ExpertiseEntry, ExpertiseColor } from '../../../types/index.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'

const props = defineProps<{
  section: ExpertiseSection
  sectionLabel: string
}>()

const emit = defineEmits<{
  update: [section: ExpertiseSection]
}>()

// ─── Icon catalog ─────────────────────────────────────────────────────────────
// Top 3 (normal crit / hit / block — the non-_to versions)
const TOP3_ICONS = [
  'critical_crop.png',
  'strike_crop.png',
  'block_crop.png',
]

// Common gameplay icons
const COMMON_ICONS = [
  'damage_crop.png',
  'heal_crop.png',
  'dash_crop.png',
  'reposition_crop.png',
  'advance_crop.png',
  'jump_crop.png',
  'climb_crop.png',
]

// Everything else, alphabetical
const REST_ICONS = [
  'active_crop.png',
  'attack_expertise_crop.png',
  'character_crop.png',
  'defense_expertise_crop.png',
  'disarmed_crop.png',
  'dmg.png',
  'exposed_crop.png',
  'fail.png',
  'failure_crop.png',
  'force_crop.png',
  'hunker_crop.png',
  'identity_crop.png',
  'innate_crop.png',
  'melee_crop.png',
  'pinned_crop.png',
  'range_crop.png',
  'ranged_crop.png',
  'reactive_crop.png',
  'shove_crop.png',
  'strained_crop.png',
  'tactic_crop.png',
]

// Die-result icons — visually distinct section, feature TBD
const TO_ICONS = [
  'crit_to.png',
  'hit_to.png',
  'block_to.png',
]

function iconPath(file: string): string {
  return imageUrl(`/images/abilities_iconography/${file}`)
}

function iconLabel(file: string): string {
  return file.replace('_crop.png', '').replace('_to.png', '').replace('.png', '').replace(/_/g, ' ')
}

// ─── Color palette ────────────────────────────────────────────────────────────
const COLOR_OPTIONS: { key: ExpertiseColor; label: string; shades: string[] }[] = [
  { key: 'blue',   label: 'Blue',   shades: ['#7ab0d4', '#4d8cb8', '#2a6a9c', '#0d4a80'] },
  { key: 'red',    label: 'Red',    shades: ['#d47a7a', '#b85252', '#9c2e2e', '#800a0a'] },
  { key: 'purple', label: 'Purple', shades: ['#a07ad4', '#7e52b8', '#5e2e9c', '#3e0a80'] },
  { key: 'grey',   label: 'Grey',   shades: ['#a8a8a8', '#888888', '#686868', '#484848'] },
]

const currentColorOption = computed(() =>
  COLOR_OPTIONS.find(c => c.key === props.section.color) ?? COLOR_OPTIONS[0]
)

function shade(entryIndex: number): string {
  return currentColorOption.value.shades[entryIndex] ?? currentColorOption.value.shades[3]
}

// ─── Threshold badge ──────────────────────────────────────────────────────────
function thresholdBadge(entry: ExpertiseEntry): string {
  if (entry.isPlus) return `${entry.from}+`
  if (entry.to === null || entry.from === entry.to) return String(entry.from)
  return `${entry.from}–${entry.to}`
}

// ─── Icon picker ──────────────────────────────────────────────────────────────
const pickerOpenFor = ref<number | null>(null)

function togglePicker(entryIdx: number) {
  pickerOpenFor.value = pickerOpenFor.value === entryIdx ? null : entryIdx
}

function closePicker() {
  pickerOpenFor.value = null
}

// ─── Drag-and-drop state ──────────────────────────────────────────────────────
const dragFrom = ref<{ entry: number; icon: number } | null>(null)
const dragOverIdx = ref<number | null>(null)

function onDragStart(entryIdx: number, iconIdx: number) {
  dragFrom.value = { entry: entryIdx, icon: iconIdx }
}

function onDragOver(iconIdx: number) {
  dragOverIdx.value = iconIdx
}

function onDrop(entryIdx: number, toIdx: number) {
  if (!dragFrom.value || dragFrom.value.entry !== entryIdx) return
  const fromIdx = dragFrom.value.icon
  if (fromIdx === toIdx) return
  const s = cloneSection()
  const icons = s.entries[entryIdx].icons
  const [moved] = icons.splice(fromIdx, 1)
  icons.splice(toIdx, 0, moved)
  emit('update', s)
  dragFrom.value = null
  dragOverIdx.value = null
}

function onDragEnd() {
  dragFrom.value = null
  dragOverIdx.value = null
}

// ─── Mutations ────────────────────────────────────────────────────────────────
function cloneSection(): ExpertiseSection {
  return JSON.parse(JSON.stringify(props.section))
}

function setColor(color: ExpertiseColor) {
  const s = cloneSection()
  s.color = color
  emit('update', s)
}

function toggleHidden() {
  const s = cloneSection()
  s.hidden = !s.hidden
  emit('update', s)
}

function updateEntryField(
  entryIdx: number,
  field: 'from' | 'to' | 'isPlus',
  value: number | boolean | null,
) {
  const s = cloneSection()
  const e = s.entries[entryIdx]
  if (field === 'from')   e.from   = value as number
  if (field === 'to')     e.to     = value as number | null
  if (field === 'isPlus') {
    e.isPlus = value as boolean
    if (e.isPlus) e.to = null
  }
  emit('update', s)
}

function addEntry() {
  if (props.section.entries.length >= 4) return
  const s = cloneSection()
  const last = s.entries[s.entries.length - 1]
  const nextFrom = (last?.from ?? 0) + 1
  s.entries.push({ from: nextFrom, to: null, isPlus: true, icons: [] })
  emit('update', s)
}

function deleteEntry(entryIdx: number) {
  if (props.section.entries.length <= 1) return
  const s = cloneSection()
  s.entries.splice(entryIdx, 1)
  emit('update', s)
  if (pickerOpenFor.value === entryIdx) pickerOpenFor.value = null
}

function addIcon(entryIdx: number, iconFile: string) {
  const s = cloneSection()
  s.entries[entryIdx].icons.push({ iconFile })
  emit('update', s)
  pickerOpenFor.value = null
}

function removeIcon(entryIdx: number, iconIdx: number) {
  const s = cloneSection()
  s.entries[entryIdx].icons.splice(iconIdx, 1)
  emit('update', s)
}

function numInput(val: string, min = 1): number {
  const n = parseInt(val, 10)
  return isNaN(n) ? min : Math.max(min, n)
}
</script>

<template>
  <div
    class="relative rounded-2xl border border-sw-gold/20 bg-sw-card/60 p-4 space-y-4"
    :class="pickerOpenFor !== null ? 'z-10' : 'z-0'"
  >

    <!-- Header: hide checkbox + label + color swatches -->
    <div class="flex items-center gap-3">
      <label class="flex items-center gap-1.5 cursor-pointer select-none shrink-0" title="Suppress this column on the card">
        <input
          type="checkbox"
          class="w-3.5 h-3.5 accent-sw-gold"
          :checked="section.hidden ?? false"
          @change="toggleHidden"
        />
        <span class="text-xs text-sw-text/40 hover:text-sw-text/60 transition-colors">Hide</span>
      </label>

      <p
        class="text-xs font-bold uppercase tracking-widest flex-1 transition-colors"
        :class="section.hidden ? 'text-sw-text/25 line-through' : 'text-sw-gold/60'"
      >
        {{ sectionLabel }}
      </p>

      <div class="flex gap-2" :class="section.hidden ? 'opacity-30 pointer-events-none' : ''">
        <button
          v-for="opt in COLOR_OPTIONS"
          :key="opt.key"
          type="button"
          :title="opt.label"
          class="w-6 h-6 rounded-full transition-all"
          :style="{ background: opt.shades[1] }"
          :class="section.color === opt.key
            ? 'ring-2 ring-sw-gold ring-offset-1 ring-offset-sw-dark scale-110'
            : 'opacity-60 hover:opacity-90'"
          @click="setColor(opt.key)"
        />
      </div>
    </div>

    <!-- Entry rows -->
    <div class="space-y-3" :class="section.hidden ? 'opacity-30 pointer-events-none' : ''">
      <div
        v-for="(entry, eIdx) in section.entries"
        :key="eIdx"
        class="rounded-xl border border-white/10"
      >
        <!-- Coloured header band -->
        <div
          class="flex items-center gap-3 px-3 py-2 rounded-t-xl"
          :style="{ background: shade(eIdx) }"
        >
          <span class="text-xs font-bold text-white/90 min-w-[2.5rem] text-center bg-black/20 rounded px-1.5 py-0.5">
            {{ thresholdBadge(entry) }}
          </span>

          <div class="flex items-center gap-1.5 text-white/80 text-xs">
            <input
              type="number" min="1" :value="entry.from"
              class="w-12 rounded bg-black/25 border border-white/20 text-center text-xs text-white py-0.5 focus:outline-none focus:border-white/50"
              @change="updateEntryField(eIdx, 'from', numInput(($event.target as HTMLInputElement).value))"
            />
            <span v-if="!entry.isPlus" class="select-none">–</span>
            <input
              v-if="!entry.isPlus"
              type="number" :min="entry.from + 1" :value="entry.to ?? entry.from"
              class="w-12 rounded bg-black/25 border border-white/20 text-center text-xs text-white py-0.5 focus:outline-none focus:border-white/50"
              @change="updateEntryField(eIdx, 'to', numInput(($event.target as HTMLInputElement).value, entry.from))"
            />
          </div>

          <label class="flex items-center gap-1 text-white/70 text-xs cursor-pointer select-none ml-1">
            <input
              type="checkbox" class="accent-white w-3 h-3"
              :checked="entry.isPlus"
              @change="updateEntryField(eIdx, 'isPlus', ($event.target as HTMLInputElement).checked)"
            />
            <span>+</span>
          </label>

          <div class="flex-1" />

          <button
            v-if="section.entries.length > 1"
            type="button"
            class="text-white/50 hover:text-white/90 transition-colors text-xs px-1"
            title="Remove entry"
            @click="deleteEntry(eIdx)"
          >✕</button>
        </div>

        <!-- Icon pills + add button -->
        <div class="bg-sw-dark/60 px-3 py-2 rounded-b-xl">
          <div class="flex flex-wrap gap-1.5 min-h-[28px] items-center">
            <!-- Draggable icon pills -->
            <template v-for="(icon, iIdx) in entry.icons" :key="iIdx">
              <!-- Tight "→" connector between a _to icon and the icon that follows it -->
              <span
                v-if="iIdx > 0 && entry.icons[iIdx - 1].iconFile.includes('_to')"
                class="text-sw-gold/70 text-[11px] font-bold -mx-0.5 select-none pointer-events-none"
              >→</span>
              <div
                draggable="true"
                class="relative flex items-center justify-center rounded-lg bg-sw-card border transition-all cursor-grab active:cursor-grabbing select-none"
                :class="[
                  dragOverIdx === iIdx && dragFrom?.entry === eIdx && dragFrom?.icon !== iIdx
                    ? 'border-sw-gold/60 scale-105'
                    : 'border-sw-gold/20',
                ]"
                style="padding: 4px; width: 36px; height: 36px;"
                :title="iconLabel(icon.iconFile)"
                @dragstart="onDragStart(eIdx, iIdx)"
                @dragover.prevent="onDragOver(iIdx)"
                @drop.prevent="onDrop(eIdx, iIdx)"
                @dragend="onDragEnd"
              >
                <img
                  :src="iconPath(icon.iconFile)"
                  :alt="iconLabel(icon.iconFile)"
                  class="w-full h-full object-contain pointer-events-none"
                />
                <!-- Persistent delete badge (visible on all devices) -->
                <button
                  type="button"
                  class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-sw-dark border border-white/20 text-sw-text/50 hover:text-red-400 hover:border-red-400/50 text-[9px] leading-none flex items-center justify-center transition-colors z-10 touch-manipulation"
                  :title="`Remove ${iconLabel(icon.iconFile)}`"
                  @click.stop="removeIcon(eIdx, iIdx)"
                >×</button>
              </div>
            </template>

            <!-- Add icon button -->
            <div class="relative">
              <button
                type="button"
                class="w-9 h-9 flex items-center justify-center rounded-lg border border-dashed border-sw-gold/30 text-sw-gold/50 hover:border-sw-gold/60 hover:text-sw-gold transition-colors text-lg leading-none"
                title="Add icon"
                @click="togglePicker(eIdx)"
              >+</button>

              <!-- Picker dropdown -->
              <div
                v-if="pickerOpenFor === eIdx"
                class="absolute left-0 top-full mt-1 z-20 rounded-xl border border-sw-gold/20 bg-sw-dark shadow-xl p-3 w-80"
              >
                <div class="flex items-center justify-between mb-2">
                  <p class="text-[10px] text-sw-text/40 uppercase tracking-wider">Pick an icon</p>
                  <button type="button" class="text-sw-text/30 hover:text-sw-text/70 text-xs" @click="closePicker">✕</button>
                </div>

                <div class="max-h-72 overflow-y-auto space-y-2">
                  <!-- Top 3: normal crit / hit / block -->
                  <div class="grid grid-cols-5 gap-2">
                    <button
                      v-for="file in TOP3_ICONS" :key="file" type="button" :title="iconLabel(file)"
                      class="w-full aspect-square flex items-center justify-center rounded-lg bg-sw-card hover:bg-sw-gold/10 border border-transparent hover:border-sw-gold/30 transition-colors p-1.5"
                      @click="addIcon(eIdx, file)"
                    >
                      <img :src="iconPath(file)" :alt="iconLabel(file)" class="w-full h-full object-contain" />
                    </button>
                  </div>

                  <!-- Common gameplay icons -->
                  <div class="grid grid-cols-5 gap-2">
                    <button
                      v-for="file in COMMON_ICONS" :key="file" type="button" :title="iconLabel(file)"
                      class="w-full aspect-square flex items-center justify-center rounded-lg bg-sw-card hover:bg-sw-gold/10 border border-transparent hover:border-sw-gold/30 transition-colors p-1.5"
                      @click="addIcon(eIdx, file)"
                    >
                      <img :src="iconPath(file)" :alt="iconLabel(file)" class="w-full h-full object-contain" />
                    </button>
                  </div>

                  <!-- Separator -->
                  <div class="flex items-center gap-2 pt-1">
                    <div class="flex-1 h-px bg-sw-gold/15" />
                    <span class="text-[9px] text-sw-text/30 uppercase tracking-widest">Other</span>
                    <div class="flex-1 h-px bg-sw-gold/15" />
                  </div>

                  <!-- Rest, alphabetical -->
                  <div class="grid grid-cols-5 gap-2">
                    <button
                      v-for="file in REST_ICONS" :key="file" type="button" :title="iconLabel(file)"
                      class="w-full aspect-square flex items-center justify-center rounded-lg bg-sw-card hover:bg-sw-gold/10 border border-transparent hover:border-sw-gold/30 transition-colors p-1.5"
                      @click="addIcon(eIdx, file)"
                    >
                      <img :src="iconPath(file)" :alt="iconLabel(file)" class="w-full h-full object-contain" />
                    </button>
                  </div>

                  <!-- _to die results — distinct section, feature TBD -->
                  <div class="rounded-lg border border-sw-gold/10 bg-sw-card/40 p-2 space-y-1.5">
                    <p class="text-[9px] text-sw-text/30 uppercase tracking-widest">Die results</p>
                    <div class="grid grid-cols-5 gap-2">
                      <button
                        v-for="file in TO_ICONS" :key="file" type="button" :title="iconLabel(file)"
                        class="w-full aspect-square flex items-center justify-center rounded-lg bg-sw-dark/60 hover:bg-sw-gold/10 border border-sw-gold/10 hover:border-sw-gold/30 transition-colors p-1.5"
                        @click="addIcon(eIdx, file)"
                      >
                        <img :src="iconPath(file)" :alt="iconLabel(file)" class="w-full h-full object-contain" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add entry button -->
    <button
      type="button"
      :disabled="section.entries.length >= 4 || (section.hidden ?? false)"
      class="w-full py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-colors"
      :class="section.entries.length >= 4
        ? 'border-sw-gold/10 text-sw-text/20 cursor-not-allowed'
        : 'border-sw-gold/30 text-sw-gold/60 hover:border-sw-gold/60 hover:text-sw-gold'"
      @click="addEntry"
    >
      + Add Entry Row
      <span class="text-sw-text/30 font-normal normal-case tracking-normal ml-1">
        ({{ section.entries.length }}/4)
      </span>
    </button>

  </div>
</template>
