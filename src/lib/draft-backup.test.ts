import { describe, expect, it } from 'vitest';
import { backupDraft, backupKey, readBackup, type DraftStore } from './draft-backup';

function memoryStore(): DraftStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

describe('backupDraft', () => {
  it('saves a real draft before it is replaced', () => {
    const store = memoryStore();
    expect(backupDraft(store, 'doc', 'my notes', 'shared text')).toBe(true);
    expect(readBackup(store, 'doc')).toBe('my notes');
    expect(store.data.has(backupKey('doc'))).toBe(true);
  });

  it('skips empty drafts, identical content and built-in samples', () => {
    const store = memoryStore();
    expect(backupDraft(store, 'doc', '   ', 'x')).toBe(false);
    expect(backupDraft(store, 'doc', 'same', 'same')).toBe(false);
    expect(backupDraft(store, 'doc', '# Sample', 'x', ['# Sample'])).toBe(false);
    expect(readBackup(store, 'doc')).toBeNull();
  });

  it('keeps going when storage throws', () => {
    const failing: DraftStore = {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('quota'); },
    };
    expect(backupDraft(failing, 'doc', 'a', 'b')).toBe(false);
    expect(readBackup(failing, 'doc')).toBeNull();
  });
});
