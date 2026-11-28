import { Copy, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface CopyButtonProps {
  text: string;
  label?: string;
  size?: 'default' | 'sm';
  className?: string;
}

export default function CopyButton({ text, label = 'Copy', size = 'default', className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(resetTimer.current), []);
  // Icon-only buttons (label="") still need a name for screen readers.
  const iconOnly = !label;

  const handleCopy = async () => {
    if (!text) {
      toast.error('Nothing to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const sizeClasses = size === 'sm'
    ? 'h-7 text-xs px-2.5'
    : 'h-8 text-sm px-3';

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={iconOnly ? (copied ? 'Copied' : 'Copy to clipboard') : undefined}
      title={iconOnly ? 'Copy to clipboard' : undefined}
      className={`inline-flex items-center justify-center shrink-0 gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors
        bg-surface text-text border border-border-strong hover:bg-surface-hover focus-ring
        ${sizeClasses} ${className}`}
    >
      {/* The key remounts the icon so the pop-in plays on each swap (skipped with reduced motion). */}
      <span key={copied ? 'check' : 'copy'} aria-hidden="true" className="inline-flex motion-safe:animate-pop">
        {copied ? <Check size={size === 'sm' ? 13 : 15} className="text-success" /> : <Copy size={size === 'sm' ? 13 : 15} />}
      </span>
      {!iconOnly && (copied ? 'Copied!' : label)}
    </button>
  );
}
