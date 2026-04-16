import { Loader2 } from 'lucide-react';

export default function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

