import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '../../../src/stores/settings.ts'

describe('useSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('showProbabilityRoller defaults to false', () => {
    const store = useSettingsStore()
    expect(store.showProbabilityRoller).toBe(false)
  })

  it('showRollTab defaults to true', () => {
    const store = useSettingsStore()
    expect(store.showRollTab).toBe(true)
  })

  it('disabling showRollTab auto-disables showProbabilityRoller', async () => {
    const store = useSettingsStore()
    store.showProbabilityRoller = true
    store.showRollTab = false
    // watcher is async — wait a tick
    await new Promise(r => setTimeout(r, 0))
    expect(store.showProbabilityRoller).toBe(false)
  })

  it('enabling showRollTab does not auto-enable showProbabilityRoller', async () => {
    const store = useSettingsStore()
    store.showRollTab = false
    await new Promise(r => setTimeout(r, 0))
    store.showRollTab = true
    await new Promise(r => setTimeout(r, 0))
    expect(store.showProbabilityRoller).toBe(false)
  })
})
