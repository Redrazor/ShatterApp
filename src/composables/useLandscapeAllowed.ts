import { ref, watch } from 'vue'

const STORAGE_KEY = 'shatterapp:allowLandscape'

function readInitial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

const allowLandscapeMode = ref(readInitial())

watch(allowLandscapeMode, (v) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(v))
  } catch {
    /* ignore quota / privacy errors */
  }
})

export function useLandscapeAllowed() {
  return allowLandscapeMode
}
