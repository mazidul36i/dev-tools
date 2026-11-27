import { useMemo } from 'react';
import ToolLayout from '@components/layout/ToolLayout';
import Badge from '@components/ui/Badge';
import CodeBlock from '@components/ui/CodeBlock';
import { ErrorNotice, Panel, ResultRows } from '@components/workspace';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import {
  ipv4Info, ipv6Info, parseAddressInput, parseIPv4, rangeToCidrs, splitSubnets,
} from '@lib/cidr-utils';

const EXAMPLES = ['192.168.1.130/26', '10.0.0.0 255.255.0.0', '172.16.5.4/20', '2001:db8:abcd:12::1/48'];

function errorText(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

const schema = {
  ip: opt.str(EXAMPLES[0], 100),
  split: opt.num(28, { min: 0, max: 32 }),
  from: opt.str('10.0.0.5', 50),
  to: opt.str('10.0.0.20', 50),
};

const fieldClass =
  'w-full h-9 px-2.5 rounded-md bg-surface-alt border border-border-strong font-mono text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25';

export default function CidrCalculatorPage() {
  const [o, setO] = useUrlOptions(schema);
  const input = o.ip;

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
  const effectiveSplit = v?.version === 4 ? Math.max(v.prefix, o.split) : 0;
  const split = useMemo(
    () => (v?.version === 4 ? splitSubnets(v.address, v.prefix, effectiveSplit) : null),
    [v, effectiveSplit],
  );

  const range = useMemo(() => {
    try {
      return { cidrs: rangeToCidrs(parseIPv4(o.from), parseIPv4(o.to)) };
    } catch (e) {
      return { error: errorText(e) };
    }
  }, [o.from, o.to]);

  return (
    <ToolLayout
      seoTitle="Subnet Calculator – IPv4 & IPv6 CIDR, Netmask and Host Range"
      tagline="Network, broadcast, host range and netmask for IPv4 and IPv6 CIDR blocks"
      metaDescription="Calculate IPv4 and IPv6 subnets: network and broadcast address, usable host range, netmask, wildcard mask and address count. Split networks into subnets and convert IP ranges to CIDR blocks."
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">Prefix length</strong> is how many leading bits identify the network. /24 leaves 8 host bits: 256 addresses, 254 usable.</li>
          <li><strong className="text-text">Private ranges.</strong> 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16 (RFC 1918); 100.64.0.0/10 is carrier-grade NAT; IPv6 uses fc00::/7.</li>
          <li><strong className="text-text">Small networks.</strong> /31 has two usable addresses and no broadcast (RFC 3021); /32 is a single host. IPv6 subnets are normally /64.</li>
        </ul>
      }
    >
      <Panel
        title={<label htmlFor="cidr-input">IP address with prefix or netmask</label>}
        className="mb-4"
        bodyClassName="p-4 space-y-3"
        footer={
          info4 ? (
            <span className="flex flex-wrap gap-1.5"><Badge tone="primary">IPv4 /{info4.prefix}</Badge><Badge>{info4.scope}</Badge><Badge>Class {info4.ipClass}</Badge></span>
          ) : info6 ? (
            <span className="flex flex-wrap gap-1.5"><Badge tone="primary">IPv6 /{info6.prefix}</Badge><Badge>{info6.scope}</Badge></span>
          ) : undefined
        }
      >
        <input
          id="cidr-input"
          value={input}
          onChange={(e) => setO({ ip: e.target.value })}
          placeholder="192.168.1.0/24, 10.0.0.1 255.0.0.0 or 2001:db8::/32"
          spellCheck={false}
          className={`${fieldClass} h-10! text-base!`}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-text-muted">Examples</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => setO({ ip: ex })} className="h-7 px-2 rounded-md text-xs font-mono border border-border bg-surface-alt text-text-secondary hover:border-border-strong hover:text-text focus-ring">
              {ex}
            </button>
          ))}
        </div>
        {parsed.error && <ErrorNotice title="Not a valid address">{parsed.error}</ErrorNotice>}
      </Panel>

      {info4 && (
        <div className="grid gap-4 lg:grid-cols-2 mb-4 items-start">
          <Panel title="Network">
            <ResultRows
              rows={[
                { label: 'Network', value: `${info4.network}/${info4.prefix}` },
                { label: 'Netmask', value: info4.netmask },
                { label: 'Wildcard mask', value: info4.wildcard },
                { label: 'Broadcast', value: info4.broadcast },
                { label: 'Host range', value: `${info4.firstHost} – ${info4.lastHost}` },
                { label: 'Usable hosts', value: info4.usableHosts.toLocaleString() },
                { label: 'Total addresses', value: info4.totalAddresses.toLocaleString() },
              ]}
            />
          </Panel>
          <Panel title="Representations">
            <ResultRows
              rows={[
                { label: 'Address (binary)', value: info4.binaryAddress },
                { label: 'Mask (binary)', value: info4.binaryMask },
                { label: 'Hex', value: info4.hex },
                { label: 'Integer', value: String(info4.integer) },
                { label: 'Reverse DNS', value: info4.reverse },
              ]}
            />
          </Panel>
        </div>
      )}

      {info6 && (
        <Panel title="Network" className="mb-4">
          <ResultRows
            rows={[
              { label: 'Address', value: info6.address },
              { label: 'Expanded', value: info6.expanded },
              { label: 'Network', value: `${info6.network}/${info6.prefix}` },
              { label: 'Last address', value: info6.lastAddress },
              { label: 'Addresses', value: info6.prefix >= 64 ? info6.totalAddresses.toLocaleString() : `2^${128 - info6.prefix}` },
              ...(info6.prefix <= 64 ? [{ label: '/64 subnets', value: `2^${64 - info6.prefix} (${(1n << BigInt(64 - info6.prefix)).toLocaleString()})` }] : []),
            ]}
          />
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Panel title="Split into subnets" bodyClassName="p-4 space-y-3">
          {v?.version === 4 ? (
            <>
              <div>
                <label htmlFor="split-prefix" className="block mb-1.5 text-xs font-medium text-text-secondary">Split {info4!.network}/{v.prefix} into</label>
                <select id="split-prefix" value={effectiveSplit} onChange={(e) => setO({ split: Number(e.target.value) })} className={`${fieldClass} pr-8 font-sans`}>
                  {Array.from({ length: 33 - v.prefix }, (_, i) => v.prefix + i).map((p) => (
                    <option key={p} value={p}>/{p} · {(2 ** (p - v.prefix)).toLocaleString()} subnet{p === v.prefix ? '' : 's'} of {(2 ** (32 - p)).toLocaleString()} addresses</option>
                  ))}
                </select>
              </div>
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
        </Panel>

        <Panel title="IP range → CIDR blocks" bodyClassName="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="range-start" className="block mb-1.5 text-xs font-medium text-text-secondary">First address</label>
              <input id="range-start" value={o.from} onChange={(e) => setO({ from: e.target.value })} spellCheck={false} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="range-end" className="block mb-1.5 text-xs font-medium text-text-secondary">Last address</label>
              <input id="range-end" value={o.to} onChange={(e) => setO({ to: e.target.value })} spellCheck={false} className={fieldClass} />
            </div>
          </div>
          {range.error ? (
            <ErrorNotice>{range.error}</ErrorNotice>
          ) : (
            <CodeBlock title={`${range.cidrs!.length} block${range.cidrs!.length === 1 ? '' : 's'}`} code={range.cidrs!.join('\n')} preClassName="max-h-64" />
          )}
        </Panel>
      </div>
    </ToolLayout>
  );
}
