import { useRef, useState, type ReactNode } from 'react';
import { Upload } from 'lucide-react';

interface FileDropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title?: ReactNode;
  hint?: ReactNode;
  className?: string;
  /** Compact single-line variant. */
  compact?: boolean;
}

/** Click-to-browse and drag-and-drop file picker. */
export default function FileDropZone({
  onFiles,
  accept,
  multiple = false,
  title = 'Drop a file here or click to browse',
  hint,
  className = '',
  compact = false,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const emit = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => {
        // Moving over a child fires dragleave on the parent; only reset when the pointer really leaves.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(e) => { e.preventDefault(); setDragging(false); emit(e.dataTransfer.files); }}
      className={`border border-dashed rounded-md text-center cursor-pointer transition-colors
        focus-ring
        ${compact ? 'p-4 flex items-center justify-center gap-3' : 'p-8'}
        ${dragging ? 'border-primary bg-primary-subtle' : 'border-border-strong bg-surface-alt hover:border-primary hover:bg-primary-subtle'}
        ${className}`}
    >
      <Upload className={`${compact ? 'w-5 h-5' : 'w-9 h-9 mx-auto mb-3'} transition-colors ${dragging ? 'text-primary' : 'text-text-muted'}`} />
      <div>
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        {hint && <p className="text-xs text-text-muted mt-1">{hint}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => {
          emit(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
