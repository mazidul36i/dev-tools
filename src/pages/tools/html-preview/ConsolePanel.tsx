import { useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Ban, Terminal } from 'lucide-react';
import type { ConsoleEntry, ConsoleLevel } from '@lib/html-preview-utils';

const levelClass: Record<ConsoleLevel, string> = {
  log: 'text-text',
  info: 'text-primary',
  warn: 'text-warning bg-warning/10',
  error: 'text-error bg-error/10',
};

interface ConsolePanelProps {
  entries: ConsoleEntry[];
  open: boolean;
  onToggle: () => void;
  onClear: () => void;
}

export default function ConsolePanel({ entries, open, onToggle, onClear }: ConsolePanelProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const errors = entries.filter((e) => e.level === 'error').length;
  const warnings = entries.filter((e) => e.level === 'warn').length;

  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [entries, open]);

  return (
    <div className="shrink-0 border-t border-border bg-surface">
      <div className="flex items-center justify-between px-3 py-1.5">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-1.5 h-7 text-xs font-medium text-text-secondary hover:text-text rounded transition-colors focus-ring"
          aria-expanded={open}
        >
          <Terminal size={13} aria-hidden="true" />
          Console
          {entries.length > 0 && (
            <span className="text-xs text-text-muted">({entries.length})</span>
          )}
          {errors > 0 && (
            <span className="text-[11px] px-1.5 rounded-full bg-error/15 text-error" aria-label={`${errors} errors`}>{errors}</span>
          )}
          {warnings > 0 && (
            <span className="text-[11px] px-1.5 rounded-full bg-warning/15 text-warning" aria-label={`${warnings} warnings`}>{warnings}</span>
          )}
          {open ? <ChevronDown size={13} aria-hidden="true" /> : <ChevronUp size={13} aria-hidden="true" />}
        </button>
        {open && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 h-7 text-xs text-text-secondary hover:text-text rounded transition-colors focus-ring"
            title="Clear console"
          >
            <Ban size={11} aria-hidden="true" /> Clear
          </button>
        )}
      </div>
      {open && (
        <div ref={listRef} role="log" aria-label="Console output" className="max-h-40 overflow-y-auto border-t border-border font-mono text-xs bg-surface-alt">
          {entries.length === 0 ? (
            <p className="px-3 py-2 text-text-muted">No output yet. Use console.log() in a &lt;script&gt;.</p>
          ) : (
            entries.map((e) => (
              <pre
                key={e.id}
                className={`px-3 py-1 whitespace-pre-wrap break-all border-b border-border-light ${levelClass[e.level]}`}
              >
                {e.text}
              </pre>
            ))
          )}
        </div>
      )}
    </div>
  );
}
