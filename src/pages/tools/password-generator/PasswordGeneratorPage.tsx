import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Copy, RefreshCw } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import Tabs from '@components/ui/Tabs';
import Checkbox from '@components/ui/Checkbox';
import CopyButton from '@components/ui/CopyButton';
import CodeBlock from '@components/ui/CodeBlock';
import SegmentedControl from '@components/ui/SegmentedControl';
import { PrimaryButton } from '@components/ui/Button';
import { Field, TextInput } from '@components/ui/Input';
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

const countOptions = ['1', '5', '10', '25'].map((v) => ({ id: v, label: v }));
const unitOptions = [
  { id: 'paragraphs', label: 'Paragraphs' },
  { id: 'sentences', label: 'Sentences' },
  { id: 'words', label: 'Words' },
];

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied!');
  } catch {
    toast.error('Failed to copy');
  }
}

function PasswordPanel() {
  const [opts, setOpts] = useState<PasswordOptions>({
    length: 20, lower: true, upper: true, digits: true, symbols: true, excludeAmbiguous: false, exclude: '', requireEach: true,
  });
  const [count, setCount] = useState('5');
  const [passwords, setPasswords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const regenerate = useCallback(() => {
    try {
      setPasswords(Array.from({ length: Number(count) }, () => generatePassword(opts)));
      setError(null);
    } catch (e) {
      setPasswords([]);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [opts, count]);

  useEffect(regenerate, [regenerate]);

  const bits = entropyBits(opts.length, passwordPoolSize(opts));
  const strength = STRENGTH[strengthFor(bits)];
  const set = <K extends keyof PasswordOptions>(k: K, v: PasswordOptions[K]) => setOpts((o) => ({ ...o, [k]: v }));

  return (
    <div className="p-6 space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <Field label={<>Length: <span className="font-mono text-primary">{opts.length}</span></>} htmlFor="pw-length">
            <div className="flex items-center gap-3">
              <input
                id="pw-length"
                type="range"
                min={4}
                max={128}
                value={opts.length}
                onChange={(e) => set('length', Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <TextInput
                type="number"
                min={1}
                max={1024}
                value={opts.length}
                onChange={(e) => set('length', Math.min(1024, Math.max(1, Number(e.target.value) || 1)))}
                className="w-20!"
                aria-label="Length"
              />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Checkbox checked={opts.lower} onChange={(v) => set('lower', v)} label="Lowercase (a-z)" />
            <Checkbox checked={opts.upper} onChange={(v) => set('upper', v)} label="Uppercase (A-Z)" />
            <Checkbox checked={opts.digits} onChange={(v) => set('digits', v)} label="Digits (0-9)" />
            <Checkbox checked={opts.symbols} onChange={(v) => set('symbols', v)} label="Symbols (!@#…)" />
            <Checkbox checked={!!opts.excludeAmbiguous} onChange={(v) => set('excludeAmbiguous', v)} label="Avoid look-alikes (Il1O0)" />
            <Checkbox checked={!!opts.requireEach} onChange={(v) => set('requireEach', v)} label="At least one of each" />
          </div>
          <Field label="Exclude characters" htmlFor="pw-exclude">
            <TextInput id="pw-exclude" value={opts.exclude} onChange={(e) => set('exclude', e.target.value)} placeholder="e.g. {}[]" className="font-mono" />
          </Field>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-surface-alt p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-text">{strength.label}</span>
              <span className="text-text-muted font-mono">{Math.round(bits)} bits</span>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div className={`h-full ${strength.color} ${strength.width} transition-all`} />
            </div>
            <p className="text-xs text-text-muted mt-2">
              Offline brute force at 100 billion guesses/second: <span className="text-text-secondary">{crackTime(bits)}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-text-secondary">How many:</span>
            <SegmentedControl options={countOptions} value={count} onChange={setCount} variant="glass" />
            <PrimaryButton onClick={regenerate} className="ml-auto"><RefreshCw size={15} /> Generate</PrimaryButton>
          </div>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-error">{error}</p>
      ) : (
        <div>
          <div className="rounded-lg border border-border bg-surface divide-y divide-border max-h-96 overflow-auto">
            {passwords.map((pw, i) => (
              <div key={i} className="group flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 min-w-0 font-mono text-sm text-text break-all">{pw}</span>
                <button onClick={() => copy(pw)} title="Copy" className="text-text-muted hover:text-primary shrink-0"><Copy size={15} /></button>
              </div>
            ))}
          </div>
          {passwords.length > 1 && <CopyButton text={passwords.join('\n')} label="Copy all" size="sm" className="mt-2" />}
        </div>
      )}
    </div>
  );
}

function LoremPanel() {
  const [unit, setUnit] = useState<LoremUnit>('paragraphs');
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [html, setHtml] = useState(false);
  const [seed, setSeed] = useState(0);

  const text = useMemo(() => {
    void seed;
    const raw = generateLorem({ count, unit, startWithLorem });
    if (!html) return raw;
    return unit === 'paragraphs' ? raw.split('\n\n').map((p) => `<p>${p}</p>`).join('\n') : `<p>${raw}</p>`;
  }, [unit, count, startWithLorem, html, seed]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <SegmentedControl options={unitOptions} value={unit} onChange={(v) => setUnit(v as LoremUnit)} />
        <Field label="Count" htmlFor="lorem-count" className="w-24">
          <TextInput
            id="lorem-count"
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(Math.min(500, Math.max(1, Number(e.target.value) || 1)))}
          />
        </Field>
        <div className="flex gap-4 pb-2">
          <Checkbox checked={startWithLorem} onChange={setStartWithLorem} label="Start with “Lorem ipsum”" />
          <Checkbox checked={html} onChange={setHtml} label="Wrap in <p>" />
        </div>
        <PrimaryButton onClick={() => setSeed((s) => s + 1)} className="ml-auto"><RefreshCw size={15} /> Regenerate</PrimaryButton>
      </div>
      <CodeBlock title={`${text.split(/\s+/).length} words`} code={text} preClassName="max-h-[28rem] font-sans! leading-relaxed" />
    </div>
  );
}

export default function PasswordGeneratorPage() {
  const [tab, setTab] = useState(() => (new URLSearchParams(window.location.search).get('tab') === 'lorem' ? 'lorem' : 'password'));

  return (
    <ToolLayout
      title="Password & Lorem Ipsum Generator"
      seoTitle="Secure Password Generator & Lorem Ipsum Generator"
      tagline="Generate strong random passwords with a strength meter, or placeholder lorem ipsum text"
      metaDescription="Generate cryptographically secure random passwords with custom length and character sets, see entropy and crack-time estimates, and generate lorem ipsum paragraphs, sentences or words."
    >
      <Card hover={false}>
        <Tabs tabs={[{ id: 'password', label: 'Password' }, { id: 'lorem', label: 'Lorem Ipsum' }]} activeTab={tab} onTabChange={setTab} />
        {tab === 'password' ? <PasswordPanel /> : <LoremPanel />}
      </Card>

      <InfoCard title="About Password Strength">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { t: 'Truly random', d: 'Passwords use crypto.getRandomValues with rejection sampling, so every character is equally likely. Nothing is sent or stored.' },
            { t: 'Length beats complexity', d: 'Each extra character multiplies the search space. A 20-character password from letters and digits (~119 bits) is far stronger than a 10-character one with symbols (~65 bits).' },
            { t: 'Entropy', d: 'Strength is shown as entropy: length × log₂(pool size). Aim for 80+ bits for important accounts, and use a password manager so every password is unique.' },
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
