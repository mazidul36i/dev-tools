/** Pure helpers for the favourites / recently-used lists (stored as tool slugs). */

export const MAX_RECENT = 8;

/** Adds `slug` if absent, removes it if present. Keeps insertion order. */
export function toggleInList(list: string[], slug: string): string[] {
  return list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];
}

/** Moves `slug` to the front, de-duplicated and capped at `max`. */
export function pushRecent(list: string[], slug: string, max = MAX_RECENT): string[] {
  return [slug, ...list.filter((s) => s !== slug)].slice(0, max);
}

/** Drops slugs that no longer exist (a tool was renamed or removed). */
export function knownSlugs(list: unknown, known: ReadonlySet<string>): string[] {
  if (!Array.isArray(list)) return [];
  return list.filter((s): s is string => typeof s === 'string' && known.has(s));
}
