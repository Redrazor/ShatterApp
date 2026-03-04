const IMAGE_BASE = (import.meta.env.VITE_IMAGE_BASE as string) ?? ''

/**
 * Resolves an image path against VITE_IMAGE_BASE.
 * - Local dev: IMAGE_BASE is empty → path served from public/
 * - Production: IMAGE_BASE = Firebase CDN URL → full absolute URL
 */
export function imageUrl(path: string | null | undefined): string {
  if (!path) return ''
  // Already absolute (e.g. https://...)
  if (path.startsWith('http')) return path
  return `${IMAGE_BASE}${path}`
}

export const eraIconMap: Record<string, string> = {
  'Clone Wars':   imageUrl('/images/era/clone-wars.png'),
  'Empire':       imageUrl('/images/era/empire.png'),
  'Civil War':    imageUrl('/images/era/civil-war.png'),
  'New Republic': imageUrl('/images/era/new-republic.png'),
}
