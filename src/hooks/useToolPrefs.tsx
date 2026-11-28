import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import useLocalStorage from './useLocalStorage';
import { knownSlugs, pushRecent, toggleInList } from '@lib/prefs';
import { tools } from '../tools';

const KNOWN = new Set(tools.map((t) => t.slug));

interface ToolPrefs {
  favorites: string[];
  recent: string[];
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (slug: string) => void;
  recordVisit: (slug: string) => void;
}

const ToolPrefsContext = createContext<ToolPrefs | null>(null);

/** Favourite and recently used tools, persisted in localStorage. */
export function ToolPrefsProvider({ children }: { children: ReactNode }) {
  const [rawFavorites, setFavorites] = useLocalStorage<string[]>('devtools:favorites', []);
  const [rawRecent, setRecent] = useLocalStorage<string[]>('devtools:recent', []);

  const favorites = useMemo(() => knownSlugs(rawFavorites, KNOWN), [rawFavorites]);
  const recent = useMemo(() => knownSlugs(rawRecent, KNOWN), [rawRecent]);

  const toggleFavorite = useCallback(
    (slug: string) => setFavorites((prev) => toggleInList(knownSlugs(prev, KNOWN), slug)),
    [setFavorites],
  );
  const recordVisit = useCallback(
    (slug: string) => setRecent((prev) => pushRecent(knownSlugs(prev, KNOWN), slug)),
    [setRecent],
  );
  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites]);

  const value = useMemo(
    () => ({ favorites, recent, isFavorite, toggleFavorite, recordVisit }),
    [favorites, recent, isFavorite, toggleFavorite, recordVisit],
  );
  return <ToolPrefsContext.Provider value={value}>{children}</ToolPrefsContext.Provider>;
}

export function useToolPrefs(): ToolPrefs {
  const ctx = useContext(ToolPrefsContext);
  if (!ctx) throw new Error('useToolPrefs must be used inside <ToolPrefsProvider>');
  return ctx;
}
