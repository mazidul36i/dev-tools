import { useDeferredValue, useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import SegmentedControl from '@components/ui/SegmentedControl';
import Button from '@components/ui/Button';
import { EditorPanel, OutputPanel, SplitPane, Toolbar, ToolbarSpacer } from '@components/workspace';
import { compressGzip, decompressGzip } from '@lib/gzip-utils';
import { formatBytes } from '@lib/image-utils';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import { useShareInput } from '@hooks/useShareInput';

const schema = { dir: opt.oneOf(['compress', 'decompress'] as const, 'compress') };

export default function GzipConverterPage() {
  const [input, setInput] = useState('');
  const [o, setO] = useUrlOptions(schema);
  const deferred = useDeferredValue(input);
  const compress = o.dir === 'compress';

  const { output, error } = useMemo(() => {
    if (!deferred) return { output: '', error: null };
    try {
      return { output: compress ? compressGzip(deferred) : decompressGzip(deferred), error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [deferred, compress]);

  useShareInput({ input }, (d) => d.input !== undefined && setInput(d.input), { enabled: input.length > 0 });

  // Compressed size is the decoded Base64 length.
  const ratio = useMemo(() => {
    if (!compress || !output || !deferred) return null;
    const raw = new TextEncoder().encode(deferred).length;
    const gz = Math.floor((output.length * 3) / 4) - (output.endsWith('==') ? 2 : output.endsWith('=') ? 1 : 0);
    return `${formatBytes(raw)} → ${formatBytes(gz)} gzip (${Math.round((gz / raw) * 100)}%)`;
  }, [compress, output, deferred]);

  return (
    <ToolLayout
      seoTitle="Gzip Compress & Decompress (Base64)"
      tagline="Gzip text to Base64, or gunzip Base64 back to text with partial recovery of damaged data"
      metaDescription="Compress text to gzip (base64-encoded) or decompress base64-encoded gzip data back to text. Supports partial recovery for corrupted data."
      variant="workspace"
      about={
        <ul className="grid gap-3 md:grid-cols-2">
          <li><strong className="text-text">Compress</strong> gzips the UTF-8 text and shows the bytes as Base64 (it starts with <code>H4sI</code>), handy for logs, headers and JSON fields.</li>
          <li><strong className="text-text">Decompress</strong> takes that Base64 back to text. If the data is truncated or damaged it tries a raw inflate to recover as much as possible.</li>
        </ul>
      }
    >
      <Toolbar>
        <SegmentedControl ariaLabel="Direction" options={[{ id: 'compress', label: 'Compress' }, { id: 'decompress', label: 'Decompress' }]} value={o.dir} onChange={(v) => setO({ dir: v as typeof o.dir })} />
        <ToolbarSpacer />
        <Button variant="secondary" size="sm" disabled={!output} onClick={() => { setInput(output); setO({ dir: compress ? 'decompress' : 'compress' }); }}>
          <ArrowLeftRight size={14} aria-hidden="true" /> Swap
        </Button>
      </Toolbar>
      <SplitPane
        storageKey="gzip"
        left={
          <EditorPanel
            label={compress ? 'Text' : 'Base64 gzip'}
            value={input}
            onChange={setInput}
            placeholder={compress ? 'Text to compress' : 'Base64-encoded gzip, usually starting with H4sI…'}
            fileAccept="text/*,.txt,.b64,.json"
            className="flex-1"
          />
        }
        right={
          <OutputPanel
            label={compress ? 'Base64 gzip' : 'Text'}
            value={output}
            error={error}
            errorTitle={compress ? 'Could not compress' : 'Could not decompress'}
            status={ratio}
            downloadName={compress ? 'compressed.b64.txt' : 'decompressed.txt'}
            onUseAsInput={() => setInput(output)}
            className="flex-1"
          />
        }
      />
    </ToolLayout>
  );
}
