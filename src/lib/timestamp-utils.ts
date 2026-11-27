export type TimestampUnit = 's' | 'ms' | 'us' | 'ns' | 'date';

export const UNIT_LABELS: Record<TimestampUnit, string> = {
  s: 'Unix seconds',
  ms: 'Unix milliseconds',
  us: 'Unix microseconds',
  ns: 'Unix nanoseconds',
  date: 'Date string',
};

export interface ParsedTimestamp {
  date: Date;
  unit: TimestampUnit;
}

/**
 * Parses a Unix timestamp (unit detected from its magnitude) or any date
 * string `Date` understands (ISO 8601, RFC 2822, ...).
 */
export function parseTimestampInput(raw: string): ParsedTimestamp {
  const input = raw.trim();
  if (!input) throw new Error('Enter a timestamp or a date.');

  if (/^[-+]?\d+(\.\d+)?$/.test(input)) {
    const [intPart] = input.replace(/^[-+]/, '').split('.');
    const digits = intPart.replace(/^0+/, '').length;
    const value = Number(input);
    let unit: TimestampUnit;
    let ms: number;
    if (digits <= 11) { unit = 's'; ms = value * 1000; }
    else if (digits <= 14) { unit = 'ms'; ms = value; }
    else if (digits <= 17) { unit = 'us'; ms = value / 1000; }
    else if (digits <= 19) { unit = 'ns'; ms = Number(BigInt(intPart) / 1000n) / 1000 * (input.startsWith('-') ? -1 : 1); }
    else throw new Error('That number is too large to be a timestamp.');
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) throw new Error('That timestamp is out of range.');
    return { date, unit };
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) throw new Error('Not a recognised timestamp or date format.');
  return { date, unit: 'date' };
}

/** ISO 8601 week number and week-year. */
export function isoWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

export function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  return Math.floor((date.getTime() - start) / 86400000) + 1;
}

/** Formats a date in a given IANA time zone, e.g. "2024-03-01 14:05:09 GMT+1". */
export function formatInZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23', timeZoneName: 'short',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')} ${get('timeZoneName')}`;
}

/** Offset of `timeZone` from UTC at `date`, in minutes. */
export function zoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/**
 * Interprets a wall-clock time ("2024-03-01T14:05", as from
 * <input type="datetime-local">) in `timeZone` and returns the instant.
 */
export function wallTimeToDate(wall: string, timeZone: string): Date {
  const m = wall.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) throw new Error('Pick a date and time.');
  const [, y, mo, d, h, mi, s = '0'] = m;
  const guess = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
  // Two passes handle DST transitions.
  let ts = guess - zoneOffsetMinutes(new Date(guess), timeZone) * 60000;
  ts = guess - zoneOffsetMinutes(new Date(ts), timeZone) * 60000;
  return new Date(ts);
}

export function listTimeZones(): string[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
  const zones = intl.supportedValuesOf?.('timeZone') ?? [];
  return zones.includes('UTC') ? zones : ['UTC', ...zones];
}
