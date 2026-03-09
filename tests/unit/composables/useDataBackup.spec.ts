import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDataBackup } from '../../../src/composables/useDataBackup.ts'

// ── FileReader mock ──────────────────────────────────────────────────────────
// Calls onload synchronously with the provided result text.
function mockFileReader(result: string) {
  return vi.fn().mockImplementation(function (this: Partial<FileReader>) {
    this.readAsText = ((_file: File) => {
      const event = { target: { result } } as ProgressEvent<FileReader>
      this.onload!(event)
    }) as FileReader['readAsText']
  })
}

// ── URL / anchor mocks ───────────────────────────────────────────────────────
const mockClick = vi.fn()
const mockAnchor = { href: '', download: '', click: mockClick }

describe('useDataBackup', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:mock'),
      revokeObjectURL: vi.fn(),
    })
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement)
    mockClick.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  // ── exportData ─────────────────────────────────────────────────────────────

  it('exportData creates a download anchor and clicks it', () => {
    const { exportData } = useDataBackup()
    exportData()
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })

  it('exportData sets exportSuccess to true then clears it', async () => {
    vi.useFakeTimers()
    const { exportData, exportSuccess } = useDataBackup()
    exportData()
    expect(exportSuccess.value).toBe(true)
    vi.advanceTimersByTime(2000)
    expect(exportSuccess.value).toBe(false)
    vi.useRealTimers()
  })

  // ── importData — invalid input ─────────────────────────────────────────────

  it('importData sets importError for invalid JSON', async () => {
    vi.stubGlobal('FileReader', mockFileReader('not valid json'))
    const { importData, importError } = useDataBackup()
    importData(new File([''], 'backup.json'))
    expect(importError.value).toBe("Could not read backup — make sure it's a valid ShatterApp file.")
  })

  it('importData sets importError when backup schema is wrong', () => {
    const bad = JSON.stringify({ version: 2, collection: [], savedLists: [] })
    vi.stubGlobal('FileReader', mockFileReader(bad))
    const { importData, importError } = useDataBackup()
    importData(new File([''], 'backup.json'))
    expect(importError.value).toMatch(/Could not read/)
  })

  it('importData sets importError when collection field is missing', () => {
    const bad = JSON.stringify({ version: 1, savedLists: [] })
    vi.stubGlobal('FileReader', mockFileReader(bad))
    const { importData, importError } = useDataBackup()
    importData(new File([''], 'backup.json'))
    expect(importError.value).toMatch(/Could not read/)
  })

  it('importData sets importError when savedLists field is missing', () => {
    const bad = JSON.stringify({ version: 1, collection: [] })
    vi.stubGlobal('FileReader', mockFileReader(bad))
    const { importData, importError } = useDataBackup()
    importData(new File([''], 'backup.json'))
    expect(importError.value).toMatch(/Could not read/)
  })

  // ── importData — valid input ───────────────────────────────────────────────

  it('importData sets importSuccess for a valid backup', () => {
    const valid = JSON.stringify({ version: 1, collection: ['SWP01'], savedLists: [] })
    vi.stubGlobal('FileReader', mockFileReader(valid))
    const { importData, importSuccess } = useDataBackup()
    importData(new File([''], 'backup.json'))
    expect(importSuccess.value).toBe(true)
  })

  it('importData clears importSuccess after timeout', () => {
    vi.useFakeTimers()
    const valid = JSON.stringify({ version: 1, collection: [], savedLists: [] })
    vi.stubGlobal('FileReader', mockFileReader(valid))
    const { importData, importSuccess } = useDataBackup()
    importData(new File([''], 'backup.json'))
    expect(importSuccess.value).toBe(true)
    vi.advanceTimersByTime(3000)
    expect(importSuccess.value).toBe(false)
    vi.useRealTimers()
  })

  it('importData clears importError after timeout', () => {
    vi.useFakeTimers()
    vi.stubGlobal('FileReader', mockFileReader('bad json'))
    const { importData, importError } = useDataBackup()
    importData(new File([''], 'backup.json'))
    expect(importError.value).not.toBeNull()
    vi.advanceTimersByTime(4000)
    expect(importError.value).toBeNull()
    vi.useRealTimers()
  })
})
