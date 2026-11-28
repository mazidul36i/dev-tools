import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, FileText, X, XCircle } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Checkbox from '@components/ui/Checkbox';
import SegmentedControl from '@components/ui/SegmentedControl';
import FileDropZone from '@components/ui/FileDropZone';
import Badge from '@components/ui/Badge';
import Button from '@components/ui/Button';
import { EditorPanel, Panel, ResultRows, Toolbar, ToolbarDivider } from '@components/workspace';
import {
  HASH_ALGORITHMS, INSECURE_ALGORITHMS, computeHash, encodeBytes, normalizeHash,
  type HashAlgorithm, type OutputEncoding,
} from '@lib/hash-utils';
import { formatBytes } from '@lib/image-utils';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';

const MAX_FILE_BYTES = 512 * 1024 * 1024;

// The HMAC key and the text are deliberately not in the schema: they can be secrets.
const schema = {
  source: opt.oneOf(['text', 'file'] as const, 'text'),
  enc: opt.oneOf(['hex', 'HEX', 'base64'] as const, 'hex'),
  hmac: opt.bool(false),
  expect: opt.str('', 200),
};

type Results = Partial<Record<HashAlgorithm, string>>;

const inputClass =
  'w-full h-8 px-2.5 rounded-md bg-surface-alt border border-border-strong font-mono text-[13px] text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25';

export default function HashGeneratorPage() {
  const [o, setO] = useUrlOptions(schema);
  const [text, setText] = useState('');
  const [file, setFile] = useState<{ name: string; size: number; bytes: Uint8Array } | null>(null);
  const [hmacKey, setHmacKey] = useState('');
  const [results, setResults] = useState<Results>({});
  const [busy, setBusy] = useState(false);

  const data = useMemo(
    () => (o.source === 'text' ? new TextEncoder().encode(text) : file?.bytes ?? null),
    [o.source, text, file],
  );
  const hasInput = o.source === 'text' ? text.length > 0 : !!file;

  useEffect(() => {
    if (!data || !hasInput) {
      setResults({});
      setBusy(false);
      return;
    }
    let cancelled = false;
    const key = o.hmac ? new TextEncoder().encode(hmacKey) : undefined;
    setBusy(true);
    const timer = setTimeout(async () => {
      const next: Results = {};
      for (const alg of HASH_ALGORITHMS) {
        if (key && alg === 'CRC32') continue;
        try {
          next[alg] = encodeBytes(await computeHash(alg, data, key), o.enc as OutputEncoding);
        } catch {
          // Leave unsupported combinations empty.
        }
        if (cancelled) return;
      }
      setResults(next);
      setBusy(false);
    }, o.source === 'text' ? 150 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [data, hasInput, o.source, o.hmac, hmacKey, o.enc]);

  const handleFile = async (files: File[]) => {
    const f = files[0];
    if (f.size > MAX_FILE_BYTES) {
      toast.error(`File is larger than ${formatBytes(MAX_FILE_BYTES)}`);
      return;
    }
    setFile({ name: f.name, size: f.size, bytes: new Uint8Array(await f.arrayBuffer()) });
  };

  const target = normalizeHash(o.expect);
  const matchAlg = target
    ? (Object.entries(results) as [HashAlgorithm, string][]).find(([, v]) =>
        o.enc === 'base64' ? v === target : v.toLowerCase() === target.toLowerCase())?.[0]
    : undefined;

  const name = (alg: HashAlgorithm) => (o.hmac && alg !== 'CRC32' ? `HMAC-${alg}` : alg);

  return (
    <ToolLayout
      seoTitle="Hash Generator – MD5, SHA-1, SHA-256, SHA-512, CRC32 & HMAC"
      tagline="MD5, SHA-1, SHA-256/384/512 and CRC32 checksums and HMACs for text or files"
      metaDescription="Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512 and CRC32 hashes or HMACs of text and files in your browser. Compare against an expected checksum. Files never leave your device."
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">Checksums.</strong> Compare a download’s SHA-256 with the publisher’s to confirm it arrived intact. CRC32 and MD5 only detect accidental changes.</li>
          <li><strong className="text-text">Security.</strong> MD5 and SHA-1 have practical collision attacks; use SHA-256 or stronger. Never store passwords as plain hashes; use bcrypt, scrypt or Argon2.</li>
          <li><strong className="text-text">HMAC.</strong> A keyed hash proves a message came from someone with the secret key, as in API request signing and webhook signatures. The key is never put in links.</li>
        </ul>
      }
    >
      <Toolbar>
        <SegmentedControl ariaLabel="Input" options={[{ id: 'text', label: 'Text' }, { id: 'file', label: 'File' }]} value={o.source} onChange={(v) => setO({ source: v as 'text' | 'file' })} />
        <ToolbarDivider />
        <span className="text-xs text-text-muted">Output</span>
        <SegmentedControl ariaLabel="Output encoding" options={[{ id: 'hex', label: 'hex' }, { id: 'HEX', label: 'HEX' }, { id: 'base64', label: 'Base64' }]} value={o.enc} onChange={(v) => setO({ enc: v as typeof o.enc })} />
        <ToolbarDivider />
        <Checkbox checked={o.hmac} onChange={(v) => setO({ hmac: v })} label="HMAC" className="text-xs" />
        {o.hmac && (
          <input
            type="password"
            value={hmacKey}
            onChange={(e) => setHmacKey(e.target.value)}
            placeholder="Secret key"
            aria-label="HMAC secret key"
            autoComplete="off"
            className={`${inputClass} w-48`}
          />
        )}
      </Toolbar>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start">
        {o.source === 'text' ? (
          <EditorPanel label="Text (UTF-8)" value={text} onChange={setText} placeholder="Type or paste text to hash" textareaClassName="min-h-64" />
        ) : (
          <Panel title="File" bodyClassName="p-3">
            {file ? (
              <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-surface-alt">
                <FileText size={20} aria-hidden="true" className="text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-text truncate">{file.name}</div>
                  <div className="text-xs text-text-muted">{formatBytes(file.size)}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}><X size={13} aria-hidden="true" /> Remove</Button>
              </div>
            ) : (
              <FileDropZone onFiles={handleFile} hint="Any file type, up to 512 MB. It is read locally and never uploaded." />
            )}
          </Panel>
        )}

        <div className="space-y-4 min-w-0">
          <Panel title={o.hmac ? 'HMACs' : 'Hashes'} footer={<span role="status">{hasInput && busy ? 'Computing…' : hasInput ? `${Object.keys(results).length} digests` : 'Waiting for input'}</span>}>
            <ResultRows
              labelWidth="sm:w-28"
              rows={HASH_ALGORITHMS.map((alg) => {
                const unavailable = o.hmac && alg === 'CRC32';
                return {
                  label: (
                    <span className={matchAlg === alg ? 'text-success font-semibold' : ''}>
                      {name(alg)}
                      {INSECURE_ALGORITHMS.has(alg) && <span className="block text-[11px] text-warning">checksum only</span>}
                    </span>
                  ),
                  value: unavailable ? '' : results[alg] ?? '',
                  display: unavailable ? <span className="font-sans text-text-muted">Not applicable for HMAC</span> : undefined,
                };
              })}
            />
          </Panel>

          <Panel title={<label htmlFor="hash-expect">Compare with expected hash</label>} bodyClassName="p-3 space-y-2">
            <input
              id="hash-expect"
              value={o.expect}
              onChange={(e) => setO({ expect: e.target.value })}
              placeholder="Paste a checksum to verify"
              spellCheck={false}
              className={inputClass}
            />
            {target && hasInput && !busy && (
              <div role="status">
                {matchAlg
                  ? <Badge tone="success"><CheckCircle2 size={12} aria-hidden="true" /> Matches {name(matchAlg)}</Badge>
                  : <Badge tone="error"><XCircle size={12} aria-hidden="true" /> No algorithm matches</Badge>}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </ToolLayout>
  );
}
