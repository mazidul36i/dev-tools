import { useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Ban, Terminal } from 'lucide-react';
import type { ConsoleEntry, ConsoleLevel } from '@lib/html-preview-utils';

const levelClass: Record<ConsoleLevel, string> = {
  log: 'text-gray-700 dark:text-gray-300',
  info: 'text-blue-600 dark:text-blue-400',
  warn: 'text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-900/20',
  error: 'text-red-600 dark:text-red-400 bg-red-50/60 dark:bg-red-900/20',
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
    <div className="shrink-0 border border-white/50 dark:border-gray-700/50 rounded-xl bg-white/30 dark:bg-gray-900/30 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5">
        <button
          onClick={onToggle}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded transition-colors focus-ring"
          aria-expanded={open}
        >
          <Terminal size={13} />
          Console
          {entries.length > 0 && (
            <span className="text-xs text-gray-600 dark:text-gray-400">({entries.length})</span>
          )}
          {errors > 0 && (
            <span className="text-[10px] px-1.5 rounded-full bg-red-500 text-white">{errors}</span>
          )}
          {warnings > 0 && (
            <span className="text-[10px] px-1.5 rounded-full bg-amber-500 text-white">{warnings}</span>
          )}
          {open ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>
        {open && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded transition-colors focus-ring"
            title="Clear console"
          >
            <Ban size={11} /> Clear
          </button>
        )}
      </div>
      {open && (
        <div ref={listRef} className="max-h-40 overflow-y-auto border-t border-white/50 dark:border-gray-700/50 font-mono text-xs">
          {entries.length === 0 ? (
            <p className="px-3 py-2 text-gray-600 dark:text-gray-400">No output yet. Use console.log() in a &lt;script&gt;.</p>
          ) : (
            entries.map((e) => (
              <pre
                key={e.id}
                className={`px-3 py-1 whitespace-pre-wrap break-all border-b border-white/30 dark:border-gray-800/60 ${levelClass[e.level]}`}
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
