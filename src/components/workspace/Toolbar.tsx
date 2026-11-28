import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';

/** A wrapping row of tool options and actions above a workspace. */
export function Toolbar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-wrap items-center gap-x-2 gap-y-2 mb-3 shrink-0 ${className}`}>{children}</div>;
}

export function ToolbarDivider() {
  return <span aria-hidden="true" className="hidden sm:block w-px h-5 mx-1 bg-border" />;
}

/** Pushes the following items to the right edge. */
export function ToolbarSpacer() {
  return <span aria-hidden="true" className="flex-1" />;
}

interface ToolbarSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  /** Hide the visible label (it stays the accessible name). */
  hideLabel?: boolean;
}

/** Compact labelled select for toolbars. */
export function ToolbarSelect({ label, value, onChange, options, hideLabel = false, className = '', ...rest }: ToolbarSelectProps) {
  const id = useId();
  return (
    <span className="inline-flex items-center gap-1.5">
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'text-xs text-text-muted whitespace-nowrap'}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-7 pl-2 pr-7 rounded-md bg-surface-alt border border-border-strong text-xs text-text
          focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 ${className}`}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </span>
  );
}
