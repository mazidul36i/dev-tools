import { useCallback, useId, type ReactNode } from 'react';
import { toast } from 'sonner';
import { AlertCircle, ArrowUpDown, Clipboard, Download, Eraser } from 'lucide-react';
import CopyButton from '@components/ui/CopyButton';
import { SecondaryButton, SmallButton } from '@components/ui/Button';
import { TextAreaInput, TextAreaOutput } from '@components/ui/TextArea';
import { downloadFile } from '@lib/download-utils';

interface ToolIOProps {
  input: string;
  onInputChange: (value: string) => void;
  output: string;
  /** Shown in place of the output when set. */
  error?: string | null;
  /** Controls rendered above the action row (selectors, checkboxes...). */
  options?: ReactNode;
  /** Primary action buttons rendered between input and output. */
  actions?: ReactNode;
  /** When given, a "Swap" button is added to the action row. */
  onSwap?: () => void;
  inputLabel?: string;
  outputLabel?: string;
  inputPlaceholder?: string;
  outputPlaceholder?: string;
  /** File name for the Download button; the button is hidden when omitted. */
  downloadName?: string;
  downloadMime?: string;
  /** `side` puts input and output next to each other on large screens. */
  layout?: 'stacked' | 'side';
  inputClassName?: string;
  outputClassName?: string;
}

/**
 * The common "input → actions → output" shell used by text-based tools,
 * with Clear / Paste on the input and Copy / Download on the output.
 */
export default function ToolIO({
  input,
  onInputChange,
  output,
  error,
  options,
  actions,
  onSwap,
  inputLabel = 'Input:',
  outputLabel = 'Output:',
  inputPlaceholder = 'Enter or paste your input here...',
  outputPlaceholder = 'Result will appear here...',
  downloadName,
  downloadMime,
  layout = 'stacked',
  inputClassName = '',
  outputClassName = '',
}: ToolIOProps) {
  const inputId = useId();

  const handlePaste = useCallback(async () => {
    try {
      onInputChange(await navigator.clipboard.readText());
    } catch {
      toast.error('Unable to paste');
    }
  }, [onInputChange]);

  const handleDownload = useCallback(() => {
    if (!output) {
      toast.error('No content to download');
      return;
    }
    downloadFile(output, downloadName ?? 'output.txt', downloadMime);
  }, [output, downloadName, downloadMime]);

  const inputBlock = (
    <div className="min-w-0">
      <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary mb-2">
        {inputLabel}
      </label>
      <TextAreaInput
        id={inputId}
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder={inputPlaceholder}
        spellCheck={false}
        className={inputClassName}
      />
      <div className="flex gap-2 mt-2">
        <SmallButton onClick={() => onInputChange('')}><Eraser size={12} /> Clear</SmallButton>
        <SmallButton onClick={handlePaste}><Clipboard size={12} /> Paste</SmallButton>
      </div>
    </div>
  );

  const outputBlock = (
    <div className="min-w-0">
      <span className="block text-sm font-medium text-text-secondary mb-2">{outputLabel}</span>
      {error ? (
        <div className="flex items-start gap-2 p-3.5 min-h-35 rounded-lg border border-error/30 bg-error/5 text-error text-sm font-mono whitespace-pre-wrap break-words">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : (
        <TextAreaOutput value={output} placeholder={outputPlaceholder} className={outputClassName} />
      )}
      <div className="flex gap-2 mt-2">
        <CopyButton text={error ? '' : output} label="Copy" size="sm" />
        {downloadName && (
          <SmallButton onClick={handleDownload}><Download size={12} /> Download</SmallButton>
        )}
      </div>
    </div>
  );

  const actionRow = (actions || onSwap) && (
    <div className="flex flex-wrap gap-3">
      {actions}
      {onSwap && (
        <SecondaryButton onClick={onSwap} title="Swap input and output">
          <ArrowUpDown size={15} /> Swap
        </SecondaryButton>
      )}
    </div>
  );

  if (layout === 'side') {
    return (
      <div className="space-y-5">
        {options}
        {actionRow}
        <div className="grid lg:grid-cols-2 gap-5">
          {inputBlock}
          {outputBlock}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {inputBlock}
      {options}
      {actionRow}
      {outputBlock}
    </div>
  );
}
