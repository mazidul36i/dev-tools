import { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import CopyButton from '@components/ui/CopyButton';
import Checkbox from '@components/ui/Checkbox';
import Badge from '@components/ui/Badge';
import SegmentedControl from '@components/ui/SegmentedControl';
import { Field, SelectInput, TextInput } from '@components/ui/Input';
import { bitLength, formatInteger, fromTwosComplement, parseInteger, twosComplement } from '@lib/base-utils';

const baseOptions = [
  { value: 'auto', label: 'Auto (0x, 0b, 0o prefixes)' },
  { value: '2', label: 'Binary (2)' },
  { value: '8', label: 'Octal (8)' },
  { value: '10', label: 'Decimal (10)' },
  { value: '16', label: 'Hexadecimal (16)' },
  ...Array.from({ length: 35 }, (_, i) => i + 2)
    .filter((b) => ![2, 8, 10, 16].includes(b))
    .map((b) => ({ value: String(b), label: `Base ${b}` })),
];

const customBaseOptions = Array.from({ length: 35 }, (_, i) => ({ value: String(i + 2), label: `Base ${i + 2}` }));
const widthOptions = ['8', '16', '32', '64'].map((w) => ({ id: w, label: `${w}-bit` }));

function Row({ label, value, prefix }: { label: string; value: string; prefix?: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <span className="w-28 shrink-0 text-sm text-text-muted">{label}</span>
      <span className="flex-1 min-w-0 font-mono text-sm text-text break-all">
        {value.startsWith('-') && '-'}
        {prefix && <span className="text-text-muted">{prefix}</span>}
        {value.replace(/^-/, '')}
      </span>
      <CopyButton text={value} label="" size="sm" className="px-2! shrink-0" />
    </div>
  );
}

export default function BaseConverterPage() {
  const [input, setInput] = useState('0xDEADBEEF');
  const [inputBase, setInputBase] = useState('auto');
  const [customBase, setCustomBase] = useState('36');
  const [uppercase, setUppercase] = useState(true);
  const [group, setGroup] = useState(true);
  const [width, setWidth] = useState('32');

  const parsed = useMemo(() => {
    try {
      return { ...parseInteger(input, inputBase === 'auto' ? 'auto' : Number(inputBase)) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, inputBase]);

  const value = 'value' in parsed ? parsed.value : null;
  const fmt = (base: number, groupSize: number, separator = ' ') =>
    value === null ? '' : formatInteger(value, base, { uppercase, group: group ? groupSize : 0, separator });

  const twos = value === null ? null : twosComplement(value, Number(width));
  const codePoint = value !== null && value >= 0n && value <= 0x10ffffn && !(value >= 0xd800n && value <= 0xdfffn) ? Number(value) : null;

  return (
    <ToolLayout
      title="Number Base Converter"
      seoTitle="Number Base Converter – Binary, Octal, Decimal, Hex"
      tagline="Convert integers between binary, octal, decimal, hexadecimal and any base from 2 to 36"
      metaDescription="Convert numbers between binary, octal, decimal, hexadecimal and any base 2–36 with arbitrary precision. Shows bit length and two's-complement representations for 8, 16, 32 and 64 bits."
    >
      <Card hover={false}>
        <div className="p-6 space-y-5">
          <div className="grid md:grid-cols-[1fr_260px] gap-3">
            <Field label="Number" htmlFor="base-input">
              <TextInput
                id="base-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. 255, 0xff, 0b1010, -42"
                className="font-mono text-base!"
                spellCheck={false}
                autoComplete="off"
              />
            </Field>
            <Field label="Input base" htmlFor="base-select">
              <SelectInput id="base-select" value={inputBase} onChange={(e) => setInputBase(e.target.value)} options={baseOptions} />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Checkbox checked={uppercase} onChange={setUppercase} label="Uppercase letters" />
            <Checkbox checked={group} onChange={setGroup} label="Group digits" />
            {value !== null && (
              <div className="flex flex-wrap gap-2 ml-auto">
                <Badge tone="primary">Read as base {'base' in parsed ? parsed.base : ''}</Badge>
                <Badge>{bitLength(value)} bits</Badge>
                <Badge>{Math.ceil(bitLength(value) / 8) || 1} byte{Math.ceil(bitLength(value) / 8) > 1 ? 's' : ''}</Badge>
              </div>
            )}
          </div>

          {'error' in parsed ? (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-error/30 bg-error/5 text-error text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" /> {parsed.error}
            </div>
          ) : (
            <div>
              <Row label="Binary" prefix="0b" value={fmt(2, 4)} />
              <Row label="Octal" prefix="0o" value={fmt(8, 3)} />
              <Row label="Decimal" value={fmt(10, 3, ',')} />
              <Row label="Hexadecimal" prefix="0x" value={fmt(16, 4)} />
              <div className="flex items-center gap-3 py-2.5">
                <SelectInput
                  aria-label="Custom base"
                  value={customBase}
                  onChange={(e) => setCustomBase(e.target.value)}
                  options={customBaseOptions}
                  className="w-32! shrink-0 py-1!"
                />
                <span className="flex-1 min-w-0 font-mono text-sm text-text break-all">{fmt(Number(customBase), 0)}</span>
                <CopyButton text={fmt(Number(customBase), 0)} label="" size="sm" className="px-2! shrink-0" />
              </div>
              {codePoint !== null && codePoint >= 32 && (
                <p className="text-xs text-text-muted mt-1">
                  As a Unicode code point: <span className="font-mono text-text-secondary">U+{codePoint.toString(16).toUpperCase().padStart(4, '0')}</span>{' '}
                  <span className="text-base text-text">{String.fromCodePoint(codePoint)}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      {value !== null && (
        <Card hover={false}>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-text">Two’s complement</h2>
              <SegmentedControl options={widthOptions} value={width} onChange={setWidth} variant="glass" />
            </div>
            {twos === null ? (
              <p className="text-sm text-text-muted">{formatInteger(value, 10)} does not fit in {width} bits.</p>
            ) : (
              <div>
                <Row label="Bit pattern" value={twos.toString(2).padStart(Number(width), '0').replace(/(.{4})(?=.)/g, '$1 ')} />
                <Row label="Hex" prefix="0x" value={(uppercase ? (s: string) => s.toUpperCase() : (s: string) => s)(twos.toString(16).padStart(Number(width) / 4, '0'))} />
                <Row label="As unsigned" value={formatInteger(twos, 10)} />
                <Row label="As signed" value={formatInteger(fromTwosComplement(twos, Number(width)), 10)} />
              </div>
            )}
          </div>
        </Card>
      )}

      <InfoCard title="About Number Bases">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { t: 'Common bases', d: 'Binary (2) is how computers store data, octal (8) shows up in Unix file permissions, and hexadecimal (16) is a compact way to write bytes — two hex digits per byte.' },
            { t: 'Arbitrary precision', d: 'Numbers are handled as BigInt, so 64-bit IDs, hashes and other huge integers convert exactly without the rounding you get from JavaScript numbers above 2⁵³.' },
            { t: 'Two’s complement', d: 'Signed integers store negatives as 2ⁿ + value. The same bit pattern reads as -1 when signed and 255 when unsigned (8 bits).' },
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
