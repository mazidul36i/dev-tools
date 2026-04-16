import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Shuffle, RotateCcw, Plus, Trash2, Download } from 'lucide-react';
import ToolLayout from '../../../components/layout/ToolLayout';
import Card from '../../../components/ui/Card';
import CopyButton from '../../../components/ui/CopyButton';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, generateRandomColor } from '../../../lib/color-utils';

export default function ColorPickerPage() {
  const [rgb, setRgb] = useState({ r: 255, g: 255, b: 255 });
  const [palette, setPalette] = useLocalStorage('colorPalette', []);
  const [exportFormat, setExportFormat] = useState('css');
  const [showExport, setShowExport] = useState(false);
  const gradientRef = useRef(null);
  const isDragging = useRef(false);

  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const updateFromRgb = useCallback((newRgb) => {
    setRgb({
      r: Math.max(0, Math.min(255, Math.round(newRgb.r))),
      g: Math.max(0, Math.min(255, Math.round(newRgb.g))),
      b: Math.max(0, Math.min(255, Math.round(newRgb.b))),
    });
  }, []);

  const handleHexInput = (val) => {
    let h = val.startsWith('#') ? val : '#' + val;
    if (h.length >= 4) {
      try { updateFromRgb(hexToRgb(h)); } catch {}
    }
  };

  const handleGradientInteraction = useCallback((e) => {
    const rect = gradientRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    let x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    let y = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    const s = Math.round(x * 100);
    const l = Math.round(y * 100);
    updateFromRgb(hslToRgb(hsl.h, s, l));
  }, [hsl.h, updateFromRgb]);

  const onPointerDown = (e) => { isDragging.current = true; handleGradientInteraction(e); };
  useEffect(() => {
    const onMove = (e) => { if (isDragging.current) handleGradientInteraction(e); };
    const onUp = () => { isDragging.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
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
      [baseH, baseS, baseL],
      [(baseH + 180) % 360, baseS, baseL],
      [(baseH + 30) % 360, baseS, baseL],
      [(baseH + 330) % 360, baseS, baseL],
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
              <label className="block text-sm font-semibold text-slate-600 mb-2">HEX Color:</label>
              <div className="flex gap-2">
                <input type="text" value={hex} onChange={(e) => handleHexInput(e.target.value)} maxLength={9} className="flex-1 p-2.5 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                <CopyButton text={hex} label="Copy" className="!text-xs !px-3 !py-1.5" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">RGB Color:</label>
              <div className="flex gap-1.5 items-center">
                {['r', 'g', 'b'].map((c) => (
                  <div key={c} className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase">{c}:</span>
                    <input type="number" min={0} max={255} value={rgb[c]} onChange={(e) => updateFromRgb({ ...rgb, [c]: Number(e.target.value) || 0 })} className="w-16 p-2 border border-slate-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                ))}
                <CopyButton text={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} label="Copy" className="!text-xs !px-2 !py-1.5" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">HSL Color:</label>
              <div className="flex gap-1.5 items-center">
                {[['h', hsl.h, 360], ['s', hsl.s, 100], ['l', hsl.l, 100]].map(([k, v, max]) => (
                  <div key={k} className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase">{k}:</span>
                    <input type="number" min={0} max={max} value={v}
                      onChange={(e) => updateFromRgb(hslToRgb(k === 'h' ? Number(e.target.value) : hsl.h, k === 's' ? Number(e.target.value) : hsl.s, k === 'l' ? Number(e.target.value) : hsl.l))}
                      className="w-16 p-2 border border-slate-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    {k !== 'h' && <span className="text-xs text-slate-400">%</span>}
                  </div>
                ))}
                <CopyButton text={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} label="Copy" className="!text-xs !px-2 !py-1.5" />
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
                className="relative w-full h-56 rounded-lg cursor-crosshair border border-slate-200 overflow-hidden select-none"
                style={{
                  background: `linear-gradient(to top, black, transparent 50%, white), linear-gradient(to right, white, hsl(${hsl.h}, 100%, 50%))`,
                }}
              >
                <div
                  className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `${hsl.s}%`, top: `${100 - hsl.l}%`, backgroundColor: hex }}
                />
              </div>
              <input
                type="range" min={0} max={360} value={hsl.h}
                onChange={(e) => updateFromRgb(hslToRgb(Number(e.target.value), hsl.s, hsl.l))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{ background: 'linear-gradient(to right, #f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }}
              />
              <div className="flex flex-wrap gap-2">
                <button onClick={handleRandom} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition shadow-sm"><Shuffle size={15} /> Random</button>
                <button onClick={() => updateFromRgb({ r: 255, g: 255, b: 255 })} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-semibold hover:bg-primary/20 transition"><RotateCcw size={15} /> Reset</button>
                <button onClick={addToPalette} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition shadow-sm"><Plus size={15} /> Save to Palette</button>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-full h-36 rounded-xl shadow-md border border-slate-200" style={{ backgroundColor: hex }} />
              <div className="text-center space-y-1 text-sm font-mono">
                <div className="font-semibold text-slate-700">{hex}</div>
                <div className="text-slate-500">rgb({rgb.r}, {rgb.g}, {rgb.b})</div>
                <div className="text-slate-500">hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</div>
              </div>
            </div>
          </div>

          {/* Palette */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={generatePalette} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition shadow-sm">Generate Palette</button>
              <button onClick={() => { setShowExport(!showExport); }} className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-semibold hover:bg-primary/20 transition">
                <Download size={14} className="inline mr-1" /> Export as Code
              </button>
              <button onClick={() => { setPalette([]); toast.success('Palette cleared'); }} className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-semibold hover:bg-primary/20 transition">
                <Trash2 size={14} className="inline mr-1" /> Clear
              </button>
            </div>
            {palette.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Your palette is empty. Pick colors and save them here.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {palette.map((c, i) => (
                  <div key={i} className="group text-center cursor-pointer" onClick={() => { try { updateFromRgb(hexToRgb(c)); } catch {} }} onDoubleClick={() => { setPalette(palette.filter((_, j) => j !== i)); toast.success('Removed'); }}>
                    <div className="w-14 h-14 rounded-lg shadow-sm border border-slate-200 group-hover:scale-110 transition-transform" style={{ backgroundColor: c }} title="Click to use, double-click to remove" />
                    <div className="text-xs font-mono text-slate-500 mt-1">{c}</div>
                  </div>
                ))}
              </div>
            )}
            {showExport && palette.length > 0 && (
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex gap-2">
                  {['css', 'scss', 'json'].map((f) => (
                    <button key={f} onClick={() => setExportFormat(f)} className={`px-3 py-1.5 text-xs font-medium rounded transition ${exportFormat === f ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>{f.toUpperCase()}</button>
                  ))}
                </div>
                <textarea value={getExportCode()} readOnly className="w-full p-3 border border-slate-200 rounded-lg font-mono text-xs min-h-[100px] bg-white" />
                <CopyButton text={getExportCode()} label="Copy Code" />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Info */}
      <Card hover={false} className="bg-slate-50 border-slate-200">
        <div className="p-7">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-3 mb-5">About Color Conversion</h2>
          <p className="text-slate-500 leading-relaxed mb-4">Colors can be represented in different formats for web development:</p>
          <ul className="space-y-2 text-sm text-slate-500 mb-6">
            <li><strong>HEX</strong> — Hexadecimal notation (#RRGGBB) used in CSS</li>
            <li><strong>RGB</strong> — Red, Green, Blue model (rgb(R, G, B))</li>
            <li><strong>HSL</strong> — Hue, Saturation, Lightness (hsl(H, S%, L%))</li>
          </ul>
          <div className="flex flex-wrap gap-4">
            {[['#FF5733', 'rgb(255,87,51)', 'hsl(14,100%,60%)'], ['#3498DB', 'rgb(52,152,219)', 'hsl(204,70%,53%)'], ['#2ECC71', 'rgb(46,204,113)', 'hsl(145,63%,49%)']].map(([h, r, l]) => (
              <div key={h} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-slate-100">
                <div className="w-10 h-10 rounded-lg shadow-sm" style={{ backgroundColor: h }} />
                <div className="text-xs font-mono space-y-0.5 text-slate-600">
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

