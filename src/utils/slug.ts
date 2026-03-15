/**
 * Converts a character name to a URL-safe slug.
 * Examples:
 *   "Bo-Katan Kryze"  → "bo-katan-kryze"
 *   "R2-D2"           → "r2-d2"
 *   "C-3PO"           → "c-3po"
 *   "501st Legion"    → "501st-legion"
 *   "Asajj Ventress"  → "asajj-ventress"
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''']/g, '')          // drop apostrophes
    .replace(/[^a-z0-9]+/g, '-')   // non-alphanumeric run → single hyphen
    .replace(/^-+|-+$/g, '')       // trim leading/trailing hyphens
}
