import { ref } from 'vue'
import { useCollectionStore } from '../stores/collection.ts'
import { useStrikeForceStore } from '../stores/strikeForce.ts'
import type { CompactBuild } from '../types/index.ts'

interface BackupData {
  version: 1
  collection: string[]
  savedLists: CompactBuild[]
}

function isValidBackup(obj: unknown): obj is BackupData {
  if (typeof obj !== 'object' || !obj) return false
  const b = obj as Record<string, unknown>
  return b.version === 1 && Array.isArray(b.collection) && Array.isArray(b.savedLists)
}

export function useDataBackup() {
  const collectionStore = useCollectionStore()
  const sfStore = useStrikeForceStore()

  const importError = ref<string | null>(null)
  const importSuccess = ref(false)
  const exportSuccess = ref(false)

  function exportData() {
    const data: BackupData = {
      version: 1,
      collection: [...collectionStore.owned],
      savedLists: [...sfStore.savedLists],
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
        sfStore.savedLists.splice(0, sfStore.savedLists.length, ...parsed.savedLists)
        sfStore.activeIndex = -1
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
