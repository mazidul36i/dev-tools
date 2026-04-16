export function TextAreaInput({ id, value, onChange, placeholder, className = '', ...props }) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full p-3.5 border border-slate-200 rounded-lg font-mono text-sm min-h-40 resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${className}`}
      {...props}
    />
  );
}

export function TextAreaOutput({ value, className = '', ...props }) {
  return (
    <textarea
      value={value}
      readOnly
      className={`w-full p-3.5 border border-slate-200 rounded-lg font-mono text-sm min-h-35 resize-y bg-slate-50 cursor-default ${className}`}
      {...props}
    />
  );
}

