export function TextAreaInput({ id, value, onChange, placeholder, className = '', ...props }) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full p-3.5 bg-surface border border-border rounded-lg font-mono text-sm text-text min-h-40 resize-y
        placeholder:text-text-muted
        focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
        transition-all duration-200 ${className}`}
      {...props}
    />
  );
}

export function TextAreaOutput({ value, className = '', ...props }) {
  return (
    <textarea
      value={value}
      readOnly
      className={`w-full p-3.5 bg-surface-alt border border-border rounded-lg font-mono text-sm text-text-secondary min-h-35 resize-y cursor-default
        ${className}`}
      {...props}
    />
  );
}
