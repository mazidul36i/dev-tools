import { describe, expect, it } from 'vitest';
import {
  AMBIGUOUS, CHARSETS, crackTime, entropyBits, generateLorem, generatePassword, passwordPoolSize, secureRandomInt, strengthFor,
} from './generator-utils';

const base = { length: 24, lower: true, upper: true, digits: true, symbols: false };

describe('secureRandomInt', () => {
  it('stays in range and covers all values', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const v = secureRandomInt(5);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(5);
      seen.add(v);
    }
    expect(seen.size).toBe(5);
  });
});

describe('generatePassword', () => {
  it('respects length and character sets', () => {
    const pw = generatePassword(base);
    expect(pw).toHaveLength(24);
    expect(pw).toMatch(/^[A-Za-z0-9]+$/);
    expect(generatePassword({ ...base, lower: false, upper: false, digits: true, length: 8 })).toMatch(/^\d{8}$/);
  });

  it('can guarantee one of each set and exclude characters', () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword({ ...base, symbols: true, length: 4, requireEach: true, excludeAmbiguous: true });
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/\d/);
      expect(pw).toMatch(/[^A-Za-z0-9]/);
      for (const c of AMBIGUOUS) expect(pw).not.toContain(c);
    }
    expect(generatePassword({ ...base, exclude: 'abc' }, () => 0)).not.toMatch(/[abc]/);
  });

  it('rejects an empty selection', () => {
    expect(() => generatePassword({ ...base, lower: false, upper: false, digits: false })).toThrow();
  });
});

describe('strength', () => {
  it('computes entropy and labels', () => {
    expect(passwordPoolSize(base)).toBe(62);
    expect(passwordPoolSize({ ...base, excludeAmbiguous: true })).toBe(62 - 6);
    expect(entropyBits(8, CHARSETS.digits.length)).toBeCloseTo(26.58, 1);
    expect(strengthFor(20)).toBe('very-weak');
    expect(strengthFor(70)).toBe('strong');
    expect(crackTime(10)).toBe('instantly');
    expect(crackTime(128)).toBe('longer than the age of the universe');
  });
});

describe('generateLorem', () => {
  it('generates words, sentences and paragraphs', () => {
    const w = generateLorem({ count: 5, unit: 'words' });
    expect(w.split(' ')).toHaveLength(5);
    expect(w.startsWith('Lorem ipsum dolor sit amet')).toBe(true);
    const s = generateLorem({ count: 3, unit: 'sentences', startWithLorem: false });
    expect(s.match(/\./g)).toHaveLength(3);
    expect(generateLorem({ count: 2, unit: 'paragraphs' }).split('\n\n')).toHaveLength(2);
  });
});
