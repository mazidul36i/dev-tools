import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  className?: string;
}

export default function Spinner({ className = '' }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center min-h-screen ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-sm text-text-muted">Loading...</span>
      </div>
    </div>
  );
}
