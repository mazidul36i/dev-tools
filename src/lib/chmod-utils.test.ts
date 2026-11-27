import { describe, expect, it } from 'vitest';
import { applyChmodExpression, fromOctal, fromSymbolic, toChmodExpression, toOctal, toSymbolic } from './chmod-utils';

describe('chmod conversions', () => {
  it.each([
    ['755', 'rwxr-xr-x', 'u=rwx,g=rx,o=rx'],
    ['644', 'rw-r--r--', 'u=rw,g=r,o=r'],
    ['600', 'rw-------', 'u=rw,g=,o='],
    ['4755', 'rwsr-xr-x', 'u=rwxs,g=rx,o=rx'],
    ['2750', 'rwxr-s---', 'u=rwx,g=rxs,o='],
    ['1777', 'rwxrwxrwt', 'u=rwx,g=rwx,o=rwxt'],
    ['1666', 'rw-rw-rwT', 'u=rw,g=rw,o=rwt'],
  ])('%s <-> %s', (octal, symbolic, expr) => {
    const p = fromOctal(octal);
    expect(toSymbolic(p)).toBe(symbolic);
    expect(toOctal(fromSymbolic(symbolic))).toBe(octal);
    expect(toChmodExpression(p)).toBe(expr);
  });

  it('accepts ls -l strings and short octal', () => {
    expect(toOctal(fromSymbolic('-rwxr-x---'))).toBe('750');
    expect(toOctal(fromOctal('7'))).toBe('007');
    expect(toOctal(fromOctal('0755'))).toBe('755');
    expect(toOctal(fromOctal('0'))).toBe('000');
    expect(toOctal(fromOctal('0o644'))).toBe('644');
  });

  it('rejects invalid input', () => {
    expect(() => fromOctal('8')).toThrow();
    expect(() => fromOctal('12345')).toThrow();
    expect(() => fromSymbolic('rwx')).toThrow();
  });
});

describe('applyChmodExpression', () => {
  it('applies +, - and = clauses', () => {
    const p = fromOctal('644');
    expect(toOctal(applyChmodExpression(p, 'u+x'))).toBe('744');
    expect(toOctal(applyChmodExpression(p, 'go-r'))).toBe('600');
    expect(toOctal(applyChmodExpression(p, 'a=rx'))).toBe('555');
    expect(toOctal(applyChmodExpression(p, '+x'))).toBe('755');
    expect(toOctal(applyChmodExpression(p, 'u+s,o+t'))).toBe('5644');
    expect(() => applyChmodExpression(p, 'z+q')).toThrow();
  });
});
