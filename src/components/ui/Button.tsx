import { type ReactNode, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 shadow-soft hover:shadow-card',
  secondary: 'bg-surface text-text-secondary border border-border hover:bg-surface-hover hover:border-primary/30',
  ghost: 'text-text-muted hover:bg-surface-hover hover:text-text',
  danger: 'bg-error/10 text-error border border-error/20 hover:bg-error/20',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1',
  md: 'text-sm px-4 py-2 gap-1.5',
  lg: 'text-sm px-5 py-2.5 gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
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
interface ConvenienceButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export function PrimaryButton({ children, className = '', ...props }: ConvenienceButtonProps) {
  return <Button variant="primary" size="lg" className={className} {...props}>{children}</Button>;
}

export function SecondaryButton({ children, className = '', ...props }: ConvenienceButtonProps) {
  return <Button variant="secondary" size="md" className={className} {...props}>{children}</Button>;
}

export function SmallButton({ children, className = '', ...props }: ConvenienceButtonProps) {
  return <Button variant="ghost" size="sm" className={className} {...props}>{children}</Button>;
}
