<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { AbilityBlock, AbilitiesData } from '../../../types/index.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'

const props = defineProps<{ abilities: AbilitiesData | null }>()
const emit = defineEmits<{ update: [data: AbilitiesData] }>()

// Ability type icons — the 5 orange icons shown in the Reference screen
const ICONS = [
  { name: 'active', label: 'Active' },
  { name: 'reactive', label: 'Reactive' },
  { name: 'innate', label: 'Innate' },
  { name: 'tactic', label: 'Tactic' },
  { name: 'identity', label: 'Identity' },
]

// Inline symbols for ability text — from /images/abilities_iconography/
const SYMBOLS = [
  { name: 'advance', label: 'Advance' },
  { name: 'attack_expertise', label: 'Atk Exp.' },
  { name: 'block', label: 'Block' },
  { name: 'character', label: 'Character' },
  { name: 'climb', label: 'Climb' },
  { name: 'critical', label: 'Critical' },
  { name: 'damage', label: 'Damage' },
  { name: 'dash', label: 'Dash' },
  { name: 'defense_expertise', label: 'Def Exp.' },
  { name: 'disarmed', label: 'Disarmed' },
  { name: 'exposed', label: 'Exposed' },
  { name: 'failure', label: 'Failure' },
  { name: 'force', label: 'Force' },
  { name: 'heal', label: 'Heal' },
  { name: 'hunker', label: 'Hunker' },
  { name: 'jump', label: 'Jump' },
  { name: 'melee', label: 'Melee' },
  { name: 'pinned', label: 'Pinned' },
  { name: 'range', label: 'Range' },
  { name: 'ranged', label: 'Ranged' },
  { name: 'reposition', label: 'Reposition' },
  { name: 'shove', label: 'Shove' },
  { name: 'strained', label: 'Strained' },
  { name: 'strike', label: 'Strike' },
]

function symbolPathFor(name: string): string {
  return imageUrl(`/images/abilities_iconography/${name}_crop.png`)
}

const blocks = computed<AbilityBlock[]>(() => props.abilities?.blocks ?? [])

// Dropdown state: which block index has its icon dropdown open
const openDropdown = ref<number | null>(null)

// Symbol picker state: which block index has its symbol picker open
const pickerForBlock = ref<number | null>(null)

// Textarea refs and cursor tracking
const textareaRefs = ref<(HTMLTextAreaElement | null)[]>([])
const cursorMap = ref<Record<number, number>>({})

function iconPathFor(name: string): string {
  return imageUrl(`/images/icons/${name}.png`)
}

function iconLabelFor(name: string): string {
  return ICONS.find(i => i.name === name)?.label ?? name
}

function emitUpdate(newBlocks: AbilityBlock[]) {
  emit('update', { blocks: newBlocks })
}

function addBlock() {
  emitUpdate([...blocks.value, { iconType: 'active', title: '', forceCost: 0, text: '' }])
}

function removeBlock(i: number) {
  const updated = blocks.value.filter((_, idx) => idx !== i)
  emitUpdate(updated)
}

function updateBlock(i: number, patch: Partial<AbilityBlock>) {
  const updated = blocks.value.map((b, idx) => idx === i ? { ...b, ...patch } : b)
  emitUpdate(updated)
}

function saveCursor(i: number) {
  const el = textareaRefs.value[i]
  if (el) cursorMap.value[i] = el.selectionStart ?? 0
}

function toggleDropdown(i: number) {
  openDropdown.value = openDropdown.value === i ? null : i
  // Close picker if open
  pickerForBlock.value = null
}

function selectIcon(i: number, name: string) {
  updateBlock(i, { iconType: name })
  openDropdown.value = null
}

function handleDropdownFocusOut(e: FocusEvent, i: number) {
  const related = e.relatedTarget as HTMLElement | null
  const container = (e.currentTarget as HTMLElement)
  if (!related || !container.contains(related)) {
    if (openDropdown.value === i) openDropdown.value = null
  }
}

function togglePicker(i: number) {
  pickerForBlock.value = pickerForBlock.value === i ? null : i
  openDropdown.value = null
}

function handlePickerKey(e: KeyboardEvent) {
  if (e.key === 'Escape') pickerForBlock.value = null
}

function handlePickerFocusOut(e: FocusEvent, i: number) {
  const related = e.relatedTarget as HTMLElement | null
  const container = (e.currentTarget as HTMLElement)
  if (!related || !container.contains(related)) {
    if (pickerForBlock.value === i) pickerForBlock.value = null
  }
}

async function insertSymbol(symbolName: string) {
  const i = pickerForBlock.value
  if (i === null) return

  const block = blocks.value[i]
  if (!block) return

  const cursor = cursorMap.value[i] ?? block.text.length
  const token = `[${symbolName}]`
  const newText = block.text.slice(0, cursor) + token + block.text.slice(cursor)
  updateBlock(i, { text: newText })

  const newCursor = cursor + token.length
  pickerForBlock.value = null

  await nextTick()
  const el = textareaRefs.value[i]
  if (el) {
    el.focus()
    el.setSelectionRange(newCursor, newCursor)
    cursorMap.value[i] = newCursor
  }
}
</script>

<template>
  <div class="space-y-3">
    <!-- Ability blocks list -->
    <div
      v-for="(block, i) in blocks"
      :key="i"
      class="rounded-xl border border-sw-gold/15 bg-sw-dark p-3 space-y-2"
    >
      <!-- Row 1: Icon dropdown + Force cost + Title + Remove -->
      <div class="flex items-center gap-2">

        <!-- Custom icon dropdown -->
        <div class="relative" @focusout="handleDropdownFocusOut($event, i)">
          <button
            type="button"
            class="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-sw-card border border-sw-gold/20 hover:border-sw-gold/50 transition-colors text-xs text-sw-text/70 whitespace-nowrap"
            @click="toggleDropdown(i)"
          >
            <img
              :src="iconPathFor(block.iconType)"
              :alt="iconLabelFor(block.iconType)"
              class="w-5 h-5 object-contain flex-shrink-0"
            />
            <span class="hidden sm:inline max-w-[80px] truncate">{{ iconLabelFor(block.iconType) }}</span>
            <svg class="w-3 h-3 opacity-50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Dropdown panel -->
          <div
            v-if="openDropdown === i"
            class="absolute z-20 top-full left-0 mt-1 w-48 max-h-56 overflow-y-auto rounded-xl bg-sw-card border border-sw-gold/20 shadow-xl"
          >
            <button
              v-for="icon in ICONS"
              :key="icon.name"
              type="button"
              class="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-sw-text/80 hover:bg-sw-gold/10 transition-colors"
              :class="{ 'bg-sw-gold/15 text-sw-gold': block.iconType === icon.name }"
              @click="selectIcon(i, icon.name)"
            >
              <img
                :src="iconPathFor(icon.name)"
                :alt="icon.label"
                class="w-5 h-5 object-contain flex-shrink-0"
              />
              {{ icon.label }}
            </button>
          </div>
        </div>

        <!-- Force cost -->
        <div class="flex items-center gap-1">
          <span class="text-xs text-sw-text/40 font-medium select-none">F:</span>
          <input
            type="number"
            :value="block.forceCost"
            min="0"
            max="6"
            class="w-12 px-2 py-1.5 rounded-lg bg-sw-card border border-sw-gold/20 text-xs text-sw-text text-center focus:outline-none focus:border-sw-gold/60 transition-colors"
            @input="updateBlock(i, { forceCost: Math.max(0, Math.min(6, parseInt(($event.target as HTMLInputElement).value) || 0)) })"
          />
        </div>

        <!-- Title input -->
        <input
          type="text"
          :value="block.title"
          placeholder="Ability name…"
          class="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-sw-card border border-sw-gold/20 text-xs text-sw-text placeholder-sw-text/30 focus:outline-none focus:border-sw-gold/60 transition-colors"
          @input="updateBlock(i, { title: ($event.target as HTMLInputElement).value })"
        />

        <!-- Remove button -->
        <button
          type="button"
          class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-sw-text/30 hover:text-red-400 hover:bg-red-400/10 transition-colors text-sm"
          title="Remove ability"
          @click="removeBlock(i)"
        >
          ×
        </button>
      </div>

      <!-- Row 2: Textarea + Insert Symbol -->
      <div class="space-y-1">
        <textarea
          :ref="(el) => { textareaRefs[i] = el as HTMLTextAreaElement | null }"
          :value="block.text"
          rows="4"
          placeholder="Ability description… Use [damage], [advance], [force] etc. for inline icons."
          class="w-full px-3 py-2 rounded-lg bg-sw-card border border-sw-gold/20 text-xs text-sw-text placeholder-sw-text/30 focus:outline-none focus:border-sw-gold/60 transition-colors resize-none leading-relaxed"
          @input="updateBlock(i, { text: ($event.target as HTMLTextAreaElement).value })"
          @blur="saveCursor(i)"
          @click="saveCursor(i)"
          @keyup="saveCursor(i)"
        />

        <!-- Insert Symbol row -->
        <div class="flex justify-end">
          <div
            class="relative"
            @keydown="handlePickerKey"
            @focusout="handlePickerFocusOut($event, i)"
          >
            <button
              type="button"
              class="px-3 py-1 rounded-lg text-xs border transition-colors"
              :class="pickerForBlock === i
                ? 'bg-sw-gold/20 border-sw-gold/50 text-sw-gold'
                : 'bg-sw-card border-sw-gold/20 text-sw-text/60 hover:border-sw-gold/40 hover:text-sw-text/80'"
              @click="togglePicker(i)"
            >
              Insert Symbol
            </button>

            <!-- Symbol picker popup -->
            <div
              v-if="pickerForBlock === i"
              class="absolute z-20 bottom-full right-0 mb-1 w-72 rounded-xl bg-sw-card border border-sw-gold/20 shadow-xl p-2"
            >
              <p class="text-[10px] text-sw-text/40 mb-2 px-1">Click to insert at cursor</p>
              <div class="grid grid-cols-6 gap-1">
                <button
                  v-for="sym in SYMBOLS"
                  :key="sym.name"
                  type="button"
                  class="flex flex-col items-center gap-0.5 p-1 rounded-lg hover:bg-sw-gold/10 transition-colors"
                  :title="sym.label"
                  @click="insertSymbol(sym.name)"
                >
                  <img
                    :src="symbolPathFor(sym.name)"
                    :alt="sym.label"
                    class="w-7 h-7 object-contain"
                  />
                  <span class="text-[8px] text-sw-text/50 leading-tight text-center w-full truncate">{{ sym.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="blocks.length === 0"
      class="rounded-xl border border-dashed border-sw-gold/15 p-6 text-center"
    >
      <p class="text-xs text-sw-text/30">No ability blocks yet. Add one below.</p>
    </div>

    <!-- Add block button -->
    <button
      type="button"
      class="w-full rounded-xl px-4 py-2.5 text-sm font-medium border border-sw-gold/30 text-sw-gold hover:bg-sw-gold/10 hover:border-sw-gold/60 transition-colors"
      @click="addBlock"
    >
      ＋ Add Ability
    </button>
  </div>
</template>
