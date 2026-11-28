import { useDeferredValue, useMemo, useState } from 'react';
import ToolLayout from '@components/layout/ToolLayout';
import Checkbox from '@components/ui/Checkbox';
import SegmentedControl from '@components/ui/SegmentedControl';
import { EditorPanel, OutputPanel, SplitPane, Toolbar, ToolbarDivider, ToolbarSelect } from '@components/workspace';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import { useShareInput } from '@hooks/useShareInput';
import { SQL_DIALECTS, formatSql, minifySql, type Case, type SqlFormatOptions } from '@lib/sql-format-utils';

const SAMPLE = `-- Top customers by revenue in the last 90 days
select c.id, c.name, count(o.id) as orders, sum(o.total) as revenue from customers c join orders o on o.customer_id = c.id where o.created_at >= current_date - interval '90 days' and o.status in ('paid','shipped') group by c.id, c.name having sum(o.total) > 1000 order by revenue desc limit 10;
update customers set tier = 'gold' where id in (select customer_id from orders group by customer_id having count(*) > 20);`;

const DIALECT_IDS = SQL_DIALECTS.map((d) => d.id) as [SqlFormatOptions['dialect'], ...SqlFormatOptions['dialect'][]];

const schema = {
  mode: opt.oneOf(['format', 'minify'] as const, 'format'),
  dialect: opt.oneOf(DIALECT_IDS, 'postgresql'),
  case: opt.oneOf(['upper', 'lower', 'preserve'] as const, 'upper'),
  indent: opt.oneOf(['2', '4', 'tab'] as const, '2'),
  layout: opt.oneOf(['standard', 'tabularLeft', 'tabularRight'] as const, 'standard'),
  dense: opt.bool(false),
  andAfter: opt.bool(false),
};

export default function SqlFormatterPage() {
  const [input, setInput] = useState(SAMPLE);
  const [o, setO] = useUrlOptions(schema, { persist: { dialect: 'sql-formatter:dialect' } });
  const deferred = useDeferredValue(input);

  const { output, error } = useMemo(() => {
    try {
      const out = o.mode === 'minify'
        ? minifySql(deferred)
        : formatSql(deferred, {
          dialect: o.dialect,
          keywordCase: o.case as Case,
          indent: o.indent === 'tab' ? 'tab' : Number(o.indent),
          indentStyle: o.layout,
          denseOperators: o.dense,
          logicalOperatorNewline: o.andAfter ? 'after' : 'before',
        });
      return { output: out, error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [deferred, o]);

  useShareInput({ input }, (d) => d.input !== undefined && setInput(d.input), { enabled: input.length > 0 });

  return (
    <ToolLayout
      seoTitle="SQL Formatter & Beautifier – MySQL, PostgreSQL, SQL Server & more"
      tagline="Format or minify SQL for 16 dialects. Results update as you type."
      metaDescription="Format and beautify SQL queries online for MySQL, PostgreSQL, SQLite, SQL Server, Oracle, BigQuery, Snowflake and more. Choose keyword case, indentation and layout, or minify SQL to one line."
      variant="workspace"
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">Dialect-aware.</strong> Each dialect knows its keywords, quoting (`backticks`, [brackets], "double quotes"), parameters ($1, ?, :name) and operators such as PostgreSQL’s :: casts.</li>
          <li><strong className="text-text">Readable diffs.</strong> One clause per line and one column per line make code review and version-control diffs of queries easier to read.</li>
          <li><strong className="text-text">Minify.</strong> Strips comments and collapses whitespace outside strings and quoted identifiers, handy for embedding a query in code or logs.</li>
        </ul>
      }
    >
      <Toolbar>
        <SegmentedControl ariaLabel="Operation" options={[{ id: 'format', label: 'Format' }, { id: 'minify', label: 'Minify' }]} value={o.mode} onChange={(v) => setO({ mode: v as 'format' | 'minify' })} />
        {o.mode === 'format' && (
          <>
            <ToolbarDivider />
            <ToolbarSelect label="Dialect" value={o.dialect} onChange={(v) => setO({ dialect: v as SqlFormatOptions['dialect'] })} options={SQL_DIALECTS.map((d) => ({ value: d.id, label: d.label }))} />
            <ToolbarSelect label="Indent" value={o.indent} onChange={(v) => setO({ indent: v as typeof o.indent })} options={[{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: 'tab', label: 'Tabs' }]} />
            <ToolbarSelect label="Layout" value={o.layout} onChange={(v) => setO({ layout: v as typeof o.layout })} options={[{ value: 'standard', label: 'Standard' }, { value: 'tabularLeft', label: 'Tabular (left)' }, { value: 'tabularRight', label: 'Tabular (right)' }]} />
            <ToolbarDivider />
            <span className="text-xs text-text-muted">Keywords</span>
            <SegmentedControl ariaLabel="Keyword case" options={[{ id: 'upper', label: 'UPPER' }, { id: 'lower', label: 'lower' }, { id: 'preserve', label: 'Preserve' }]} value={o.case} onChange={(v) => setO({ case: v as typeof o.case })} />
            <Checkbox checked={o.dense} onChange={(v) => setO({ dense: v })} label="Dense operators" className="text-xs" />
            <Checkbox checked={o.andAfter} onChange={(v) => setO({ andAfter: v })} label="AND/OR at line end" className="text-xs" />
          </>
        )}
      </Toolbar>
      <SplitPane
        storageKey="sql-formatter"
        left={<EditorPanel label="SQL" value={input} onChange={setInput} placeholder="Paste SQL here…" sample={SAMPLE} fileAccept=".sql,text/plain" className="flex-1" textareaClassName="[tab-size:4]" />}
        right={
          <OutputPanel
            label={o.mode === 'minify' ? 'Minified' : 'Formatted'}
            value={output}
            error={error}
            errorTitle="Could not parse this SQL"
            placeholder="Formatted SQL appears here"
            downloadName="query.sql"
            downloadMime="application/sql"
            onUseAsInput={() => setInput(output)}
            className="flex-1"
            textareaClassName="[tab-size:4]"
          />
        }
      />
    </ToolLayout>
  );
}
