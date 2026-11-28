import { type ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'error' | 'primary';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-alt text-text-secondary border-border-strong',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  error: 'bg-error/10 text-error border-error/30',
  primary: 'bg-primary/10 text-primary-hover border-primary/30',
};

export default function Badge({ tone = 'neutral', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium whitespace-nowrap ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
