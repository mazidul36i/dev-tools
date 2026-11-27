// Standard 5-field cron (minute hour day-of-month month day-of-week) parsing
// and next-run calculation, following Vixie cron semantics.

export interface CronField {
  name: string;
  min: number;
  max: number;
  names?: string[];
}

export const CRON_FIELDS: CronField[] = [
  { name: 'Minute', min: 0, max: 59 },
  { name: 'Hour', min: 0, max: 23 },
  { name: 'Day of month', min: 1, max: 31 },
  { name: 'Month', min: 1, max: 12, names: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] },
  { name: 'Day of week', min: 0, max: 7, names: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] },
];

export const CRON_MACROS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

export interface ParsedCron {
  /** The 5-field form (macros expanded). */
  expression: string;
  fields: string[];
  minutes: Set<number>;
  hours: Set<number>;
  daysOfMonth: Set<number>;
  months: Set<number>;
  /** 0–6, Sunday = 0 (7 is folded into 0). */
  daysOfWeek: Set<number>;
  domRestricted: boolean;
  dowRestricted: boolean;
}

function parseValue(token: string, field: CronField): number {
  const upper = token.toUpperCase();
  const named = field.names?.indexOf(upper) ?? -1;
  if (named >= 0) return named + (field.name === 'Month' ? 1 : 0);
  if (!/^\d+$/.test(token)) throw new Error(`${field.name}: "${token}" is not a number${field.names ? ' or name' : ''}.`);
  const v = Number(token);
  if (v < field.min || v > field.max) throw new Error(`${field.name}: ${v} is out of range ${field.min}–${field.max}.`);
  return v;
}

export function parseField(text: string, field: CronField): Set<number> {
  const out = new Set<number>();
  for (const part of text.split(',')) {
    if (!part) throw new Error(`${field.name}: empty list item.`);
    const [range, stepText] = part.split('/');
    let step = 1;
    if (stepText !== undefined) {
      if (!/^\d+$/.test(stepText) || Number(stepText) === 0) throw new Error(`${field.name}: invalid step "/${stepText}".`);
      step = Number(stepText);
    }
    let lo: number;
    let hi: number;
    if (range === '*' || range === '?') {
      lo = field.min;
      hi = field.name === 'Day of week' ? 6 : field.max;
    } else if (range.includes('-')) {
      const [a, b] = range.split('-');
      lo = parseValue(a, field);
      hi = parseValue(b, field);
      if (lo > hi) throw new Error(`${field.name}: range ${range} goes backwards.`);
    } else {
      lo = parseValue(range, field);
      hi = stepText !== undefined ? (field.name === 'Day of week' ? 6 : field.max) : lo;
    }
    for (let v = lo; v <= hi; v += step) out.add(field.name === 'Day of week' && v === 7 ? 0 : v);
  }
  return out;
}

export function parseCron(input: string): ParsedCron {
  const trimmed = input.trim().replace(/\s+/g, ' ');
  if (!trimmed) throw new Error('Enter a cron expression.');
  const expression = CRON_MACROS[trimmed.toLowerCase()] ?? trimmed;
  if (expression.startsWith('@')) throw new Error(`Unknown macro "${trimmed}". Try @hourly, @daily, @weekly, @monthly or @yearly.`);
  const fields = expression.split(' ');
  if (fields.length === 6) throw new Error('6 fields found — this tool expects standard 5-field cron (no seconds or year field).');
  if (fields.length !== 5) throw new Error(`Expected 5 fields (minute hour day month weekday), found ${fields.length}.`);
  const [m, h, dom, mon, dow] = fields.map((f, i) => parseField(f, CRON_FIELDS[i]));
  return {
    expression,
    fields,
    minutes: m,
    hours: h,
    daysOfMonth: dom,
    months: mon,
    daysOfWeek: dow,
    domRestricted: !/^[*?]$/.test(fields[2]),
    dowRestricted: !/^[*?]$/.test(fields[4]),
  };
}

function dayMatches(c: ParsedCron, dom: number, dow: number): boolean {
  if (c.domRestricted && c.dowRestricted) return c.daysOfMonth.has(dom) || c.daysOfWeek.has(dow);
  if (c.domRestricted) return c.daysOfMonth.has(dom);
  if (c.dowRestricted) return c.daysOfWeek.has(dow);
  return true;
}

/**
 * The next `count` times the schedule fires strictly after `from`,
 * evaluated in UTC or the local time zone.
 */
export function nextRuns(c: ParsedCron, from: Date, count: number, utc = false): Date[] {
  const get = utc
    ? { y: (d: Date) => d.getUTCFullYear(), mo: (d: Date) => d.getUTCMonth(), d: (d: Date) => d.getUTCDate(), dow: (d: Date) => d.getUTCDay() }
    : { y: (d: Date) => d.getFullYear(), mo: (d: Date) => d.getMonth(), d: (d: Date) => d.getDate(), dow: (d: Date) => d.getDay() };
  const make = (y: number, mo: number, d: number, h = 0, mi = 0) =>
    utc ? new Date(Date.UTC(y, mo, d, h, mi)) : new Date(y, mo, d, h, mi);

  const hours = [...c.hours].sort((a, b) => a - b);
  const minutes = [...c.minutes].sort((a, b) => a - b);
  const results: Date[] = [];
  let day = make(get.y(from), get.mo(from), get.d(from));
  // Leap-day schedules can be up to 8 years apart.
  for (let i = 0; i < 366 * 9 && results.length < count; i++) {
    const y = get.y(day);
    const mo = get.mo(day);
    const d = get.d(day);
    if (c.months.has(mo + 1) && dayMatches(c, d, get.dow(day))) {
      for (const h of hours) {
        for (const mi of minutes) {
          const t = make(y, mo, d, h, mi);
          // Skip non-existent local times (DST gaps) and times not after `from`.
          if (t.getTime() <= from.getTime() || (!utc && (t.getHours() !== h || t.getMinutes() !== mi))) continue;
          results.push(t);
          if (results.length >= count) return results;
        }
      }
    }
    day = make(y, mo, d + 1);
  }
  return results;
}

export const CRON_PRESETS: { label: string; expression: string }[] = [
  { label: 'Every minute', expression: '* * * * *' },
  { label: 'Every 5 minutes', expression: '*/5 * * * *' },
  { label: 'Every hour', expression: '0 * * * *' },
  { label: 'Every day at midnight', expression: '0 0 * * *' },
  { label: 'Every day at 9:30', expression: '30 9 * * *' },
  { label: 'Weekdays at 9:00', expression: '0 9 * * 1-5' },
  { label: 'Every 15 min in work hours', expression: '*/15 9-17 * * MON-FRI' },
  { label: 'Every Sunday at 3:00', expression: '0 3 * * 0' },
  { label: 'First day of the month', expression: '0 0 1 * *' },
  { label: 'Every quarter', expression: '0 0 1 1,4,7,10 *' },
  { label: 'Every year (Jan 1)', expression: '0 0 1 1 *' },
];
