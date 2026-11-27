import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, FileText, X, XCircle } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import CopyButton from '@components/ui/CopyButton';
import Checkbox from '@components/ui/Checkbox';
import SegmentedControl from '@components/ui/SegmentedControl';
import FileDropZone from '@components/ui/FileDropZone';
import Badge from '@components/ui/Badge';
import { SmallButton } from '@components/ui/Button';
import { TextAreaInput } from '@components/ui/TextArea';
import { Field, TextInput } from '@components/ui/Input';
import {
  HASH_ALGORITHMS, INSECURE_ALGORITHMS, computeHash, encodeBytes, normalizeHash,
  type HashAlgorithm, type OutputEncoding,
} from '@lib/hash-utils';

const MAX_FILE_BYTES = 512 * 1024 * 1024;

const modeOptions = [
  { id: 'text', label: 'Text' },
  { id: 'file', label: 'File' },
];

const encodingOptions = [
  { id: 'hex', label: 'hex' },
  { id: 'HEX', label: 'HEX' },
  { id: 'base64', label: 'Base64' },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

type Results = Partial<Record<HashAlgorithm, string>>;

export default function HashGeneratorPage() {
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<{ name: string; size: number; bytes: Uint8Array } | null>(null);
  const [useHmac, setUseHmac] = useState(false);
  const [hmacKey, setHmacKey] = useState('');
  const [encoding, setEncoding] = useState<OutputEncoding>('hex');
  const [compare, setCompare] = useState('');
  const [results, setResults] = useState<Results>({});
  const [busy, setBusy] = useState(false);

  const data = useMemo(
    () => (mode === 'text' ? new TextEncoder().encode(text) : file?.bytes ?? null),
    [mode, text, file],
  );

  useEffect(() => {
    if (!data || (mode === 'text' && !text)) {
      setResults({});
      return;
    }
    let cancelled = false;
    const key = useHmac ? new TextEncoder().encode(hmacKey) : undefined;
    const timer = setTimeout(async () => {
      setBusy(true);
      const next: Results = {};
      for (const alg of HASH_ALGORITHMS) {
        if (key && alg === 'CRC32') continue;
        try {
          next[alg] = encodeBytes(await computeHash(alg, data, key), encoding);
        } catch {
          // Leave unsupported combinations empty.
        }
        if (cancelled) return;
      }
      setResults(next);
      setBusy(false);
    }, mode === 'text' ? 150 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [data, mode, text, useHmac, hmacKey, encoding]);

  const handleFile = async (files: File[]) => {
    const f = files[0];
    if (f.size > MAX_FILE_BYTES) {
      toast.error(`File is larger than ${formatSize(MAX_FILE_BYTES)}`);
      return;
    }
    setBusy(true);
    setFile({ name: f.name, size: f.size, bytes: new Uint8Array(await f.arrayBuffer()) });
  };

  const target = normalizeHash(compare);
  const matchAlg = target
    ? (Object.entries(results) as [HashAlgorithm, string][]).find(([, v]) =>
        encoding === 'base64' ? v === target : v.toLowerCase() === target.toLowerCase())?.[0]
    : undefined;

  const hasInput = mode === 'text' ? text.length > 0 : !!file;

  return (
    <ToolLayout
      title="Hash Generator"
      seoTitle="Hash Generator – MD5, SHA-1, SHA-256, SHA-512, CRC32 & HMAC"
      tagline="Compute MD5, SHA-1, SHA-256/384/512 and CRC32 checksums and HMACs for text or files"
      metaDescription="Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512 and CRC32 hashes or HMACs of text and files in your browser. Compare against an expected checksum. Files never leave your device."
    >
      <Card hover={false}>
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedControl options={modeOptions} value={mode} onChange={setMode} />
            <SegmentedControl options={encodingOptions} value={encoding} onChange={(v) => setEncoding(v as OutputEncoding)} variant="glass" />
          </div>

          {mode === 'text' ? (
            <div>
              <TextAreaInput
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste text to hash (UTF-8)..."
                aria-label="Text to hash"
                spellCheck={false}
              />
              <div className="flex gap-2 mt-2">
                <SmallButton onClick={() => setText('')}>Clear</SmallButton>
                <span className="text-xs text-text-muted self-center">{new TextEncoder().encode(text).length} bytes</span>
              </div>
            </div>
          ) : file ? (
            <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-surface-alt">
              <FileText size={20} className="text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-text truncate">{file.name}</div>
                <div className="text-xs text-text-muted">{formatSize(file.size)}</div>
              </div>
              <SmallButton onClick={() => setFile(null)}><X size={12} /> Remove</SmallButton>
            </div>
          ) : (
            <FileDropZone onFiles={handleFile} hint="Any file type, up to 512 MB. It is read locally and never uploaded." />
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Checkbox checked={useHmac} onChange={setUseHmac} label="HMAC (keyed hash)" />
              {useHmac && (
                <TextInput value={hmacKey} onChange={(e) => setHmacKey(e.target.value)} placeholder="Secret key" aria-label="HMAC key" />
              )}
            </div>
            <Field label="Compare with expected hash" htmlFor="hash-compare">
              <TextInput
                id="hash-compare"
                value={compare}
                onChange={(e) => setCompare(e.target.value)}
                placeholder="Paste a checksum to verify"
                className="font-mono"
                spellCheck={false}
              />
            </Field>
          </div>

          {target && hasInput && !busy && (
            matchAlg
              ? <Badge tone="success"><CheckCircle2 size={12} /> Matches {useHmac ? `HMAC-${matchAlg}` : matchAlg}</Badge>
              : <Badge tone="error"><XCircle size={12} /> No algorithm matches the expected hash</Badge>
          )}

          <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
            {HASH_ALGORITHMS.map((alg) => {
              const value = results[alg];
              const unavailable = useHmac && alg === 'CRC32';
              return (
                <div
                  key={alg}
                  className={`flex items-center gap-3 px-4 py-3 ${matchAlg === alg ? 'bg-success/10' : 'bg-surface/50'}`}
                >
                  <div className="w-20 sm:w-28 shrink-0">
                    <div className="text-sm font-semibold text-text">{useHmac && !unavailable ? `HMAC-${alg}` : alg}</div>
                    {INSECURE_ALGORITHMS.has(alg) && <div className="text-[10px] uppercase tracking-wide text-warning">checksum only</div>}
                  </div>
                  <div className="flex-1 min-w-0 font-mono text-xs sm:text-sm text-text-secondary break-all">
                    {unavailable ? <span className="text-text-muted">Not applicable for HMAC</span>
                      : value ?? <span className="text-text-muted">{hasInput && busy ? 'Computing…' : '—'}</span>}
                  </div>
                  <CopyButton text={value ?? ''} label="" size="sm" className="px-2! shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <InfoCard title="About Hash Functions">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { t: 'Checksums', d: 'Compare a downloaded file’s SHA-256 against the publisher’s to confirm it arrived intact. CRC32 and MD5 are fast but only detect accidental changes.' },
            { t: 'Security', d: 'MD5 and SHA-1 have practical collision attacks — use SHA-256 or stronger for signatures. Never store passwords with plain hashes; use bcrypt, scrypt or Argon2.' },
            { t: 'HMAC', d: 'A keyed hash proves a message came from someone holding the secret key — used for API request signing and webhook signatures (e.g. HMAC-SHA256).' },
          ].map(({ t, d }) => (
            <div key={t} className="bg-surface-alt rounded-lg p-5 border border-border">
              <h3 className="font-medium text-text-secondary mb-2">{t}</h3>
              <p className="text-sm text-text-muted">{d}</p>
            </div>
          ))}
        </div>
      </InfoCard>
    </ToolLayout>
  );
}
