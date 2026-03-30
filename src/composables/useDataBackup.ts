import { ref } from 'vue'
import { useCollectionStore } from '../stores/collection.ts'
import { useStrikeForceStore } from '../stores/strikeForce.ts'
import { useSettingsStore } from '../stores/settings.ts'
import type { CompactBuild } from '../types/index.ts'

interface BackupDataV1 {
  version: 1
  collection: string[]
  ownedCharacterIds: number[]
  savedLists: CompactBuild[]
}

interface BackupDataV2 {
  version: 2
  collection: string[]
  ownedCharacterIds: number[]
  paintedCharacterIds: number[]
  basedCharacterIds: number[]
  savedLists: CompactBuild[]
  settings: Record<string, boolean>
}

type BackupData = BackupDataV1 | BackupDataV2

function isValidBackup(obj: unknown): obj is BackupData {
  if (typeof obj !== 'object' || !obj) return false
  const b = obj as Record<string, unknown>
  return (b.version === 1 || b.version === 2) && Array.isArray(b.collection) && Array.isArray(b.savedLists)
}

export function useDataBackup() {
  const collectionStore = useCollectionStore()
  const sfStore = useStrikeForceStore()
  const settingsStore = useSettingsStore()

  const importError = ref<string | null>(null)
  const importSuccess = ref(false)
  const exportSuccess = ref(false)

  function exportData() {
    const data: BackupDataV2 = {
      version: 2,
      collection: [...collectionStore.owned],
      ownedCharacterIds: [...collectionStore.ownedCharacterIds],
      paintedCharacterIds: [...collectionStore.paintedCharacterIds],
      basedCharacterIds: [...collectionStore.basedCharacterIds],
      savedLists: [...sfStore.savedLists],
      settings: {
        autoMarkUnitsOwned: settingsStore.autoMarkUnitsOwned,
        showPaintedToggle: settingsStore.showPaintedToggle,
        showBasedToggle: settingsStore.showBasedToggle,
        showRollTab: settingsStore.showRollTab,
        playShowRoster: settingsStore.playShowRoster,
        playShowTracker: settingsStore.playShowTracker,
        playShowDice: settingsStore.playShowDice,
      },
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shatterapp-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    exportSuccess.value = true
    setTimeout(() => { exportSuccess.value = false }, 2000)
  }

  function importData(file: File) {
    importError.value = null
    importSuccess.value = false
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string)
        if (!isValidBackup(parsed)) throw new Error('Invalid backup file')

        collectionStore.importOwned(parsed.collection)
        collectionStore.importCharacterOwned(parsed.ownedCharacterIds ?? [])
        sfStore.savedLists.splice(0, sfStore.savedLists.length, ...parsed.savedLists)
        sfStore.activeIndex = -1

        if (parsed.version === 2) {
          collectionStore.importPainted(parsed.paintedCharacterIds ?? [])
          collectionStore.importBased(parsed.basedCharacterIds ?? [])
          const s = parsed.settings ?? {}
          if (typeof s.autoMarkUnitsOwned === 'boolean') settingsStore.autoMarkUnitsOwned = s.autoMarkUnitsOwned
          if (typeof s.showPaintedToggle === 'boolean') settingsStore.showPaintedToggle = s.showPaintedToggle
          if (typeof s.showBasedToggle === 'boolean') settingsStore.showBasedToggle = s.showBasedToggle
          if (typeof s.showRollTab === 'boolean') settingsStore.showRollTab = s.showRollTab
          if (typeof s.playShowRoster === 'boolean') settingsStore.playShowRoster = s.playShowRoster
          if (typeof s.playShowTracker === 'boolean') settingsStore.playShowTracker = s.playShowTracker
          if (typeof s.playShowDice === 'boolean') settingsStore.playShowDice = s.playShowDice
        }

        importSuccess.value = true
        setTimeout(() => { importSuccess.value = false }, 3000)
      } catch {
        importError.value = 'Could not read backup — make sure it\'s a valid ShatterApp file.'
        setTimeout(() => { importError.value = null }, 4000)
      }
    }
    reader.readAsText(file)
  }

  return { exportData, importData, importError, importSuccess, exportSuccess }
}
