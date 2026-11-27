const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600 * 1000],
  ['month', 30 * 24 * 3600 * 1000],
  ['week', 7 * 24 * 3600 * 1000],
  ['day', 24 * 3600 * 1000],
  ['hour', 3600 * 1000],
  ['minute', 60 * 1000],
  ['second', 1000],
];

/** "in 3 hours" / "5 minutes ago" for `date` relative to `now`. */
export function formatRelative(date: Date | number, now: Date | number = Date.now(), locale = 'en'): string {
  const diff = Number(date) - Number(now);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms || unit === 'second') {
      return rtf.format(Math.round(diff / ms), unit);
    }
  }
  return rtf.format(0, 'second');
}

/** Compact duration like "1d 2h 3m 4s" (sign ignored). */
export function formatDuration(ms: number): string {
  let s = Math.floor(Math.abs(ms) / 1000);
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  const parts = [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean);
  return parts.slice(0, 3).join(' ');
}
