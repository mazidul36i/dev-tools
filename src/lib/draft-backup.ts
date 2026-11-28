/** Keeps a copy of a saved document before a share link replaces it. */

export interface DraftStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const backupKey = (key: string) => `${key}:backup`;

/**
 * Copies `current` to `<key>:backup` when it's worth keeping: non-empty, not
 * the same as what replaces it, and not one of the built-in samples/templates.
 * Returns true when a backup was written.
 */
export function backupDraft(store: DraftStore, key: string, current: string, incoming: string, disposable: readonly string[] = []): boolean {
  if (!current.trim() || current === incoming || disposable.includes(current)) return false;
  try {
    store.setItem(backupKey(key), current);
    return true;
  } catch {
    // Storage full or unavailable: nothing to restore later.
    return false;
  }
}

export function readBackup(store: DraftStore, key: string): string | null {
  try {
    return store.getItem(backupKey(key));
  } catch {
    return null;
  }
}
