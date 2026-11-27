import { createTwoFilesPatch, diffChars, diffLines, diffWordsWithSpace, type ChangeObject } from 'diff';

export interface DiffOptions {
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
}

export type Granularity = 'word' | 'char';

/** A piece of a line, flagged when it differs from the other side. */
export interface InlinePart {
  text: string;
  changed: boolean;
}

export interface SideCell {
  num: number;
  parts: InlinePart[];
}

export type RowType = 'equal' | 'removed' | 'added' | 'modified';

/** One row of a side-by-side diff. A missing side means the line exists only on the other. */
export interface DiffRow {
  type: RowType;
  left?: SideCell;
  right?: SideCell;
}

export interface DiffResult {
  rows: DiffRow[];
  added: number;
  removed: number;
  identical: boolean;
}

function splitLines(value: string): string[] {
  const lines = value.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/** Normalises a line for comparison (whitespace runs collapse, like `diff -w -b`). */
function normalizer({ ignoreCase, ignoreWhitespace }: DiffOptions) {
  return (line: string) => {
    let v = ignoreWhitespace ? line.replace(/\s+/g, ' ').trim() : line;
    if (ignoreCase) v = v.toLowerCase();
    return v;
  };
}

/** Highlights the differing words / characters between two versions of a line. */
function inlineDiff(a: string, b: string, granularity: Granularity, opts: DiffOptions): [InlinePart[], InlinePart[]] {
  const changes: ChangeObject<string>[] = granularity === 'char'
    ? diffChars(a, b, { ignoreCase: opts.ignoreCase })
    : diffWordsWithSpace(a, b, { ignoreCase: opts.ignoreCase });
  const left: InlinePart[] = [];
  const right: InlinePart[] = [];
  for (const c of changes) {
    if (c.added) right.push({ text: c.value, changed: true });
    else if (c.removed) left.push({ text: c.value, changed: true });
    else {
      left.push({ text: c.value, changed: false });
      right.push({ text: c.value, changed: false });
    }
  }
  return [left, right];
}

export function computeDiff(original: string, modified: string, opts: DiffOptions = {}, granularity: Granularity = 'word'): DiffResult {
  const aLines = splitLines(original.replace(/\r\n/g, '\n'));
  const bLines = splitLines(modified.replace(/\r\n/g, '\n'));
  // Diff normalised copies, then read the real text back by line number.
  const norm = normalizer(opts);
  const changes = diffLines(
    aLines.map(norm).map((l) => l + '\n').join(''),
    bLines.map(norm).map((l) => l + '\n').join(''),
  );

  const rows: DiffRow[] = [];
  let ai = 0;
  let bi = 0;
  let added = 0;
  let removed = 0;
  const plain = (text: string): InlinePart[] => [{ text, changed: false }];
  const left = () => ({ num: ai + 1, text: aLines[ai++] });
  const right = () => ({ num: bi + 1, text: bLines[bi++] });

  for (let i = 0; i < changes.length; i++) {
    const c = changes[i];
    const count = c.count ?? splitLines(c.value).length;
    if (!c.added && !c.removed) {
      for (let k = 0; k < count; k++) {
        const l = left();
        const r = right();
        rows.push({ type: 'equal', left: { num: l.num, parts: plain(l.text) }, right: { num: r.num, parts: plain(r.text) } });
      }
      continue;
    }
    const next = changes[i + 1];
    if (c.removed && next?.added) {
      const nextCount = next.count ?? splitLines(next.value).length;
      removed += count;
      added += nextCount;
      for (let k = 0; k < Math.max(count, nextCount); k++) {
        if (k < count && k < nextCount) {
          const l = left();
          const r = right();
          const [lp, rp] = inlineDiff(l.text, r.text, granularity, opts);
          rows.push({ type: 'modified', left: { num: l.num, parts: lp }, right: { num: r.num, parts: rp } });
        } else if (k < count) {
          const l = left();
          rows.push({ type: 'removed', left: { num: l.num, parts: plain(l.text) } });
        } else {
          const r = right();
          rows.push({ type: 'added', right: { num: r.num, parts: plain(r.text) } });
        }
      }
      i++;
      continue;
    }
    for (let k = 0; k < count; k++) {
      if (c.removed) {
        removed++;
        const l = left();
        rows.push({ type: 'removed', left: { num: l.num, parts: plain(l.text) } });
      } else {
        added++;
        const r = right();
        rows.push({ type: 'added', right: { num: r.num, parts: plain(r.text) } });
      }
    }
  }

  return { rows, added, removed, identical: added === 0 && removed === 0 };
}

/** Unified diff (always an exact comparison, so it can be applied with `patch`). */
export function unifiedPatch(original: string, modified: string, context = 3): string {
  return createTwoFilesPatch('original', 'modified', original.replace(/\r\n/g, '\n'), modified.replace(/\r\n/g, '\n'), undefined, undefined, { context });
}
