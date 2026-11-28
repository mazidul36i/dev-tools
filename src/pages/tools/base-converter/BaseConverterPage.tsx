import { useMemo } from 'react';
import ToolLayout from '@components/layout/ToolLayout';
import Checkbox from '@components/ui/Checkbox';
import Badge from '@components/ui/Badge';
import SegmentedControl from '@components/ui/SegmentedControl';
import { ErrorNotice, Panel, ResultRows } from '@components/workspace';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
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

const BASES = ['auto', ...Array.from({ length: 35 }, (_, i) => String(i + 2))] as [string, ...string[]];

const schema = {
  n: opt.str('0xDEADBEEF', 300),
  base: opt.oneOf(BASES, 'auto'),
  to: opt.num(36, { min: 2, max: 36 }),
  upper: opt.bool(true),
  group: opt.bool(true),
  width: opt.oneOf(['8', '16', '32', '64'] as const, '32'),
};

/** Value with a muted base prefix, keeping a leading minus in front. */
function withPrefix(value: string, prefix?: string) {
  if (!value) return undefined;
  return (
    <>
      {value.startsWith('-') && '-'}
      {prefix && <span className="text-text-muted">{prefix}</span>}
      {value.replace(/^-/, '')}
    </>
  );
}

const fieldClass =
  'h-9 px-2.5 rounded-md bg-surface-alt border border-border-strong text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25';

export default function BaseConverterPage() {
  const [o, setO] = useUrlOptions(schema);

  const parsed = useMemo(() => {
    try {
      return { ...parseInteger(o.n, o.base === 'auto' ? 'auto' : Number(o.base)) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [o.n, o.base]);

  const value = 'value' in parsed ? parsed.value : null;
  const fmt = (base: number, groupSize: number, separator = ' ') =>
    value === null ? '' : formatInteger(value, base, { uppercase: o.upper, group: o.group ? groupSize : 0, separator });

  const width = Number(o.width);
  const twos = value === null ? null : twosComplement(value, width);
  const codePoint = value !== null && value >= 0n && value <= 0x10ffffn && !(value >= 0xd800n && value <= 0xdfffn) ? Number(value) : null;
  const bits = value === null ? 0 : bitLength(value);
  const bytes = Math.ceil(bits / 8) || 1;
  const hexCase = (s: string) => (o.upper ? s.toUpperCase() : s);

  return (
    <ToolLayout
      seoTitle="Number Base Converter – Binary, Octal, Decimal, Hex"
      tagline="Convert integers between binary, octal, decimal, hex and any base from 2 to 36, exactly"
      metaDescription="Convert numbers between binary, octal, decimal, hexadecimal and any base 2–36 with arbitrary precision. Shows bit length and two's-complement representations for 8, 16, 32 and 64 bits."
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">Common bases.</strong> Binary (2) is how computers store data, octal (8) shows up in Unix permissions, and hex (16) writes each byte as two digits.</li>
          <li><strong className="text-text">Arbitrary precision.</strong> Numbers are BigInt, so 64-bit IDs and other huge integers convert exactly, without JavaScript’s rounding above 2⁵³.</li>
          <li><strong className="text-text">Two’s complement.</strong> Signed integers store negatives as 2ⁿ + value; the same 8-bit pattern reads as -1 signed and 255 unsigned.</li>
        </ul>
      }
    >
      <Panel
        title={<label htmlFor="base-input">Number</label>}
        className="mb-4"
        bodyClassName="p-3 space-y-3"
        footer={
          value !== null ? (
            <span className="flex flex-wrap gap-1.5" role="status">
              <Badge tone="primary">Read as base {'base' in parsed ? parsed.base : ''}</Badge>
              <Badge>{bits} bits</Badge>
              <Badge>{bytes} byte{bytes > 1 ? 's' : ''}</Badge>
              {codePoint !== null && codePoint >= 32 && (
                <Badge>U+{codePoint.toString(16).toUpperCase().padStart(4, '0')} <span className="font-normal text-text">{String.fromCodePoint(codePoint)}</span></Badge>
              )}
            </span>
          ) : undefined
        }
      >
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            id="base-input"
            value={o.n}
            onChange={(e) => setO({ n: e.target.value })}
            placeholder="e.g. 255, 0xff, 0b1010, -42"
            spellCheck={false}
            autoComplete="off"
            className={`${fieldClass} font-mono text-base`}
          />
          <select aria-label="Input base" value={o.base} onChange={(e) => setO({ base: e.target.value })} className={`${fieldClass} text-sm pr-8`}>
            {baseOptions.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-4">
          <Checkbox checked={o.upper} onChange={(v) => setO({ upper: v })} label="Uppercase letters" className="text-xs" />
          <Checkbox checked={o.group} onChange={(v) => setO({ group: v })} label="Group digits" className="text-xs" />
        </div>
      </Panel>

      {'error' in parsed ? (
        <ErrorNotice title="Not a number in that base">{parsed.error}</ErrorNotice>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 items-start">
          <Panel title="Conversions">
            <ResultRows
              labelWidth="sm:w-28"
              rows={[
                { label: 'Binary', value: fmt(2, 4), display: withPrefix(fmt(2, 4), '0b') },
                { label: 'Octal', value: fmt(8, 3), display: withPrefix(fmt(8, 3), '0o') },
                { label: 'Decimal', value: fmt(10, 3, ',') },
                { label: 'Hexadecimal', value: fmt(16, 4), display: withPrefix(fmt(16, 4), '0x') },
                {
                  label: (
                    <select aria-label="Custom base" value={o.to} onChange={(e) => setO({ to: Number(e.target.value) })} className="h-7 pl-1.5 pr-6 rounded-md bg-surface-alt border border-border-strong text-xs text-text focus:outline-none focus:border-primary">
                      {Array.from({ length: 35 }, (_, i) => i + 2).map((b) => <option key={b} value={b}>Base {b}</option>)}
                    </select>
                  ),
                  value: fmt(o.to, 0),
                },
              ]}
            />
          </Panel>

          <Panel
            title="Two’s complement"
            actions={<SegmentedControl ariaLabel="Width" options={['8', '16', '32', '64'].map((w) => ({ id: w, label: `${w}-bit` }))} value={o.width} onChange={(v) => setO({ width: v as typeof o.width })} />}
          >
            {value === null ? null : twos === null ? (
              <p className="text-sm text-text-muted">{formatInteger(value, 10)} does not fit in {width} bits.</p>
            ) : (
              <ResultRows
                labelWidth="sm:w-28"
                rows={[
                  { label: 'Bit pattern', value: twos.toString(2).padStart(width, '0').replace(/(.{4})(?=.)/g, '$1 ') },
                  { label: 'Hex', value: hexCase(twos.toString(16).padStart(width / 4, '0')), display: withPrefix(hexCase(twos.toString(16).padStart(width / 4, '0')), '0x') },
                  { label: 'As unsigned', value: formatInteger(twos, 10) },
                  { label: 'As signed', value: formatInteger(fromTwosComplement(twos, width), 10) },
                ]}
              />
            )}
          </Panel>
        </div>
      )}
    </ToolLayout>
  );
}
