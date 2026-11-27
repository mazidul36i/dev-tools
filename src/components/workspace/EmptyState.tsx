import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

/** Centered placeholder for an empty result area. */
export default function EmptyState({ icon: Icon, title, children, className = '' }: { icon?: LucideIcon; title: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 h-full min-h-40 p-6 text-center ${className}`}>
      {Icon && <Icon size={22} aria-hidden="true" className="mb-1 text-text-muted" />}
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      {children && <div className="text-xs text-text-muted max-w-sm">{children}</div>}
    </div>
  );
}
