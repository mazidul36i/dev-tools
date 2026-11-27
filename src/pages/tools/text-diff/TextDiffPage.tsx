import { Fragment, useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Badge from '@components/ui/Badge';
import Checkbox from '@components/ui/Checkbox';
import CodeBlock from '@components/ui/CodeBlock';
import SegmentedControl from '@components/ui/SegmentedControl';
import Button from '@components/ui/Button';
import { EditorPanel, Panel, Toolbar, ToolbarDivider, ToolbarSpacer } from '@components/workspace';
import { downloadFile } from '@lib/download-utils';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import { useShareInput } from '@hooks/useShareInput';
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
      <td className={`select-none text-right pr-2 pl-2 text-text-muted tabular-nums align-top ${divider ? 'border-l border-border' : ''} ${rowBg[tone]}`}>{num ?? ''}</td>
      <td aria-hidden="true" className={`select-none w-4 text-center align-top ${tone === 'del' ? 'text-error' : tone === 'ins' ? 'text-success' : 'text-text-muted'} ${rowBg[tone]}`}>{sign}</td>
      <td className={`pr-3 whitespace-pre-wrap break-all align-top text-text ${rowBg[tone]} ${num === undefined && tone === 'none' ? 'bg-surface-hover/50' : ''}`}>{children}</td>
    </>
  );
}

const schema = {
  view: opt.oneOf(['split', 'inline', 'patch'] as const, 'split'),
  gran: opt.oneOf(['word', 'char'] as const, 'word'),
  ws: opt.bool(false),
  ic: opt.bool(false),
  only: opt.bool(false),
};

export default function TextDiffPage() {
  const [original, setOriginal] = useState(SAMPLE_A);
  const [modified, setModified] = useState(SAMPLE_B);
  const [o, setO] = useUrlOptions(schema);
  const a = useDeferredValue(original);
  const b = useDeferredValue(modified);

  const diff = useMemo(
    () => computeDiff(a, b, { ignoreWhitespace: o.ws, ignoreCase: o.ic }, o.gran as Granularity),
    [a, b, o.ws, o.ic, o.gran],
  );
  const patch = useMemo(() => (o.view === 'patch' ? unifiedPatch(a, b) : ''), [o.view, a, b]);
  const items = useMemo(() => collapse(diff.rows, o.only), [diff.rows, o.only]);

  useShareInput({ original, modified }, (d) => {
    if (d.original !== undefined) setOriginal(d.original);
    if (d.modified !== undefined) setModified(d.modified);
  }, { enabled: original.length + modified.length > 0 });

  const swap = () => {
    setOriginal(modified);
    setModified(original);
  };

  const gapRow = (count: number, key: number, cols: number) => (
    <tr key={key}>
      <td colSpan={cols} className="py-1 text-center text-xs text-text-muted bg-surface-hover">⋯ {count} unchanged line{count === 1 ? '' : 's'}</td>
    </tr>
  );

  return (
    <ToolLayout
      seoTitle="Text Diff Checker – Compare Two Texts Online"
      tagline="Compare two texts side by side with line, word and character highlighting"
      metaDescription="Compare two pieces of text or code online. Side-by-side and inline views with word or character highlighting, ignore whitespace/case options and unified patch export. Runs in your browser."
      variant="wide"
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">How it works.</strong> Lines are compared with the Myers algorithm (the one Git uses); changed lines are paired and compared again by word or character.</li>
          <li><strong className="text-text">Ignore options.</strong> Ignore whitespace treats runs of spaces/tabs as equal and trims lines (like diff -w). Ignore case compares case-insensitively.</li>
          <li><strong className="text-text">Unified patch.</strong> Export a standard diff you can apply with patch or git apply. The patch always compares the texts exactly.</li>
        </ul>
      }
    >
      <Toolbar>
        <SegmentedControl ariaLabel="View" options={viewOptions} value={o.view} onChange={(v) => setO({ view: v as typeof o.view })} />
        {o.view !== 'patch' && (
          <>
            <SegmentedControl ariaLabel="Highlight" options={granularityOptions} value={o.gran} onChange={(v) => setO({ gran: v as typeof o.gran })} />
            <ToolbarDivider />
            <Checkbox checked={o.ws} onChange={(v) => setO({ ws: v })} label="Ignore whitespace" className="text-xs" />
            <Checkbox checked={o.ic} onChange={(v) => setO({ ic: v })} label="Ignore case" className="text-xs" />
            <Checkbox checked={o.only} onChange={(v) => setO({ only: v })} label="Only changes" className="text-xs" />
          </>
        )}
        <ToolbarSpacer />
        <Button variant="secondary" size="sm" onClick={swap}><ArrowLeftRight size={14} aria-hidden="true" /> Swap sides</Button>
      </Toolbar>

      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        <EditorPanel label="Original" value={original} onChange={setOriginal} fileAccept="text/*,*" maxFileBytes={5 * 1024 * 1024} textareaClassName="min-h-56" />
        <EditorPanel label="Modified" value={modified} onChange={setModified} fileAccept="text/*,*" maxFileBytes={5 * 1024 * 1024} textareaClassName="min-h-56" />
      </div>

      <Panel
        title="Differences"
        bodyClassName=""
        actions={
          <span className="flex gap-1.5" role="status">
            {diff.identical ? (
              <Badge tone="success">No differences</Badge>
            ) : (
              <>
                <Badge tone="success">+{diff.added}</Badge>
                <Badge tone="error">−{diff.removed}</Badge>
              </>
            )}
          </span>
        }
      >
        {o.view === 'patch' ? (
          <div className="p-3"><CodeBlock title="original → modified" code={patch} preClassName="max-h-[36rem]" actions={<Button variant="ghost" size="sm" onClick={() => downloadFile(patch, 'changes.patch', 'text/x-diff')}>Download</Button>} /></div>
        ) : (
          <div className="overflow-auto max-h-[40rem]">
            <table className="w-full table-fixed font-mono text-[13px] leading-6 border-collapse">
              <colgroup>
                {Array.from({ length: o.view === 'split' ? 2 : 1 }, (_, i) => (
                  <Fragment key={i}>
                    <col className="w-12" />
                    <col className="w-5" />
                    <col />
                  </Fragment>
                ))}
              </colgroup>
              <tbody>
                {o.view === 'split'
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
      </Panel>
    </ToolLayout>
  );
}
