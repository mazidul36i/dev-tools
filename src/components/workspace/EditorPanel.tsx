import { useId, useMemo, useRef, useState, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { toast } from 'sonner';
import { Clipboard, Eraser, FileUp, Sparkles } from 'lucide-react';
import Panel from './Panel';
import { formatBytes } from '@lib/image-utils';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

interface EditorPanelProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Adds a "Sample" button that loads this text. */
  sample?: string;
  /** Adds "Open file" and drag-and-drop, limited to these types (e.g. ".json,application/json"). */
  fileAccept?: string;
  /** Custom handling for an opened/dropped file; by default its text replaces the value. */
  onFile?: (file: File) => void;
  maxFileBytes?: number;
  /** Extra header actions, before the standard ones. */
  actions?: ReactNode;
  /** Extra status text, left of the counters. */
  status?: ReactNode;
  className?: string;
  /** Classes for the textarea (e.g. a min-height in page layouts). */
  textareaClassName?: string;
  textareaProps?: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'placeholder'>;
  hidePaste?: boolean;
}

export function textCounts(value: string) {
  return {
    lines: value ? value.split('\n').length : 0,
    chars: value.length,
    bytes: new TextEncoder().encode(value).length,
  };
}

const action =
  'inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs text-text-secondary hover:text-text hover:bg-surface-hover transition-colors focus-ring';

/** Monospace input editor with Paste / Open file / Sample / Clear and live counts. */
export default function EditorPanel({
  label, value, onChange, placeholder, sample, fileAccept, onFile, maxFileBytes = MAX_FILE_BYTES,
  actions, status, className = '', textareaClassName = '', textareaProps, hidePaste = false,
}: EditorPanelProps) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const counts = useMemo(() => textCounts(value), [value]);

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > maxFileBytes) {
      toast.error(`${file.name} is larger than ${formatBytes(maxFileBytes)}`);
      return;
    }
    if (onFile) return onFile(file);
    try {
      onChange(await file.text());
    } catch {
      toast.error(`Could not read ${file.name}`);
    }
  };

  const paste = async () => {
    try {
      onChange(await navigator.clipboard.readText());
    } catch {
      toast.error('Clipboard access was blocked. Paste with Ctrl+V instead.');
    }
  };

  return (
    <Panel
      title={<label htmlFor={id}>{label}</label>}
      className={`focus-within:border-primary/60 ${dragging ? 'border-primary! ring-2 ring-primary/25' : ''} ${className}`}
      bodyClassName="flex"
      actions={
        <>
          {actions}
          {!hidePaste && (
            <button type="button" onClick={paste} className={action}>
              <Clipboard size={13} aria-hidden="true" /> Paste
            </button>
          )}
          {fileAccept !== undefined && (
            <>
              <button type="button" onClick={() => fileRef.current?.click()} className={action}>
                <FileUp size={13} aria-hidden="true" /> Open
              </button>
              <input
                ref={fileRef}
                type="file"
                accept={fileAccept}
                hidden
                onChange={(e) => {
                  readFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </>
          )}
          {sample !== undefined && (
            <button type="button" onClick={() => onChange(sample)} className={action}>
              <Sparkles size={13} aria-hidden="true" /> Sample
            </button>
          )}
          <button type="button" onClick={() => onChange('')} disabled={!value} className={`${action} disabled:opacity-40 disabled:pointer-events-none`}>
            <Eraser size={13} aria-hidden="true" /> Clear
          </button>
        </>
      }
      footer={
        <>
          {status && <span className="min-w-0 truncate">{status}</span>}
          <span className="ml-auto tabular-nums">
            {counts.lines.toLocaleString()} {counts.lines === 1 ? 'line' : 'lines'} · {counts.chars.toLocaleString()} chars · {formatBytes(counts.bytes)}
          </span>
        </>
      }
    >
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        onDragOver={fileAccept !== undefined ? (e) => { e.preventDefault(); setDragging(true); } : undefined}
        onDragLeave={() => setDragging(false)}
        onDrop={fileAccept !== undefined ? (e) => {
          e.preventDefault();
          setDragging(false);
          readFile(e.dataTransfer.files?.[0]);
        } : undefined}
        className={`flex-1 w-full min-h-56 p-3 resize-none bg-surface-alt font-mono text-[13px] leading-relaxed text-text
          placeholder:text-text-muted focus:outline-none [tab-size:2] ${textareaClassName}`}
        {...textareaProps}
      />
    </Panel>
  );
}
