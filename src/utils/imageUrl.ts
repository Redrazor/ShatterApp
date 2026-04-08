const IMAGE_BASE = (import.meta.env.VITE_IMAGE_BASE as string) ?? ''

/**
 * Resolves an image path against VITE_IMAGE_BASE.
 * - Local dev: IMAGE_BASE is empty → path served from public/ as-is
 * - Production: IMAGE_BASE = Firebase CDN URL → strips /images/ prefix
 *   and converts extension to .webp to match compressed output
 */
export function imageUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  if (path.startsWith('data:')) return path
  if (!IMAGE_BASE) return path

  // Firebase hosting root = public/images-compressed, so strip /images/ prefix
  const stripped = path.replace(/^\/images\//, '/')
  // Compressed files are all .webp
  const webp = stripped.replace(/\.(png|jpe?g|gif)$/i, '.webp')
  return `${IMAGE_BASE}${webp}`
}

export const eraIconMap: Record<string, string> = {
  'Clone Wars':   imageUrl('/images/era/clone-wars.png'),
  'Empire':       imageUrl('/images/era/empire.png'),
  'Civil War':    imageUrl('/images/era/civil-war.png'),
  'New Republic': imageUrl('/images/era/new-republic.png'),
}
