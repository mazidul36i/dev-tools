export interface RegexMatch {
  index: number;
  end: number;
  text: string;
  /** Numbered capture groups (1..n); undefined when a group did not participate. */
  groups: (string | undefined)[];
  named: Record<string, string | undefined>;
}

export interface RegexRunResult {
  matches: RegexMatch[];
  /** True when the match list was cut off at the limit. */
  truncated: boolean;
  replaced?: string;
  error?: string;
}

export const REGEX_FLAGS = [
  { flag: 'g', name: 'global', desc: 'Find all matches, not just the first' },
  { flag: 'i', name: 'ignore case', desc: 'Case-insensitive matching' },
  { flag: 'm', name: 'multiline', desc: '^ and $ match at line breaks' },
  { flag: 's', name: 'dotAll', desc: '. also matches newlines' },
  { flag: 'u', name: 'unicode', desc: 'Full Unicode matching and \\u{...} escapes' },
  { flag: 'y', name: 'sticky', desc: 'Match only at lastIndex' },
] as const;

export function buildRegex(pattern: string, flags: string): RegExp {
  try {
    return new RegExp(pattern, flags);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message.replace(/^Invalid regular expression: /, '') : String(e));
  }
}

/** Runs the pattern over `text`, collecting matches (all of them when the g flag is set). */
export function findMatches(regex: RegExp, text: string, limit = 1000): { matches: RegexMatch[]; truncated: boolean } {
  const toMatch = (m: RegExpExecArray): RegexMatch => ({
    index: m.index,
    end: m.index + m[0].length,
    text: m[0],
    groups: m.slice(1),
    named: m.groups ? { ...m.groups } : {},
  });

  if (!regex.global) {
    const r = new RegExp(regex.source, regex.flags);
    const m = r.exec(text);
    return { matches: m ? [toMatch(m)] : [], truncated: false };
  }

  const r = new RegExp(regex.source, regex.flags);
  const matches: RegexMatch[] = [];
  let m: RegExpExecArray | null;
  while ((m = r.exec(text)) !== null) {
    matches.push(toMatch(m));
    if (m[0].length === 0) {
      // Avoid an infinite loop on empty matches; step over a whole code point in unicode mode.
      const code = text.codePointAt(r.lastIndex);
      r.lastIndex += (regex.unicode || regex.flags.includes('v')) && code !== undefined && code > 0xffff ? 2 : 1;
    }
    if (matches.length >= limit) return { matches, truncated: r.lastIndex < text.length };
  }
  return { matches, truncated: false };
}

export function runRegex(pattern: string, flags: string, text: string, replacement?: string, limit = 1000): RegexRunResult {
  if (!pattern) return { matches: [], truncated: false, replaced: replacement !== undefined ? text : undefined };
  let regex: RegExp;
  try {
    regex = buildRegex(pattern, flags);
  } catch (e) {
    return { matches: [], truncated: false, error: (e as Error).message };
  }
  const { matches, truncated } = findMatches(regex, text, limit);
  const replaced = replacement !== undefined ? text.replace(regex, replacement) : undefined;
  return { matches, truncated, replaced };
}

export interface Segment {
  text: string;
  /** Index into the match list, or -1 for unmatched text. */
  match: number;
}

/** Splits text into matched / unmatched segments for highlighting. */
export function segmentText(text: string, matches: RegexMatch[]): Segment[] {
  const segments: Segment[] = [];
  let pos = 0;
  matches.forEach((m, i) => {
    if (m.index < pos) return;
    if (m.index > pos) segments.push({ text: text.slice(pos, m.index), match: -1 });
    segments.push({ text: m.text, match: i });
    pos = m.end;
  });
  if (pos < text.length) segments.push({ text: text.slice(pos), match: -1 });
  return segments;
}

export const REGEX_PRESETS: { name: string; pattern: string; flags: string }[] = [
  { name: 'Email', pattern: String.raw`[\w.+-]+@[\w-]+(\.[\w-]+)+`, flags: 'gi' },
  { name: 'URL', pattern: String.raw`https?:\/\/[^\s/$.?#].[^\s]*`, flags: 'gi' },
  { name: 'IPv4', pattern: String.raw`\b((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)\b`, flags: 'g' },
  { name: 'Date (YYYY-MM-DD)', pattern: String.raw`(?<year>\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\d|3[01])`, flags: 'g' },
  { name: 'Hex colour', pattern: String.raw`#(?:[0-9a-f]{3}){1,2}\b`, flags: 'gi' },
  { name: 'UUID', pattern: String.raw`[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}`, flags: 'gi' },
  { name: 'Phone (intl)', pattern: String.raw`\+?\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}`, flags: 'g' },
];

export const REGEX_CHEATSHEET: [string, string][] = [
  ['.', 'Any character except newline'],
  ['\\d \\w \\s', 'Digit, word character, whitespace'],
  ['\\D \\W \\S', 'Not digit / word / whitespace'],
  ['[abc] [^abc]', 'Any of / none of a, b, c'],
  ['^ $', 'Start / end of string (or line with m)'],
  ['\\b', 'Word boundary'],
  ['* + ?', '0+, 1+, 0 or 1 (add ? for lazy)'],
  ['{n,m}', 'Between n and m times'],
  ['(abc)', 'Capture group — $1 in replacement'],
  ['(?<name>abc)', 'Named group — $<name> in replacement'],
  ['(?:abc)', 'Non-capturing group'],
  ['a|b', 'a or b'],
  ['(?=a) (?!a)', 'Lookahead / negative lookahead'],
  ['(?<=a) (?<!a)', 'Lookbehind / negative lookbehind'],
  ['$& $` $\'', 'Replacement: match, before, after'],
];
