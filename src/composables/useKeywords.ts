import { ref, readonly } from 'vue'

const keywords = ref<Record<string, string>>({})
let loaded = false

export function useKeywords() {
  if (!loaded) {
    loaded = true
    fetch('/data/keywords.json')
      .then(r => r.ok ? r.json() : {})
      .then(data => { keywords.value = data })
      .catch(() => {})
  }

  function getDefinition(tag: string): string | undefined {
    return keywords.value[tag]
  }

  return { keywords: readonly(keywords), getDefinition }
}
