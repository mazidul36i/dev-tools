import { useId, type ReactNode } from 'react';

interface PanelProps {
  /** Header title (plain text or a <label>). */
  title?: ReactNode;
  /** Controls on the right of the header. */
  actions?: ReactNode;
  /** Status bar under the body. */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Body classes; defaults to padded. Pass "" for edge-to-edge content. */
  bodyClassName?: string;
}

/** Bordered panel with an optional header, body and status footer. */
export default function Panel({ title, actions, footer, children, className = '', bodyClassName = 'p-4' }: PanelProps) {
  const id = useId();
  const titled = title !== undefined && title !== null;
  return (
    <section
      aria-labelledby={typeof title === 'string' ? id : undefined}
      className={`flex flex-col min-w-0 min-h-0 rounded-lg border border-border bg-surface overflow-hidden ${className}`}
    >
      {(titled || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 min-h-10 px-3 py-1.5 border-b border-border shrink-0">
          <div id={id} className="min-w-0 text-xs font-semibold uppercase tracking-wider text-text-muted">
            {title}
          </div>
          {actions && <div className="flex flex-wrap items-center justify-end gap-1 ml-auto">{actions}</div>}
        </header>
      )}
      <div className={`flex-1 min-h-0 min-w-0 ${bodyClassName}`}>{children}</div>
      {footer && (
        <footer className="flex items-center gap-3 min-h-8 px-3 border-t border-border text-xs text-text-muted shrink-0 overflow-x-auto whitespace-nowrap">
          {footer}
        </footer>
      )}
    </section>
  );
}
