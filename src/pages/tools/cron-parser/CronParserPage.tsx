import { useMemo } from 'react';
import cronstrue from 'cronstrue';
import { CalendarClock } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import CopyButton from '@components/ui/CopyButton';
import SegmentedControl from '@components/ui/SegmentedControl';
import { ErrorNotice, Panel } from '@components/workspace';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import { CRON_FIELDS, CRON_PRESETS, nextRuns, parseCron } from '@lib/cron-utils';
import { formatRelative } from '@lib/time-utils';

const FIELD_HINTS = ['0–59', '0–23', '1–31', '1–12 or JAN–DEC', '0–6 or SUN–SAT'];

const schema = {
  expr: opt.str('*/15 9-17 * * MON-FRI', 200),
  tz: opt.oneOf(['local', 'utc'] as const, 'local'),
  n: opt.oneOf(['5', '10', '25', '50'] as const, '10'),
};

function splitFields(expr: string): string[] {
  const parts = expr.trim().split(/\s+/);
  return Array.from({ length: 5 }, (_, i) => parts[i] ?? '');
}

export default function CronParserPage() {
  const [o, setO] = useUrlOptions(schema);
  const expr = o.expr;
  const setExpr = (v: string) => setO({ expr: v });

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
    () => (result.parsed ? nextRuns(result.parsed, new Date(), Number(o.n), o.tz === 'utc') : []),
    [result.parsed, o.n, o.tz],
  );

  const fields = splitFields(expr.startsWith('@') && result.parsed ? result.parsed.expression : expr);
  const setField = (i: number, value: string) => {
    const next = [...fields];
    next[i] = value.replace(/\s+/g, '') || '*';
    setExpr(next.join(' '));
  };

  const fmt = (d: Date) => (o.tz === 'utc'
    ? d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
    : d.toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));

  return (
    <ToolLayout
      seoTitle="Cron Expression Parser – Explain Cron Schedules & Next Run Times"
      tagline="Explain cron schedules in plain English and preview the next run times"
      metaDescription="Parse and explain cron expressions in plain English, edit each field, use presets and macros like @daily, and see the next run times in local time or UTC."
      about={
        <div className="grid gap-4 md:grid-cols-2">
          <pre className="rounded-md border border-border bg-surface-alt p-3 font-mono text-xs text-text-secondary overflow-x-auto">{`┌───────────── minute (0–59)
│ ┌─────────── hour (0–23)
│ │ ┌───────── day of month (1–31)
│ │ │ ┌─────── month (1–12 or JAN–DEC)
│ │ │ │ ┌───── day of week (0–6 or SUN–SAT; 7 = Sunday)
│ │ │ │ │
* * * * *`}</pre>
          <div className="space-y-1.5">
            {[
              ['*', 'every value'],
              ['5,10', 'a list of values'],
              ['1-5', 'a range'],
              ['*/15', 'every 15th value (0, 15, 30, 45)'],
              ['10-50/20', 'every 20th value from 10 to 50'],
              ['@daily', 'macros: @hourly @daily @weekly @monthly @yearly'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-4">
                <code className="w-24 shrink-0 text-text">{k}</code>
                <span>{v}</span>
              </div>
            ))}
            <p className="pt-2 text-xs text-text-muted">If both day-of-month and day-of-week are set, the job runs when <em>either</em> matches (standard cron behaviour).</p>
          </div>
        </div>
      }
    >
      <Panel
        title={<label htmlFor="cron-expr">Expression</label>}
        className="mb-4"
        bodyClassName="p-4 space-y-4"
        actions={
          <select
            aria-label="Presets"
            value=""
            onChange={(e) => e.target.value && setExpr(e.target.value)}
            className="h-7 pl-2 pr-7 rounded-md bg-surface-alt border border-border-strong text-xs text-text focus:outline-none focus:border-primary"
          >
            <option value="">Presets…</option>
            {CRON_PRESETS.map((p) => <option key={p.expression} value={p.expression}>{p.label}</option>)}
          </select>
        }
      >
        <div className="flex items-center rounded-md border border-border-strong bg-surface-alt focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
          <input
            id="cron-expr"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            className="flex-1 min-w-0 px-3 h-11 bg-transparent font-mono text-lg text-text focus:outline-none"
          />
          <CopyButton text={expr} label="" size="sm" className="mr-2 px-2!" />
        </div>

        {result.error ? (
          <ErrorNotice title="Invalid cron expression">{result.error}</ErrorNotice>
        ) : (
          <p className="text-lg font-semibold text-text" role="status">“{result.description}”</p>
        )}

        <div className="grid grid-cols-5 gap-2">
          {CRON_FIELDS.map((f, i) => (
            <label key={f.name} className="min-w-0">
              <input
                value={fields[i]}
                onChange={(e) => setField(i, e.target.value)}
                spellCheck={false}
                aria-label={`${f.name} (${FIELD_HINTS[i]})`}
                className="w-full h-9 px-2 text-center rounded-md bg-surface-alt border border-border-strong font-mono text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
              />
              <span aria-hidden="true" className="block mt-1.5 text-center text-xs font-medium text-text-secondary truncate">{f.name}</span>
              <span aria-hidden="true" className="hidden md:block text-center text-[11px] text-text-muted">{FIELD_HINTS[i]}</span>
            </label>
          ))}
        </div>
      </Panel>

      {result.parsed && (
        <Panel
          title={<span className="inline-flex items-center gap-1.5"><CalendarClock size={13} aria-hidden="true" /> Next runs</span>}
          bodyClassName=""
          actions={
            <>
              <SegmentedControl ariaLabel="Time zone" options={[{ id: 'local', label: 'Local' }, { id: 'utc', label: 'UTC' }]} value={o.tz} onChange={(v) => setO({ tz: v as 'local' | 'utc' })} />
              <select aria-label="Number of runs" value={o.n} onChange={(e) => setO({ n: e.target.value as typeof o.n })} className="h-7 pl-2 pr-7 rounded-md bg-surface-alt border border-border-strong text-xs text-text focus:outline-none focus:border-primary">
                {['5', '10', '25', '50'].map((n) => <option key={n} value={n}>{n} runs</option>)}
              </select>
            </>
          }
        >
          {runs.length === 0 ? (
            <p className="p-4 text-sm text-text-muted">This schedule never fires (for example, February 31st).</p>
          ) : (
            <ol className="divide-y divide-border">
              {runs.map((d, i) => (
                <li key={d.getTime()} className="flex items-center gap-4 px-4 py-2 text-sm">
                  <span className="w-6 text-right text-text-muted tabular-nums">{i + 1}</span>
                  <span className="flex-1 font-mono text-[13px] text-text">{fmt(d)}</span>
                  <span className="text-xs text-text-muted">{formatRelative(d)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      )}
    </ToolLayout>
  );
}
