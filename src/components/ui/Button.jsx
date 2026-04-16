const variants = {
  primary: 'bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 shadow-soft hover:shadow-card',
  secondary: 'bg-surface text-text-secondary border border-border hover:bg-surface-hover hover:border-primary/30',
  ghost: 'text-text-muted hover:bg-surface-hover hover:text-text',
  danger: 'bg-error/10 text-error border border-error/20 hover:bg-error/20',
};

const sizes = {
  sm: 'text-xs px-3 py-1.5 gap-1',
  md: 'text-sm px-4 py-2 gap-1.5',
  lg: 'text-sm px-5 py-2.5 gap-2',
};

export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200
        active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1
        disabled:opacity-50 disabled:pointer-events-none
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Convenience exports for backward compatibility
export function PrimaryButton({ children, className = '', ...props }) {
  return <Button variant="primary" size="lg" className={className} {...props}>{children}</Button>;
}

export function SecondaryButton({ children, className = '', ...props }) {
  return <Button variant="secondary" size="md" className={className} {...props}>{children}</Button>;
}

export function SmallButton({ children, className = '', ...props }) {
  return <Button variant="ghost" size="sm" className={className} {...props}>{children}</Button>;
}
