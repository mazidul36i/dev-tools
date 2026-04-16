import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CopyButton({ text, label = 'Copy', className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) {
      toast.error('Nothing to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all
        bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:-translate-y-0.5 ${className}`}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

