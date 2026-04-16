export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-all hover:-translate-y-0.5 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SmallButton({ children, className = '', ...props }) {
  return (
    <button
      className={`text-xs px-3 py-1.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium inline-flex items-center gap-1 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

