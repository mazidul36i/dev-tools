import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import Tabs from '@components/ui/Tabs';
import Checkbox from '@components/ui/Checkbox';
import CodeBlock from '@components/ui/CodeBlock';
import SegmentedControl from '@components/ui/SegmentedControl';
import { SmallButton } from '@components/ui/Button';
import { SelectInput } from '@components/ui/Input';
import {
  gradientCss, shadowCss, toTailwindArbitrary,
  type Gradient, type GradientStop, type GradientType, type ShadowLayer,
} from '@lib/css-gen-utils';

let nextId = 100;
const uid = () => ++nextId;

function Slider({ label, value, min, max, step = 1, unit = '', onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-xs text-text-muted mb-1">
        <span>{label}</span>
        <span className="font-mono text-text-secondary">{value}{unit}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </label>
  );
}

function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <input
      type="color"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-10 h-10 shrink-0 rounded-lg border border-border bg-transparent cursor-pointer p-0.5"
    />
  );
}

const CHECKER = {
  backgroundColor: '#fff',
  backgroundImage: 'linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0,0 8px,8px -8px,-8px 0',
};

// ── Gradient ───────────────────────────────────────────────────────────

const GRADIENT_PRESETS: { name: string; stops: [string, number][]; angle: number }[] = [
  { name: 'Sunset', stops: [['#ff7e5f', 0], ['#feb47b', 100]], angle: 90 },
  { name: 'Ocean', stops: [['#2193b0', 0], ['#6dd5ed', 100]], angle: 135 },
  { name: 'Indigo', stops: [['#6366f1', 0], ['#8b5cf6', 50], ['#ec4899', 100]], angle: 120 },
  { name: 'Forest', stops: [['#134e5e', 0], ['#71b280', 100]], angle: 160 },
  { name: 'Night', stops: [['#0f2027', 0], ['#203a43', 50], ['#2c5364', 100]], angle: 180 },
  { name: 'Peach', stops: [['#ffecd2', 0], ['#fcb69f', 100]], angle: 45 },
];

const typeOptions = [
  { id: 'linear', label: 'Linear' },
  { id: 'radial', label: 'Radial' },
  { id: 'conic', label: 'Conic' },
];
const positionOptions = ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right']
  .map((p) => ({ value: p, label: p }));

function GradientEditor() {
  const [g, setG] = useState<Gradient>({
    type: 'linear', angle: 120, shape: 'circle', position: 'center', repeating: false,
    stops: [
      { id: 1, color: '#6366f1', alpha: 1, position: 0 },
      { id: 2, color: '#8b5cf6', alpha: 1, position: 50 },
      { id: 3, color: '#ec4899', alpha: 1, position: 100 },
    ],
  });
  const css = gradientCss(g);
  const updateStop = (id: number, patch: Partial<GradientStop>) =>
    setG((s) => ({ ...s, stops: s.stops.map((st) => (st.id === id ? { ...st, ...patch } : st)) }));

  return (
    <div className="p-6 grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="h-64 rounded-xl border border-border" style={{ ...CHECKER }}>
          <div className="w-full h-full rounded-xl" style={{ background: css }} />
        </div>
        <div className="flex flex-wrap gap-2">
          {GRADIENT_PRESETS.map((p) => (
            <button
              key={p.name}
              title={p.name}
              onClick={() => setG((s) => ({
                ...s, type: 'linear', angle: p.angle,
                stops: p.stops.map(([color, position]) => ({ id: uid(), color, alpha: 1, position })),
              }))}
              className="w-10 h-10 rounded-lg border border-border hover:scale-105 transition-transform"
              style={{ background: `linear-gradient(${p.angle}deg, ${p.stops.map(([c, pos]) => `${c} ${pos}%`).join(', ')})` }}
            />
          ))}
        </div>
        <CodeBlock title="CSS" code={`background: ${css};`} />
        <CodeBlock title="Tailwind" code={toTailwindArbitrary('bg', css)} preClassName="break-all!" />
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <SegmentedControl options={typeOptions} value={g.type} onChange={(v) => setG((s) => ({ ...s, type: v as GradientType }))} />
          <Checkbox checked={g.repeating} onChange={(v) => setG((s) => ({ ...s, repeating: v }))} label="Repeating" />
        </div>
        {g.type !== 'radial' && (
          <Slider label={g.type === 'conic' ? 'Start angle' : 'Angle'} value={g.angle} min={0} max={360} unit="°" onChange={(v) => setG((s) => ({ ...s, angle: v }))} />
        )}
        {g.type !== 'linear' && (
          <div className="grid grid-cols-2 gap-3">
            {g.type === 'radial' && (
              <SelectInput
                aria-label="Shape"
                value={g.shape}
                onChange={(e) => setG((s) => ({ ...s, shape: e.target.value as Gradient['shape'] }))}
                options={[{ value: 'circle', label: 'Circle' }, { value: 'ellipse', label: 'Ellipse' }]}
              />
            )}
            <SelectInput aria-label="Centre" value={g.position} onChange={(e) => setG((s) => ({ ...s, position: e.target.value }))} options={positionOptions} />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-secondary">Colour stops</h3>
            <SmallButton
              onClick={() => setG((s) => ({ ...s, stops: [...s.stops, { id: uid(), color: '#22d3ee', alpha: 1, position: 75 }] }))}
            >
              <Plus size={12} /> Add stop
            </SmallButton>
          </div>
          {[...g.stops].sort((a, b) => a.position - b.position).map((st) => (
            <div key={st.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-alt">
              <ColorInput label="Stop colour" value={st.color} onChange={(c) => updateStop(st.id, { color: c })} />
              <div className="flex-1 grid grid-cols-2 gap-3">
                <Slider label="Position" value={st.position} min={0} max={100} unit="%" onChange={(v) => updateStop(st.id, { position: v })} />
                <Slider label="Opacity" value={st.alpha} min={0} max={1} step={0.05} onChange={(v) => updateStop(st.id, { alpha: v })} />
              </div>
              <button
                onClick={() => setG((s) => ({ ...s, stops: s.stops.filter((x) => x.id !== st.id) }))}
                disabled={g.stops.length <= 2}
                aria-label="Remove stop"
                className="text-text-muted hover:text-error disabled:opacity-30"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Box shadow ─────────────────────────────────────────────────────────

const SHADOW_PRESETS: { name: string; layers: Omit<ShadowLayer, 'id'>[] }[] = [
  { name: 'Soft', layers: [{ x: 0, y: 4, blur: 6, spread: -1, color: '#000000', alpha: 0.1, inset: false }, { x: 0, y: 2, blur: 4, spread: -2, color: '#000000', alpha: 0.1, inset: false }] },
  { name: 'Large', layers: [{ x: 0, y: 20, blur: 25, spread: -5, color: '#000000', alpha: 0.1, inset: false }, { x: 0, y: 8, blur: 10, spread: -6, color: '#000000', alpha: 0.1, inset: false }] },
  { name: 'Floating', layers: [{ x: 0, y: 25, blur: 50, spread: -12, color: '#000000', alpha: 0.25, inset: false }] },
  { name: 'Glow', layers: [{ x: 0, y: 0, blur: 24, spread: 4, color: '#6366f1', alpha: 0.55, inset: false }] },
  { name: 'Inset', layers: [{ x: 0, y: 2, blur: 4, spread: 0, color: '#000000', alpha: 0.15, inset: true }] },
  { name: 'Neumorphic', layers: [{ x: 8, y: 8, blur: 16, spread: 0, color: '#a3b1c6', alpha: 0.6, inset: false }, { x: -8, y: -8, blur: 16, spread: 0, color: '#ffffff', alpha: 0.8, inset: false }] },
];

function ShadowEditor() {
  const [layers, setLayers] = useState<ShadowLayer[]>(() => SHADOW_PRESETS[1].layers.map((l) => ({ ...l, id: uid() })));
  const [boxColor, setBoxColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#e8ecf3');
  const [radius, setRadius] = useState(16);
  const css = shadowCss(layers);
  const update = (id: number, patch: Partial<ShadowLayer>) => setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <div className="p-6 grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="h-64 rounded-xl border border-border flex items-center justify-center" style={{ background: bgColor }}>
          <div className="w-40 h-32" style={{ background: boxColor, borderRadius: radius, boxShadow: css }} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2 text-sm text-text-secondary"><ColorInput label="Box colour" value={boxColor} onChange={setBoxColor} /> Box</span>
          <span className="flex items-center gap-2 text-sm text-text-secondary"><ColorInput label="Background colour" value={bgColor} onChange={setBgColor} /> Background</span>
          <div className="flex-1 min-w-40"><Slider label="Corner radius" value={radius} min={0} max={64} unit="px" onChange={setRadius} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {SHADOW_PRESETS.map((p) => (
            <SmallButton key={p.name} onClick={() => setLayers(p.layers.map((l) => ({ ...l, id: uid() })))} className="border border-border">
              {p.name}
            </SmallButton>
          ))}
        </div>
        <CodeBlock title="CSS" code={`box-shadow: ${css};`} />
        <CodeBlock title="Tailwind" code={toTailwindArbitrary('shadow', css)} preClassName="break-all!" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-secondary">Shadow layers</h3>
          <SmallButton onClick={() => setLayers((ls) => [...ls, { id: uid(), x: 0, y: 10, blur: 15, spread: 0, color: '#000000', alpha: 0.2, inset: false }])}>
            <Plus size={12} /> Add layer
          </SmallButton>
        </div>
        {layers.map((l, i) => (
          <div key={l.id} className="p-4 rounded-lg border border-border bg-surface-alt space-y-3">
            <div className="flex items-center gap-3">
              <ColorInput label="Shadow colour" value={l.color} onChange={(c) => update(l.id, { color: c })} />
              <span className="text-sm font-medium text-text">Layer {i + 1}</span>
              <Checkbox checked={l.inset} onChange={(v) => update(l.id, { inset: v })} label="Inset" className="ml-auto" />
              <button onClick={() => setLayers((ls) => ls.filter((x) => x.id !== l.id))} aria-label="Remove layer" className="text-text-muted hover:text-error">
                <Trash2 size={15} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <Slider label="Offset X" value={l.x} min={-50} max={50} unit="px" onChange={(v) => update(l.id, { x: v })} />
              <Slider label="Offset Y" value={l.y} min={-50} max={50} unit="px" onChange={(v) => update(l.id, { y: v })} />
              <Slider label="Blur" value={l.blur} min={0} max={100} unit="px" onChange={(v) => update(l.id, { blur: v })} />
              <Slider label="Spread" value={l.spread} min={-50} max={50} unit="px" onChange={(v) => update(l.id, { spread: v })} />
              <Slider label="Opacity" value={l.alpha} min={0} max={1} step={0.05} onChange={(v) => update(l.id, { alpha: v })} />
            </div>
          </div>
        ))}
        {layers.length === 0 && <p className="text-sm text-text-muted">No shadow — add a layer.</p>}
      </div>
    </div>
  );
}

export default function CssGeneratorPage() {
  const [tab, setTab] = useState(() => (new URLSearchParams(window.location.search).get('tab') === 'shadow' ? 'shadow' : 'gradient'));

  return (
    <ToolLayout
      title="CSS Gradient & Shadow Generator"
      seoTitle="CSS Gradient Generator & Box Shadow Generator (with Tailwind)"
      tagline="Design CSS gradients and layered box shadows visually and copy CSS or Tailwind classes"
      metaDescription="Create linear, radial and conic CSS gradients and multi-layer box shadows with live preview. Copy the CSS or a Tailwind arbitrary-value class."
    >
      <Card hover={false}>
        <Tabs tabs={[{ id: 'gradient', label: 'Gradient' }, { id: 'shadow', label: 'Box shadow' }]} activeTab={tab} onTabChange={setTab} />
        {tab === 'gradient' ? <GradientEditor /> : <ShadowEditor />}
      </Card>

      <InfoCard title="Tips">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { t: 'Smoother gradients', d: 'Two-stop gradients between very different hues can look muddy in the middle. Add a mid stop with an in-between colour, or use colours of similar lightness.' },
            { t: 'Layered shadows', d: 'Real shadows are soft and directional. Combining a tight, darker shadow with a large, faint one looks more natural than a single heavy shadow.' },
            { t: 'Tailwind', d: 'The Tailwind output uses arbitrary values (bg-[…], shadow-[…]); spaces become underscores. For values you reuse, add them to your theme instead.' },
          ].map(({ t, d }) => (
            <div key={t} className="bg-surface-alt rounded-lg p-5 border border-border">
              <h3 className="font-medium text-text-secondary mb-2">{t}</h3>
              <p className="text-sm text-text-muted">{d}</p>
            </div>
          ))}
        </div>
      </InfoCard>
    </ToolLayout>
  );
}
