import { describe, expect, it } from 'vitest';
import { knownSlugs, pushRecent, toggleInList } from './prefs';

describe('prefs helpers', () => {
  it('toggles membership and keeps order', () => {
    expect(toggleInList(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
    expect(toggleInList(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('moves a revisited tool to the front without duplicates', () => {
    expect(pushRecent(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b']);
    expect(pushRecent([], 'a')).toEqual(['a']);
  });

  it('caps the recent list', () => {
    expect(pushRecent(['a', 'b', 'c'], 'd', 3)).toEqual(['d', 'a', 'b']);
  });

  it('ignores corrupt or unknown stored values', () => {
    const known = new Set(['a', 'b']);
    expect(knownSlugs(['a', 'zzz', 3, 'b'], known)).toEqual(['a', 'b']);
    expect(knownSlugs('nope', known)).toEqual([]);
    expect(knownSlugs(null, known)).toEqual([]);
  });
});
