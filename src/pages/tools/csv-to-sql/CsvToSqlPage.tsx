import { useState, useMemo, useDeferredValue } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Checkbox from '@components/ui/Checkbox';
import SegmentedControl from '@components/ui/SegmentedControl';
import { EditorPanel, OutputPanel, Panel, SplitPane, Toolbar, ToolbarDivider, ToolbarSelect } from '@components/workspace';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import { useShareInput } from '@hooks/useShareInput';
import {
  parseCsv,
  detectDelimiter,
  generateSql,
  type SqlDialect,
  type SqlAction,
  type Delimiter,
  type ParsedCsv,
} from '@lib/csv-sql-utils';
import CsvPreviewTable from './CsvPreviewTable';

const MAX_ROWS_WARNING = 10000;

const actionLabels: Record<SqlAction, string> = {
  create: 'CREATE TABLE',
  insert: 'INSERT',
  'batch-insert': 'BATCH INSERT',
  upsert: 'UPSERT',
  update: 'UPDATE',
};

const dialectLabels: { id: SqlDialect; label: string }[] = [
  { id: 'mysql', label: 'MySQL' },
  { id: 'postgresql', label: 'PostgreSQL' },
  { id: 'sqlite', label: 'SQLite' },
];

const DELIMS = { auto: 'auto', comma: ',', tab: '\t', semicolon: ';', pipe: '|' } as const;
type DelimId = keyof typeof DELIMS;
const delimiterOptions: { value: DelimId; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'comma', label: 'Comma (,)' },
  { value: 'tab', label: 'Tab' },
  { value: 'semicolon', label: 'Semicolon (;)' },
  { value: 'pipe', label: 'Pipe (|)' },
];

const ACTIONS = ['create', 'insert', 'batch-insert', 'upsert', 'update'] as const;

const schema = {
  action: opt.oneOf(ACTIONS, 'insert'),
  dialect: opt.oneOf(['mysql', 'postgresql', 'sqlite'] as const, 'postgresql'),
  delim: opt.oneOf(Object.keys(DELIMS) as [DelimId, ...DelimId[]], 'auto'),
  table: opt.str('my_table', 64),
  schema: opt.str('', 64),
  headers: opt.bool(true),
  emptyNull: opt.bool(true),
  nullStr: opt.bool(true),
  quote: opt.bool(false),
  batch: opt.num(100, { min: 1, max: 100000 }),
  key: opt.str('', 64),
};

const sampleCsv = `id,name,email,age,active
1,John Doe,john@example.com,30,true
2,Jane Smith,jane@example.com,25,true
3,Bob Wilson,bob@example.com,35,false`;

const smallInput =
  'h-7 px-2 rounded-md bg-surface-alt border border-border-strong font-mono text-xs text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25';

export default function CsvToSqlPage() {
  const [input, setInput] = useState('');
  const [o, setO] = useUrlOptions(schema);
  const [showPreview, setShowPreview] = useState(true);
  const deferred = useDeferredValue(input);

  const parsed: ParsedCsv = useMemo(() => {
    if (!deferred.trim()) return { headers: [], rows: [] };
    try {
      return parseCsv(deferred, DELIMS[o.delim] as Delimiter | 'auto', '"', o.headers);
    } catch {
      return { headers: [], rows: [] };
    }
  }, [deferred, o.delim, o.headers]);

  const detected = useMemo(() => {
    if (o.delim !== 'auto' || !deferred.trim()) return null;
    const d = detectDelimiter(deferred);
    return ({ ',': 'comma', '\t': 'tab', ';': 'semicolon', '|': 'pipe' } as Record<string, string>)[d] ?? d;
  }, [deferred, o.delim]);

  const needsKey = o.action === 'upsert' || o.action === 'update';
  const keyColumn = parsed.headers.includes(o.key) ? o.key : parsed.headers[0] ?? '';

  const { output, error } = useMemo(() => {
    if (!deferred.trim()) return { output: '', error: null };
    if (parsed.headers.length === 0) return { output: '', error: 'Could not find any columns. Check the delimiter and header settings.' };
    try {
      return {
        output: generateSql({
          action: o.action,
          table: o.table || 'my_table',
          schema: o.schema,
          headers: parsed.headers,
          rows: parsed.rows,
          dialect: o.dialect,
          treatEmptyAsNull: o.emptyNull,
          treatNullStringAsNull: o.nullStr,
          batchSize: o.batch,
          conflictColumn: keyColumn,
          quoteIdentifiers: o.quote,
        }),
        error: null,
      };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [deferred, parsed, o, keyColumn]);

  useShareInput({ input }, (d) => d.input !== undefined && setInput(d.input), { enabled: input.length > 0 && input.length < 20000 });

  const rowsLabel = `${parsed.rows.length.toLocaleString()} rows · ${parsed.headers.length} columns${detected ? ` · ${detected}-separated` : ''}`;

  return (
    <ToolLayout
      seoTitle="CSV to SQL Converter – INSERT, CREATE TABLE, UPSERT"
      tagline="Turn CSV into CREATE TABLE, INSERT, batch INSERT, UPSERT or UPDATE statements for MySQL, PostgreSQL and SQLite"
      metaDescription="Convert CSV data to SQL INSERT, CREATE TABLE, UPSERT, and UPDATE statements. Supports MySQL, PostgreSQL, and SQLite dialects."
      variant="workspace"
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">Types are inferred</strong> per column for CREATE TABLE: integers, decimals, booleans and text. Empty cells and the word NULL can become SQL NULL.</li>
          <li><strong className="text-text">Batch INSERT</strong> groups rows into multi-row statements, much faster to import than one INSERT per row.</li>
          <li><strong className="text-text">UPSERT and UPDATE</strong> match rows on the key column using each dialect’s syntax (ON CONFLICT, ON DUPLICATE KEY).</li>
        </ul>
      }
    >
      <Toolbar>
        <SegmentedControl ariaLabel="Statement" options={ACTIONS.map((a) => ({ id: a, label: actionLabels[a] }))} value={o.action} onChange={(v) => setO({ action: v as SqlAction })} />
        <ToolbarSelect label="Dialect" value={o.dialect} onChange={(v) => setO({ dialect: v as SqlDialect })} options={dialectLabels.map((d) => ({ value: d.id, label: d.label }))} />
      </Toolbar>
      <Toolbar>
        <label htmlFor="csv-table" className="text-xs text-text-muted">Table</label>
        <input id="csv-table" value={o.table} onChange={(e) => setO({ table: e.target.value })} className={`${smallInput} w-32`} spellCheck={false} />
        <label htmlFor="csv-schema" className="text-xs text-text-muted">Schema</label>
        <input id="csv-schema" value={o.schema} onChange={(e) => setO({ schema: e.target.value })} placeholder="optional" className={`${smallInput} w-24`} spellCheck={false} />
        {o.action === 'batch-insert' && (
          <>
            <label htmlFor="csv-batch" className="text-xs text-text-muted">Rows per statement</label>
            <input id="csv-batch" type="number" min={1} value={o.batch} onChange={(e) => setO({ batch: Math.max(1, Number(e.target.value) || 1) })} className={`${smallInput} w-20`} />
          </>
        )}
        {needsKey && parsed.headers.length > 0 && (
          <ToolbarSelect label="Key column" value={keyColumn} onChange={(v) => setO({ key: v })} options={parsed.headers.map((h) => ({ value: h, label: h }))} />
        )}
        <ToolbarDivider />
        <ToolbarSelect label="Delimiter" value={o.delim} onChange={(v) => setO({ delim: v as DelimId })} options={delimiterOptions} />
        <Checkbox checked={o.headers} onChange={(v) => setO({ headers: v })} label="First row is header" className="text-xs" />
        <Checkbox checked={o.emptyNull} onChange={(v) => setO({ emptyNull: v })} label="Empty → NULL" className="text-xs" />
        <Checkbox checked={o.nullStr} onChange={(v) => setO({ nullStr: v })} label="“NULL” → NULL" className="text-xs" />
        <Checkbox checked={o.quote} onChange={(v) => setO({ quote: v })} label="Quote identifiers" className="text-xs" />
      </Toolbar>

      <SplitPane
        storageKey="csv-to-sql"
        left={
          <div className="flex flex-col flex-1 min-h-0 gap-3">
            <EditorPanel
              label="CSV"
              value={input}
              onChange={setInput}
              placeholder="Paste CSV, or open / drop a .csv or .tsv file"
              sample={sampleCsv}
              fileAccept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
              maxFileBytes={50 * 1024 * 1024}
              status={parsed.headers.length ? rowsLabel : undefined}
              className="flex-1"
            />
            {parsed.headers.length > 0 && (
              <Panel
                title="Preview"
                className="shrink-0"
                bodyClassName={showPreview ? 'max-h-52 overflow-auto' : 'hidden'}
                actions={
                  <button type="button" onClick={() => setShowPreview((v) => !v)} aria-expanded={showPreview} className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs text-text-secondary hover:text-text hover:bg-surface-hover focus-ring">
                    {showPreview ? <EyeOff size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />} {showPreview ? 'Hide' : 'Show'}
                  </button>
                }
              >
                <CsvPreviewTable headers={parsed.headers} rows={parsed.rows} />
              </Panel>
            )}
          </div>
        }
        right={
          <OutputPanel
            label="SQL"
            value={output}
            error={error}
            errorTitle="Could not generate SQL"
            placeholder="SQL statements appear here"
            status={parsed.rows.length > MAX_ROWS_WARNING ? `Large file: ${parsed.rows.length.toLocaleString()} rows` : null}
            downloadName={`${o.table || 'output'}.sql`}
            downloadMime="application/sql"
            className="flex-1"
          />
        }
      />
    </ToolLayout>
  );
}
