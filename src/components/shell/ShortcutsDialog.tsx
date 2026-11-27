import { X } from 'lucide-react';
import Dialog from '@components/ui/Dialog';
import { modKeyLabel } from '@hooks/useHotkeys';

const shortcuts: [string[], string][] = [
  [[modKeyLabel, 'K'], 'Open the command palette'],
  [['/'], 'Focus search'],
  [[modKeyLabel, 'Enter'], 'Run the current tool'],
  [['?'], 'Show keyboard shortcuts'],
  [['Esc'], 'Close dialogs, clear a search'],
];

export default function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="shortcuts-title" className="w-[min(440px,calc(100vw-2rem))] m-auto">
      <div className="w-full rounded-xl border border-border-strong bg-surface shadow-float">
        <div className="flex items-center justify-between h-12 px-4 border-b border-border">
          <h2 id="shortcuts-title" className="text-sm font-semibold">Keyboard shortcuts</h2>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Close"
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-text-muted hover:text-text hover:bg-surface-hover focus-ring"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <dl className="p-2">
          {shortcuts.map(([keys, label]) => (
            <div key={label} className="flex items-center justify-between gap-4 h-10 px-2 rounded-md text-sm">
              <dt className="text-text-secondary">{label}</dt>
              <dd className="flex items-center gap-1">
                {keys.map((k) => (
                  <kbd key={k} className="min-w-6 px-1.5 rounded border border-border-strong bg-surface-alt text-center text-xs leading-5 text-text">
                    {k}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Dialog>
  );
}
