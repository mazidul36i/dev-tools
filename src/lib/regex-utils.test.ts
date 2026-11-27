import { describe, expect, it } from 'vitest';
import { REGEX_PRESETS, runRegex, segmentText } from './regex-utils';

describe('runRegex', () => {
  it('finds all matches with groups when global', () => {
    const r = runRegex(String.raw`(?<k>\w+)=(\d+)`, 'g', 'a=1, b=22');
    expect(r.matches.map((m) => [m.text, m.index, m.groups, m.named.k])).toEqual([
      ['a=1', 0, ['a', '1'], 'a'],
      ['b=22', 5, ['b', '22'], 'b'],
    ]);
  });

  it('returns only the first match without g', () => {
    expect(runRegex('o', '', 'foo').matches).toHaveLength(1);
  });

  it('survives empty matches, including astral characters in unicode mode', () => {
    expect(runRegex('x*', 'g', 'ab').matches.map((m) => m.index)).toEqual([0, 1, 2]);
    expect(runRegex('(?:)', 'gu', '😀a').matches.map((m) => m.index)).toEqual([0, 2, 3]);
  });

  it('applies the match limit', () => {
    const r = runRegex('a', 'g', 'aaaa', undefined, 2);
    expect(r.matches).toHaveLength(2);
    expect(r.truncated).toBe(true);
  });

  it('replaces with group references', () => {
    expect(runRegex(String.raw`(\w+)@(\w+)`, 'g', 'me@home you@work', '$2:$1').replaced).toBe('home:me work:you');
  });

  it('reports syntax errors', () => {
    expect(runRegex('(', 'g', 'x').error).toMatch(/Unterminated group|missing \)/i);
  });
});

describe('segmentText', () => {
  it('splits into matched and unmatched parts', () => {
    const { matches } = runRegex(String.raw`\d+`, 'g', 'a1b22c');
    expect(segmentText('a1b22c', matches)).toEqual([
      { text: 'a', match: -1 }, { text: '1', match: 0 }, { text: 'b', match: -1 },
      { text: '22', match: 1 }, { text: 'c', match: -1 },
    ]);
  });
});

describe('presets', () => {
  it('compile and match their examples', () => {
    const samples: Record<string, string> = {
      Email: 'jane.doe+x@mail.example.com',
      URL: 'https://example.com/path?q=1',
      IPv4: '192.168.0.255',
      'Date (YYYY-MM-DD)': '2024-02-29',
      'Hex colour': '#a1B2c3',
      UUID: '3f8a1c2d-7e4b-4a91-b6f0-8c2d5e9a1b3f',
      'Phone (intl)': '+1 (555) 123-4567',
    };
    for (const p of REGEX_PRESETS) {
      expect(runRegex(p.pattern, p.flags, samples[p.name]).matches[0]?.text, p.name).toBe(samples[p.name]);
    }
  });
});
