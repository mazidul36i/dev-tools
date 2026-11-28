import { AlertCircle } from 'lucide-react';
import { type ReactNode } from 'react';

/** Inline error, announced to screen readers. Use instead of a toast for input errors. */
export default function ErrorNotice({ title, children, className = '' }: { title?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div role="alert" className={`flex items-start gap-2.5 p-3 rounded-md border border-error/30 bg-error/10 text-sm text-error ${className}`}>
      <AlertCircle size={16} aria-hidden="true" className="shrink-0 mt-0.5" />
      <div className="min-w-0 space-y-0.5">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">{children}</div>}
      </div>
    </div>
  );
}
