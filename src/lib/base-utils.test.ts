import { describe, expect, it } from 'vitest';
import { bitLength, formatInteger, fromTwosComplement, parseInteger, twosComplement } from './base-utils';

describe('parseInteger', () => {
  it('parses with explicit bases and prefixes', () => {
    expect(parseInteger('ff', 16)).toEqual({ value: 255n, base: 16 });
    expect(parseInteger('0xFF', 16).value).toBe(255n);
    expect(parseInteger('1010_1010', 2).value).toBe(170n);
    expect(parseInteger('z', 36).value).toBe(35n);
    expect(parseInteger('-1,000,000', 10).value).toBe(-1000000n);
  });

  it('auto-detects bases from prefixes', () => {
    expect(parseInteger('0b101', 'auto')).toEqual({ value: 5n, base: 2 });
    expect(parseInteger('0o17', 'auto')).toEqual({ value: 15n, base: 8 });
    expect(parseInteger('0x1F', 'auto')).toEqual({ value: 31n, base: 16 });
    expect(parseInteger('42', 'auto')).toEqual({ value: 42n, base: 10 });
  });

  it('handles values beyond Number precision', () => {
    expect(parseInteger('18446744073709551615', 10).value.toString(16)).toBe('ffffffffffffffff');
  });

  it('rejects invalid digits', () => {
    expect(() => parseInteger('102', 2)).toThrow(/"2" is not a valid base-2 digit/);
    expect(() => parseInteger('', 10)).toThrow();
    expect(() => parseInteger('0x', 'auto')).toThrow();
  });
});

describe('formatInteger', () => {
  it('formats with case and grouping', () => {
    expect(formatInteger(255n, 16, { uppercase: true })).toBe('FF');
    expect(formatInteger(170n, 2, { group: 4 })).toBe('1010 1010');
    expect(formatInteger(1234567n, 10, { group: 3, separator: ',' })).toBe('1,234,567');
    expect(formatInteger(-5n, 2)).toBe('-101');
  });
});

describe('bits', () => {
  it('computes bit length and two’s complement', () => {
    expect(bitLength(255n)).toBe(8);
    expect(bitLength(0n)).toBe(0);
    expect(twosComplement(-1n, 8)).toBe(255n);
    expect(twosComplement(-128n, 8)).toBe(128n);
    expect(twosComplement(-129n, 8)).toBeNull();
    expect(twosComplement(256n, 8)).toBeNull();
    expect(fromTwosComplement(255n, 8)).toBe(-1n);
    expect(fromTwosComplement(127n, 8)).toBe(127n);
  });
});
