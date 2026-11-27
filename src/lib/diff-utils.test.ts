import { describe, expect, it } from 'vitest';
import { computeDiff, unifiedPatch } from './diff-utils';

const text = (parts: { text: string }[] | undefined) => parts?.map((p) => p.text).join('');

describe('computeDiff', () => {
  it('aligns equal, modified, added and removed lines', () => {
    const r = computeDiff('a\nb\nc\nd\n', 'a\nB!\nc\ne\nf\n');
    expect(r.rows.map((row) => row.type)).toEqual(['equal', 'modified', 'equal', 'modified', 'added']);
    expect(r.rows[1].left?.num).toBe(2);
    expect(text(r.rows[1].right?.parts)).toBe('B!');
    expect(r.rows[4]).toEqual({ type: 'added', right: { num: 5, parts: [{ text: 'f', changed: false }] } });
    expect(r).toMatchObject({ added: 3, removed: 2, identical: false });
  });

  it('highlights changed words within a modified line', () => {
    const r = computeDiff('the quick fox', 'the slow fox');
    const left = r.rows[0].left!.parts.filter((p) => p.changed).map((p) => p.text);
    const right = r.rows[0].right!.parts.filter((p) => p.changed).map((p) => p.text);
    expect(left).toEqual(['quick']);
    expect(right).toEqual(['slow']);
  });

  it('honours ignore-case and ignore-whitespace', () => {
    expect(computeDiff('Hello\n', 'hello\n').identical).toBe(false);
    expect(computeDiff('Hello\n', 'hello\n', { ignoreCase: true }).identical).toBe(true);
    expect(computeDiff('a  b\n', 'a b \n', { ignoreWhitespace: true }).identical).toBe(true);
  });

  it('treats CRLF and LF the same', () => {
    expect(computeDiff('a\r\nb\r\n', 'a\nb\n').identical).toBe(true);
  });
});

describe('unifiedPatch', () => {
  it('creates a unified diff', () => {
    const patch = unifiedPatch('a\nb\n', 'a\nc\n');
    expect(patch).toContain('--- original');
    expect(patch).toContain('+++ modified');
    expect(patch).toContain('-b\n+c');
  });
});
