import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseOptions, serializeOptions, type OptionSchema, type OptionValues } from '@lib/url-state';

interface UrlOptionsConfig<S extends OptionSchema> {
  /**
   * Fields that are also remembered in localStorage, mapped to their storage
   * key (JSON-encoded, the same format as useLocalStorage). Lets existing
   * saved preferences keep working. The URL always wins over storage.
   */
  persist?: Partial<Record<keyof S, string>>;
}

function readStored(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/**
 * Tool options mirrored to the query string (defaults omitted, history
 * replaced rather than pushed), so "Copy link" reproduces the setup.
 */
export default function useUrlOptions<S extends OptionSchema>(schema: S, config: UrlOptionsConfig<S> = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const persist = config.persist ?? {};

  const [values, setValues] = useState<OptionValues<S>>(() => {
    const stored: Partial<Record<keyof S, unknown>> = {};
    for (const [field, key] of Object.entries(persist) as [keyof S, string][]) stored[field] = readStored(key);
    return parseOptions(schema, searchParams, stored);
  });

  // Write to the URL after render, keeping params owned by others (e.g. ?tab).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      // Only rewrite the URL on load if it held invalid or default values.
      const clean = serializeOptions(schema, values, searchParams);
      if (clean.toString() !== searchParams.toString()) setSearchParams(clean, { replace: true });
      return;
    }
    setSearchParams((prev) => serializeOptions(schema, values, prev), { replace: true });
    for (const [field, key] of Object.entries(persist) as [keyof S, string][]) {
      try {
        localStorage.setItem(key, JSON.stringify(values[field]));
      } catch {
        // Storage can be unavailable (private mode); the URL still works.
      }
    }
    // schema and persist are module-level constants in callers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const update = useCallback((patch: Partial<OptionValues<S>>) => {
    setValues((prev) => {
      const next = { ...prev, ...patch };
      return Object.keys(patch).some((k) => prev[k as keyof S] !== next[k as keyof S]) ? next : prev;
    });
  }, []);

  return [values, update] as const;
}
