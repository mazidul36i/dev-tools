import { describe, expect, it } from 'vitest';
import { CRON_FIELDS, CRON_PRESETS, nextRuns, parseCron, parseField } from './cron-utils';

const iso = (dates: Date[]) => dates.map((d) => d.toISOString().slice(0, 16));

describe('parseField', () => {
  it('handles wildcards, ranges, steps, lists and names', () => {
    expect([...parseField('*/15', CRON_FIELDS[0])]).toEqual([0, 15, 30, 45]);
    expect([...parseField('1-10/3', CRON_FIELDS[0])]).toEqual([1, 4, 7, 10]);
    expect([...parseField('5/20', CRON_FIELDS[0])]).toEqual([5, 25, 45]);
    expect([...parseField('JAN,mar,12', CRON_FIELDS[3])]).toEqual([1, 3, 12]);
    expect([...parseField('MON-FRI', CRON_FIELDS[4])]).toEqual([1, 2, 3, 4, 5]);
    expect([...parseField('7', CRON_FIELDS[4])]).toEqual([0]);
  });

  it('rejects bad values', () => {
    expect(() => parseField('60', CRON_FIELDS[0])).toThrow(/out of range/);
    expect(() => parseField('5-1', CRON_FIELDS[0])).toThrow(/backwards/);
    expect(() => parseField('*/0', CRON_FIELDS[0])).toThrow(/step/);
    expect(() => parseField('abc', CRON_FIELDS[1])).toThrow(/not a number/);
  });
});

describe('parseCron', () => {
  it('expands macros and validates field count', () => {
    expect(parseCron('@daily').expression).toBe('0 0 * * *');
    expect(() => parseCron('* * * *')).toThrow(/Expected 5 fields/);
    expect(() => parseCron('0 * * * * *')).toThrow(/6 fields/);
    expect(() => parseCron('@sometimes')).toThrow(/Unknown macro/);
  });

  it('parses every preset', () => {
    for (const p of CRON_PRESETS) expect(() => parseCron(p.expression)).not.toThrow();
  });
});

describe('nextRuns', () => {
  const from = new Date('2024-01-01T10:07:00Z'); // a Monday

  it('finds the next runs in UTC', () => {
    expect(iso(nextRuns(parseCron('*/15 * * * *'), from, 3, true))).toEqual([
      '2024-01-01T10:15', '2024-01-01T10:30', '2024-01-01T10:45',
    ]);
    expect(iso(nextRuns(parseCron('0 9 * * 1-5'), from, 3, true))).toEqual([
      '2024-01-02T09:00', '2024-01-03T09:00', '2024-01-04T09:00',
    ]);
  });

  it('uses OR semantics when both day fields are restricted', () => {
    // 13th of the month OR any Friday.
    expect(iso(nextRuns(parseCron('0 0 13 * 5'), from, 3, true))).toEqual([
      '2024-01-05T00:00', '2024-01-12T00:00', '2024-01-13T00:00',
    ]);
  });

  it('handles leap days and impossible dates', () => {
    expect(iso(nextRuns(parseCron('0 0 29 2 *'), from, 2, true))).toEqual(['2024-02-29T00:00', '2028-02-29T00:00']);
    expect(nextRuns(parseCron('0 0 31 2 *'), from, 1, true)).toEqual([]);
  });
});
