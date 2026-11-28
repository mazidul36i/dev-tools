import { useEffect, useMemo, useState } from 'react';
import { Pause, Play, Clock, CalendarClock } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import CopyButton from '@components/ui/CopyButton';
import Badge from '@components/ui/Badge';
import Button from '@components/ui/Button';
import { ErrorNotice, Panel, ResultRows } from '@components/workspace';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import {
  UNIT_LABELS, dayOfYear, formatInZone, isoWeek, listTimeZones, parseTimestampInput, wallTimeToDate,
} from '@lib/timestamp-utils';
import { formatRelative } from '@lib/time-utils';

const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Value for <input type="datetime-local"> showing `date` as wall time in `timeZone`. */
function toWallInput(date: Date, timeZone: string) {
  return formatInZone(date, timeZone).slice(0, 19).replace(' ', 'T');
}

// Empty values mean "now" / "local zone", so a plain link always opens on the current time.
const schema = {
  t: opt.str('', 64),
  tz: opt.str('', 64),
  at: opt.str('', 32),
  atz: opt.str('', 64),
};

const fieldClass =
  'w-full h-9 px-2.5 rounded-md bg-surface-alt border border-border-strong text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25';

export default function TimestampConverterPage() {
  const [now, setNow] = useState(() => Date.now());
  const [paused, setPaused] = useState(false);
  const [o, setO] = useUrlOptions(schema);
  const [initial] = useState(() => ({ t: String(Math.floor(Date.now() / 1000)), at: toWallInput(new Date(), localZone) }));

  const zones = useMemo(() => listTimeZones(), []);
  const zone = o.tz && zones.includes(o.tz) ? o.tz : localZone;
  const wallZone = o.atz && zones.includes(o.atz) ? o.atz : localZone;
  const input = o.t || initial.t;
  const wall = o.at || initial.at;

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [paused]);

  const zoneOptions = useMemo(
    () => zones.map((z) => ({ value: z, label: z === localZone ? `${z} (local)` : z })),
    [zones],
  );

  const parsed = useMemo(() => {
    try {
      return { value: parseTimestampInput(input) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [input]);

  const wallResult = useMemo(() => {
    try {
      return { date: wallTimeToDate(wall, wallZone) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [wall, wallZone]);

  const rows = useMemo(() => {
    if (!parsed.value) return [];
    const d = parsed.value.date;
    const ms = d.getTime();
    const wk = isoWeek(d);
    return [
      { label: 'Unix seconds', value: String(Math.floor(ms / 1000)) },
      { label: 'Unix milliseconds', value: String(ms) },
      { label: 'ISO 8601 (UTC)', value: d.toISOString() },
      { label: 'RFC 2822 / HTTP', value: d.toUTCString() },
      { label: `In ${zone}`, value: formatInZone(d, zone) },
      { label: 'Relative', value: formatRelative(d, now) },
      { label: 'Day of year', value: `${dayOfYear(d)} (ISO week ${wk.week}, ${wk.year})` },
    ];
  }, [parsed.value, zone, now]);

  const nowSeconds = Math.floor(now / 1000);
  const setWallDay = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setO({ atz: '', at: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00` });
  };

  return (
    <ToolLayout
      seoTitle="Unix Timestamp Converter – Epoch to Date & Date to Epoch"
      tagline="Convert between Unix timestamps and readable dates in any time zone"
      metaDescription="Convert Unix epoch timestamps (seconds, milliseconds, microseconds, nanoseconds) to ISO 8601, RFC 2822 and local dates, and convert dates in any time zone back to timestamps."
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">Epoch time</strong> counts seconds since 1970-01-01 00:00:00 UTC, ignoring leap seconds. It’s the same everywhere; zones only matter for display.</li>
          <li><strong className="text-text">Units are detected.</strong> Up to 11 digits is seconds, 12–14 milliseconds (JavaScript, Java), 15–17 microseconds and 18–19 nanoseconds (Go, some databases).</li>
          <li><strong className="text-text">Year 2038.</strong> Signed 32-bit timestamps overflow at 2147483647 (2038-01-19 03:14:07 UTC). Store them as 64-bit integers.</li>
        </ul>
      }
    >
      <Panel
        title={<span className="inline-flex items-center gap-1.5"><Clock size={13} aria-hidden="true" /> Current time</span>}
        className="mb-4"
        bodyClassName="p-3"
        actions={
          <Button variant="ghost" size="sm" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
            {paused ? <><Play size={13} aria-hidden="true" /> Resume</> : <><Pause size={13} aria-hidden="true" /> Pause</>}
          </Button>
        }
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { label: 'Seconds', value: String(nowSeconds) },
            { label: 'Milliseconds', value: String(now) },
            { label: 'ISO 8601', value: new Date(now).toISOString() },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-md border border-border bg-surface-alt px-3 py-2 min-w-0">
              <div className="text-xs text-text-muted">{label}</div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-base font-semibold text-text truncate tabular-nums">{value}</span>
                <CopyButton text={value} label="" size="sm" className="px-2! shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Panel title="Timestamp → date" bodyClassName="p-4 space-y-3">
          <div>
            <label htmlFor="ts-input" className="block mb-1.5 text-xs font-medium text-text-secondary">Timestamp or date string</label>
            <div className="flex gap-2">
              <input
                id="ts-input"
                value={input}
                onChange={(e) => setO({ t: e.target.value })}
                placeholder="1700000000, 1700000000000 or 2024-03-01T12:00:00Z"
                spellCheck={false}
                className={`${fieldClass} font-mono`}
              />
              <Button variant="secondary" size="lg" onClick={() => setO({ t: String(Math.floor(Date.now() / 1000)) })}>Now</Button>
            </div>
          </div>
          <div>
            <label htmlFor="ts-zone" className="block mb-1.5 text-xs font-medium text-text-secondary">Show in time zone</label>
            <select id="ts-zone" value={zone} onChange={(e) => setO({ tz: e.target.value === localZone ? '' : e.target.value })} className={`${fieldClass} pr-8`}>
              {zoneOptions.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
            </select>
          </div>
          {parsed.error ? (
            <ErrorNotice title="Not a timestamp or date">{parsed.error}</ErrorNotice>
          ) : (
            <>
              <Badge tone="primary">Detected: {UNIT_LABELS[parsed.value!.unit]}</Badge>
              <ResultRows labelWidth="sm:w-36" rows={rows} />
            </>
          )}
        </Panel>

        <Panel title={<span className="inline-flex items-center gap-1.5"><CalendarClock size={13} aria-hidden="true" /> Date → timestamp</span>} bodyClassName="p-4 space-y-3">
          <div>
            <label htmlFor="wall-input" className="block mb-1.5 text-xs font-medium text-text-secondary">Date and time</label>
            <input id="wall-input" type="datetime-local" step={1} value={wall} onChange={(e) => setO({ at: e.target.value })} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="wall-zone" className="block mb-1.5 text-xs font-medium text-text-secondary">Interpreted in time zone</label>
            <select id="wall-zone" value={wallZone} onChange={(e) => setO({ atz: e.target.value === localZone ? '' : e.target.value })} className={`${fieldClass} pr-8`}>
              {zoneOptions.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button variant="secondary" size="sm" onClick={() => setWallDay(0)}>Start of today</Button>
            <Button variant="secondary" size="sm" onClick={() => setWallDay(1)}>Start of tomorrow</Button>
            <Button variant="secondary" size="sm" onClick={() => setO({ at: toWallInput(new Date(), wallZone) })}>Now</Button>
          </div>
          {wallResult.error ? (
            <ErrorNotice title="Invalid date">{wallResult.error}</ErrorNotice>
          ) : (
            <ResultRows
              labelWidth="sm:w-36"
              rows={[
                { label: 'Unix seconds', value: String(Math.floor(wallResult.date!.getTime() / 1000)) },
                { label: 'Unix milliseconds', value: String(wallResult.date!.getTime()) },
                { label: 'ISO 8601 (UTC)', value: wallResult.date!.toISOString() },
                { label: 'Local', value: formatInZone(wallResult.date!, localZone) },
              ]}
            />
          )}
        </Panel>
      </div>
    </ToolLayout>
  );
}
