import { useMemo, useState } from 'react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import ToolIO from '@components/ui/ToolIO';
import Checkbox from '@components/ui/Checkbox';
import SegmentedControl from '@components/ui/SegmentedControl';
import { SecondaryButton } from '@components/ui/Button';
import { Field, SelectInput } from '@components/ui/Input';
import useLocalStorage from '@hooks/useLocalStorage';
import { SQL_DIALECTS, formatSql, minifySql, type Case, type SqlFormatOptions } from '@lib/sql-format-utils';

const SAMPLE = `-- Top customers by revenue in the last 90 days
select c.id, c.name, count(o.id) as orders, sum(o.total) as revenue from customers c join orders o on o.customer_id = c.id where o.created_at >= current_date - interval '90 days' and o.status in ('paid','shipped') group by c.id, c.name having sum(o.total) > 1000 order by revenue desc limit 10;
update customers set tier = 'gold' where id in (select customer_id from orders group by customer_id having count(*) > 20);`;

const modeOptions = [
  { id: 'format', label: 'Format' },
  { id: 'minify', label: 'Minify' },
];
const caseOptions = [
  { id: 'upper', label: 'UPPER' },
  { id: 'lower', label: 'lower' },
  { id: 'preserve', label: 'Preserve' },
];
const indentOptions = [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
  { value: 'tab', label: 'Tabs' },
];
const styleOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'tabularLeft', label: 'Tabular (left)' },
  { value: 'tabularRight', label: 'Tabular (right)' },
];

export default function SqlFormatterPage() {
  const [input, setInput] = useState(SAMPLE);
  const [mode, setMode] = useState('format');
  const [dialect, setDialect] = useLocalStorage<SqlFormatOptions['dialect']>('sql-formatter:dialect', 'postgresql');
  const [keywordCase, setKeywordCase] = useState<Case>('upper');
  const [indent, setIndent] = useState('2');
  const [indentStyle, setIndentStyle] = useState<NonNullable<SqlFormatOptions['indentStyle']>>('standard');
  const [denseOperators, setDenseOperators] = useState(false);
  const [andAfter, setAndAfter] = useState(false);

  const { output, error } = useMemo(() => {
    try {
      const out = mode === 'minify'
        ? minifySql(input)
        : formatSql(input, {
          dialect,
          keywordCase,
          indent: indent === 'tab' ? 'tab' : Number(indent),
          indentStyle,
          denseOperators,
          logicalOperatorNewline: andAfter ? 'after' : 'before',
        });
      return { output: out, error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, mode, dialect, keywordCase, indent, indentStyle, denseOperators, andAfter]);

  return (
    <ToolLayout
      title="SQL Formatter"
      seoTitle="SQL Formatter & Beautifier – MySQL, PostgreSQL, SQL Server & more"
      tagline="Format or minify SQL for 16 dialects with keyword case and indentation options"
      metaDescription="Format and beautify SQL queries online for MySQL, PostgreSQL, SQLite, SQL Server, Oracle, BigQuery, Snowflake and more. Choose keyword case, indentation and layout, or minify SQL to one line."
    >
      <Card hover={false}>
        <div className="p-6">
          <ToolIO
            layout="side"
            input={input}
            onInputChange={setInput}
            output={output}
            error={error}
            inputLabel="SQL:"
            outputLabel={mode === 'minify' ? 'Minified:' : 'Formatted:'}
            inputPlaceholder="Paste SQL here..."
            downloadName="query.sql"
            downloadMime="application/sql"
            inputClassName="min-h-96! [tab-size:4]"
            outputClassName="min-h-96! [tab-size:4]"
            options={
              <div className="space-y-4">
                <div className="flex flex-wrap items-end gap-4">
                  <SegmentedControl options={modeOptions} value={mode} onChange={setMode} />
                  {mode === 'format' && (
                    <>
                      <Field label="Dialect" htmlFor="sql-dialect" className="w-52">
                        <SelectInput
                          id="sql-dialect"
                          value={dialect}
                          onChange={(e) => setDialect(e.target.value as SqlFormatOptions['dialect'])}
                          options={SQL_DIALECTS.map((d) => ({ value: d.id, label: d.label }))}
                        />
                      </Field>
                      <Field label="Indent" htmlFor="sql-indent" className="w-32">
                        <SelectInput id="sql-indent" value={indent} onChange={(e) => setIndent(e.target.value)} options={indentOptions} />
                      </Field>
                      <Field label="Layout" htmlFor="sql-style" className="w-40">
                        <SelectInput
                          id="sql-style"
                          value={indentStyle}
                          onChange={(e) => setIndentStyle(e.target.value as typeof indentStyle)}
                          options={styleOptions}
                        />
                      </Field>
                    </>
                  )}
                </div>
                {mode === 'format' && (
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm text-text-secondary">Keywords:</span>
                    <SegmentedControl options={caseOptions} value={keywordCase} onChange={(v) => setKeywordCase(v as Case)} variant="glass" />
                    <Checkbox checked={denseOperators} onChange={setDenseOperators} label="Dense operators (a=b)" />
                    <Checkbox checked={andAfter} onChange={setAndAfter} label="AND / OR at line end" />
                  </div>
                )}
              </div>
            }
            actions={<SecondaryButton onClick={() => setInput(SAMPLE)}>Load sample</SecondaryButton>}
          />
        </div>
      </Card>

      <InfoCard title="About SQL Formatting">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { t: 'Dialect-aware', d: 'Each dialect knows its own keywords, quoting (`backticks`, [brackets], "double quotes"), parameters ($1, ?, :name) and operators such as PostgreSQL’s :: casts.' },
            { t: 'Readable diffs', d: 'One clause per line and one column per line make code review and version-control diffs of queries much easier to read.' },
            { t: 'Minify', d: 'Minify strips comments and collapses whitespace outside strings and quoted identifiers — handy for embedding a query in code or logs.' },
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
