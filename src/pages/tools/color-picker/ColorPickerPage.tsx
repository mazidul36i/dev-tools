import { useRef, useCallback, useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { toast } from 'sonner';
import { Shuffle, Plus, Trash2, X, Sparkles } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import CodeBlock from '@components/ui/CodeBlock';
import Button from '@components/ui/Button';
import Badge from '@components/ui/Badge';
import SegmentedControl from '@components/ui/SegmentedControl';
import { Panel, ResultRows } from '@components/workspace';
import useLocalStorage from '@hooks/useLocalStorage';
import useUrlOptions from '@hooks/useUrlOptions';
import { opt } from '@lib/url-state';
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, generateRandomColor, contrastRatio, type RGB } from '@lib/color-utils';

const schema = {
  c: opt.str('2563eb', 8),
  fmt: opt.oneOf(['css', 'scss', 'json', 'tailwind'] as const, 'css'),
};

const WHITE = { r: 255, g: 255, b: 255 };
const BLACK = { r: 0, g: 0, b: 0 };

const numInput =
  'w-16 h-8 px-2 rounded-md bg-surface-alt border border-border-strong text-sm text-center text-text tabular-nums focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25';

function parseHex(value: string): RGB | null {
  const h = value.trim().replace(/^#/, '');
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h)) return null;
  try {
    return hexToRgb(`#${h}`);
  } catch {
    return null;
  }
}

function clampRgb(c: RGB): RGB {
  const f = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return { r: f(c.r), g: f(c.g), b: f(c.b) };
}

function ContrastBadge({ ratio, on }: { ratio: number; on: string }) {
  const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA large' : 'Fail';
  const tone = level === 'Fail' ? 'error' : level === 'AA large' ? 'warning' : 'success';
  return (
    <Badge tone={tone}>
      {ratio.toFixed(2)}:1 on {on} · {level}
    </Badge>
  );
}

export default function ColorPickerPage() {
  const [o, setO] = useUrlOptions(schema);
  const rgb = useMemo(() => parseHex(o.c) ?? { r: 37, g: 99, b: 235 }, [o.c]);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const [hexDraft, setHexDraft] = useState<string | null>(null);
  const [palette, setPalette] = useLocalStorage<string[]>('colorPalette', []);
  const areaRef = useRef<HTMLDivElement>(null);
  // Hue is lost for greys (s = 0); keep the last chosen hue for the picker area.
  const [hue, setHue] = useState(hsl.h);
  const shownHue = hsl.s === 0 ? hue : hsl.h;

  const setColor = useCallback((c: RGB) => {
    const next = clampRgb(c);
    setO({ c: rgbToHex(next.r, next.g, next.b).slice(1).toLowerCase() });
  }, [setO]);

  const setFromArea = (clientX: number, clientY: number) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const l = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    setColor(hslToRgb(shownHue, Math.round(s * 100), Math.round(l * 100)));
  };

  const onAreaPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromArea(e.clientX, e.clientY);
  };
  const onAreaPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) setFromArea(e.clientX, e.clientY);
  };
  const onAreaKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 1;
    let { s, l } = hsl;
    if (e.key === 'ArrowLeft') s -= step;
    else if (e.key === 'ArrowRight') s += step;
    else if (e.key === 'ArrowUp') l += step;
    else if (e.key === 'ArrowDown') l -= step;
    else return;
    e.preventDefault();
    setColor(hslToRgb(shownHue, Math.max(0, Math.min(100, s)), Math.max(0, Math.min(100, l))));
  };

  const addToPalette = () => {
    if (palette.includes(hex)) return toast.info(`${hex} is already in the palette`);
    setPalette([...palette, hex]);
  };

  const generatePalette = () => {
    const h = hsl.h;
    const colors = [[h, hsl.s, hsl.l], [(h + 180) % 360, hsl.s, hsl.l], [(h + 30) % 360, hsl.s, hsl.l], [(h + 330) % 360, hsl.s, hsl.l], [h, hsl.s, Math.max(hsl.l - 30, 10)]]
      .map(([hh, ss, ll]) => { const c = hslToRgb(hh, ss, ll); return rgbToHex(c.r, c.g, c.b); });
    setPalette(colors);
  };

  const exportCode = useMemo((): string => {
    if (palette.length === 0) return '';
    switch (o.fmt) {
      case 'css': return ':root {\n' + palette.map((h, i) => `  --color-${i + 1}: ${h};`).join('\n') + '\n}';
      case 'scss': return palette.map((h, i) => `$color-${i + 1}: ${h};`).join('\n');
      case 'json': return JSON.stringify(Object.fromEntries(palette.map((h, i) => [`color${i + 1}`, h])), null, 2);
      case 'tailwind': return '@theme {\n' + palette.map((h, i) => `  --color-brand-${(i + 1) * 100}: ${h};`).join('\n') + '\n}';
    }
  }, [palette, o.fmt]);

  const onWhite = contrastRatio(rgb, WHITE);
  const onBlack = contrastRatio(rgb, BLACK);
  const hexValue = hexDraft ?? hex;

  return (
    <ToolLayout
      seoTitle="Color Picker & Converter – HEX, RGB, HSL with Contrast Check"
      tagline="Pick a colour, convert HEX/RGB/HSL, check WCAG contrast and build a palette"
      metaDescription="Pick colors and convert between HEX, RGB and HSL with live preview. Check WCAG contrast on white and black, and build and export palettes as CSS, SCSS, JSON or Tailwind."
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">HEX</strong> (#RRGGBB) is the usual CSS notation. <strong className="text-text">RGB</strong> gives the red, green and blue channels (0–255).</li>
          <li><strong className="text-text">HSL</strong> (hue, saturation, lightness) is easiest to adjust by hand: keep the hue and change lightness for tints and shades.</li>
          <li><strong className="text-text">Contrast.</strong> Body text needs 4.5:1 against its background (AA), large text 3:1, and 7:1 meets AAA. The picker area works with arrow keys (Shift for ×10).</li>
        </ul>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-start">
        <Panel
          title="Picker"
          bodyClassName="p-4 space-y-4"
          actions={
            <>
              <Button variant="ghost" size="sm" onClick={() => setColor(generateRandomColor())}><Shuffle size={13} aria-hidden="true" /> Random</Button>
              <Button variant="ghost" size="sm" onClick={addToPalette}><Plus size={13} aria-hidden="true" /> Save</Button>
            </>
          }
        >
          <div
            ref={areaRef}
            role="slider"
            tabIndex={0}
            aria-label="Saturation and lightness"
            aria-valuetext={`Saturation ${hsl.s}%, lightness ${hsl.l}%`}
            aria-valuenow={hsl.l}
            aria-valuemin={0}
            aria-valuemax={100}
            onPointerDown={onAreaPointerDown}
            onPointerMove={onAreaPointerMove}
            onKeyDown={onAreaKeyDown}
            className="relative w-full h-60 rounded-md cursor-crosshair border border-border overflow-hidden select-none touch-none focus-ring"
            style={{ background: `linear-gradient(to top, black, transparent 50%, white), linear-gradient(to right, hsl(${shownHue}, 0%, 50%), hsl(${shownHue}, 100%, 50%))` }}
          >
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${hsl.s}%`, top: `${100 - hsl.l}%`, backgroundColor: hex }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={360}
            value={shownHue}
            aria-label="Hue"
            onChange={(e) => { const h = Number(e.target.value); setHue(h); setColor(hslToRgb(h, hsl.s || 100, hsl.s === 0 ? 50 : hsl.l)); }}
            className="w-full h-3 rounded-full appearance-none cursor-pointer"
            style={{ background: 'linear-gradient(to right, #f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="hex-input" className="block mb-1 text-xs text-text-muted">HEX</label>
              <input
                id="hex-input"
                value={hexValue}
                onChange={(e) => {
                  setHexDraft(e.target.value);
                  const c = parseHex(e.target.value);
                  if (c) setColor(c);
                }}
                onBlur={() => setHexDraft(null)}
                maxLength={7}
                spellCheck={false}
                aria-invalid={hexDraft !== null && !parseHex(hexDraft)}
                className="w-full h-8 px-2 rounded-md bg-surface-alt border border-border-strong font-mono text-sm text-text uppercase focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 aria-invalid:border-error"
              />
            </div>
            <fieldset className="min-w-0">
              <legend className="mb-1 text-xs text-text-muted">RGB</legend>
              <div className="flex gap-1">
                {(['r', 'g', 'b'] as const).map((c) => (
                  <input key={c} type="number" min={0} max={255} aria-label={c.toUpperCase()} value={rgb[c]} onChange={(e) => setColor({ ...rgb, [c]: Number(e.target.value) || 0 })} className={numInput} />
                ))}
              </div>
            </fieldset>
            <fieldset className="min-w-0">
              <legend className="mb-1 text-xs text-text-muted">HSL</legend>
              <div className="flex gap-1">
                {([['h', hsl.h, 360, 'Hue'], ['s', hsl.s, 100, 'Saturation %'], ['l', hsl.l, 100, 'Lightness %']] as const).map(([k, v, max, label]) => (
                  <input
                    key={k}
                    type="number"
                    min={0}
                    max={max}
                    aria-label={label}
                    value={v}
                    onChange={(e) => {
                      const n = Number(e.target.value) || 0;
                      setColor(hslToRgb(k === 'h' ? n : hsl.h, k === 's' ? n : hsl.s, k === 'l' ? n : hsl.l));
                    }}
                    className={numInput}
                  />
                ))}
              </div>
            </fieldset>
          </div>
        </Panel>

        <div className="space-y-4 min-w-0">
          <Panel title="Colour" bodyClassName="p-4 space-y-4">
            <div className="h-28 rounded-md border border-border" style={{ backgroundColor: hex }} role="img" aria-label={`Colour preview ${hex}`} />
            <ResultRows
              labelWidth="sm:w-14"
              rows={[
                { label: 'HEX', value: hex },
                { label: 'RGB', value: `rgb(${rgb.r} ${rgb.g} ${rgb.b})` },
                { label: 'HSL', value: `hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)` },
              ]}
            />
            <div className="flex flex-wrap gap-1.5" aria-label="Contrast">
              <ContrastBadge ratio={onWhite} on="white" />
              <ContrastBadge ratio={onBlack} on="black" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm font-medium">
              <div className="rounded-md px-3 py-2 bg-white border border-border" style={{ color: hex }}>Text on white</div>
              <div className="rounded-md px-3 py-2 bg-black" style={{ color: hex }}>Text on black</div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        title={`Palette · ${palette.length}`}
        className="mt-4"
        bodyClassName="p-4 space-y-4"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={generatePalette} title="Complementary and analogous colours from the current one">
              <Sparkles size={13} aria-hidden="true" /> Generate from colour
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPalette([])} disabled={!palette.length}>
              <Trash2 size={13} aria-hidden="true" /> Clear
            </Button>
          </>
        }
      >
        {palette.length === 0 ? (
          <p className="text-sm text-text-muted">Save colours here with “Save”, or generate a palette from the current colour. It’s kept in this browser.</p>
        ) : (
          <ul className="flex flex-wrap gap-3">
            {palette.map((c, i) => (
              <li key={`${c}-${i}`} className="relative group">
                <button
                  type="button"
                  onClick={() => { const p = parseHex(c); if (p) setColor(p); }}
                  className="flex flex-col items-center gap-1 rounded-md focus-ring"
                  aria-label={`Use ${c}`}
                >
                  <span className="block w-14 h-14 rounded-md border border-border" style={{ backgroundColor: c }} />
                  <span className="text-xs font-mono text-text-muted">{c}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPalette(palette.filter((_, j) => j !== i))}
                  aria-label={`Remove ${c}`}
                  className="absolute -top-1.5 -right-1.5 grid place-items-center w-5 h-5 rounded-full bg-surface border border-border-strong text-text-muted hover:text-error opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-ring"
                >
                  <X size={11} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {palette.length > 0 && (
          <div className="space-y-2">
            <SegmentedControl
              ariaLabel="Export format"
              options={[{ id: 'css', label: 'CSS' }, { id: 'scss', label: 'SCSS' }, { id: 'json', label: 'JSON' }, { id: 'tailwind', label: 'Tailwind v4' }]}
              value={o.fmt}
              onChange={(id) => setO({ fmt: id as typeof o.fmt })}
            />
            <CodeBlock title="Export" code={exportCode} />
          </div>
        )}
      </Panel>
    </ToolLayout>
  );
}
