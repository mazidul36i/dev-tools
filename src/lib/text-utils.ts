// ── Word splitting & case conversion ───────────────────────────────────

/** Splits identifiers and phrases into lower-case words: "parseHTTPResponse_v2" → parse, http, response, v2. */
export function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

export type CaseStyle =
  | 'camel' | 'pascal' | 'snake' | 'constant' | 'kebab' | 'train' | 'dot' | 'path'
  | 'title' | 'sentence' | 'lower' | 'upper' | 'swap';

export const CASE_STYLES: { id: CaseStyle; label: string; example: string }[] = [
  { id: 'camel', label: 'camelCase', example: 'helloWorld' },
  { id: 'pascal', label: 'PascalCase', example: 'HelloWorld' },
  { id: 'snake', label: 'snake_case', example: 'hello_world' },
  { id: 'constant', label: 'CONSTANT_CASE', example: 'HELLO_WORLD' },
  { id: 'kebab', label: 'kebab-case', example: 'hello-world' },
  { id: 'train', label: 'Train-Case', example: 'Hello-World' },
  { id: 'dot', label: 'dot.case', example: 'hello.world' },
  { id: 'path', label: 'path/case', example: 'hello/world' },
  { id: 'title', label: 'Title Case', example: 'Hello World' },
  { id: 'sentence', label: 'Sentence case', example: 'Hello world' },
  { id: 'lower', label: 'lower case', example: 'hello world' },
  { id: 'upper', label: 'UPPER CASE', example: 'HELLO WORLD' },
  { id: 'swap', label: 'sWAP cASE', example: 'hELLO wORLD' },
];

const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'the', 'to', 'up', 'via', 'vs']);

function convertLine(line: string, style: CaseStyle): string {
  switch (style) {
    case 'lower': return line.toLowerCase();
    case 'upper': return line.toUpperCase();
    case 'swap': return Array.from(line, (c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('');
    case 'sentence': {
      const lower = line.toLowerCase();
      return lower.replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, p, c: string) => p + c.toUpperCase());
    }
    case 'title':
      // Keeps punctuation and spacing, capitalises words except minor ones in the middle.
      return line.toLowerCase().replace(/\p{L}[\p{L}\p{N}']*/gu, (w, offset: number) =>
        offset > 0 && SMALL_WORDS.has(w) && offset + w.length < line.length ? w : cap(w));
    default: {
      const words = splitWords(line);
      if (!words.length) return line;
      switch (style) {
        case 'camel': return words[0] + words.slice(1).map(cap).join('');
        case 'pascal': return words.map(cap).join('');
        case 'snake': return words.join('_');
        case 'constant': return words.join('_').toUpperCase();
        case 'kebab': return words.join('-');
        case 'train': return words.map(cap).join('-');
        case 'dot': return words.join('.');
        case 'path': return words.join('/');
      }
    }
  }
}

/** Converts each line separately, so a list of identifiers stays a list. */
export function convertCase(text: string, style: CaseStyle): string {
  return text.split('\n').map((line) => convertLine(line, style)).join('\n');
}

export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Line operations ────────────────────────────────────────────────────

export type LineOperation =
  | 'sort-asc' | 'sort-desc' | 'sort-natural' | 'sort-length' | 'reverse' | 'shuffle'
  | 'dedupe' | 'remove-empty' | 'trim' | 'number' | 'join' | 'split-commas';

export const LINE_OPERATIONS: { id: LineOperation; label: string }[] = [
  { id: 'sort-asc', label: 'Sort A → Z' },
  { id: 'sort-desc', label: 'Sort Z → A' },
  { id: 'sort-natural', label: 'Natural sort (2 < 10)' },
  { id: 'sort-length', label: 'Sort by length' },
  { id: 'reverse', label: 'Reverse lines' },
  { id: 'shuffle', label: 'Shuffle' },
  { id: 'dedupe', label: 'Remove duplicates' },
  { id: 'remove-empty', label: 'Remove empty lines' },
  { id: 'trim', label: 'Trim whitespace' },
  { id: 'number', label: 'Number lines' },
  { id: 'join', label: 'Join with ", "' },
  { id: 'split-commas', label: 'Split on commas' },
];

const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
const naturalCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function applyLineOperation(text: string, op: LineOperation, random: () => number = Math.random): string {
  const lines = text.split('\n');
  switch (op) {
    case 'sort-asc': return [...lines].sort(collator.compare).join('\n');
    case 'sort-desc': return [...lines].sort((a, b) => collator.compare(b, a)).join('\n');
    case 'sort-natural': return [...lines].sort(naturalCollator.compare).join('\n');
    case 'sort-length': return [...lines].sort((a, b) => a.length - b.length || collator.compare(a, b)).join('\n');
    case 'reverse': return [...lines].reverse().join('\n');
    case 'shuffle': {
      const out = [...lines];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out.join('\n');
    }
    case 'dedupe': return [...new Set(lines)].join('\n');
    case 'remove-empty': return lines.filter((l) => l.trim() !== '').join('\n');
    case 'trim': return lines.map((l) => l.trim()).join('\n');
    case 'number': {
      const width = String(lines.length).length;
      return lines.map((l, i) => `${String(i + 1).padStart(width)}. ${l}`).join('\n');
    }
    case 'join': return lines.filter((l) => l.trim() !== '').map((l) => l.trim()).join(', ');
    case 'split-commas': return text.split(',').map((s) => s.trim()).filter(Boolean).join('\n');
  }
}

// ── Statistics ─────────────────────────────────────────────────────────

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  sentences: number;
  paragraphs: number;
  bytes: number;
  /** Minutes at 230 words per minute. */
  readingMinutes: number;
}

// Intl.Segmenter is ES2022; the project's TS lib targets ES2020.
type SegmenterCtor = new (locale?: string, options?: { granularity: 'grapheme' }) => { segment(s: string): Iterable<unknown> };
const Segmenter = (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter;

export function textStats(text: string): TextStats {
  const graphemes = Segmenter
    ? [...new Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].length
    : Array.from(text).length;
  const words = text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  return {
    characters: graphemes,
    charactersNoSpaces: Array.from(text.replace(/\s/g, '')).length,
    words,
    lines: text ? text.split('\n').length : 0,
    sentences: text.match(/[^.!?]*[\p{L}\p{N}][^.!?]*([.!?]+|$)/gu)?.length ?? 0,
    paragraphs: text.split(/\n\s*\n/).filter((p) => p.trim()).length,
    bytes: new TextEncoder().encode(text).length,
    readingMinutes: words / 230,
  };
}
