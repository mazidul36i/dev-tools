import { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import CopyButton from '@components/ui/CopyButton';
import Badge from '@components/ui/Badge';
import CodeBlock from '@components/ui/CodeBlock';
import { Field, SelectInput, TextInput } from '@components/ui/Input';
import {
  ipv4Info, ipv6Info, parseAddressInput, parseIPv4, rangeToCidrs, splitSubnets,
} from '@lib/cidr-utils';

const EXAMPLES = ['192.168.1.130/26', '10.0.0.0 255.255.0.0', '172.16.5.4/20', '2001:db8:abcd:12::1/48'];

function Row({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      <span className="w-36 shrink-0 text-sm text-text-muted">{label}</span>
      <span className={`flex-1 min-w-0 text-sm text-text break-all ${mono ? 'font-mono' : ''}`}>{value}</span>
      <CopyButton text={value} label="" size="sm" className="px-2! shrink-0" />
    </div>
  );
}

function errorText(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

export default function CidrCalculatorPage() {
  const [input, setInput] = useState(EXAMPLES[0]);
  const [splitPrefix, setSplitPrefix] = useState('28');
  const [rangeStart, setRangeStart] = useState('10.0.0.5');
  const [rangeEnd, setRangeEnd] = useState('10.0.0.20');

  const parsed = useMemo(() => {
    try {
      return { value: parseAddressInput(input) };
    } catch (e) {
      return { error: errorText(e) };
    }
  }, [input]);

  const v = parsed.value;
  const info4 = v?.version === 4 ? ipv4Info(v.address, v.prefix) : null;
  const info6 = v?.version === 6 ? ipv6Info(v.address, v.prefix) : null;

  // The chosen split size can't be shorter than the network's own prefix.
  const effectiveSplit = v?.version === 4 ? Math.max(v.prefix, Number(splitPrefix)) : 0;
  const split = useMemo(
    () => (v?.version === 4 ? splitSubnets(v.address, v.prefix, effectiveSplit) : null),
    [v, effectiveSplit],
  );

  const range = useMemo(() => {
    try {
      return { cidrs: rangeToCidrs(parseIPv4(rangeStart), parseIPv4(rangeEnd)) };
    } catch (e) {
      return { error: errorText(e) };
    }
  }, [rangeStart, rangeEnd]);

  return (
    <ToolLayout
      title="Subnet / CIDR Calculator"
      seoTitle="Subnet Calculator – IPv4 & IPv6 CIDR, Netmask and Host Range"
      tagline="Network, broadcast, host range and netmask for IPv4 and IPv6 CIDR blocks"
      metaDescription="Calculate IPv4 and IPv6 subnets: network and broadcast address, usable host range, netmask, wildcard mask and address count. Split networks into subnets and convert IP ranges to CIDR blocks."
    >
      <Card hover={false}>
        <div className="p-6 space-y-4">
          <Field label="IP address with prefix or netmask" htmlFor="cidr-input">
            <TextInput
              id="cidr-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="192.168.1.0/24, 10.0.0.1 255.0.0.0 or 2001:db8::/32"
              className="font-mono text-lg!"
              spellCheck={false}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setInput(ex)} className="px-2.5 py-1 rounded-md text-xs font-mono border border-border bg-surface-alt text-text-secondary hover:border-primary/40">
                {ex}
              </button>
            ))}
          </div>

          {parsed.error && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-error/30 bg-error/5 text-error text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" /> {parsed.error}
            </div>
          )}

          {info4 && (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge tone="primary">IPv4 /{info4.prefix}</Badge>
                <Badge>{info4.scope}</Badge>
                <Badge>Class {info4.ipClass}</Badge>
              </div>
              <div className="grid lg:grid-cols-2 gap-x-8">
                <div>
                  <Row label="Network" value={`${info4.network}/${info4.prefix}`} />
                  <Row label="Netmask" value={info4.netmask} />
                  <Row label="Wildcard mask" value={info4.wildcard} />
                  <Row label="Broadcast" value={info4.broadcast} />
                  <Row label="Host range" value={`${info4.firstHost} – ${info4.lastHost}`} />
                  <Row label="Usable hosts" value={info4.usableHosts.toLocaleString()} />
                  <Row label="Total addresses" value={info4.totalAddresses.toLocaleString()} />
                </div>
                <div>
                  <Row label="Address (binary)" value={info4.binaryAddress} />
                  <Row label="Mask (binary)" value={info4.binaryMask} />
                  <Row label="Hex" value={info4.hex} />
                  <Row label="Integer" value={String(info4.integer)} />
                  <Row label="Reverse DNS" value={info4.reverse} />
                </div>
              </div>
            </>
          )}

          {info6 && (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge tone="primary">IPv6 /{info6.prefix}</Badge>
                <Badge>{info6.scope}</Badge>
              </div>
              <div>
                <Row label="Address" value={info6.address} />
                <Row label="Expanded" value={info6.expanded} />
                <Row label="Network" value={`${info6.network}/${info6.prefix}`} />
                <Row label="Last address" value={info6.lastAddress} />
                <Row label="Addresses" value={info6.prefix >= 64 ? info6.totalAddresses.toLocaleString() : `2^${128 - info6.prefix}`} />
                {info6.prefix <= 64 && <Row label="/64 subnets" value={`2^${64 - info6.prefix} (${(1n << BigInt(64 - info6.prefix)).toLocaleString()})`} />}
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-3">
        <Card hover={false} className="mb-0! lg:mb-3!">
          <div className="p-6 space-y-4">
            <h2 className="font-semibold text-text">Split into subnets</h2>
            {v?.version === 4 ? (
              <>
                <Field label={`Split ${info4!.network}/${v.prefix} into`} htmlFor="split-prefix">
                  <SelectInput
                    id="split-prefix"
                    value={String(effectiveSplit)}
                    onChange={(e) => setSplitPrefix(e.target.value)}
                    options={Array.from({ length: 33 - v.prefix }, (_, i) => v.prefix + i).map((p) => ({
                      value: String(p),
                      label: `/${p} — ${(2 ** (p - v.prefix)).toLocaleString()} subnet${p === v.prefix ? '' : 's'} of ${(2 ** (32 - p)).toLocaleString()} addresses`,
                    }))}
                  />
                </Field>
                {split && split.total > 0 ? (
                  <CodeBlock
                    title={split.total > split.cidrs.length ? `First ${split.cidrs.length} of ${split.total.toLocaleString()}` : `${split.total} subnets`}
                    code={split.cidrs.join('\n')}
                    preClassName="max-h-64"
                  />
                ) : (
                  <p className="text-sm text-text-muted">Choose a prefix of /{v.prefix} or longer.</p>
                )}
              </>
            ) : (
              <p className="text-sm text-text-muted">Enter an IPv4 network above to split it.</p>
            )}
          </div>
        </Card>

        <Card hover={false}>
          <div className="p-6 space-y-4">
            <h2 className="font-semibold text-text">IP range → CIDR blocks</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First address" htmlFor="range-start">
                <TextInput id="range-start" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="font-mono" />
              </Field>
              <Field label="Last address" htmlFor="range-end">
                <TextInput id="range-end" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="font-mono" />
              </Field>
            </div>
            {range.error ? (
              <p className="text-sm text-error">{range.error}</p>
            ) : (
              <CodeBlock title={`${range.cidrs!.length} block${range.cidrs!.length === 1 ? '' : 's'}`} code={range.cidrs!.join('\n')} preClassName="max-h-64" />
            )}
          </div>
        </Card>
      </div>

      <InfoCard title="About CIDR Notation">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { t: 'Prefix length', d: 'The number after the slash is how many leading bits identify the network. /24 leaves 8 bits for hosts: 256 addresses, 254 usable after the network and broadcast addresses.' },
            { t: 'Private ranges', d: '10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16 (RFC 1918) are for internal networks. 100.64.0.0/10 is carrier-grade NAT; IPv6 uses fc00::/7 for unique local addresses.' },
            { t: 'Point-to-point links', d: '/31 networks have two usable addresses and no broadcast (RFC 3021); /32 identifies a single host. IPv6 subnets are normally /64.' },
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
