import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';

const base = `w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text
  placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
  transition-all duration-200 disabled:opacity-60`;

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = '', ...props }, ref) {
    return <input ref={ref} className={`${base} ${className}`} {...props} />;
  },
);

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export function SelectInput({ options, className = '', ...props }: SelectInputProps) {
  return (
    <select className={`${base} pr-8 cursor-pointer ${className}`} {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

interface FieldProps {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Label + control + optional hint, stacked. */
export function Field({ label, htmlFor, hint, children, className = '' }: FieldProps) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-text-muted mt-1">{hint}</p>}
    </div>
  );
}
