import { type ReactNode, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'bg-surface text-text border border-border-strong hover:bg-surface-hover',
  ghost: 'text-text-secondary hover:bg-surface-hover hover:text-text',
  danger: 'text-error border border-error/40 hover:bg-error/10',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-8 px-3 text-sm gap-1.5',
  lg: 'h-9 px-4 text-sm gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export default function Button({ children, variant = 'primary', size = 'md', className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center shrink-0 whitespace-nowrap rounded-md font-medium transition-colors focus-ring
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
  return <Button variant="primary" size="md" className={className} {...props}>{children}</Button>;
}

export function SecondaryButton({ children, className = '', ...props }: ConvenienceButtonProps) {
  return <Button variant="secondary" size="md" className={className} {...props}>{children}</Button>;
}

export function SmallButton({ children, className = '', ...props }: ConvenienceButtonProps) {
  return <Button variant="ghost" size="sm" className={className} {...props}>{children}</Button>;
}
