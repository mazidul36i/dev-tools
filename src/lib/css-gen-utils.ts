import { hexToRgb } from './color-utils';

/** "#ff0000" + alpha → "#ff0000" (opaque) or "rgb(255 0 0 / 0.5)". */
export function colorWithAlpha(hex: string, alpha: number): string {
  if (alpha >= 1) return hex.toLowerCase();
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r} ${g} ${b} / ${+alpha.toFixed(2)})`;
}

/** Converts a CSS value to Tailwind's arbitrary-value syntax (spaces → underscores). */
export function toTailwindArbitrary(prefix: string, value: string): string {
  return `${prefix}-[${value.replace(/,\s+/g, ',').replace(/\s+/g, '_')}]`;
}

// ── Gradients ──────────────────────────────────────────────────────────

export type GradientType = 'linear' | 'radial' | 'conic';

export interface GradientStop {
  id: number;
  color: string;
  alpha: number;
  /** 0–100 */
  position: number;
}

export interface Gradient {
  type: GradientType;
  angle: number;
  /** radial: circle or ellipse */
  shape: 'circle' | 'ellipse';
  /** radial/conic centre, e.g. "center" or "top left" */
  position: string;
  repeating: boolean;
  stops: GradientStop[];
}

export function gradientCss(g: Gradient): string {
  const stops = [...g.stops]
    .sort((a, b) => a.position - b.position)
    .map((s) => `${colorWithAlpha(s.color, s.alpha)} ${Math.round(s.position)}%`)
    .join(', ');
  const fn = `${g.repeating ? 'repeating-' : ''}${g.type}-gradient`;
  const at = g.position === 'center' ? '' : ` at ${g.position}`;
  if (g.type === 'linear') return `${fn}(${g.angle}deg, ${stops})`;
  if (g.type === 'radial') return `${fn}(${g.shape}${at}, ${stops})`;
  return `${fn}(from ${g.angle}deg${at}, ${stops})`;
}

// ── Box shadows ────────────────────────────────────────────────────────

export interface ShadowLayer {
  id: number;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  alpha: number;
  inset: boolean;
}

export function shadowCss(layers: ShadowLayer[]): string {
  if (!layers.length) return 'none';
  return layers
    .map((l) => `${l.inset ? 'inset ' : ''}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${colorWithAlpha(l.color, l.alpha)}`)
    .join(', ');
}
