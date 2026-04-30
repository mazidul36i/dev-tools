import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface CopyButtonProps {
  text: string;
  label?: string;
  size?: 'default' | 'sm';
  className?: string;
}

export default function CopyButton({ text, label = 'Copy', size = 'default', className = '' }: CopyButtonProps) {
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

  const sizeClasses = size === 'sm'
    ? 'text-xs px-3 py-1.5'
    : 'text-sm px-4 py-2';

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-all duration-200
        bg-surface text-text-secondary border border-border hover:bg-surface-hover hover:border-primary/30
        active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-primary/30
        ${sizeClasses} ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }} className="inline-flex">
            <Check size={size === 'sm' ? 13 : 15} className="text-success" />
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }} className="inline-flex">
            <Copy size={size === 'sm' ? 13 : 15} />
          </motion.span>
        )}
      </AnimatePresence>
      {copied ? 'Copied!' : label}
    </button>
  );
}
