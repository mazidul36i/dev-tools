import { Fragment, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { ArrowLeftRight, Clipboard, Eraser, FileUp } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import Badge from '@components/ui/Badge';
import Checkbox from '@components/ui/Checkbox';
import CodeBlock from '@components/ui/CodeBlock';
import SegmentedControl from '@components/ui/SegmentedControl';
import { SecondaryButton, SmallButton } from '@components/ui/Button';
import { TextAreaInput } from '@components/ui/TextArea';
import { computeDiff, unifiedPatch, type DiffRow, type Granularity, type InlinePart } from '@lib/diff-utils';

const SAMPLE_A = `function greet(name) {
  console.log("Hello, " + name);
  return true;
}

const users = ["alice", "bob"];
users.forEach(greet);
`;

const SAMPLE_B = `function greet(name, greeting = "Hello") {
  console.log(\`\${greeting}, \${name}!\`);
  return true;
}

const users = ["alice", "bob", "carol"];
users.forEach((u) => greet(u));
`;

const viewOptions = [
  { id: 'split', label: 'Side by side' },
  { id: 'inline', label: 'Inline' },
  { id: 'patch', label: 'Unified patch' },
];
const granularityOptions = [
  { id: 'word', label: 'Words' },
  { id: 'char', label: 'Characters' },
];

const CONTEXT = 3;

type Item = { kind: 'row'; row: DiffRow } | { kind: 'gap'; count: number };

/** Keeps changed rows plus CONTEXT rows around them; the rest collapse into gaps. */
function collapse(rows: DiffRow[], enabled: boolean): Item[] {
  if (!enabled) return rows.map((row) => ({ kind: 'row', row }));
  const keep = rows.map(() => false);
  rows.forEach((r, i) => {
    if (r.type === 'equal') return;
    for (let k = Math.max(0, i - CONTEXT); k <= Math.min(rows.length - 1, i + CONTEXT); k++) keep[k] = true;
  });
  const items: Item[] = [];
  let gap = 0;
  rows.forEach((row, i) => {
    if (keep[i]) {
      if (gap) items.push({ kind: 'gap', count: gap });
      gap = 0;
      items.push({ kind: 'row', row });
    } else gap++;
  });
  if (gap) items.push({ kind: 'gap', count: gap });
  return items;
}

function Parts({ parts, tone }: { parts: InlinePart[]; tone: 'del' | 'ins' }) {
  const mark = tone === 'del' ? 'bg-red-300/60 dark:bg-red-500/40' : 'bg-green-300/60 dark:bg-green-500/40';
  return (
    <>
      {parts.map((p, i) => (p.changed ? <span key={i} className={`${mark} rounded-sm`}>{p.text}</span> : <span key={i}>{p.text}</span>))}
    </>
  );
}

const rowBg = {
  del: 'bg-red-50 dark:bg-red-950/40',
  ins: 'bg-green-50 dark:bg-green-950/40',
  none: '',
};

function Cell({ num, children, tone, sign, divider }: { num?: number; children?: ReactNode; tone: keyof typeof rowBg; sign?: string; divider?: boolean }) {
  return (
    <>
      <td className={`select-none text-right pr-2 pl-2 text-text-muted/70 align-top ${divider ? 'border-l border-border' : ''} ${rowBg[tone]}`}>{num ?? ''}</td>
      <td className={`select-none w-4 text-center align-top ${tone === 'del' ? 'text-error' : tone === 'ins' ? 'text-success' : 'text-text-muted/50'} ${rowBg[tone]}`}>{sign}</td>
      <td className={`pr-3 whitespace-pre-wrap break-all align-top text-text ${rowBg[tone]} ${num === undefined && tone === 'none' ? 'bg-surface-hover/50' : ''}`}>{children}</td>
    </>
  );
}

function useTextFile(onText: (text: string) => void) {
  const ref = useRef<HTMLInputElement>(null);
  const input = (
    <input
      ref={ref}
      type="file"
      hidden
      onChange={async (e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        if (f.size > 5 * 1024 * 1024) {
          toast.error('File is larger than 5 MB');
          return;
        }
        onText(await f.text());
      }}
    />
  );
  return { open: () => ref.current?.click(), input };
}

function InputPane({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const file = useTextFile(onChange);
  const paste = useCallback(async () => {
    try {
      onChange(await navigator.clipboard.readText());
    } catch {
      toast.error('Unable to paste');
    }
  }, [onChange]);
  return (
    <div className="min-w-0">
      <span className="block text-sm font-medium text-text-secondary mb-2">{label}</span>
      <TextAreaInput value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} spellCheck={false} className="min-h-56!" />
      <div className="flex gap-2 mt-2">
        <SmallButton onClick={() => onChange('')}><Eraser size={12} /> Clear</SmallButton>
        <SmallButton onClick={paste}><Clipboard size={12} /> Paste</SmallButton>
        <SmallButton onClick={file.open}><FileUp size={12} /> Open file</SmallButton>
        {file.input}
      </div>
    </div>
  );
}

export default function TextDiffPage() {
  const [original, setOriginal] = useState(SAMPLE_A);
  const [modified, setModified] = useState(SAMPLE_B);
  const [view, setView] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'inline' : 'split'));
  const [granularity, setGranularity] = useState<Granularity>('word');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [onlyChanges, setOnlyChanges] = useState(false);

  const diff = useMemo(
    () => computeDiff(original, modified, { ignoreWhitespace, ignoreCase }, granularity),
    [original, modified, ignoreWhitespace, ignoreCase, granularity],
  );
  const patch = useMemo(() => (view === 'patch' ? unifiedPatch(original, modified) : ''), [view, original, modified]);
  const items = useMemo(() => collapse(diff.rows, onlyChanges), [diff.rows, onlyChanges]);

  const swap = () => {
    setOriginal(modified);
    setModified(original);
  };

  const gapRow = (count: number, key: number, cols: number) => (
    <tr key={key}>
      <td colSpan={cols} className="py-1 text-center text-xs text-text-muted bg-surface-hover/60">⋯ {count} unchanged line{count === 1 ? '' : 's'}</td>
    </tr>
  );

  return (
    <ToolLayout
      title="Text Diff"
      seoTitle="Text Diff Checker – Compare Two Texts Online"
      tagline="Compare two texts side by side with line, word and character highlighting"
      metaDescription="Compare two pieces of text or code online. Side-by-side and inline views with word or character highlighting, ignore whitespace/case options and unified patch export. Runs in your browser."
    >
      <Card hover={false}>
        <div className="p-6 space-y-4">
          <div className="grid lg:grid-cols-2 gap-5">
            <InputPane label="Original" value={original} onChange={setOriginal} />
            <InputPane label="Modified" value={modified} onChange={setModified} />
          </div>
          <SecondaryButton onClick={swap}><ArrowLeftRight size={15} /> Swap sides</SecondaryButton>
        </div>
      </Card>

      <Card hover={false}>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <SegmentedControl options={viewOptions} value={view} onChange={setView} />
            {view !== 'patch' && (
              <>
                <SegmentedControl options={granularityOptions} value={granularity} onChange={(v) => setGranularity(v as Granularity)} variant="glass" />
                <Checkbox checked={ignoreWhitespace} onChange={setIgnoreWhitespace} label="Ignore whitespace" />
                <Checkbox checked={ignoreCase} onChange={setIgnoreCase} label="Ignore case" />
                <Checkbox checked={onlyChanges} onChange={setOnlyChanges} label="Only changes" />
              </>
            )}
            <div className="flex gap-2 ml-auto">
              {diff.identical ? (
                <Badge tone="success">No differences</Badge>
              ) : (
                <>
                  <Badge tone="success">+{diff.added}</Badge>
                  <Badge tone="error">−{diff.removed}</Badge>
                </>
              )}
            </div>
          </div>

          {view === 'patch' ? (
            <CodeBlock title="original → modified" code={patch} preClassName="max-h-[36rem]" />
          ) : (
            <div className="rounded-lg border border-border overflow-auto max-h-[40rem] bg-surface">
              <table className="w-full table-fixed font-mono text-[13px] leading-6 border-collapse">
                <colgroup>
                  {Array.from({ length: view === 'split' ? 2 : 1 }, (_, i) => (
                    <Fragment key={i}>
                      <col className="w-12" />
                      <col className="w-5" />
                      <col />
                    </Fragment>
                  ))}
                </colgroup>
                <tbody>
                  {view === 'split'
                    ? items.map((item, i) => {
                      if (item.kind === 'gap') return gapRow(item.count, i, 6);
                      const { row } = item;
                      return (
                        <tr key={i}>
                          <Cell num={row.left?.num} tone={row.left && row.type !== 'equal' ? 'del' : 'none'} sign={row.left && row.type !== 'equal' ? '−' : ''}>
                            {row.left && <Parts parts={row.left.parts} tone="del" />}
                          </Cell>
                          <Cell divider num={row.right?.num} tone={row.right && row.type !== 'equal' ? 'ins' : 'none'} sign={row.right && row.type !== 'equal' ? '+' : ''}>
                            {row.right && <Parts parts={row.right.parts} tone="ins" />}
                          </Cell>
                        </tr>
                      );
                    })
                    : items.flatMap((item, i) => {
                      if (item.kind === 'gap') return [gapRow(item.count, i, 3)];
                      const { row } = item;
                      if (row.type === 'equal') {
                        return [<tr key={i}><Cell num={row.right!.num} tone="none"><Parts parts={row.right!.parts} tone="ins" /></Cell></tr>];
                      }
                      const out = [];
                      if (row.left) out.push(<tr key={`${i}l`}><Cell num={row.left.num} tone="del" sign="−"><Parts parts={row.left.parts} tone="del" /></Cell></tr>);
                      if (row.right) out.push(<tr key={`${i}r`}><Cell num={row.right.num} tone="ins" sign="+"><Parts parts={row.right.parts} tone="ins" /></Cell></tr>);
                      return out;
                    })}
                </tbody>
              </table>
              {diff.rows.length === 0 && <p className="p-4 text-sm text-text-muted">Both sides are empty.</p>}
            </div>
          )}
        </div>
      </Card>

      <InfoCard title="About Text Diff">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { t: 'How it works', d: 'Lines are compared with the Myers diff algorithm (the one Git uses). Changed lines are paired up and compared again word by word or character by character.' },
            { t: 'Ignore options', d: 'Ignore whitespace treats runs of spaces and tabs as equal and ignores leading/trailing space (like diff -w). Ignore case compares lines case-insensitively.' },
            { t: 'Unified patch', d: 'Export the changes as a standard unified diff you can apply with patch or git apply. The patch always compares the texts exactly.' },
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
