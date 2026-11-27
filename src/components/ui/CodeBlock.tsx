import { type ReactNode } from 'react';
import CopyButton from '@components/ui/CopyButton';

interface CodeBlockProps {
  code: string;
  title?: ReactNode;
  /** Extra controls rendered next to the copy button. */
  actions?: ReactNode;
  className?: string;
  /** Class for the <pre>, e.g. to cap the height. */
  preClassName?: string;
  placeholder?: string;
}

/** Read-only monospace block with a header row and a copy button. */
export default function CodeBlock({ code, title, actions, className = '', preClassName = '', placeholder }: CodeBlockProps) {
  return (
    <div className={`min-w-0 flex flex-col rounded-md border border-border bg-surface-alt overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-2 px-3 h-9 border-b border-border bg-surface">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted truncate">{title}</span>
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          <CopyButton text={code} size="sm" />
        </div>
      </div>
      <pre className={`flex-1 [tab-size:4] p-3 font-mono text-[13px] leading-relaxed text-text whitespace-pre-wrap break-words overflow-auto ${preClassName}`}>
        {code || <span className="text-text-muted">{placeholder}</span>}
      </pre>
    </div>
  );
}
