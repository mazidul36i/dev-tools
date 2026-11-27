import { useEffect, useRef } from 'react';

export interface Hotkey {
  /** `KeyboardEvent.key`, compared case-insensitively (e.g. "k", "/", "?", "Enter"). */
  key: string;
  /** Requires Ctrl (Windows/Linux) or ⌘ (macOS). */
  mod?: boolean;
  /** Fire even while typing in an input, textarea or contenteditable. */
  allowInInputs?: boolean;
  handler: (e: KeyboardEvent) => void;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.closest) return false;
  return !!el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
}

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
/** Label for the platform's command modifier. */
export const modKeyLabel = isMac ? '⌘' : 'Ctrl';

/** Global keyboard shortcuts. The list may change between renders. */
export default function useHotkeys(hotkeys: Hotkey[]) {
  const ref = useRef(hotkeys);
  useEffect(() => {
    ref.current = hotkeys;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      const mod = e.metaKey || e.ctrlKey;
      for (const hk of ref.current) {
        if (e.key.toLowerCase() !== hk.key.toLowerCase()) continue;
        if (!!hk.mod !== mod) continue;
        if (!hk.mod && e.altKey) continue;
        if (!hk.allowInInputs && isEditableTarget(e.target)) continue;
        e.preventDefault();
        hk.handler(e);
        return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
