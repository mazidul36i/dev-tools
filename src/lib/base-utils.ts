const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

const PREFIXES: Record<string, number> = { '0x': 16, '0b': 2, '0o': 8 };

export interface ParsedNumber {
  value: bigint;
  base: number;
}

/**
 * Parses an integer in `base` (2–36). With `base` = 'auto', a 0x / 0b / 0o
 * prefix selects the base, otherwise decimal. Spaces, underscores and commas
 * between digits are ignored.
 */
export function parseInteger(input: string, base: number | 'auto'): ParsedNumber {
  let s = input.trim().toLowerCase().replace(/[\s_,']/g, '');
  if (!s) throw new Error('Enter a number.');
  let negative = false;
  if (s[0] === '-' || s[0] === '+') {
    negative = s[0] === '-';
    s = s.slice(1);
  }
  let b = base === 'auto' ? 10 : base;
  const prefix = s.slice(0, 2);
  if (prefix in PREFIXES && (base === 'auto' || PREFIXES[prefix] === base)) {
    b = PREFIXES[prefix];
    s = s.slice(2);
  }
  if (b < 2 || b > 36) throw new Error('Base must be between 2 and 36.');
  if (!s) throw new Error('Enter some digits.');
  let value = 0n;
  const big = BigInt(b);
  for (const ch of s) {
    const d = DIGITS.indexOf(ch);
    if (d < 0 || d >= b) throw new Error(`"${ch}" is not a valid base-${b} digit.`);
    value = value * big + BigInt(d);
  }
  return { value: negative ? -value : value, base: b };
}

export function formatInteger(value: bigint, base: number, { uppercase = false, group = 0, separator = ' ' } = {}): string {
  const negative = value < 0n;
  let s = (negative ? -value : value).toString(base);
  if (uppercase) s = s.toUpperCase();
  if (group > 0) {
    const parts: string[] = [];
    for (let end = s.length; end > 0; end -= group) parts.unshift(s.slice(Math.max(0, end - group), end));
    s = parts.join(separator);
  }
  return negative ? `-${s}` : s;
}

export function bitLength(value: bigint): number {
  let v = value < 0n ? -value : value;
  let n = 0;
  while (v > 0n) {
    v >>= 1n;
    n++;
  }
  return n;
}

/** Two's-complement bit pattern of `value` in `width` bits, or null if it does not fit. */
export function twosComplement(value: bigint, width: number): bigint | null {
  const w = BigInt(width);
  const min = -(1n << (w - 1n));
  const maxUnsigned = (1n << w) - 1n;
  if (value < min || value > maxUnsigned) return null;
  return value < 0n ? (1n << w) + value : value;
}

/** Interprets a `width`-bit pattern as a signed integer. */
export function fromTwosComplement(pattern: bigint, width: number): bigint {
  const w = BigInt(width);
  return pattern >= 1n << (w - 1n) ? pattern - (1n << w) : pattern;
}
