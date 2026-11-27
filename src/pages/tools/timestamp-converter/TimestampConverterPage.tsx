import { useEffect, useMemo, useState } from 'react';
import { Pause, Play, Clock, AlertCircle, CalendarClock } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import CopyButton from '@components/ui/CopyButton';
import Badge from '@components/ui/Badge';
import { SmallButton } from '@components/ui/Button';
import { Field, SelectInput, TextInput } from '@components/ui/Input';
import {
  UNIT_LABELS, dayOfYear, formatInZone, isoWeek, listTimeZones, parseTimestampInput, wallTimeToDate,
} from '@lib/timestamp-utils';
import { formatRelative } from '@lib/time-utils';

const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      <span className="w-36 shrink-0 text-xs font-medium text-text-muted">{label}</span>
      <span className="flex-1 min-w-0 font-mono text-sm text-text-secondary break-all">{value}</span>
      <CopyButton text={value} label="" size="sm" className="px-2!" />
    </div>
  );
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Value for <input type="datetime-local"> showing `date` as wall time in `timeZone`. */
function toWallInput(date: Date, timeZone: string) {
  return formatInZone(date, timeZone).slice(0, 19).replace(' ', 'T');
}

export default function TimestampConverterPage() {
  const [now, setNow] = useState(() => Date.now());
  const [paused, setPaused] = useState(false);
  const [input, setInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [zone, setZone] = useState(localZone);
  const [wall, setWall] = useState(() => toWallInput(new Date(), localZone));
  const [wallZone, setWallZone] = useState(localZone);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [paused]);

  const zones = useMemo(() => listTimeZones(), []);
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

  return (
    <ToolLayout
      title="Unix Timestamp Converter"
      seoTitle="Unix Timestamp Converter – Epoch to Date & Date to Epoch"
      tagline="Convert between Unix timestamps and human-readable dates in any time zone"
      metaDescription="Convert Unix epoch timestamps (seconds, milliseconds, microseconds, nanoseconds) to ISO 8601, RFC 2822 and local dates, and convert dates in any time zone back to timestamps."
    >
      {/* Current time */}
      <Card hover={false}>
        <div className="p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="flex items-center gap-2 font-semibold text-text"><Clock size={16} className="text-primary" /> Current time</h2>
            <SmallButton onClick={() => setPaused((p) => !p)}>
              {paused ? <><Play size={12} /> Resume</> : <><Pause size={12} /> Pause</>}
            </SmallButton>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: 'Seconds', value: String(nowSeconds) },
              { label: 'Milliseconds', value: String(now) },
              { label: 'ISO 8601', value: new Date(now).toISOString() },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-border bg-surface-alt p-3 min-w-0">
                <div className="text-xs text-text-muted mb-1">{label}</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-base md:text-lg font-semibold text-text truncate">{value}</span>
                  <CopyButton text={value} label="" size="sm" className="px-2! shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-3">
        {/* Timestamp -> date */}
        <Card hover={false} className="mb-0! lg:mb-3!">
          <div className="p-6 space-y-4">
            <h2 className="font-semibold text-text">Timestamp → Date</h2>
            <div className="flex gap-2 items-end">
              <Field label="Timestamp or date string" htmlFor="ts-input" className="flex-1">
                <TextInput
                  id="ts-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="1700000000, 1700000000000 or 2024-03-01T12:00:00Z"
                  className="font-mono"
                  spellCheck={false}
                />
              </Field>
              <SmallButton onClick={() => setInput(String(Math.floor(Date.now() / 1000)))} className="h-9 shrink-0">Now</SmallButton>
            </div>
            <Field label="Show in time zone" htmlFor="ts-zone">
              <SelectInput id="ts-zone" value={zone} onChange={(e) => setZone(e.target.value)} options={zoneOptions} />
            </Field>
            {parsed.error ? (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-error/30 bg-error/5 text-error text-sm">
                <AlertCircle size={16} className="shrink-0 mt-0.5" /> {parsed.error}
              </div>
            ) : (
              <>
                <Badge tone="primary">Detected: {UNIT_LABELS[parsed.value!.unit]}</Badge>
                <div>{rows.map((r) => <Row key={r.label} {...r} />)}</div>
              </>
            )}
          </div>
        </Card>

        {/* Date -> timestamp */}
        <Card hover={false}>
          <div className="p-6 space-y-4">
            <h2 className="flex items-center gap-2 font-semibold text-text"><CalendarClock size={16} className="text-primary" /> Date → Timestamp</h2>
            <Field label="Date and time" htmlFor="wall-input">
              <TextInput
                id="wall-input"
                type="datetime-local"
                step={1}
                value={wall}
                onChange={(e) => setWall(e.target.value)}
              />
            </Field>
            <Field label="Interpreted in time zone" htmlFor="wall-zone">
              <SelectInput id="wall-zone" value={wallZone} onChange={(e) => setWallZone(e.target.value)} options={zoneOptions} />
            </Field>
            {wallResult.error ? (
              <p className="text-sm text-error">{wallResult.error}</p>
            ) : (
              <div>
                <Row label="Unix seconds" value={String(Math.floor(wallResult.date!.getTime() / 1000))} />
                <Row label="Unix milliseconds" value={String(wallResult.date!.getTime())} />
                <Row label="ISO 8601 (UTC)" value={wallResult.date!.toISOString()} />
                <Row label="Local" value={formatInZone(wallResult.date!, localZone)} />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {[['Start of today', 0], ['Start of tomorrow', 1]].map(([label, days]) => (
                <SmallButton
                  key={label}
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + Number(days));
                    setWallZone(localZone);
                    setWall(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`);
                  }}
                >
                  {label}
                </SmallButton>
              ))}
              <SmallButton onClick={() => setWall(toWallInput(new Date(), wallZone))}>Now</SmallButton>
            </div>
          </div>
        </Card>
      </div>

      <InfoCard title="About Unix Timestamps">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { t: 'What is epoch time?', d: 'The number of seconds since 1970-01-01 00:00:00 UTC, ignoring leap seconds. It is the same everywhere — time zones only matter when you display it.' },
            { t: 'Units are detected', d: 'Up to 11 digits is read as seconds, 12–14 as milliseconds (JavaScript, Java), 15–17 as microseconds and 18–19 as nanoseconds (Go, some databases).' },
            { t: 'The year 2038', d: 'Signed 32-bit timestamps overflow at 2147483647 (2038-01-19 03:14:07 UTC). Store timestamps as 64-bit integers to avoid it.' },
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
