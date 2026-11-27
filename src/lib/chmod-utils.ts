export type Who = 'owner' | 'group' | 'other';
export type Bit = 'r' | 'w' | 'x';

export interface Permissions {
  owner: Record<Bit, boolean>;
  group: Record<Bit, boolean>;
  other: Record<Bit, boolean>;
  setuid: boolean;
  setgid: boolean;
  sticky: boolean;
}

export const WHO: Who[] = ['owner', 'group', 'other'];
export const BITS: Bit[] = ['r', 'w', 'x'];
const BIT_VALUE: Record<Bit, number> = { r: 4, w: 2, x: 1 };

export function emptyPermissions(): Permissions {
  const none = () => ({ r: false, w: false, x: false });
  return { owner: none(), group: none(), other: none(), setuid: false, setgid: false, sticky: false };
}

function digit(p: Record<Bit, boolean>): number {
  return BITS.reduce((n, b) => n + (p[b] ? BIT_VALUE[b] : 0), 0);
}

/** "755", or "4755" when special bits are set. */
export function toOctal(p: Permissions): string {
  const special = (p.setuid ? 4 : 0) + (p.setgid ? 2 : 0) + (p.sticky ? 1 : 0);
  const base = `${digit(p.owner)}${digit(p.group)}${digit(p.other)}`;
  return special ? `${special}${base}` : base;
}

export function fromOctal(text: string): Permissions {
  const s = text.trim().replace(/^0o/i, '');
  if (!/^[0-7]{1,4}$/.test(s)) throw new Error('Octal mode must be 1–4 digits from 0 to 7, e.g. 755 or 4755.');
  const padded = s.padStart(4, '0');
  const [sp, o, g, ot] = [...padded].map(Number);
  const bits = (n: number) => ({ r: !!(n & 4), w: !!(n & 2), x: !!(n & 1) });
  return { owner: bits(o), group: bits(g), other: bits(ot), setuid: !!(sp & 4), setgid: !!(sp & 2), sticky: !!(sp & 1) };
}

/** "rwxr-xr-x" (ls -l style, with s/S/t/T for special bits). */
export function toSymbolic(p: Permissions): string {
  const triple = (who: Who, special: boolean, ch: string) => {
    const t = p[who];
    const x = t.x ? (special ? ch : 'x') : (special ? ch.toUpperCase() : '-');
    return `${t.r ? 'r' : '-'}${t.w ? 'w' : '-'}${x}`;
  };
  return triple('owner', p.setuid, 's') + triple('group', p.setgid, 's') + triple('other', p.sticky, 't');
}

export function fromSymbolic(text: string): Permissions {
  let s = text.trim();
  if (s.length === 10) s = s.slice(1); // drop file-type char from `ls -l`
  if (!/^[r-][w-][xsS-][r-][w-][xsS-][r-][w-][xtT-]$/.test(s)) {
    throw new Error('Symbolic mode must look like rwxr-xr-x (9 characters, optionally with s/S/t/T).');
  }
  const t = (i: number) => ({ r: s[i] === 'r', w: s[i + 1] === 'w', x: /[xst]/.test(s[i + 2]) });
  return {
    owner: t(0), group: t(3), other: t(6),
    setuid: /[sS]/.test(s[2]), setgid: /[sS]/.test(s[5]), sticky: /[tT]/.test(s[8]),
  };
}

/** chmod-style symbolic expression, e.g. "u=rwx,g=rx,o=rx". */
export function toChmodExpression(p: Permissions): string {
  const part = (letter: string, who: Who, special: string) =>
    `${letter}=${BITS.filter((b) => p[who][b]).join('')}${special}`;
  return [
    part('u', 'owner', p.setuid ? 's' : ''),
    part('g', 'group', p.setgid ? 's' : ''),
    part('o', 'other', p.sticky ? 't' : ''),
  ].join(',');
}

/** Applies a chmod symbolic expression such as "u+x,go-w" or "a=r" to `p`. */
export function applyChmodExpression(p: Permissions, expr: string): Permissions {
  const next: Permissions = structuredClone(p);
  for (const clause of expr.split(',').map((c) => c.trim()).filter(Boolean)) {
    const m = clause.match(/^([ugoa]*)([+\-=])([rwxst]*)$/);
    if (!m) throw new Error(`Cannot parse "${clause}". Use forms like u+x, go-w or a=r.`);
    const [, whoText, op, perms] = m;
    const whos: Who[] = !whoText || whoText.includes('a')
      ? WHO
      : [...new Set(whoText.split('').map((c) => ({ u: 'owner', g: 'group', o: 'other' } as const)[c as 'u' | 'g' | 'o']))];
    for (const who of whos) {
      for (const b of BITS) {
        const has = perms.includes(b);
        if (op === '=') next[who][b] = has;
        else if (has) next[who][b] = op === '+';
      }
      const specialKey = who === 'owner' ? 'setuid' : who === 'group' ? 'setgid' : null;
      if (specialKey && (perms.includes('s') || op === '=')) {
        if (op === '=') next[specialKey] = perms.includes('s');
        else next[specialKey] = op === '+';
      }
    }
    if (perms.includes('t') || (op === '=' && whos.includes('other'))) {
      if (op === '=') next.sticky = perms.includes('t');
      else next.sticky = op === '+';
    }
  }
  return next;
}
