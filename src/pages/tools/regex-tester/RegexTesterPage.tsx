import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Timer } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import Tabs from '@components/ui/Tabs';
import Badge from '@components/ui/Badge';
import CodeBlock from '@components/ui/CodeBlock';
import { TextAreaInput } from '@components/ui/TextArea';
import { Field, SelectInput, TextInput } from '@components/ui/Input';
import {
  REGEX_CHEATSHEET, REGEX_FLAGS, REGEX_PRESETS, segmentText, type RegexRunResult,
} from '@lib/regex-utils';
import type { RegexWorkerRequest } from '@lib/regex.worker';
import RegexWorker from '@lib/regex.worker?worker';

const TIMEOUT_MS = 2000;

const SAMPLE_TEXT = `Contact us at support@example.com or sales@example.org.
Release dates: 2024-03-15, 2024-11-02 and 2025-01-20.
Visit https://example.com/docs?page=2 for more.`;

const HIGHLIGHTS = [
  'bg-amber-200/80 dark:bg-amber-500/40',
  'bg-sky-200/80 dark:bg-sky-500/40',
];

type WorkerState =
  | { status: 'ok'; result: RegexRunResult }
  | { status: 'timeout' };

/** Runs the regex in a worker, restarting it if a run takes too long. */
function useRegexRun(pattern: string, flags: string, text: string, replacement: string | undefined) {
  const workerRef = useRef<Worker | null>(null);
  const idRef = useRef(0);
  const [state, setState] = useState<WorkerState>({ status: 'ok', result: { matches: [], truncated: false } });

  useEffect(() => () => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new RegexWorker();
    }
    const worker = workerRef.current;
    const id = ++idRef.current;
    const timer = setTimeout(() => {
      if (idRef.current !== id) return;
      worker.terminate();
      workerRef.current = null;
      setState({ status: 'timeout' });
    }, TIMEOUT_MS);
    const onMessage = (e: MessageEvent<{ id: number; result: RegexRunResult }>) => {
      if (e.data.id !== id) return;
      clearTimeout(timer);
      setState({ status: 'ok', result: e.data.result });
    };
    worker.addEventListener('message', onMessage);
    const request: RegexWorkerRequest = { id, pattern, flags, text, replacement };
    worker.postMessage(request);
    return () => {
      clearTimeout(timer);
      worker.removeEventListener('message', onMessage);
    };
  }, [pattern, flags, text, replacement]);

  return state;
}

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState(REGEX_PRESETS[0].pattern);
  const [flags, setFlags] = useState('gi');
  const [text, setText] = useState(SAMPLE_TEXT);
  const [tab, setTab] = useState('matches');
  const [replacement, setReplacement] = useState('[redacted]');

  const run = useRegexRun(pattern, flags, text, tab === 'replace' ? replacement : undefined);
  const result = run.status === 'ok' ? run.result : null;
  const matches = result?.matches ?? [];
  const segments = useMemo(() => segmentText(text, matches), [text, matches]);
  const groupCount = matches.reduce((n, m) => Math.max(n, m.groups.length), 0);
  const hasNamed = matches.some((m) => Object.keys(m.named).length > 0);

  const toggleFlag = (f: string) => {
    const next = flags.includes(f) ? flags.replace(f, '') : flags + f;
    setFlags(REGEX_FLAGS.map((x) => x.flag).filter((x) => next.includes(x)).join(''));
  };

  return (
    <ToolLayout
      title="Regex Tester"
      seoTitle="Regex Tester – Test JavaScript Regular Expressions Online"
      tagline="Build and test JavaScript regular expressions with live highlighting, groups and replace"
      metaDescription="Test JavaScript regular expressions online with live match highlighting, capture and named groups, flags, replace preview, common patterns and a cheat sheet."
    >
      <Card hover={false}>
        <div className="p-6 space-y-4">
          <div className="grid md:grid-cols-[1fr_220px] gap-3 items-end">
            <Field label="Regular expression" htmlFor="regex-pattern">
              <div className="flex items-center rounded-lg border border-border bg-surface focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 font-mono text-sm">
                <span className="pl-3 text-text-muted select-none">/</span>
                <input
                  id="regex-pattern"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  spellCheck={false}
                  placeholder="Enter a pattern, e.g. \d+"
                  className="flex-1 min-w-0 px-1 py-2 bg-transparent text-text focus:outline-none"
                />
                <span className="pr-3 text-text-muted select-none">/<span className="text-primary">{flags}</span></span>
              </div>
            </Field>
            <SelectInput
              aria-label="Load a common pattern"
              value=""
              onChange={(e) => {
                const preset = REGEX_PRESETS.find((p) => p.name === e.target.value);
                if (preset) {
                  setPattern(preset.pattern);
                  setFlags(preset.flags);
                }
              }}
              options={[{ value: '', label: 'Common patterns…' }, ...REGEX_PRESETS.map((p) => ({ value: p.name, label: p.name }))]}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {REGEX_FLAGS.map(({ flag, name, desc }) => (
              <button
                key={flag}
                onClick={() => toggleFlag(flag)}
                title={desc}
                aria-pressed={flags.includes(flag)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-colors ${
                  flags.includes(flag)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-alt text-text-secondary border-border hover:border-primary/40'}`}
              >
                {flag} <span className="font-sans opacity-80">{name}</span>
              </button>
            ))}
          </div>

          {run.status === 'timeout' && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-warning/30 bg-warning/5 text-warning text-sm">
              <Timer size={16} className="shrink-0 mt-0.5" />
              Stopped after {TIMEOUT_MS / 1000}s — the pattern is probably backtracking catastrophically (e.g. nested quantifiers like (a+)+).
            </div>
          )}
          {result?.error && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-error/30 bg-error/5 text-error text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" /> {result.error}
            </div>
          )}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-3">
        <Card hover={false} className="mb-0! lg:mb-3!">
          <div className="p-6">
            <label htmlFor="regex-text" className="block text-sm font-medium text-text-secondary mb-2">Test string</label>
            <TextAreaInput
              id="regex-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              className="min-h-64!"
            />
          </div>
        </Card>
        <Card hover={false}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">Matches</span>
              <Badge tone={matches.length ? 'success' : 'neutral'}>
                {matches.length}{result?.truncated ? '+' : ''} match{matches.length === 1 ? '' : 'es'}
              </Badge>
            </div>
            <pre className="min-h-64 max-h-[28rem] overflow-auto p-3.5 rounded-lg border border-border bg-surface-alt font-mono text-sm text-text-secondary whitespace-pre-wrap break-words">
              {segments.map((s, i) =>
                s.match < 0
                  ? <span key={i}>{s.text}</span>
                  : (
                    <mark key={i} title={`Match ${s.match + 1}`} className={`${HIGHLIGHTS[s.match % 2]} text-text rounded-sm`}>
                      {s.text || '​'}
                    </mark>
                  ))}
            </pre>
          </div>
        </Card>
      </div>

      <Card hover={false}>
        <Tabs
          tabs={[{ id: 'matches', label: 'Match details' }, { id: 'replace', label: 'Replace' }]}
          activeTab={tab}
          onTabChange={setTab}
        />
        <div className="p-6">
          {tab === 'matches' ? (
            matches.length === 0 ? (
              <p className="text-sm text-text-muted">No matches.</p>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-surface">
                    <tr className="text-left text-text-muted border-b border-border">
                      <th className="py-2 pr-4 font-medium">#</th>
                      <th className="py-2 pr-4 font-medium">Position</th>
                      <th className="py-2 pr-4 font-medium">Match</th>
                      {Array.from({ length: groupCount }, (_, g) => (
                        <th key={g} className="py-2 pr-4 font-medium">${g + 1}</th>
                      ))}
                      {hasNamed && <th className="py-2 pr-4 font-medium">Named groups</th>}
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {matches.map((m, i) => (
                      <tr key={i} className="border-b border-border last:border-0 align-top">
                        <td className="py-1.5 pr-4 text-text-muted">{i + 1}</td>
                        <td className="py-1.5 pr-4 text-text-muted whitespace-nowrap">{m.index}–{m.end}</td>
                        <td className="py-1.5 pr-4 text-text break-all">{m.text || <em className="text-text-muted">empty</em>}</td>
                        {Array.from({ length: groupCount }, (_, g) => (
                          <td key={g} className="py-1.5 pr-4 text-violet-500 break-all">
                            {m.groups[g] ?? <span className="text-text-muted">—</span>}
                          </td>
                        ))}
                        {hasNamed && (
                          <td className="py-1.5 pr-4 text-sky-500 break-all">
                            {Object.entries(m.named).map(([k, v]) => `${k}: ${v ?? '—'}`).join(', ')}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <Field label="Replacement" htmlFor="regex-replacement" hint="Use $1, $<name>, $& (whole match). Without the g flag only the first match is replaced.">
                <TextInput
                  id="regex-replacement"
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  className="font-mono"
                  spellCheck={false}
                />
              </Field>
              <CodeBlock title="Result" code={result?.replaced ?? ''} preClassName="max-h-96" />
            </div>
          )}
        </div>
      </Card>

      <InfoCard title="Regex Cheat Sheet">
        <div className="grid md:grid-cols-2 gap-x-8">
          {REGEX_CHEATSHEET.map(([token, meaning]) => (
            <div key={token} className="flex gap-4 py-1.5 border-b border-border text-sm">
              <code className="w-32 shrink-0 font-mono text-primary">{token}</code>
              <span className="text-text-muted">{meaning}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-4">
          Uses your browser’s JavaScript RegExp engine. Syntax differs slightly from PCRE (PHP), Python and Java — e.g. no possessive quantifiers or inline (?i) modifiers in older browsers.
        </p>
      </InfoCard>
    </ToolLayout>
  );
}
