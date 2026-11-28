import { type ReactNode } from 'react';
import CopyButton from '@components/ui/CopyButton';

export interface ResultRow {
  label: ReactNode;
  value: string;
  /** Rendered instead of `value` (e.g. with badges); `value` is still what Copy copies. */
  display?: ReactNode;
  hint?: ReactNode;
  mono?: boolean;
  copy?: boolean;
}

/** Labelled values with a copy button each (calculators, inspectors). */
export default function ResultRows({ rows, labelWidth = 'sm:w-40', className = '' }: { rows: ResultRow[]; labelWidth?: string; className?: string }) {
  return (
    <dl className={`divide-y divide-border ${className}`}>
      {rows.map((r, i) => (
        <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-0.5 py-2 first:pt-0 last:pb-0">
          <dt className={`shrink-0 text-xs text-text-muted ${labelWidth}`}>{r.label}</dt>
          <dd className="flex items-center gap-2 flex-1 min-w-0">
            <span className={`flex-1 min-w-0 break-all text-sm text-text ${r.mono === false ? '' : 'font-mono text-[13px]'}`}>
              {r.display ?? (r.value || <span className="text-text-muted">—</span>)}
              {r.hint && <span className="block mt-0.5 font-sans text-xs text-text-muted">{r.hint}</span>}
            </span>
            {r.copy !== false && r.value && <CopyButton text={r.value} label="" size="sm" className="px-2!" />}
          </dd>
        </div>
      ))}
    </dl>
  );
}
