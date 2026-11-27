import { useMemo, useState } from 'react';
import cronstrue from 'cronstrue';
import { AlertCircle, CalendarClock } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import CopyButton from '@components/ui/CopyButton';
import SegmentedControl from '@components/ui/SegmentedControl';
import { SelectInput } from '@components/ui/Input';
import { CRON_FIELDS, CRON_PRESETS, nextRuns, parseCron } from '@lib/cron-utils';
import { formatRelative } from '@lib/time-utils';

const zoneOptions = [
  { id: 'local', label: 'Local time' },
  { id: 'utc', label: 'UTC' },
];

const FIELD_HINTS = ['0–59', '0–23', '1–31', '1–12 or JAN–DEC', '0–6 or SUN–SAT'];

function splitFields(expr: string): string[] {
  const parts = expr.trim().split(/\s+/);
  return Array.from({ length: 5 }, (_, i) => parts[i] ?? '');
}

export default function CronParserPage() {
  const [expr, setExpr] = useState('*/15 9-17 * * MON-FRI');
  const [zone, setZone] = useState('local');
  const [count, setCount] = useState(10);

  const result = useMemo(() => {
    try {
      const parsed = parseCron(expr);
      const description = cronstrue.toString(parsed.expression, { use24HourTimeFormat: true, verbose: true });
      return { parsed, description };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [expr]);

  const runs = useMemo(
    () => (result.parsed ? nextRuns(result.parsed, new Date(), count, zone === 'utc') : []),
    [result.parsed, count, zone],
  );

  const fields = splitFields(expr.startsWith('@') && result.parsed ? result.parsed.expression : expr);
  const setField = (i: number, value: string) => {
    const next = [...fields];
    next[i] = value.replace(/\s+/g, '') || '*';
    setExpr(next.join(' '));
  };

  const fmt = (d: Date) => (zone === 'utc'
    ? d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
    : d.toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));

  return (
    <ToolLayout
      title="Cron Expression Helper"
      seoTitle="Cron Expression Parser – Explain Cron Schedules & Next Run Times"
      tagline="Explain cron schedules in plain English and preview the next run times"
      metaDescription="Parse and explain cron expressions in plain English, edit each field, use presets and macros like @daily, and see the next run times in local time or UTC."
    >
      <Card hover={false}>
        <div className="p-6 space-y-5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex items-center rounded-lg border border-border bg-surface focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50">
              <input
                value={expr}
                onChange={(e) => setExpr(e.target.value)}
                aria-label="Cron expression"
                spellCheck={false}
                className="flex-1 min-w-0 px-4 py-3 bg-transparent font-mono text-lg text-text focus:outline-none"
              />
              <CopyButton text={expr} label="" size="sm" className="mr-2 px-2!" />
            </div>
            <SelectInput
              aria-label="Presets"
              value=""
              onChange={(e) => e.target.value && setExpr(e.target.value)}
              options={[{ value: '', label: 'Presets…' }, ...CRON_PRESETS.map((p) => ({ value: p.expression, label: p.label }))]}
              className="md:w-64!"
            />
          </div>

          {result.error ? (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-error/30 bg-error/5 text-error text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" /> {result.error}
            </div>
          ) : (
            <p className="text-lg md:text-xl font-semibold text-text">“{result.description}”</p>
          )}

          <div className="grid grid-cols-5 gap-2 md:gap-3">
            {CRON_FIELDS.map((f, i) => (
              <label key={f.name} className="min-w-0">
                <input
                  value={fields[i]}
                  onChange={(e) => setField(i, e.target.value)}
                  spellCheck={false}
                  className="w-full px-2 py-2 text-center bg-surface-alt border border-border rounded-lg font-mono text-sm text-text
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                />
                <span className="block text-center text-[11px] md:text-xs font-medium text-text-secondary mt-1.5 truncate">{f.name}</span>
                <span className="hidden md:block text-center text-[11px] text-text-muted">{FIELD_HINTS[i]}</span>
              </label>
            ))}
          </div>
        </div>
      </Card>

      {result.parsed && (
        <Card hover={false}>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold text-text"><CalendarClock size={16} className="text-primary" /> Next runs</h2>
              <div className="flex items-center gap-3">
                <SegmentedControl options={zoneOptions} value={zone} onChange={setZone} variant="glass" />
                <SelectInput
                  aria-label="Number of runs"
                  value={String(count)}
                  onChange={(e) => setCount(Number(e.target.value))}
                  options={[5, 10, 25, 50].map((n) => ({ value: String(n), label: `${n} runs` }))}
                  className="w-28!"
                />
              </div>
            </div>
            {runs.length === 0 ? (
              <p className="text-sm text-text-muted">This schedule never fires (for example, February 31st).</p>
            ) : (
              <ol className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {runs.map((d, i) => (
                  <li key={d.getTime()} className="flex items-center gap-4 px-4 py-2 text-sm bg-surface/50">
                    <span className="w-6 text-text-muted text-right">{i + 1}</span>
                    <span className="flex-1 font-mono text-text">{fmt(d)}</span>
                    <span className="text-text-muted text-xs">{formatRelative(d)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
      )}

      <InfoCard title="Cron Syntax">
        <div className="grid md:grid-cols-2 gap-6">
          <pre className="bg-surface-alt rounded-lg p-4 border border-border font-mono text-xs text-text-secondary overflow-x-auto">{`┌───────────── minute (0–59)
│ ┌─────────── hour (0–23)
│ │ ┌───────── day of month (1–31)
│ │ │ ┌─────── month (1–12 or JAN–DEC)
│ │ │ │ ┌───── day of week (0–6 or SUN–SAT; 7 = Sunday)
│ │ │ │ │
* * * * *`}</pre>
          <div className="space-y-1.5 text-sm">
            {[
              ['*', 'every value'],
              ['5,10', 'a list of values'],
              ['1-5', 'a range'],
              ['*/15', 'every 15th value (0, 15, 30, 45)'],
              ['10-50/20', 'every 20th value from 10 to 50'],
              ['@daily', 'macros: @hourly @daily @weekly @monthly @yearly'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-4">
                <code className="w-24 shrink-0 font-mono text-primary">{k}</code>
                <span className="text-text-muted">{v}</span>
              </div>
            ))}
            <p className="text-xs text-text-muted pt-2">
              If both day-of-month and day-of-week are set, the job runs when <em>either</em> matches (standard cron behaviour).
            </p>
          </div>
        </div>
      </InfoCard>
    </ToolLayout>
  );
}
