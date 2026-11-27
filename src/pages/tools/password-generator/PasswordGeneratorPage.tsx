import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Checkbox from '@components/ui/Checkbox';
import CopyButton from '@components/ui/CopyButton';
import SegmentedControl from '@components/ui/SegmentedControl';
import { ErrorNotice, OutputPanel, Panel, RunButton, Toolbar, useRunShortcut } from '@components/workspace';
import { opt, type OptionValues } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import {
  crackTime, entropyBits, generateLorem, generatePassword, passwordPoolSize, strengthFor,
  type LoremUnit, type PasswordOptions, type Strength,
} from '@lib/generator-utils';

const STRENGTH: Record<Strength, { label: string; color: string; width: string }> = {
  'very-weak': { label: 'Very weak', color: 'bg-red-500', width: 'w-1/5' },
  weak: { label: 'Weak', color: 'bg-orange-500', width: 'w-2/5' },
  fair: { label: 'Fair', color: 'bg-yellow-500', width: 'w-3/5' },
  strong: { label: 'Strong', color: 'bg-lime-500', width: 'w-4/5' },
  'very-strong': { label: 'Very strong', color: 'bg-green-500', width: 'w-full' },
};

const schema = {
  tab: opt.oneOf(['password', 'lorem'] as const, 'password'),
  len: opt.num(20, { min: 1, max: 1024 }),
  lower: opt.bool(true),
  upper: opt.bool(true),
  digits: opt.bool(true),
  symbols: opt.bool(true),
  noAmb: opt.bool(false),
  each: opt.bool(true),
  ex: opt.str('', 100),
  n: opt.num(5, { min: 1, max: 100 }),
  unit: opt.oneOf(['paragraphs', 'sentences', 'words'] as const, 'paragraphs'),
  count: opt.num(3, { min: 1, max: 500 }),
  lorem: opt.bool(true),
  html: opt.bool(false),
};

type Opts = OptionValues<typeof schema>;
type SetOpts = (patch: Partial<Opts>) => void;

const fieldClass =
  'h-8 px-2.5 rounded-md bg-surface-alt border border-border-strong text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25';

function PasswordTool({ o, setO }: { o: Opts; setO: SetOpts }) {
  // Generated passwords are secrets: they live only in component state, never in the URL.
  const [passwords, setPasswords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const opts: PasswordOptions = useMemo(
    () => ({ length: o.len, lower: o.lower, upper: o.upper, digits: o.digits, symbols: o.symbols, excludeAmbiguous: o.noAmb, exclude: o.ex, requireEach: o.each }),
    [o.len, o.lower, o.upper, o.digits, o.symbols, o.noAmb, o.ex, o.each],
  );

  const regenerate = useCallback(() => {
    try {
      setPasswords(Array.from({ length: o.n }, () => generatePassword(opts)));
      setError(null);
    } catch (e) {
      setPasswords([]);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [opts, o.n]);

  useEffect(regenerate, [regenerate]);
  useRunShortcut(regenerate);

  const bits = entropyBits(o.len, passwordPoolSize(opts));
  const strength = STRENGTH[strengthFor(bits)];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] items-start">
      <Panel title="Options" bodyClassName="p-4 space-y-4">
        <div>
          <label htmlFor="pw-length" className="flex justify-between mb-1.5 text-sm text-text-secondary">
            Length <span className="font-mono text-text">{o.len}</span>
          </label>
          <div className="flex items-center gap-3">
            <input id="pw-length" type="range" min={4} max={128} value={Math.min(o.len, 128)} onChange={(e) => setO({ len: Number(e.target.value) })} className="flex-1 accent-primary" />
            <input type="number" min={1} max={1024} value={o.len} onChange={(e) => setO({ len: Math.min(1024, Math.max(1, Number(e.target.value) || 1)) })} className={`${fieldClass} w-20`} aria-label="Length" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Checkbox checked={o.lower} onChange={(v) => setO({ lower: v })} label="a–z" />
          <Checkbox checked={o.upper} onChange={(v) => setO({ upper: v })} label="A–Z" />
          <Checkbox checked={o.digits} onChange={(v) => setO({ digits: v })} label="0–9" />
          <Checkbox checked={o.symbols} onChange={(v) => setO({ symbols: v })} label="Symbols !@#…" />
          <Checkbox checked={o.noAmb} onChange={(v) => setO({ noAmb: v })} label="Avoid Il1O0" />
          <Checkbox checked={o.each} onChange={(v) => setO({ each: v })} label="One of each" />
        </div>
        <div>
          <label htmlFor="pw-exclude" className="block mb-1.5 text-sm text-text-secondary">Exclude characters</label>
          <input id="pw-exclude" value={o.ex} onChange={(e) => setO({ ex: e.target.value })} placeholder="e.g. {}[]" className={`${fieldClass} w-full font-mono`} />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="pw-count" className="text-sm text-text-secondary">How many</label>
          <input id="pw-count" type="number" min={1} max={100} value={o.n} onChange={(e) => setO({ n: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })} className={`${fieldClass} w-20`} />
        </div>
        <div className="rounded-md border border-border bg-surface-alt p-3" role="status">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-text">{strength.label}</span>
            <span className="text-text-muted font-mono">{Math.round(bits)} bits</span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div className={`h-full ${strength.color} ${strength.width} transition-all`} />
          </div>
          <p className="text-xs text-text-muted mt-2">At 100 billion guesses/s: <span className="text-text-secondary">{crackTime(bits)}</span></p>
        </div>
        <RunButton onClick={regenerate}><RefreshCw size={13} aria-hidden="true" /> Generate</RunButton>
      </Panel>

      <Panel
        title={`${passwords.length} password${passwords.length === 1 ? '' : 's'}`}
        bodyClassName=""
        actions={passwords.length > 1 ? <CopyButton text={passwords.join('\n')} label="Copy all" size="sm" /> : undefined}
      >
        {error ? (
          <div className="p-3"><ErrorNotice title="Can’t build a password">{error}</ErrorNotice></div>
        ) : (
          <ul className="divide-y divide-border max-h-[32rem] overflow-auto">
            {passwords.map((pw, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-2">
                <span className="flex-1 min-w-0 font-mono text-[13px] text-text break-all">{pw}</span>
                <CopyButton text={pw} label="" size="sm" className="px-2! shrink-0" />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function LoremTool({ o, setO }: { o: Opts; setO: SetOpts }) {
  const [seed, setSeed] = useState(0);
  const text = useMemo(() => {
    void seed;
    const raw = generateLorem({ count: o.count, unit: o.unit as LoremUnit, startWithLorem: o.lorem });
    if (!o.html) return raw;
    return o.unit === 'paragraphs' ? raw.split('\n\n').map((p) => `<p>${p}</p>`).join('\n') : `<p>${raw}</p>`;
  }, [o.unit, o.count, o.lorem, o.html, seed]);
  useRunShortcut(() => setSeed((s) => s + 1));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] items-start">
      <Panel title="Options" bodyClassName="p-4 space-y-4">
        <SegmentedControl ariaLabel="Unit" options={[{ id: 'paragraphs', label: 'Paragraphs' }, { id: 'sentences', label: 'Sentences' }, { id: 'words', label: 'Words' }]} value={o.unit} onChange={(v) => setO({ unit: v as Opts['unit'] })} />
        <div className="flex items-center gap-2">
          <label htmlFor="lorem-count" className="text-sm text-text-secondary">Count</label>
          <input id="lorem-count" type="number" min={1} max={500} value={o.count} onChange={(e) => setO({ count: Math.min(500, Math.max(1, Number(e.target.value) || 1)) })} className={`${fieldClass} w-24`} />
        </div>
        <div className="flex flex-col gap-2">
          <Checkbox checked={o.lorem} onChange={(v) => setO({ lorem: v })} label="Start with “Lorem ipsum”" />
          <Checkbox checked={o.html} onChange={(v) => setO({ html: v })} label="Wrap in <p>" />
        </div>
        <RunButton onClick={() => setSeed((s) => s + 1)}><RefreshCw size={13} aria-hidden="true" /> Regenerate</RunButton>
      </Panel>
      <OutputPanel label={`${text.split(/\s+/).filter(Boolean).length} words`} value={text} downloadName="lorem.txt" textareaClassName="min-h-96 font-sans! text-sm!" />
    </div>
  );
}

export default function PasswordGeneratorPage() {
  const [o, setO] = useUrlOptions(schema);

  return (
    <ToolLayout
      seoTitle="Secure Password Generator & Lorem Ipsum Generator"
      tagline="Strong random passwords with a strength meter, or placeholder lorem ipsum text"
      metaDescription="Generate cryptographically secure random passwords with custom length and character sets, see entropy and crack-time estimates, and generate lorem ipsum paragraphs, sentences or words."
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">Truly random.</strong> Passwords use crypto.getRandomValues with rejection sampling, so every character is equally likely. They are never sent, stored or put in links; only your options are.</li>
          <li><strong className="text-text">Length beats complexity.</strong> A 20-character letters-and-digits password (~119 bits) is far stronger than a 10-character one with symbols (~65 bits).</li>
          <li><strong className="text-text">Entropy</strong> is length × log₂(pool size). Aim for 80+ bits for important accounts, and use a password manager so every password is unique.</li>
        </ul>
      }
    >
      <Toolbar>
        <SegmentedControl ariaLabel="Generator" options={[{ id: 'password', label: 'Password' }, { id: 'lorem', label: 'Lorem ipsum' }]} value={o.tab} onChange={(v) => setO({ tab: v as Opts['tab'] })} />
      </Toolbar>
      {o.tab === 'password' ? <PasswordTool o={o} setO={setO} /> : <LoremTool o={o} setO={setO} />}
    </ToolLayout>
  );
}
