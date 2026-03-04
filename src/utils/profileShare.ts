import type { CompactBuild } from '../types/index.ts'

function toBase64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromBase64url(str: string): string {
  // Re-pad for atob
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
  const mod = padded.length % 4
  return atob(mod ? padded + '='.repeat(4 - mod) : padded)
}

export function encodeBuild(
  name: string,
  mid: number | null,
  pre: boolean,
  s: [[number, number, number], [number, number, number]],
): string {
  const build: CompactBuild = { name, mid, pre, s }
  return toBase64url(JSON.stringify(build))
}

export function decodeBuild(str: string): CompactBuild | null {
  try {
    const obj = JSON.parse(fromBase64url(str))
    if (typeof obj !== 'object' || !obj) return null
    if (typeof obj.name !== 'string') return null
    if (!Array.isArray(obj.s) || obj.s.length !== 2) return null
    if (!Array.isArray(obj.s[0]) || obj.s[0].length !== 3) return null
    if (!Array.isArray(obj.s[1]) || obj.s[1].length !== 3) return null
    return obj as CompactBuild
  } catch {
    return null
  }
}
