// ── Secure randomness ──────────────────────────────────────────────────

/** Uniform random integer in [0, max) from crypto.getRandomValues (rejection sampling, no modulo bias). */
export function secureRandomInt(max: number): number {
  if (max <= 0 || max > 2 ** 32) throw new Error('max out of range');
  const limit = Math.floor(2 ** 32 / max) * max;
  const buf = new Uint32Array(1);
  let x: number;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % max;
}

export type RandomInt = (max: number) => number;

// ── Passwords ──────────────────────────────────────────────────────────

export const CHARSETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>/?~',
} as const;

export const AMBIGUOUS = 'Il1O0o|`\'"';

export interface PasswordOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous?: boolean;
  /** Extra characters never to use. */
  exclude?: string;
  /** Guarantee at least one character from every selected set. */
  requireEach?: boolean;
}

function selectedSets(o: PasswordOptions): string[] {
  const banned = new Set([...(o.exclude ?? ''), ...(o.excludeAmbiguous ? AMBIGUOUS : '')]);
  return (['lower', 'upper', 'digits', 'symbols'] as const)
    .filter((k) => o[k])
    .map((k) => [...CHARSETS[k]].filter((c) => !banned.has(c)).join(''))
    .filter(Boolean);
}

export function passwordPoolSize(o: PasswordOptions): number {
  return new Set(selectedSets(o).join('')).size;
}

export function generatePassword(o: PasswordOptions, randomInt: RandomInt = secureRandomInt): string {
  const sets = selectedSets(o);
  if (!sets.length) throw new Error('Select at least one character set.');
  const pool = [...new Set(sets.join(''))];
  const length = Math.max(1, Math.floor(o.length));
  const chars = Array.from({ length }, () => pool[randomInt(pool.length)]);
  if (o.requireEach && length >= sets.length) {
    // Put one character from each set at distinct random positions.
    const positions = [...Array(length).keys()];
    for (const set of sets) {
      const p = positions.splice(randomInt(positions.length), 1)[0];
      chars[p] = set[randomInt(set.length)];
    }
  }
  return chars.join('');
}

/** Entropy in bits of a uniformly random string. */
export function entropyBits(length: number, poolSize: number): number {
  return poolSize > 1 ? length * Math.log2(poolSize) : 0;
}

export type Strength = 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';

export function strengthFor(bits: number): Strength {
  if (bits < 28) return 'very-weak';
  if (bits < 45) return 'weak';
  if (bits < 64) return 'fair';
  if (bits < 100) return 'strong';
  return 'very-strong';
}

/** Rough offline brute-force time at 10^11 guesses per second, on average (half the space). */
export function crackTime(bits: number): string {
  const seconds = 2 ** (bits - 1) / 1e11;
  const units: [string, number][] = [['centuries', 3.15e9], ['years', 3.15e7], ['days', 86400], ['hours', 3600], ['minutes', 60], ['seconds', 1]];
  if (seconds < 1) return 'instantly';
  for (const [name, s] of units) {
    if (seconds >= s) {
      const v = seconds / s;
      if (name === 'centuries' && v > 1e6) return 'longer than the age of the universe';
      return `${v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString()} ${name}`;
    }
  }
  return 'instantly';
}

// ── Lorem ipsum ────────────────────────────────────────────────────────

const LOREM_WORDS = (
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore ' +
  'magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat ' +
  'duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat ' +
  'cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum praesent elementum facilisis ' +
  'leo vel fringilla phasellus faucibus scelerisque eleifend donec pretium vulputate sapien nec sagittis aliquam ' +
  'malesuada bibendum arcu vitae elementum curabitur viverra tellus mauris pharetra massa tincidunt nunc pulvinar'
).split(' ');

const LOREM_START = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';

export type LoremUnit = 'words' | 'sentences' | 'paragraphs';

export interface LoremOptions {
  count: number;
  unit: LoremUnit;
  startWithLorem?: boolean;
}

function words(n: number, randomInt: RandomInt): string[] {
  return Array.from({ length: n }, () => LOREM_WORDS[randomInt(LOREM_WORDS.length)]);
}

function sentence(randomInt: RandomInt): string {
  const w = words(6 + randomInt(10), randomInt);
  if (w.length > 8 && randomInt(2)) w[3 + randomInt(w.length - 6)] += ',';
  const s = w.join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1) + '.';
}

function paragraph(randomInt: RandomInt): string {
  return Array.from({ length: 4 + randomInt(4) }, () => sentence(randomInt)).join(' ');
}

export function generateLorem({ count, unit, startWithLorem = true }: LoremOptions, randomInt: RandomInt = (m) => Math.floor(Math.random() * m)): string {
  const n = Math.max(1, Math.floor(count));
  if (unit === 'words') {
    const w = words(n, randomInt);
    if (startWithLorem) {
      const start = LOREM_START.replace(',', '').toLowerCase().split(' ');
      for (let i = 0; i < Math.min(n, start.length); i++) w[i] = start[i];
    }
    const s = w.join(' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  if (unit === 'sentences') {
    const list = Array.from({ length: n }, () => sentence(randomInt));
    if (startWithLorem) list[0] = `${LOREM_START}.`;
    return list.join(' ');
  }
  const list = Array.from({ length: n }, () => paragraph(randomInt));
  if (startWithLorem) list[0] = `${LOREM_START}, ${list[0].charAt(0).toLowerCase()}${list[0].slice(1)}`;
  return list.join('\n\n');
}
