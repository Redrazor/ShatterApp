<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CombatTree, CombatTreeConnection } from '../../../types/index.ts'
import CombatNodePicker from './CombatNodePicker.vue'
import { useHomebrewStore } from '../../../stores/homebrew.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'

const ROW_LABELS = ['TOP', 'MID', 'BOT'] as const
const MAX_COLS = 6
const COUNT_OPTIONS: Array<1 | 2 | 3> = [1, 2, 3]

// Icons that have no _orange_bg variant
const NO_ORANGE_BG = new Set(['22_SHV_DMG_DMG', '43_PIN_SHV'])
// Icons whose plain .png has an orange background — use _white_bg.png for c2+ columns
const USE_WHITE_BG = new Set(['09_DMG_DMG', '22_SHV_DMG_DMG', '43_PIN_SHV', '61_SHV_HEA_HEA_HEA', '70_SHV_DASH'])

// Which row indices are active starting nodes per startingNodeCount
const START_ROWS: Record<1 | 2 | 3, number[]> = {
  1: [1],
  2: [0, 2],
  3: [0, 1, 2],
}

// ── SVG grid geometry ─────────────────────────────────────────────────────────
// Matches Tailwind: w-12/h-12 cells (48px), gap-4 rows (16px), gap-2 cols (8px)
// Label area: w-8 (32px) + gap-2 (8px) = 40px
const CELL  = 48
const CGAP  = 8
const RGAP  = 16
const LBL_W = 40
const CSTEP = CELL + CGAP   // 56
const RSTEP = CELL + RGAP   // 64
const SVG_H = 3 * CELL + 2 * RGAP  // 176

function cellCX(col: number): number { return LBL_W + col * CSTEP + CELL / 2 }
function cellCY(row: number): number { return row * RSTEP + CELL / 2 }

interface ConnLD {
  line1: { x1: number; y1: number; x2: number; y2: number }
  line2: { x1: number; y1: number; x2: number; y2: number }
  midX: number; midY: number
}

function connLineData(conn: CombatTreeConnection): ConnLD | null {
  const x1 = cellCX(conn.fromCol), y1 = cellCY(conn.fromRow)
  const x2 = cellCX(conn.toCol),   y2 = cellCY(conn.toRow)
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 1) return null
  const px = (-dy / len) * 3.5, py = (dx / len) * 3.5
  return {
    line1: { x1: x1 + px, y1: y1 + py, x2: x2 + px, y2: y2 + py },
    line2: { x1: x1 - px, y1: y1 - py, x2: x2 - px, y2: y2 - py },
    midX: (x1 + x2) / 2,
    midY: (y1 + y2) / 2,
  }
}

// ── Icon normalisation ─────────────────────────────────────────────────────────
function extractBase(iconFile: string): string {
  return iconFile.replace('_orange_bg.png', '').replace('_white_bg.png', '').replace('.png', '')
}

function fileForColumn(base: string, colIdx: number): string {
  if (colIdx === 0) return NO_ORANGE_BG.has(base) ? `${base}.png` : `${base}_orange_bg.png`
  return USE_WHITE_BG.has(base) ? `${base}_white_bg.png` : `${base}.png`
}

function normalizeIcon(iconFile: string | null, colIdx: number): string | null {
  if (!iconFile) return null
  return fileForColumn(extractBase(iconFile), colIdx)
}

// ── Props / emits ──────────────────────────────────────────────────────────────
const props = defineProps<{
  tree: CombatTree | null
  iconUsage: Record<string, number>
}>()

const emit = defineEmits<{ 'update:tree': [tree: CombatTree] }>()

const store = useHomebrewStore()

// ── Derived state ──────────────────────────────────────────────────────────────
const currentCount = computed<1 | 2 | 3>(() => props.tree?.startingNodeCount ?? 1)

function getIcon(rowIdx: number, colIdx: number): string | null {
  return props.tree?.grid?.[rowIdx]?.[colIdx] ?? null
}

const lastFilledCol = computed<number>(() => {
  const grid = props.tree?.grid ?? []
  let last = -1
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < MAX_COLS; c++)
      if (grid[r]?.[c]) last = Math.max(last, c)
  return last
})

const visibleCols = computed<number>(() => Math.min(lastFilledCol.value + 2, MAX_COLS))

const svgW = computed<number>(() => LBL_W + visibleCols.value * CSTEP)

function isCellAvailable(rowIdx: number, colIdx: number): boolean {
  if (colIdx === 0) return START_ROWS[currentCount.value].includes(rowIdx)
  const grid = props.tree?.grid ?? []
  return [0, 1, 2].some(r => grid[r]?.[colIdx - 1])
}

// Computed connection lines (filters out degenerate connections)
const connectionLines = computed(() =>
  (props.tree?.connections ?? []).flatMap((conn, i) => {
    const ld = connLineData(conn)
    return ld ? [{ conn, i, ld }] : []
  })
)

// ── Tree clone helper ──────────────────────────────────────────────────────────
function cloneTree(): CombatTree {
  const src = props.tree
  return {
    startingNodeCount: currentCount.value,
    grid: Array.from({ length: 3 }, (_, r) =>
      Array.from({ length: MAX_COLS }, (_, c) => src?.grid?.[r]?.[c] ?? null),
    ),
    connections: [...(src?.connections ?? [])],
  }
}

// ── Grid mutations ─────────────────────────────────────────────────────────────
function setCount(count: 1 | 2 | 3) {
  const tree = cloneTree()
  tree.startingNodeCount = count
  const active = START_ROWS[count]
  for (let r = 0; r < 3; r++) {
    if (!active.includes(r)) {
      tree.grid[r][0] = null
      tree.connections = tree.connections.filter(c =>
        !(c.fromRow === r && c.fromCol === 0) && !(c.toRow === r && c.toCol === 0),
      )
    }
  }
  emit('update:tree', tree)
}

function setIcon(rowIdx: number, colIdx: number, iconFile: string) {
  const tree = cloneTree()
  const normalized = normalizeIcon(iconFile, colIdx) ?? iconFile
  tree.grid[rowIdx][colIdx] = normalized
  store.trackIconUsage(normalized)
  emit('update:tree', tree)
}

function clearCell(rowIdx: number, colIdx: number) {
  const tree = cloneTree()
  tree.grid[rowIdx][colIdx] = null
  tree.connections = tree.connections.filter(c =>
    !(c.fromRow === rowIdx && c.fromCol === colIdx) &&
    !(c.toRow === rowIdx && c.toCol === colIdx),
  )
  emit('update:tree', tree)
}

// ── Shared swap logic ─────────────────────────────────────────────────────────
function swapCells(srcRow: number, srcCol: number, dstRow: number, dstCol: number) {
  const tree = cloneTree()
  const tmp = tree.grid[dstRow][dstCol]
  tree.grid[dstRow][dstCol] = normalizeIcon(tree.grid[srcRow][srcCol], dstCol)
  tree.grid[srcRow][srcCol] = normalizeIcon(tmp, srcCol)
  tree.connections = tree.connections.map(c => {
    let { fromRow, fromCol, toRow, toCol } = c
    if (fromRow === srcRow && fromCol === srcCol) { fromRow = dstRow; fromCol = dstCol }
    else if (fromRow === dstRow && fromCol === dstCol) { fromRow = srcRow; fromCol = srcCol }
    if (toRow === srcRow && toCol === srcCol) { toRow = dstRow; toCol = dstCol }
    else if (toRow === dstRow && toCol === dstCol) { toRow = srcRow; toCol = srcCol }
    return { fromRow, fromCol, toRow, toCol }
  })
  emit('update:tree', tree)
}

// ── Drag-drop (desktop) ───────────────────────────────────────────────────────
const dragSource = ref<{ rowIdx: number; colIdx: number } | null>(null)

function onDragStart(rowIdx: number, colIdx: number, e: DragEvent) {
  if (connectMode.value) return
  dragSource.value = { rowIdx, colIdx }
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() { dragSource.value = null }

function onDrop(rowIdx: number, colIdx: number, e: DragEvent) {
  e.preventDefault()
  const src = dragSource.value
  if (!src || (src.rowIdx === rowIdx && src.colIdx === colIdx)) {
    dragSource.value = null
    return
  }
  swapCells(src.rowIdx, src.colIdx, rowIdx, colIdx)
  dragSource.value = null
}

// ── Long-press-to-select (touch) ──────────────────────────────────────────────
const touchSource = ref<{ rowIdx: number; colIdx: number } | null>(null)
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let longPressOrigin: { x: number; y: number } | null = null

function onFilledCellPointerDown(rowIdx: number, colIdx: number, e: PointerEvent) {
  if (e.pointerType !== 'touch' || connectMode.value) return
  longPressOrigin = { x: e.clientX, y: e.clientY }
  longPressTimer = setTimeout(() => {
    touchSource.value = { rowIdx, colIdx }
    longPressTimer = null
  }, 500)
}

function onFilledCellPointerMove(e: PointerEvent) {
  if (!longPressTimer || !longPressOrigin) return
  const dx = e.clientX - longPressOrigin.x
  const dy = e.clientY - longPressOrigin.y
  if (Math.sqrt(dx * dx + dy * dy) > 10) cancelLongPress()
}

function cancelLongPress() {
  if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
  longPressOrigin = null
}

// ── Connection mode ────────────────────────────────────────────────────────────
const connectMode = ref(false)
const pendingFrom = ref<{ rowIdx: number; colIdx: number } | null>(null)

function toggleConnectMode() {
  connectMode.value = !connectMode.value
  pendingFrom.value = null
}

function onCellClick(rowIdx: number, colIdx: number) {
  // Touch-move mode: tap to place the long-press-selected cell
  if (touchSource.value && !connectMode.value) {
    const src = touchSource.value
    if (src.rowIdx === rowIdx && src.colIdx === colIdx) {
      touchSource.value = null
      return
    }
    swapCells(src.rowIdx, src.colIdx, rowIdx, colIdx)
    touchSource.value = null
    return
  }

  if (!connectMode.value) return
  if (!getIcon(rowIdx, colIdx)) return

  if (!pendingFrom.value) {
    pendingFrom.value = { rowIdx, colIdx }
    return
  }
  // Same cell — deselect
  if (pendingFrom.value.rowIdx === rowIdx && pendingFrom.value.colIdx === colIdx) {
    pendingFrom.value = null
    return
  }
  const tree = cloneTree()
  const fr = pendingFrom.value.rowIdx, fc = pendingFrom.value.colIdx
  const exists = tree.connections.some(c =>
    (c.fromRow === fr && c.fromCol === fc && c.toRow === rowIdx && c.toCol === colIdx) ||
    (c.fromRow === rowIdx && c.fromCol === colIdx && c.toRow === fr && c.toCol === fc),
  )
  if (!exists) {
    tree.connections.push({ fromRow: fr, fromCol: fc, toRow: rowIdx, toCol: colIdx })
  }
  emit('update:tree', tree)
  pendingFrom.value = null
  connectMode.value = false
}

function deleteConnection(idx: number) {
  const tree = cloneTree()
  tree.connections.splice(idx, 1)
  emit('update:tree', tree)
}
</script>

<template>
  <div class="space-y-5">

    <!-- Starting node count -->
    <div class="space-y-2">
      <p class="text-[10px] font-bold uppercase tracking-widest text-sw-text/40">Starting Nodes</p>
      <div class="flex gap-2">
        <button
          v-for="n in COUNT_OPTIONS"
          :key="n"
          type="button"
          class="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all"
          :class="currentCount === n
            ? 'bg-amber-500/20 border-amber-500/60 text-amber-400'
            : 'bg-sw-dark border-white/10 text-sw-text/40 hover:border-white/30 hover:text-sw-text/60'"
          @click="setCount(n)"
        >
          {{ n }}
        </button>
      </div>
    </div>

    <!-- Grid + SVG overlay -->
    <div class="overflow-x-auto w-full">
      <div class="relative" :style="`min-width: ${svgW}px`">

        <!-- SVG overlay: connection lines + delete buttons -->
        <svg
          class="absolute top-0 left-0 overflow-visible"
          :width="svgW"
          :height="SVG_H"
          style="pointer-events: none"
        >
          <template v-for="{ i, ld } in connectionLines" :key="i">
            <line
              :x1="ld.line1.x1" :y1="ld.line1.y1"
              :x2="ld.line1.x2" :y2="ld.line1.y2"
              stroke="rgba(255,255,255,0.80)" stroke-width="3" stroke-linecap="round"
            />
            <line
              :x1="ld.line2.x1" :y1="ld.line2.y1"
              :x2="ld.line2.x2" :y2="ld.line2.y2"
              stroke="rgba(255,255,255,0.80)" stroke-width="3" stroke-linecap="round"
            />
            <!-- Delete button at midpoint -->
            <g
              :transform="`translate(${ld.midX}, ${ld.midY})`"
              style="pointer-events: all; cursor: pointer"
              @click.stop="deleteConnection(i)"
            >
              <circle r="20" fill="transparent" />
              <circle r="8" fill="#1a1a2e" stroke="rgba(255,100,100,0.5)" stroke-width="1.5" />
              <text y="4.5" text-anchor="middle" fill="rgba(255,100,100,0.9)" font-size="12" font-weight="bold">×</text>
            </g>
          </template>

          <!-- Pending-from highlight ring (connect mode) -->
          <circle
            v-if="pendingFrom"
            :cx="cellCX(pendingFrom.colIdx)"
            :cy="cellCY(pendingFrom.rowIdx)"
            r="28"
            fill="none"
            stroke="#f59e0b"
            stroke-width="2"
            stroke-dasharray="4 2"
          />
          <!-- Touch-source highlight ring (long-press move mode) -->
          <circle
            v-if="touchSource"
            :cx="cellCX(touchSource.colIdx)"
            :cy="cellCY(touchSource.rowIdx)"
            r="28"
            fill="none"
            stroke="#60a5fa"
            stroke-width="2"
            stroke-dasharray="4 2"
          />
        </svg>

        <!-- Grid rows -->
        <div class="flex flex-col gap-4">
          <div
            v-for="(rowLabel, rowIdx) in ROW_LABELS"
            :key="rowIdx"
            class="flex items-center gap-2"
          >
            <span class="w-8 flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-sw-text/30 select-none">
              {{ rowLabel }}
            </span>
            <div class="flex gap-2">
              <div
                v-for="colIdx in visibleCols"
                :key="colIdx - 1"
                class="relative flex-shrink-0 w-12 h-12"
                @dragover.prevent
                @drop="onDrop(rowIdx, colIdx - 1, $event)"
                @click="onCellClick(rowIdx, colIdx - 1)"
              >
                <!-- Filled cell -->
                <template v-if="getIcon(rowIdx, colIdx - 1)">
                  <div
                    draggable="true"
                    class="w-full h-full rounded-lg flex items-center justify-center border transition-all select-none"
                    :class="[
                      colIdx === 1
                        ? 'bg-orange-500/25 border-orange-400/50 hover:border-orange-400/80'
                        : 'bg-white/15 border-white/30 hover:border-white/50',
                      connectMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing',
                      pendingFrom?.rowIdx === rowIdx && pendingFrom?.colIdx === colIdx - 1
                        ? 'ring-2 ring-amber-400' : '',
                      touchSource?.rowIdx === rowIdx && touchSource?.colIdx === colIdx - 1
                        ? 'ring-2 ring-blue-400' : '',
                    ]"
                    :style="dragSource?.rowIdx === rowIdx && dragSource?.colIdx === colIdx - 1 ? 'opacity:0.4' : ''"
                    @dragstart="onDragStart(rowIdx, colIdx - 1, $event)"
                    @dragend="onDragEnd"
                    @pointerdown="onFilledCellPointerDown(rowIdx, colIdx - 1, $event)"
                    @pointermove="onFilledCellPointerMove"
                    @pointerup="cancelLongPress"
                    @pointercancel="cancelLongPress"
                  >
                    <img
                      :src="imageUrl(`/images/combat_tree_icons/crops/${getIcon(rowIdx, colIdx - 1)}`)"
                      class="w-10 h-10 object-contain pointer-events-none"
                      alt=""
                    />
                  </div>
                  <button
                    type="button"
                    class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-sw-dark border border-white/20 text-sw-text/40 hover:text-red-400 text-xs leading-none flex items-center justify-center transition-colors z-10 touch-manipulation"
                    @click.stop="clearCell(rowIdx, colIdx - 1)"
                  >
                    ×
                  </button>
                </template>

                <!-- Available empty cell -->
                <template v-else-if="isCellAvailable(rowIdx, colIdx - 1)">
                  <CombatNodePicker
                    :model-value="null"
                    :is-starting-node="colIdx === 1"
                    :icon-usage="iconUsage"
                    @update:model-value="setIcon(rowIdx, colIdx - 1, $event)"
                  />
                </template>

                <!-- Unavailable cell -->
                <template v-else>
                  <div class="w-full h-full rounded-lg border border-dashed border-white/8" />
                </template>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Connection controls -->
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all"
        :class="connectMode
          ? 'bg-amber-500/20 border-amber-500/60 text-amber-400'
          : 'bg-sw-dark border-white/10 text-sw-text/40 hover:border-white/30 hover:text-sw-text/60'"
        @click="toggleConnectMode"
      >
        {{ connectMode
          ? (pendingFrom ? 'Click end node…' : 'Click start node…')
          : 'Add Connection' }}
      </button>
      <button
        v-if="connectMode"
        type="button"
        class="text-xs text-sw-text/40 hover:text-sw-text/70 transition-colors"
        @click="toggleConnectMode"
      >
        Cancel
      </button>
    </div>

    <p class="text-[10px] text-sw-text/25">
      Click + to add nodes. Drag filled nodes to move them (or long-press on touch). Use "Add Connection" to draw lines between any two nodes.
    </p>
  </div>
</template>
