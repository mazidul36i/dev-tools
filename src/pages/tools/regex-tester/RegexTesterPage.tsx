import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Timer } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Badge from '@components/ui/Badge';
import CodeBlock from '@components/ui/CodeBlock';
import SegmentedControl from '@components/ui/SegmentedControl';
import { EditorPanel, ErrorNotice, Panel } from '@components/workspace';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import { useShareInput } from '@hooks/useShareInput';
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

const schema = {
  p: opt.str(REGEX_PRESETS[0].pattern, 1000),
  f: opt.str('gi', 8),
  r: opt.str('[redacted]', 500),
  tab: opt.oneOf(['matches', 'replace'] as const, 'matches'),
};

const VALID_FLAGS = REGEX_FLAGS.map((x) => x.flag);

export default function RegexTesterPage() {
  const [o, setO] = useUrlOptions(schema);
  const [text, setText] = useState(SAMPLE_TEXT);
  const pattern = o.p;
  const flags = VALID_FLAGS.filter((x) => o.f.includes(x)).join('');
  const deferredText = useDeferredValue(text);

  const run = useRegexRun(pattern, flags, deferredText, o.tab === 'replace' ? o.r : undefined);
  const result = run.status === 'ok' ? run.result : null;
  const matches = result?.matches ?? [];
  const segments = useMemo(() => segmentText(deferredText, matches), [deferredText, matches]);
  const groupCount = matches.reduce((n, m) => Math.max(n, m.groups.length), 0);
  const hasNamed = matches.some((m) => Object.keys(m.named).length > 0);

  useShareInput({ text }, (d) => d.text !== undefined && setText(d.text), { enabled: text.length > 0 });

  const toggleFlag = (f: string) => {
    const next = flags.includes(f) ? flags.replace(f, '') : flags + f;
    setO({ f: VALID_FLAGS.filter((x) => next.includes(x)).join('') });
  };

  return (
    <ToolLayout
      seoTitle="Regex Tester – Test JavaScript Regular Expressions Online"
      tagline="Build and test JavaScript regular expressions with live highlighting, groups and replace"
      metaDescription="Test JavaScript regular expressions online with live match highlighting, capture and named groups, flags, replace preview, common patterns and a cheat sheet."
      about={
        <>
          <div className="grid md:grid-cols-2 gap-x-8">
            {REGEX_CHEATSHEET.map(([token, meaning]) => (
              <div key={token} className="flex gap-4 py-1.5 border-b border-border">
                <code className="w-32 shrink-0 text-text">{token}</code>
                <span>{meaning}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Uses your browser’s JavaScript RegExp engine, in a worker that’s stopped after {TIMEOUT_MS / 1000}s. Syntax differs slightly from PCRE (PHP), Python and Java.
          </p>
        </>
      }
    >
      <Panel
        title={<label htmlFor="regex-pattern">Regular expression</label>}
        className="mb-4"
        bodyClassName="p-4 space-y-3"
        actions={
          <select
            aria-label="Load a common pattern"
            value=""
            onChange={(e) => {
              const preset = REGEX_PRESETS.find((p) => p.name === e.target.value);
              if (preset) setO({ p: preset.pattern, f: preset.flags });
            }}
            className="h-7 pl-2 pr-7 rounded-md bg-surface-alt border border-border-strong text-xs text-text focus:outline-none focus:border-primary"
          >
            <option value="">Common patterns…</option>
            {REGEX_PRESETS.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        }
      >
        <div className="flex items-center h-10 rounded-md border border-border-strong bg-surface-alt focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25 font-mono text-[15px]">
          <span aria-hidden="true" className="pl-3 text-text-muted select-none">/</span>
          <input
            id="regex-pattern"
            value={pattern}
            onChange={(e) => setO({ p: e.target.value })}
            spellCheck={false}
            autoComplete="off"
            placeholder="Enter a pattern, e.g. \d+"
            className="flex-1 min-w-0 px-1 h-full bg-transparent text-text focus:outline-none"
          />
          <span aria-hidden="true" className="pr-3 text-text-muted select-none">/<span className="text-primary">{flags}</span></span>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Flags">
          {REGEX_FLAGS.map(({ flag, name, desc }) => (
            <button
              key={flag}
              type="button"
              onClick={() => toggleFlag(flag)}
              title={desc}
              aria-pressed={flags.includes(flag)}
              className={`h-7 px-2 rounded-md text-xs font-mono border transition-colors focus-ring ${
                flags.includes(flag) ? 'bg-primary text-on-primary border-primary' : 'bg-surface-alt text-text-secondary border-border hover:border-border-strong hover:text-text'}`}
            >
              {flag} <span className="font-sans">{name}</span>
            </button>
          ))}
        </div>
        {run.status === 'timeout' && (
          <div role="alert" className="flex items-start gap-2 p-3 rounded-md border border-warning/30 bg-warning/10 text-warning text-sm">
            <Timer size={16} aria-hidden="true" className="shrink-0 mt-0.5" />
            Stopped after {TIMEOUT_MS / 1000}s. The pattern is probably backtracking catastrophically (e.g. nested quantifiers like (a+)+).
          </div>
        )}
        {result?.error && <ErrorNotice title="Invalid pattern">{result.error}</ErrorNotice>}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        <EditorPanel label="Test string" value={text} onChange={setText} sample={SAMPLE_TEXT} fileAccept="text/*,.txt,.log,.csv,.json" textareaClassName="min-h-72" />
        <Panel
          title="Matches"
          bodyClassName=""
          actions={
            <span role="status">
              <Badge tone={matches.length ? 'success' : 'neutral'}>
                {matches.length}{result?.truncated ? '+' : ''} match{matches.length === 1 ? '' : 'es'}
              </Badge>
            </span>
          }
        >
          <pre className="h-full min-h-72 max-h-[32rem] overflow-auto p-3 bg-surface-alt font-mono text-[13px] leading-relaxed text-text-secondary whitespace-pre-wrap break-words">
            {segments.map((seg, i) =>
              seg.match < 0
                ? <span key={i}>{seg.text}</span>
                : (
                  <mark key={i} title={`Match ${seg.match + 1}`} className={`${HIGHLIGHTS[seg.match % 2]} text-text rounded-sm`}>
                    {seg.text || '\u200b'}
                  </mark>
                ))}
          </pre>
        </Panel>
      </div>

      <Panel
        title={o.tab === 'matches' ? 'Match details' : 'Replace'}
        bodyClassName={o.tab === 'matches' ? '' : 'p-4 space-y-3'}
        actions={<SegmentedControl ariaLabel="View" options={[{ id: 'matches', label: 'Match details' }, { id: 'replace', label: 'Replace' }]} value={o.tab} onChange={(v) => setO({ tab: v as 'matches' | 'replace' })} />}
      >
        {o.tab === 'matches' ? (
          matches.length === 0 ? (
            <p className="p-4 text-sm text-text-muted">No matches.</p>
          ) : (
            <div className="overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface">
                  <tr className="text-left text-xs text-text-muted border-b border-border">
                    <th scope="col" className="px-3 py-2 font-medium">#</th>
                    <th scope="col" className="px-3 py-2 font-medium">Position</th>
                    <th scope="col" className="px-3 py-2 font-medium">Match</th>
                    {Array.from({ length: groupCount }, (_, g) => (
                      <th key={g} scope="col" className="px-3 py-2 font-medium">${g + 1}</th>
                    ))}
                    {hasNamed && <th scope="col" className="px-3 py-2 font-medium">Named groups</th>}
                  </tr>
                </thead>
                <tbody className="font-mono text-[13px]">
                  {matches.map((m, i) => (
                    <tr key={i} className="border-b border-border last:border-0 align-top">
                      <td className="px-3 py-1.5 text-text-muted">{i + 1}</td>
                      <td className="px-3 py-1.5 text-text-muted whitespace-nowrap">{m.index}–{m.end}</td>
                      <td className="px-3 py-1.5 text-text break-all">{m.text || <em className="text-text-muted">empty</em>}</td>
                      {Array.from({ length: groupCount }, (_, g) => (
                        <td key={g} className="px-3 py-1.5 text-violet-600 dark:text-violet-400 break-all">
                          {m.groups[g] ?? <span className="text-text-muted">—</span>}
                        </td>
                      ))}
                      {hasNamed && (
                        <td className="px-3 py-1.5 text-sky-700 dark:text-sky-400 break-all">
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
          <>
            <div>
              <label htmlFor="regex-replacement" className="block mb-1.5 text-xs font-medium text-text-secondary">Replacement</label>
              <input
                id="regex-replacement"
                value={o.r}
                onChange={(e) => setO({ r: e.target.value })}
                spellCheck={false}
                aria-describedby="regex-replacement-hint"
                className="w-full h-9 px-2.5 rounded-md bg-surface-alt border border-border-strong font-mono text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
              />
              <p id="regex-replacement-hint" className="mt-1 text-xs text-text-muted">Use $1, $&lt;name&gt;, $&amp; (whole match). Without the g flag only the first match is replaced.</p>
            </div>
            <CodeBlock title="Result" code={result?.replaced ?? ''} preClassName="max-h-96" />
          </>
        )}
      </Panel>
    </ToolLayout>
  );
}
