import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToRgb } from './color-utils';

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio(hexToRgb('#000000'), hexToRgb('#ffffff'))).toBeCloseTo(21, 5);
    expect(contrastRatio(hexToRgb('#ffffff'), hexToRgb('#ffffff'))).toBeCloseTo(1, 5);
    expect(contrastRatio(hexToRgb('#2563eb'), hexToRgb('#ffffff'))).toBeCloseTo(5.17, 2);
  });

  it('is symmetric', () => {
    const a = hexToRgb('#3498db');
    const b = hexToRgb('#1e1e1e');
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
  });
});
