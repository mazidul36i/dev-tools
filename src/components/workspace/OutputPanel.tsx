import { useMemo, type ReactNode } from 'react';
import { CornerUpLeft, Download } from 'lucide-react';
import Panel from './Panel';
import ErrorNotice from './ErrorNotice';
import { textCounts } from './EditorPanel';
import CopyButton from '@components/ui/CopyButton';
import { downloadFile } from '@lib/download-utils';
import { formatBytes } from '@lib/image-utils';

interface OutputPanelProps {
  label?: string;
  value: string;
  /** Shown inline instead of the output. */
  error?: ReactNode;
  errorTitle?: ReactNode;
  placeholder?: string;
  /** Adds a Download button with this file name. */
  downloadName?: string;
  downloadMime?: string;
  /** Adds "Use as input". */
  onUseAsInput?: () => void;
  /** Extra header actions, before Copy. */
  actions?: ReactNode;
  /** Status text in the footer (announced politely). */
  status?: ReactNode;
  /** Custom body (tree view, table…) instead of the text area. */
  children?: ReactNode;
  className?: string;
  textareaClassName?: string;
}

const action =
  'inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs text-text-secondary hover:text-text hover:bg-surface-hover transition-colors focus-ring disabled:opacity-40 disabled:pointer-events-none';

/** Read-only result with Copy / Download / Use as input, inline errors and counts. */
export default function OutputPanel({
  label = 'Output', value, error, errorTitle, placeholder = 'Output appears here', downloadName, downloadMime,
  onUseAsInput, actions, status, children, className = '', textareaClassName = '',
}: OutputPanelProps) {
  const counts = useMemo(() => textCounts(error ? '' : value), [value, error]);
  const hasValue = !error && !!value;

  return (
    <Panel
      title={label}
      className={className}
      bodyClassName="flex flex-col"
      actions={
        <>
          {actions}
          {onUseAsInput && (
            <button type="button" onClick={onUseAsInput} disabled={!hasValue} className={action} title="Use the output as the new input">
              <CornerUpLeft size={13} aria-hidden="true" /> Use as input
            </button>
          )}
          {downloadName && (
            <button type="button" onClick={() => downloadFile(value, downloadName, downloadMime)} disabled={!hasValue} className={action}>
              <Download size={13} aria-hidden="true" /> Download
            </button>
          )}
          <CopyButton text={hasValue ? value : ''} size="sm" className="h-7! border-transparent! bg-transparent! hover:bg-surface-hover! text-text-secondary hover:text-text" />
        </>
      }
      footer={
        <>
          <span role="status" className="min-w-0 truncate">{status}</span>
          {hasValue && (
            <span className="ml-auto tabular-nums">
              {counts.lines.toLocaleString()} {counts.lines === 1 ? 'line' : 'lines'} · {formatBytes(counts.bytes)}
            </span>
          )}
        </>
      }
    >
      {error ? (
        <div className="p-3 overflow-auto">
          <ErrorNotice title={errorTitle}>{error}</ErrorNotice>
        </div>
      ) : children ? (
        <div className="flex-1 min-h-56 overflow-auto bg-surface-alt">{children}</div>
      ) : (
        <textarea
          readOnly
          aria-label={label}
          value={value}
          placeholder={placeholder}
          spellCheck={false}
          className={`flex-1 w-full min-h-56 p-3 resize-none bg-surface-alt font-mono text-[13px] leading-relaxed text-text
            placeholder:text-text-muted focus:outline-none [tab-size:2] ${textareaClassName}`}
        />
      )}
    </Panel>
  );
}
