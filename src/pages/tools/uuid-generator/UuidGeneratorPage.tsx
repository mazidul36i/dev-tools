import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Checkbox from '@components/ui/Checkbox';
import SegmentedControl from '@components/ui/SegmentedControl';
import { ErrorNotice, OutputPanel, Panel, ResultRows, RunButton, useRunShortcut } from '@components/workspace';
import { formatUuid, inspectUuid, NIL_UUID, uuidV4, uuidV7 } from '@lib/uuid-utils';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';

const schema = {
  v: opt.oneOf(['v4', 'v7', 'nil'] as const, 'v4'),
  n: opt.num(5, { min: 1, max: 1000 }),
  upper: opt.bool(false),
  dashes: opt.bool(true),
  braces: opt.bool(false),
};

const versionHelp: Record<string, string> = {
  v4: 'Random. The default choice for IDs.',
  v7: 'Time-ordered: starts with a millisecond timestamp, so new IDs sort last. Good for database keys.',
  nil: 'All zeros. A placeholder meaning “no UUID”.',
};

const fieldClass =
  'h-8 px-2.5 rounded-md bg-surface-alt border border-border-strong text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25';

export default function UuidGeneratorPage() {
  const [o, setO] = useUrlOptions(schema);
  const [raw, setRaw] = useState<string[]>([]);
  const [check, setCheck] = useState('');

  const generate = useCallback(() => {
    const make = o.v === 'v7' ? () => uuidV7() : o.v === 'nil' ? () => NIL_UUID : uuidV4;
    setRaw(Array.from({ length: o.v === 'nil' ? 1 : o.n }, make));
  }, [o.v, o.n]);

  // Generate immediately, and again whenever version or count changes.
  useEffect(generate, [generate]);
  useRunShortcut(generate);

  const output = useMemo(
    () => raw.map((u) => formatUuid(u, { uppercase: o.upper, dashes: o.dashes, braces: o.braces })).join('\n'),
    [raw, o.upper, o.dashes, o.braces],
  );

  const inspected = useMemo(() => {
    if (!check.trim()) return null;
    try {
      return { info: inspectUuid(check) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [check]);

  return (
    <ToolLayout
      seoTitle="UUID Generator – v4 & v7 (RFC 9562)"
      tagline="Generate random (v4) or time-ordered (v7) UUIDs in bulk, and inspect existing ones"
      metaDescription="Generate RFC 9562 UUIDs: random v4 and time-ordered v7, up to 1000 at once, with uppercase, no-dash and brace formats. Inspect any UUID's version, variant and v7 timestamp."
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">v4</strong> is 122 random bits from the browser’s cryptographic generator. Collisions are not a practical concern.</li>
          <li><strong className="text-text">v7</strong> puts a millisecond Unix timestamp first, so IDs created later sort later. That keeps database indexes compact.</li>
          <li><strong className="text-text">Formats.</strong> Dashes are standard but optional in many systems; braces are common in Windows and .NET (GUIDs).</li>
        </ul>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] items-start">
        <div className="space-y-4">
          <Panel title="Options" bodyClassName="p-4 space-y-4">
            <div className="space-y-1.5">
              <SegmentedControl ariaLabel="Version" options={[{ id: 'v4', label: 'v4 random' }, { id: 'v7', label: 'v7 time' }, { id: 'nil', label: 'Nil' }]} value={o.v} onChange={(v) => setO({ v: v as typeof o.v })} />
              <p className="text-xs text-text-muted">{versionHelp[o.v]}</p>
            </div>
            {o.v !== 'nil' && (
              <div className="flex items-center gap-2">
                <label htmlFor="uuid-count" className="text-sm text-text-secondary">How many</label>
                <input id="uuid-count" type="number" min={1} max={1000} value={o.n} onChange={(e) => setO({ n: Math.max(1, Math.min(1000, Number(e.target.value) || 1)) })} className={`${fieldClass} w-24`} />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Checkbox checked={o.upper} onChange={(v) => setO({ upper: v })} label="Uppercase" />
              <Checkbox checked={!o.dashes} onChange={(v) => setO({ dashes: !v })} label="No dashes" />
              <Checkbox checked={o.braces} onChange={(v) => setO({ braces: v })} label="Wrap in braces { }" />
            </div>
            <RunButton onClick={generate}><RefreshCw size={13} aria-hidden="true" /> Generate</RunButton>
          </Panel>

          <Panel title={<label htmlFor="uuid-check">Inspect a UUID</label>} bodyClassName="p-4 space-y-3">
            <input id="uuid-check" value={check} onChange={(e) => setCheck(e.target.value)} placeholder="Paste any UUID" spellCheck={false} className={`${fieldClass} w-full font-mono text-[13px]`} />
            {inspected?.error && <ErrorNotice>{inspected.error}</ErrorNotice>}
            {inspected?.info && (
              <ResultRows
                labelWidth="sm:w-20"
                rows={[
                  { label: 'Version', value: String(inspected.info.version), copy: false },
                  { label: 'Variant', value: inspected.info.variant, mono: false, copy: false },
                  ...(inspected.info.timestamp ? [{ label: 'Created', value: inspected.info.timestamp.toISOString() }] : []),
                ]}
              />
            )}
          </Panel>
        </div>

        <OutputPanel
          label={`${raw.length} UUID${raw.length === 1 ? '' : 's'}`}
          value={output}
          downloadName="uuids.txt"
          className="min-h-80"
          textareaClassName="min-h-80"
        />
      </div>
    </ToolLayout>
  );
}
