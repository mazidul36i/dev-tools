import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Clipboard, Eraser, Redo2, Undo2 } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import CopyButton from '@components/ui/CopyButton';
import { SmallButton } from '@components/ui/Button';
import { TextAreaInput } from '@components/ui/TextArea';
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

export default function TextUtilsPage() {
  const text = useHistory(SAMPLE);
  const stats = useMemo(() => textStats(text.value), [text.value]);

  const apply = (fn: (t: string) => string) => {
    if (!text.value) {
      toast.error('Enter some text first');
      return;
    }
    text.set(fn(text.value));
  };

  const paste = useCallback(async () => {
    try {
      text.set(await navigator.clipboard.readText());
    } catch {
      toast.error('Unable to paste');
    }
  }, [text]);

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

  const buttonClass = 'px-3 py-2 rounded-lg text-sm text-left border border-border bg-surface hover:border-primary/40 hover:bg-primary/5 transition-colors';

  return (
    <ToolLayout
      title="Case Converter & Text Utilities"
      seoTitle="Case Converter – camelCase, snake_case, kebab-case & Text Tools"
      tagline="Convert text case, sort and clean up lines, and count words and characters"
      metaDescription="Convert text to camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, Title Case and more. Sort, dedupe and trim lines, slugify, and count characters, words, lines and bytes."
    >
      <div className="grid lg:grid-cols-[1fr_280px] gap-3">
        <Card hover={false} className="mb-0! lg:mb-3!">
          <div className="p-6">
            <TextAreaInput
              value={text.value}
              onChange={(e) => text.set(e.target.value, false)}
              onBlur={() => text.set(text.value)}
              placeholder="Type or paste text..."
              aria-label="Text"
              spellCheck={false}
              className="min-h-72!"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <SmallButton onClick={text.undo} disabled={!text.canUndo}><Undo2 size={12} /> Undo</SmallButton>
              <SmallButton onClick={text.redo} disabled={!text.canRedo}><Redo2 size={12} /> Redo</SmallButton>
              <SmallButton onClick={() => text.set('')}><Eraser size={12} /> Clear</SmallButton>
              <SmallButton onClick={paste}><Clipboard size={12} /> Paste</SmallButton>
              <CopyButton text={text.value} size="sm" className="ml-auto" />
            </div>
          </div>
        </Card>
        <Card hover={false}>
          <div className="p-6">
            <h2 className="font-semibold text-text mb-3">Statistics</h2>
            <dl className="divide-y divide-border">
              {statRows.map(([label, value]) => (
                <div key={label} className="flex justify-between py-1.5 text-sm">
                  <dt className="text-text-muted">{label}</dt>
                  <dd className="font-mono text-text">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Card>
      </div>

      <Card hover={false}>
        <div className="p-6 space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-text-secondary mb-3">Change case <span className="font-normal text-text-muted">(applied line by line)</span></h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2">
              {CASE_STYLES.map((c) => (
                <button key={c.id} onClick={() => apply((t) => convertCase(t, c.id as CaseStyle))} className={buttonClass} title={c.example}>
                  <span className="font-mono text-text">{c.label}</span>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-text-secondary mb-3">Lines</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
              {LINE_OPERATIONS.map((op) => (
                <button key={op.id} onClick={() => apply((t) => applyLineOperation(t, op.id as LineOperation))} className={buttonClass}>
                  <span className="text-text">{op.label}</span>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-text-secondary mb-3">Other</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
              {OTHER_OPERATIONS.map((op) => (
                <button key={op.id} onClick={() => apply(op.fn)} className={buttonClass}>
                  <span className="text-text">{op.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </Card>

      <InfoCard title="Naming Conventions">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['camelCase', 'JavaScript/Java variables and functions'],
            ['PascalCase', 'Classes, types, React components'],
            ['snake_case', 'Python, Ruby, SQL columns'],
            ['CONSTANT_CASE', 'Constants and environment variables'],
            ['kebab-case', 'URLs, CSS classes, file names, CLI flags'],
            ['Train-Case', 'HTTP headers (Content-Type)'],
            ['dot.case', 'Config keys and i18n message ids'],
            ['Title Case', 'Headings — small words like “of” stay lower case'],
          ].map(([name, use]) => (
            <div key={name} className="bg-surface-alt rounded-lg p-4 border border-border">
              <div className="font-mono text-sm text-primary mb-1">{name}</div>
              <p className="text-xs text-text-muted">{use}</p>
            </div>
          ))}
        </div>
      </InfoCard>
    </ToolLayout>
  );
}
