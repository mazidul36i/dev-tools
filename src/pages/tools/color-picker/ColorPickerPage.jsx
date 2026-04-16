import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Shuffle, RotateCcw, Plus, Trash2, Download } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import CopyButton from '@components/ui/CopyButton';
import { PrimaryButton, SecondaryButton } from '@components/ui/Button';
import useLocalStorage from '@hooks/useLocalStorage';
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, generateRandomColor } from '@lib/color-utils';

export default function ColorPickerPage() {
  const [rgb, setRgb] = useState({ r: 255, g: 255, b: 255 });
  const [palette, setPalette] = useLocalStorage('colorPalette', []);
  const [exportFormat, setExportFormat] = useState('css');
  const [showExport, setShowExport] = useState(false);
  const gradientRef = useRef(null);
  const isDragging = useRef(false);

  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const hslHueRef = useRef(hsl.h);
  hslHueRef.current = hsl.h;

  const updateFromRgb = useCallback((newRgb) => {
    setRgb({
      r: Math.max(0, Math.min(255, Math.round(newRgb.r))),
      g: Math.max(0, Math.min(255, Math.round(newRgb.g))),
      b: Math.max(0, Math.min(255, Math.round(newRgb.b))),
    });
  }, []);

  const handleHexInput = (val) => {
    let h = val.startsWith('#') ? val : '#' + val;
    if (h.length >= 4) { try { updateFromRgb(hexToRgb(h)); } catch {} }
  };

  const handleGradientInteraction = useCallback((e) => {
    const rect = gradientRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    let x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    let y = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    updateFromRgb(hslToRgb(hslHueRef.current, Math.round(x * 100), Math.round(y * 100)));
  }, [updateFromRgb]);

  const onPointerDown = (e) => { isDragging.current = true; handleGradientInteraction(e); };
  useEffect(() => {
    const onMove = (e) => { if (isDragging.current) handleGradientInteraction(e); };
    const onUp = () => { isDragging.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onUp); };
  }, [handleGradientInteraction]);

  const handleRandom = () => { updateFromRgb(generateRandomColor()); toast.success('Random color generated!'); };

  const addToPalette = () => {
    if (palette.includes(hex)) { toast.info('Color already in palette'); return; }
    setPalette([...palette, hex]);
    toast.success(`${hex} saved to palette`);
  };

  const generatePalette = () => {
    const baseH = Math.floor(Math.random() * 360);
    const baseS = 70 + Math.floor(Math.random() * 30);
    const baseL = 45 + Math.floor(Math.random() * 15);
    const colors = [
      [baseH, baseS, baseL], [(baseH + 180) % 360, baseS, baseL],
      [(baseH + 30) % 360, baseS, baseL], [(baseH + 330) % 360, baseS, baseL],
      [baseH, baseS, Math.max(baseL - 30, 10)],
    ].map(([h, s, l]) => { const c = hslToRgb(h, s, l); return rgbToHex(c.r, c.g, c.b); });
    setPalette(colors);
    toast.success('Palette generated!');
  };

  const getExportCode = () => {
    if (palette.length === 0) return '';
    switch (exportFormat) {
      case 'css': return ':root {\n' + palette.map((h, i) => `  --color-${i + 1}: ${h};`).join('\n') + '\n}';
      case 'scss': return palette.map((h, i) => `$color-${i + 1}: ${h};`).join('\n');
      case 'json': return JSON.stringify(Object.fromEntries(palette.map((h, i) => [`color${i + 1}`, h])), null, 2);
      default: return '';
    }
  };

  return (
    <ToolLayout
      title="Color Picker Tool"
      tagline="Pick colors and convert between formats with live preview"
      metaDescription="Pick colors and convert between HEX, RGB, HSL formats with live preview. Create and export color palettes."
    >
      <Card>
        <div className="p-6 space-y-6">
          {/* Color Inputs */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="hex-input" className="block text-sm font-medium text-text-secondary mb-2">HEX Color:</label>
              <div className="flex gap-2">
                <input id="hex-input" type="text" value={hex} onChange={(e) => handleHexInput(e.target.value)} maxLength={9} className="flex-1 p-2.5 bg-surface border border-border rounded-lg font-mono text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50" />
                <CopyButton text={hex} label="Copy" size="sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">RGB Color:</label>
              <div className="flex gap-1.5 items-center">
                {['r', 'g', 'b'].map((c) => (
                  <div key={c} className="flex items-center gap-1">
                    <label htmlFor={`rgb-${c}`} className="text-xs font-medium text-text-muted uppercase">{c}:</label>
                    <input id={`rgb-${c}`} type="number" min={0} max={255} value={rgb[c]} onChange={(e) => updateFromRgb({ ...rgb, [c]: Number(e.target.value) || 0 })} className="w-16 p-2 bg-surface border border-border rounded-lg text-sm text-center text-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                ))}
                <CopyButton text={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} label="Copy" size="sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">HSL Color:</label>
              <div className="flex gap-1.5 items-center">
                {[['h', hsl.h, 360], ['s', hsl.s, 100], ['l', hsl.l, 100]].map(([k, v, max]) => (
                  <div key={k} className="flex items-center gap-1">
                    <label htmlFor={`hsl-${k}`} className="text-xs font-medium text-text-muted uppercase">{k}:</label>
                    <input id={`hsl-${k}`} type="number" min={0} max={max} value={v}
                      onChange={(e) => updateFromRgb(hslToRgb(k === 'h' ? Number(e.target.value) : hsl.h, k === 's' ? Number(e.target.value) : hsl.s, k === 'l' ? Number(e.target.value) : hsl.l))}
                      className="w-16 p-2 bg-surface border border-border rounded-lg text-sm text-center text-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    {k !== 'h' && <span className="text-xs text-text-muted">%</span>}
                  </div>
                ))}
                <CopyButton text={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} label="Copy" size="sm" />
              </div>
            </div>
          </div>

          {/* Gradient + Preview */}
          <div className="grid md:grid-cols-[1fr_200px] gap-5">
            <div className="space-y-4">
              <div
                ref={gradientRef}
                onMouseDown={onPointerDown}
                onTouchStart={onPointerDown}
                className="relative w-full h-56 rounded-lg cursor-crosshair border border-border overflow-hidden select-none"
                role="slider" tabIndex={0}
                aria-label="Color gradient picker"
                aria-valuetext={`Saturation ${hsl.s}%, Lightness ${hsl.l}%`}
                style={{ background: `linear-gradient(to top, black, transparent 50%, white), linear-gradient(to right, white, hsl(${hsl.h}, 100%, 50%))` }}
              >
                <div className="absolute w-4 h-4 rounded-full border-2 border-white shadow-elevated -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${hsl.s}%`, top: `${100 - hsl.l}%`, backgroundColor: hex }} />
              </div>
              <input
                type="range" min={0} max={360} value={hsl.h}
                aria-label="Hue slider"
                onChange={(e) => updateFromRgb(hslToRgb(Number(e.target.value), hsl.s, hsl.l))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{ background: 'linear-gradient(to right, #f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }}
              />
              <div className="flex flex-wrap gap-2">
                <PrimaryButton onClick={handleRandom}><Shuffle size={15} /> Random</PrimaryButton>
                <SecondaryButton onClick={() => updateFromRgb({ r: 255, g: 255, b: 255 })}><RotateCcw size={15} /> Reset</SecondaryButton>
                <PrimaryButton onClick={addToPalette}><Plus size={15} /> Save to Palette</PrimaryButton>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-full h-36 rounded-xl shadow-card border border-border" style={{ backgroundColor: hex }} aria-label={`Color preview: ${hex}`} />
              <div className="text-center space-y-1 text-sm font-mono">
                <div className="font-medium text-text">{hex}</div>
                <div className="text-text-muted">rgb({rgb.r}, {rgb.g}, {rgb.b})</div>
                <div className="text-text-muted">hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</div>
              </div>
            </div>
          </div>

          {/* Palette */}
          <div className="border-t border-border pt-5">
            <div className="flex flex-wrap gap-2 mb-4">
              <PrimaryButton onClick={generatePalette}>Generate Palette</PrimaryButton>
              <SecondaryButton onClick={() => setShowExport(!showExport)}><Download size={14} /> Export as Code</SecondaryButton>
              <SecondaryButton onClick={() => { setPalette([]); toast.success('Palette cleared'); }}><Trash2 size={14} /> Clear</SecondaryButton>
            </div>
            {palette.length === 0 ? (
              <p className="text-sm text-text-muted italic">Your palette is empty. Pick colors and save them here.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {palette.map((c, i) => (
                  <div key={`${c}-${i}`} className="group text-center cursor-pointer" onClick={() => { try { updateFromRgb(hexToRgb(c)); } catch {} }} onDoubleClick={() => { setPalette(palette.filter((_, j) => j !== i)); toast.success('Removed'); }}>
                    <div className="w-14 h-14 rounded-lg shadow-soft border border-border group-hover:scale-110 transition-transform" style={{ backgroundColor: c }} title="Click to use, double-click to remove" />
                    <div className="text-xs font-mono text-text-muted mt-1">{c}</div>
                  </div>
                ))}
              </div>
            )}
            {showExport && palette.length > 0 && (
              <div className="mt-4 bg-surface-alt border border-border rounded-lg p-4 space-y-3">
                <div className="flex gap-2">
                  {['css', 'scss', 'json'].map((f) => (
                    <button key={f} onClick={() => setExportFormat(f)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${exportFormat === f ? 'bg-primary text-white' : 'bg-surface text-text-secondary border border-border hover:bg-surface-hover'}`}>{f.toUpperCase()}</button>
                  ))}
                </div>
                <textarea value={getExportCode()} readOnly className="w-full p-3 bg-surface border border-border rounded-lg font-mono text-xs text-text-secondary min-h-25" />
                <CopyButton text={getExportCode()} label="Copy Code" />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Info */}
      <Card hover={false}>
        <div className="p-7">
          <h2 className="text-lg font-semibold text-text border-b border-border pb-3 mb-5">About Color Conversion</h2>
          <p className="text-text-muted leading-relaxed mb-4">Colors can be represented in different formats for web development:</p>
          <ul className="space-y-2 text-sm text-text-muted mb-6">
            <li><strong className="text-text-secondary">HEX</strong> — Hexadecimal notation (#RRGGBB) used in CSS</li>
            <li><strong className="text-text-secondary">RGB</strong> — Red, Green, Blue model (rgb(R, G, B))</li>
            <li><strong className="text-text-secondary">HSL</strong> — Hue, Saturation, Lightness (hsl(H, S%, L%))</li>
          </ul>
          <div className="flex flex-wrap gap-4">
            {[['#FF5733', 'rgb(255,87,51)', 'hsl(14,100%,60%)'], ['#3498DB', 'rgb(52,152,219)', 'hsl(204,70%,53%)'], ['#2ECC71', 'rgb(46,204,113)', 'hsl(145,63%,49%)']].map(([h, r, l]) => (
              <div key={h} className="flex items-center gap-3 bg-surface-alt rounded-lg p-3 border border-border">
                <div className="w-10 h-10 rounded-lg shadow-soft" style={{ backgroundColor: h }} />
                <div className="text-xs font-mono space-y-0.5 text-text-muted">
                  <div>{h}</div><div>{r}</div><div>{l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </ToolLayout>
  );
}

