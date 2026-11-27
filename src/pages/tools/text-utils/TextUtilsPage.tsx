import { useCallback, useMemo, useState } from 'react';
import { Redo2, Undo2 } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import CopyButton from '@components/ui/CopyButton';
import Button from '@components/ui/Button';
import { EditorPanel, Panel } from '@components/workspace';
import { useShareInput } from '@hooks/useShareInput';
import {
  CASE_STYLES, LINE_OPERATIONS, applyLineOperation, convertCase, slugify, textStats,
  type CaseStyle, type LineOperation,
} from '@lib/text-utils';

const SAMPLE = `The quick brown fox jumps over the lazy dog.
user_account_id
getHTTPResponseCode
Hello World`;

const OTHER_OPERATIONS: { id: string; label: string; fn: (t: string) => string }[] = [
  { id: 'slug', label: 'Slugify (per line)', fn: (t) => t.split('\n').map(slugify).join('\n') },
  { id: 'spaces', label: 'Collapse spaces', fn: (t) => t.split('\n').map((l) => l.replace(/[ \t]+/g, ' ')).join('\n') },
  { id: 'single-line', label: 'Remove line breaks', fn: (t) => t.replace(/\s*\n\s*/g, ' ').trim() },
  { id: 'reverse-text', label: 'Reverse text', fn: (t) => Array.from(t).reverse().join('') },
];

function useHistory(initial: string) {
  const [state, setState] = useState({ past: [] as string[], present: initial, future: [] as string[] });
  const set = useCallback((next: string, record = true) => {
    setState((s) => (next === s.present ? s : record
      ? { past: [...s.past.slice(-49), s.present], present: next, future: [] }
      : { ...s, present: next }));
  }, []);
  const undo = useCallback(() => setState((s) => (s.past.length
    ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] }
    : s)), []);
  const redo = useCallback(() => setState((s) => (s.future.length
    ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) }
    : s)), []);
  return { value: state.present, set, undo, redo, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}

const formatNumber = (n: number) => n.toLocaleString();

const action =
  'inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs text-text-secondary hover:text-text hover:bg-surface-hover transition-colors focus-ring disabled:opacity-40 disabled:pointer-events-none';

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={title} className="space-y-1.5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {title} {hint && <span className="font-normal normal-case tracking-normal">· {hint}</span>}
      </h2>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export default function TextUtilsPage() {
  const text = useHistory(SAMPLE);
  const stats = useMemo(() => textStats(text.value), [text.value]);

  useShareInput({ text: text.value }, (d) => d.text !== undefined && text.set(d.text), { enabled: text.value.length > 0 });

  const apply = (fn: (t: string) => string) => {
    if (text.value) text.set(fn(text.value));
  };

  const statRows: [string, string][] = [
    ['Characters', formatNumber(stats.characters)],
    ['Without spaces', formatNumber(stats.charactersNoSpaces)],
    ['Words', formatNumber(stats.words)],
    ['Lines', formatNumber(stats.lines)],
    ['Sentences', formatNumber(stats.sentences)],
    ['Paragraphs', formatNumber(stats.paragraphs)],
    ['Bytes (UTF-8)', formatNumber(stats.bytes)],
    ['Reading time', stats.readingMinutes < 1 ? `${Math.ceil(stats.readingMinutes * 60)} sec` : `${Math.round(stats.readingMinutes)} min`],
  ];

  return (
    <ToolLayout
      seoTitle="Case Converter – camelCase, snake_case, kebab-case & Text Tools"
      tagline="Convert case, sort and clean up lines, and count words and characters. Edits apply in place."
      metaDescription="Convert text to camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, Title Case and more. Sort, dedupe and trim lines, slugify, and count characters, words, lines and bytes."
      variant="wide"
      about={
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['camelCase', 'JavaScript/Java variables and functions'],
            ['PascalCase', 'Classes, types, React components'],
            ['snake_case', 'Python, Ruby, SQL columns'],
            ['CONSTANT_CASE', 'Constants and environment variables'],
            ['kebab-case', 'URLs, CSS classes, file names, CLI flags'],
            ['Train-Case', 'HTTP headers (Content-Type)'],
            ['dot.case', 'Config keys and i18n message ids'],
            ['Title Case', 'Headings; small words like “of” stay lower case'],
          ].map(([name, use]) => (
            <div key={name} className="rounded-md border border-border bg-surface-alt p-2.5">
              <code className="text-[13px] text-text">{name}</code>
              <p className="mt-0.5 text-xs text-text-muted">{use}</p>
            </div>
          ))}
        </div>
      }
    >
      <Panel title="Transforms" className="mb-4" bodyClassName="p-4 grid gap-4 xl:grid-cols-[3fr_2fr_2fr]">
        <Group title="Case" hint="line by line">
          {CASE_STYLES.map((c) => (
            <Button key={c.id} variant="secondary" size="sm" onClick={() => apply((t) => convertCase(t, c.id as CaseStyle))} title={c.example} className="font-mono">
              {c.label}
            </Button>
          ))}
        </Group>
        <Group title="Lines">
          {LINE_OPERATIONS.map((op) => (
            <Button key={op.id} variant="secondary" size="sm" onClick={() => apply((t) => applyLineOperation(t, op.id as LineOperation))}>{op.label}</Button>
          ))}
        </Group>
        <Group title="Other">
          {OTHER_OPERATIONS.map((op) => (
            <Button key={op.id} variant="secondary" size="sm" onClick={() => apply(op.fn)}>{op.label}</Button>
          ))}
        </Group>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem] items-start">
        <EditorPanel
          label="Text"
          value={text.value}
          onChange={(v) => text.set(v, false)}
          placeholder="Type or paste text…"
          sample={SAMPLE}
          fileAccept="text/*,.txt,.md,.csv"
          textareaClassName="min-h-80"
          textareaProps={{ onBlur: () => text.set(text.value) }}
          actions={
            <>
              <button type="button" onClick={text.undo} disabled={!text.canUndo} className={action}><Undo2 size={13} aria-hidden="true" /> Undo</button>
              <button type="button" onClick={text.redo} disabled={!text.canRedo} className={action}><Redo2 size={13} aria-hidden="true" /> Redo</button>
              <CopyButton text={text.value} size="sm" className="h-7! border-transparent! bg-transparent! hover:bg-surface-hover! text-text-secondary hover:text-text" />
            </>
          }
        />
        <Panel title="Statistics">
          <dl className="divide-y divide-border" aria-live="polite">
            {statRows.map(([label, value]) => (
              <div key={label} className="flex justify-between py-1.5 text-sm first:pt-0 last:pb-0">
                <dt className="text-text-muted">{label}</dt>
                <dd className="font-mono text-[13px] text-text tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </ToolLayout>
  );
}
