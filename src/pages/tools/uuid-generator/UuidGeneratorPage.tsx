import {useState, useCallback} from 'react';
import {toast} from 'sonner';
import {Copy, RefreshCw, Trash2, Download} from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import CopyButton from '@components/ui/CopyButton';
import {PrimaryButton, SecondaryButton} from '@components/ui/Button';
import SegmentedControl from '@components/ui/SegmentedControl';
import {downloadFile} from '@lib/download-utils';

const versionOptions = [
  {id: 'v4', label: 'v4 (Random)'},
  {id: 'v1-like', label: 'v1-like (Time)'},
];

const countOptions = [
  {id: '1', label: '1'},
  {id: '5', label: '5'},
  {id: '10', label: '10'},
  {id: '25', label: '25'},
];

function generateUUIDv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 0x0f) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateUUIDv1Like(): string {
  const now = Date.now();
  const hex = now.toString(16).padStart(12, '0');
  const timeLow = hex.slice(-8);
  const timeMid = hex.slice(-12, -8);
  const timeHi = '1' + hex.slice(0, 3);
  const clockSeq = ((crypto.getRandomValues(new Uint8Array(1))[0] & 0x3f) | 0x80).toString(16).padStart(2, '0')
    + (crypto.getRandomValues(new Uint8Array(1))[0] & 0xff).toString(16).padStart(2, '0');
  const node = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${timeLow}-${timeMid}-${timeHi}-${clockSeq}-${node}`;
}

function generateUUID(version: string): string {
  return version === 'v4' ? generateUUIDv4() : generateUUIDv1Like();
}

export default function UuidGeneratorPage() {
  const [version, setVersion] = useState('v4');
  const [count, setCount] = useState('1');
  const [uppercase, setUppercase] = useState(false);
  const [noDashes, setNoDashes] = useState(false);
  const [uuids, setUuids] = useState<string[]>([]);

  const formatUuid = useCallback(
    (uuid: string) => {
      let result = uuid;
      if (noDashes) result = result.replace(/-/g, '');
      if (uppercase) result = result.toUpperCase();
      return result;
    },
    [uppercase, noDashes],
  );

  const handleGenerate = useCallback(() => {
    const num = parseInt(count, 10);
    const generated = Array.from({length: num}, () => formatUuid(generateUUID(version)));
    setUuids(generated);
    toast.success(`Generated ${num} UUID${num > 1 ? 's' : ''}!`);
  }, [version, count, formatUuid]);

  const handleClearAll = useCallback(() => {
    setUuids([]);
  }, []);

  useCallback(async () => {
    if (!uuids.length) {
      toast.error('Nothing to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(uuids.join('\n'));
      toast.success('All UUIDs copied!');
    } catch {
      toast.error('Failed to copy');
    }
  }, [uuids]);

  const handleDownload = useCallback(() => {
    if (!uuids.length) {
      toast.error('No UUIDs to download');
      return;
    }
    downloadFile(uuids.join('\n'), 'uuids.txt');
  }, [uuids]);

  const output = uuids.join('\n');

  return (
    <ToolLayout
      title="UUID Generator"
      tagline="Generate universally unique identifiers (UUIDs) instantly"
      metaDescription="Generate random UUIDs (v4) and time-based UUIDs (v1-like). Copy, download, and customize output format."
    >
      <Card>
        <div className="p-6 space-y-6">
          {/* Version Selector */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Version:</label>
            <SegmentedControl options={versionOptions} value={version} onChange={setVersion}/>
          </div>

          {/* Count Selector */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Count:</label>
            <SegmentedControl options={countOptions} value={count} onChange={setCount}/>
          </div>

          {/* Format Options */}
          <div className="bg-surface-alt rounded-lg border border-border p-4 flex flex-wrap gap-5">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm text-text-secondary">Uppercase</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={noDashes}
                onChange={(e) => setNoDashes(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm text-text-secondary">No dashes</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={handleGenerate}>
              <RefreshCw size={15}/> Generate
            </PrimaryButton>
            <SecondaryButton onClick={handleClearAll}>
              <Trash2 size={15}/> Clear
            </SecondaryButton>
          </div>

          {/* Output */}
          {uuids.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Generated UUID{uuids.length > 1 ? 's' : ''} ({uuids.length}):
              </label>
              <div
                className="bg-surface rounded-lg border border-border p-4 font-mono text-sm space-y-2 max-h-80 overflow-y-auto">
                {uuids.map((uuid, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 group hover:bg-surface-hover rounded-lg px-3 py-1.5 -mx-1 transition-colors"
                  >
                    <span className="text-text-secondary break-all">{uuid}</span>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(uuid);
                          toast.success('Copied!');
                        } catch {
                          toast.error('Failed to copy');
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-primary shrink-0"
                      title="Copy"
                    >
                      <Copy size={14}/>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <CopyButton text={output} label="Copy All" size="sm"/>
                <SecondaryButton onClick={handleDownload} className="text-xs! px-3! py-1.5!">
                  <Download size={12}/> Download
                </SecondaryButton>
              </div>
            </div>
          )}
        </div>
      </Card>

      <InfoCard title="About UUIDs">
        <div className="grid md:grid-cols-2 gap-5">
          {[
            {
              t: 'UUID v4 (Random)',
              d: 'Generated using cryptographically secure random numbers. The most commonly used version — ideal for unique IDs in databases, APIs, and distributed systems.',
              ex: 'e.g. 3f8a1c2d-7e4b-4a91-b6f0-8c2d5e9a1b3f',
            },
            {
              t: 'UUID v1-like (Time-based)',
              d: 'Incorporates the current timestamp and random node bytes. Useful when ordering by creation time matters, though not a strict RFC 4122 v1 implementation.',
              ex: 'e.g. 6f1a3c00-a1b2-1c3d-9e8f-0a1b2c3d4e5f',
            },
            {
              t: 'Format Options',
              d: 'Customize output with uppercase letters or remove dashes for compact representations. Dashes are standard but optional in many systems.',
              ex: 'e.g. 3F8A1C2D7E4B4A91B6F08C2D5E9A1B3F',
            },
            {
              t: 'Common Use Cases',
              d: 'Primary keys in databases, distributed system identifiers, session tokens, file naming, correlation IDs in microservices, and more.',
              ex: '128 bits → 2¹²² unique v4 possibilities',
            },
          ].map(({t, d, ex}) => (
            <div key={t} className="bg-surface-alt rounded-lg p-5 border border-border">
              <h3 className="font-medium text-text-secondary mb-2">{t}</h3>
              <p className="text-sm text-text-muted mb-3">{d}</p>
              <div className="bg-surface rounded p-3 text-xs font-mono border border-border">
                <span className="text-primary">{ex}</span>
              </div>
            </div>
          ))}
        </div>
      </InfoCard>
    </ToolLayout>
  );
}


