import { describe, expect, it } from 'vitest';
import { dayOfYear, formatInZone, isoWeek, parseTimestampInput, wallTimeToDate, zoneOffsetMinutes } from './timestamp-utils';

describe('parseTimestampInput', () => {
  const iso = '2023-11-14T22:13:20.000Z';
  it.each([
    ['1700000000', 's'],
    ['1700000000000', 'ms'],
    ['1700000000000000', 'us'],
    ['1700000000000000000', 'ns'],
  ])('detects %s as %s', (input, unit) => {
    const r = parseTimestampInput(input);
    expect(r.unit).toBe(unit);
    expect(r.date.toISOString()).toBe(iso);
  });

  it('handles fractional seconds, small and negative values', () => {
    expect(parseTimestampInput('1700000000.5').date.getTime()).toBe(1700000000500);
    expect(parseTimestampInput('0').date.toISOString()).toBe('1970-01-01T00:00:00.000Z');
    expect(parseTimestampInput('-86400').date.toISOString()).toBe('1969-12-31T00:00:00.000Z');
  });

  it('parses date strings and rejects garbage', () => {
    expect(parseTimestampInput(iso)).toEqual({ date: new Date(iso), unit: 'date' });
    expect(() => parseTimestampInput('')).toThrow();
    expect(() => parseTimestampInput('not a date')).toThrow(/recognised/);
  });
});

describe('calendar helpers', () => {
  it('computes ISO week and day of year', () => {
    expect(isoWeek(new Date('2021-01-03T12:00:00Z'))).toEqual({ week: 53, year: 2020 });
    expect(isoWeek(new Date('2024-12-30T12:00:00Z'))).toEqual({ week: 1, year: 2025 });
    expect(dayOfYear(new Date('2024-12-31T00:00:00Z'))).toBe(366);
  });
});

describe('time zones', () => {
  const instant = new Date('2024-07-01T12:00:00Z');
  it('computes offsets and formats', () => {
    expect(zoneOffsetMinutes(instant, 'UTC')).toBe(0);
    expect(zoneOffsetMinutes(instant, 'America/New_York')).toBe(-240);
    expect(zoneOffsetMinutes(instant, 'Asia/Kolkata')).toBe(330);
    expect(formatInZone(instant, 'Asia/Tokyo')).toMatch(/^2024-07-01 21:00:00 /);
  });

  it('converts wall-clock times in a zone to instants, across DST', () => {
    expect(wallTimeToDate('2024-07-01T08:00', 'America/New_York').toISOString()).toBe('2024-07-01T12:00:00.000Z');
    expect(wallTimeToDate('2024-01-15T08:00', 'America/New_York').toISOString()).toBe('2024-01-15T13:00:00.000Z');
    expect(wallTimeToDate('2024-03-01T00:00:30', 'UTC').toISOString()).toBe('2024-03-01T00:00:30.000Z');
  });
});
