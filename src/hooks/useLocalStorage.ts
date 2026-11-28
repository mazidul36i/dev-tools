import { useState, useCallback, useEffect } from 'react';

function read<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * State persisted to localStorage as JSON. Changes made in other tabs are
 * picked up through the `storage` event. Read/write failures (private mode,
 * quota, corrupt JSON) fall back to the in-memory value.
 */
export default function useLocalStorage<T>(key: string, initialValue: T): [T, (newValue: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => read(key, initialValue));

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Ignore write errors (e.g. quota exceeded)
        }
        return resolved;
      });
    },
    [key]
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== localStorage || e.key !== key) return;
      setValue(e.newValue === null ? initialValue : read(key, initialValue));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // initialValue is a default; changing its identity must not re-subscribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, setStoredValue];
}
