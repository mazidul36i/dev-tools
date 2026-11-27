import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Adds a hover state, for cards that are links or buttons. */
  hover?: boolean;
}

/** Solid panel with a hairline border. */
export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`bg-surface rounded-lg border border-border overflow-hidden mb-4
        ${hover ? 'hover:border-border-strong hover:bg-surface-hover transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
