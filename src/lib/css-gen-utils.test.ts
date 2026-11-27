import { describe, expect, it } from 'vitest';
import { colorWithAlpha, gradientCss, shadowCss, toTailwindArbitrary, type Gradient } from './css-gen-utils';

const stops = [
  { id: 2, color: '#0000FF', alpha: 1, position: 100 },
  { id: 1, color: '#ff0000', alpha: 0.5, position: 0 },
];
const base: Gradient = { type: 'linear', angle: 90, shape: 'circle', position: 'center', repeating: false, stops };

describe('css generators', () => {
  it('formats colours with alpha', () => {
    expect(colorWithAlpha('#FF0000', 1)).toBe('#ff0000');
    expect(colorWithAlpha('#ff0000', 0.25)).toBe('rgb(255 0 0 / 0.25)');
  });

  it('builds gradients with sorted stops', () => {
    expect(gradientCss(base)).toBe('linear-gradient(90deg, rgb(255 0 0 / 0.5) 0%, #0000ff 100%)');
    expect(gradientCss({ ...base, type: 'radial', position: 'top left' })).toBe('radial-gradient(circle at top left, rgb(255 0 0 / 0.5) 0%, #0000ff 100%)');
    expect(gradientCss({ ...base, type: 'conic', angle: 45 })).toBe('conic-gradient(from 45deg, rgb(255 0 0 / 0.5) 0%, #0000ff 100%)');
    expect(gradientCss({ ...base, repeating: true })).toMatch(/^repeating-linear-gradient/);
  });

  it('builds box shadows', () => {
    expect(shadowCss([])).toBe('none');
    expect(shadowCss([
      { id: 1, x: 0, y: 4, blur: 6, spread: -1, color: '#000000', alpha: 0.1, inset: false },
      { id: 2, x: 1, y: 1, blur: 0, spread: 0, color: '#ffffff', alpha: 1, inset: true },
    ])).toBe('0px 4px 6px -1px rgb(0 0 0 / 0.1), inset 1px 1px 0px 0px #ffffff');
  });

  it('converts to Tailwind arbitrary values', () => {
    expect(toTailwindArbitrary('shadow', '0px 4px 6px rgb(0 0 0 / 0.1)')).toBe('shadow-[0px_4px_6px_rgb(0_0_0_/_0.1)]');
    expect(toTailwindArbitrary('bg', 'linear-gradient(90deg, #f00 0%, #00f 100%)')).toBe('bg-[linear-gradient(90deg,#f00_0%,#00f_100%)]');
  });
});
