import { type ReactNode } from 'react';
import Button from '@components/ui/Button';
import useHotkeys, { modKeyLabel } from '@hooks/useHotkeys';

/** Runs `run` on Ctrl/⌘+Enter anywhere on the page, including inside editors. */
export function useRunShortcut(run: () => void, enabled = true) {
  useHotkeys(enabled ? [{ key: 'Enter', mod: true, allowInInputs: true, handler: run }] : []);
}

interface RunButtonProps {
  onClick: () => void;
  children?: ReactNode;
  disabled?: boolean;
  /** Show the ⌘↵ hint (only on the button the shortcut triggers). */
  shortcut?: boolean;
  variant?: 'primary' | 'secondary';
}

export default function RunButton({ onClick, children = 'Run', disabled, shortcut = true, variant = 'primary' }: RunButtonProps) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-keyshortcuts={shortcut ? 'Control+Enter Meta+Enter' : undefined}
      title={shortcut ? `${modKeyLabel}+Enter` : undefined}
    >
      {children}
      {shortcut && (
        <kbd aria-hidden="true" className="hidden sm:inline ml-1 px-1 rounded bg-black/10 dark:bg-black/20 text-[10px] font-sans leading-4 opacity-80">
          {modKeyLabel === 'Ctrl' ? 'Ctrl ↵' : '⌘↵'}
        </kbd>
      )}
    </Button>
  );
}
