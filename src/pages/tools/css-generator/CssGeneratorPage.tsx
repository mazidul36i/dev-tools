import { useState, type Dispatch, type SetStateAction } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Checkbox from '@components/ui/Checkbox';
import CodeBlock from '@components/ui/CodeBlock';
import SegmentedControl from '@components/ui/SegmentedControl';
import Button from '@components/ui/Button';
import { SelectInput } from '@components/ui/Input';
import { Panel, Toolbar } from '@components/workspace';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
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
      className="w-9 h-9 shrink-0 rounded-md border border-border-strong bg-transparent cursor-pointer p-0.5"
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

const INITIAL_GRADIENT: Gradient = {
  type: 'linear', angle: 120, shape: 'circle', position: 'center', repeating: false,
  stops: [
    { id: 1, color: '#6366f1', alpha: 1, position: 0 },
    { id: 2, color: '#8b5cf6', alpha: 1, position: 50 },
    { id: 3, color: '#ec4899', alpha: 1, position: 100 },
  ],
};

function GradientEditor({ g, setG }: { g: Gradient; setG: Dispatch<SetStateAction<Gradient>> }) {
  const css = gradientCss(g);
  const updateStop = (id: number, patch: Partial<GradientStop>) =>
    setG((s) => ({ ...s, stops: s.stops.map((st) => (st.id === id ? { ...st, ...patch } : st)) }));

  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <Panel title="Preview" bodyClassName="p-4 space-y-4">
        <div className="h-64 rounded-md border border-border" style={{ ...CHECKER }}>
          <div className="w-full h-full rounded-md" style={{ background: css }} />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Presets">
          {GRADIENT_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              title={p.name}
              aria-label={`${p.name} preset`}
              onClick={() => setG((s) => ({
                ...s, type: 'linear', angle: p.angle,
                stops: p.stops.map(([color, position]) => ({ id: uid(), color, alpha: 1, position })),
              }))}
              className="w-9 h-9 rounded-md border border-border-strong hover:scale-105 transition-transform focus-ring"
              style={{ background: `linear-gradient(${p.angle}deg, ${p.stops.map(([c, pos]) => `${c} ${pos}%`).join(', ')})` }}
            />
          ))}
        </div>
        <CodeBlock title="CSS" code={`background: ${css};`} />
        <CodeBlock title="Tailwind" code={toTailwindArbitrary('bg', css)} preClassName="break-all!" />
      </Panel>

      <Panel title="Gradient" bodyClassName="p-4 space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <SegmentedControl ariaLabel="Gradient type" options={typeOptions} value={g.type} onChange={(v) => setG((s) => ({ ...s, type: v as GradientType }))} />
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
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Colour stops</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setG((s) => ({ ...s, stops: [...s.stops, { id: uid(), color: '#22d3ee', alpha: 1, position: 75 }] }))}
            >
              <Plus size={13} aria-hidden="true" /> Add stop
            </Button>
          </div>
          {[...g.stops].sort((a, b) => a.position - b.position).map((st) => (
            <div key={st.id} className="flex items-center gap-3 p-3 rounded-md border border-border bg-surface-alt">
              <ColorInput label="Stop colour" value={st.color} onChange={(c) => updateStop(st.id, { color: c })} />
              <div className="flex-1 grid grid-cols-2 gap-3">
                <Slider label="Position" value={st.position} min={0} max={100} unit="%" onChange={(v) => updateStop(st.id, { position: v })} />
                <Slider label="Opacity" value={st.alpha} min={0} max={1} step={0.05} onChange={(v) => updateStop(st.id, { alpha: v })} />
              </div>
              <button
                type="button"
                onClick={() => setG((s) => ({ ...s, stops: s.stops.filter((x) => x.id !== st.id) }))}
                disabled={g.stops.length <= 2}
                aria-label={`Remove stop at ${st.position}%`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:text-error hover:bg-error/10 disabled:opacity-30 focus-ring"
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </Panel>
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

interface ShadowState {
  layers: ShadowLayer[];
  boxColor: string;
  bgColor: string;
  radius: number;
}

const INITIAL_SHADOW: ShadowState = {
  layers: SHADOW_PRESETS[1].layers.map((l) => ({ ...l, id: uid() })),
  boxColor: '#ffffff',
  bgColor: '#e8ecf3',
  radius: 16,
};

function ShadowEditor({ state, setState }: { state: ShadowState; setState: Dispatch<SetStateAction<ShadowState>> }) {
  const { layers, boxColor, bgColor, radius } = state;
  const setLayers = (fn: (ls: ShadowLayer[]) => ShadowLayer[]) => setState((s) => ({ ...s, layers: fn(s.layers) }));
  const setBoxColor = (v: string) => setState((s) => ({ ...s, boxColor: v }));
  const setBgColor = (v: string) => setState((s) => ({ ...s, bgColor: v }));
  const setRadius = (v: number) => setState((s) => ({ ...s, radius: v }));
  const css = shadowCss(layers);
  const update = (id: number, patch: Partial<ShadowLayer>) => setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <Panel title="Preview" bodyClassName="p-4 space-y-4">
        <div className="h-64 rounded-md border border-border flex items-center justify-center" style={{ background: bgColor }}>
          <div className="w-40 h-32" style={{ background: boxColor, borderRadius: radius, boxShadow: css }} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2 text-sm text-text-secondary"><ColorInput label="Box colour" value={boxColor} onChange={setBoxColor} /> Box</span>
          <span className="flex items-center gap-2 text-sm text-text-secondary"><ColorInput label="Background colour" value={bgColor} onChange={setBgColor} /> Background</span>
          <div className="flex-1 min-w-40"><Slider label="Corner radius" value={radius} min={0} max={64} unit="px" onChange={setRadius} /></div>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Presets">
          {SHADOW_PRESETS.map((p) => (
            <Button key={p.name} variant="secondary" size="sm" onClick={() => setLayers(() => p.layers.map((l) => ({ ...l, id: uid() })))}>
              {p.name}
            </Button>
          ))}
        </div>
        <CodeBlock title="CSS" code={`box-shadow: ${css};`} />
        <CodeBlock title="Tailwind" code={toTailwindArbitrary('shadow', css)} preClassName="break-all!" />
      </Panel>

      <Panel
        title="Shadow layers"
        bodyClassName="p-4 space-y-3"
        actions={
          <Button variant="ghost" size="sm" onClick={() => setLayers((ls) => [...ls, { id: uid(), x: 0, y: 10, blur: 15, spread: 0, color: '#000000', alpha: 0.2, inset: false }])}>
            <Plus size={13} aria-hidden="true" /> Add layer
          </Button>
        }
      >
        {layers.map((l, i) => (
          <div key={l.id} className="p-3 rounded-md border border-border bg-surface-alt space-y-3">
            <div className="flex items-center gap-3">
              <ColorInput label="Shadow colour" value={l.color} onChange={(c) => update(l.id, { color: c })} />
              <span className="text-sm font-medium text-text">Layer {i + 1}</span>
              <Checkbox checked={l.inset} onChange={(v) => update(l.id, { inset: v })} label="Inset" className="ml-auto" />
              <button type="button" onClick={() => setLayers((ls) => ls.filter((x) => x.id !== l.id))} aria-label={`Remove layer ${i + 1}`} className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:text-error hover:bg-error/10 focus-ring">
                <Trash2 size={15} aria-hidden="true" />
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
        {layers.length === 0 && <p className="text-sm text-text-muted">No shadow. Add a layer.</p>}
      </Panel>
    </div>
  );
}

const schema = { tab: opt.oneOf(['gradient', 'shadow'] as const, 'gradient') };

export default function CssGeneratorPage() {
  const [o, setO] = useUrlOptions(schema);
  // Both editors keep their state while you switch tabs.
  const [gradient, setGradient] = useState<Gradient>(INITIAL_GRADIENT);
  const [shadow, setShadow] = useState<ShadowState>(INITIAL_SHADOW);

  return (
    <ToolLayout
      seoTitle="CSS Gradient Generator & Box Shadow Generator (with Tailwind)"
      tagline="Design CSS gradients and layered box shadows visually, then copy CSS or Tailwind classes"
      metaDescription="Create linear, radial and conic CSS gradients and multi-layer box shadows with live preview. Copy the CSS or a Tailwind arbitrary-value class."
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">Smoother gradients.</strong> Two very different hues can look muddy in the middle; add a mid stop or use colours of similar lightness.</li>
          <li><strong className="text-text">Layered shadows.</strong> A tight, darker shadow combined with a large, faint one looks more natural than one heavy shadow.</li>
          <li><strong className="text-text">Tailwind.</strong> Output uses arbitrary values (bg-[…], shadow-[…]) with spaces as underscores. For values you reuse, add them to your theme.</li>
        </ul>
      }
    >
      <Toolbar>
        <SegmentedControl ariaLabel="Generator" options={[{ id: 'gradient', label: 'Gradient' }, { id: 'shadow', label: 'Box shadow' }]} value={o.tab} onChange={(v) => setO({ tab: v as 'gradient' | 'shadow' })} />
      </Toolbar>
      {o.tab === 'gradient' ? <GradientEditor g={gradient} setG={setGradient} /> : <ShadowEditor state={shadow} setState={setShadow} />}
    </ToolLayout>
  );
}
