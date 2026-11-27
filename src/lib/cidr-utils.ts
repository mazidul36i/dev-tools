// ── IPv4 ───────────────────────────────────────────────────────────────

export function parseIPv4(text: string): number {
  const parts = text.trim().split('.');
  if (parts.length !== 4) throw new Error(`"${text}" is not an IPv4 address (expected 4 numbers separated by dots).`);
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p) || Number(p) > 255) throw new Error(`"${p}" is not a valid IPv4 octet (0–255).`);
    n = n * 256 + Number(p);
  }
  return n >>> 0;
}

export function formatIPv4(n: number): string {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
}

export function prefixToMask(prefix: number): number {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

export function maskToPrefix(mask: number): number {
  const inverted = ~mask >>> 0;
  if ((inverted & (inverted + 1)) !== 0) throw new Error('Netmask bits must be contiguous (e.g. 255.255.255.0).');
  return 32 - Math.log2(inverted + 1);
}

export interface IPv4Info {
  address: string;
  prefix: number;
  netmask: string;
  wildcard: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  totalAddresses: number;
  usableHosts: number;
  ipClass: string;
  scope: string;
  binaryAddress: string;
  binaryMask: string;
  hex: string;
  integer: number;
  /** In-addr.arpa reverse DNS name. */
  reverse: string;
}

const IPV4_SCOPES: [string, number, string][] = [
  ['0.0.0.0', 8, '"This" network'],
  ['10.0.0.0', 8, 'Private (RFC 1918)'],
  ['100.64.0.0', 10, 'Carrier-grade NAT (RFC 6598)'],
  ['127.0.0.0', 8, 'Loopback'],
  ['169.254.0.0', 16, 'Link-local'],
  ['172.16.0.0', 12, 'Private (RFC 1918)'],
  ['192.0.2.0', 24, 'Documentation (TEST-NET-1)'],
  ['192.168.0.0', 16, 'Private (RFC 1918)'],
  ['198.18.0.0', 15, 'Benchmarking'],
  ['198.51.100.0', 24, 'Documentation (TEST-NET-2)'],
  ['203.0.113.0', 24, 'Documentation (TEST-NET-3)'],
  ['224.0.0.0', 4, 'Multicast'],
  ['240.0.0.0', 4, 'Reserved'],
  ['255.255.255.255', 32, 'Limited broadcast'],
];

function ipv4Scope(n: number): string {
  let best: [number, string] | null = null;
  for (const [net, p, label] of IPV4_SCOPES) {
    const mask = prefixToMask(p);
    if ((n & mask) >>> 0 === parseIPv4(net) && (!best || p > best[0])) best = [p, label];
  }
  return best?.[1] ?? 'Public';
}

function ipv4Class(n: number): string {
  const first = n >>> 24;
  if (first < 128) return 'A';
  if (first < 192) return 'B';
  if (first < 224) return 'C';
  if (first < 240) return 'D (multicast)';
  return 'E (reserved)';
}

const bin32 = (n: number) => n.toString(2).padStart(32, '0').replace(/(.{8})(?=.)/g, '$1.');

export function ipv4Info(address: number, prefix: number): IPv4Info {
  const mask = prefixToMask(prefix);
  const network = (address & mask) >>> 0;
  const broadcast = (network | ~mask) >>> 0;
  const total = 2 ** (32 - prefix);
  // RFC 3021: /31 links have two usable addresses; /32 is a single host.
  const usable = prefix >= 31 ? total : total - 2;
  const first = prefix >= 31 ? network : network + 1;
  const last = prefix >= 31 ? broadcast : broadcast - 1;
  return {
    address: formatIPv4(address),
    prefix,
    netmask: formatIPv4(mask),
    wildcard: formatIPv4(~mask >>> 0),
    network: formatIPv4(network),
    broadcast: formatIPv4(broadcast),
    firstHost: formatIPv4(first),
    lastHost: formatIPv4(last),
    totalAddresses: total,
    usableHosts: usable,
    ipClass: ipv4Class(address),
    scope: ipv4Scope(address),
    binaryAddress: bin32(address),
    binaryMask: bin32(mask),
    hex: '0x' + address.toString(16).toUpperCase().padStart(8, '0'),
    integer: address,
    reverse: formatIPv4(address).split('.').reverse().join('.') + '.in-addr.arpa',
  };
}

/** Splits a network into subnets of `newPrefix` (at most `limit`). */
export function splitSubnets(address: number, prefix: number, newPrefix: number, limit = 256): { cidrs: string[]; total: number } {
  if (newPrefix < prefix || newPrefix > 32) return { cidrs: [], total: 0 };
  const network = (address & prefixToMask(prefix)) >>> 0;
  const total = 2 ** (newPrefix - prefix);
  const size = 2 ** (32 - newPrefix);
  const cidrs = Array.from({ length: Math.min(total, limit) }, (_, i) => `${formatIPv4(network + i * size)}/${newPrefix}`);
  return { cidrs, total };
}

/** Smallest list of CIDR blocks that exactly covers start..end (inclusive). */
export function rangeToCidrs(start: number, end: number): string[] {
  if (start > end) [start, end] = [end, start];
  const out: string[] = [];
  let cur = start;
  while (cur <= end) {
    // Largest block aligned at `cur` (lowest set bit)...
    let block = cur === 0 ? 2 ** 32 : (cur & -cur) >>> 0;
    // ...shrunk until it does not overshoot `end`.
    while (cur + block - 1 > end) block /= 2;
    out.push(`${formatIPv4(cur)}/${32 - Math.log2(block)}`);
    cur += block;
    if (cur > 0xffffffff) break;
  }
  return out;
}

// ── IPv6 ───────────────────────────────────────────────────────────────

export function parseIPv6(text: string): bigint {
  let s = text.trim().toLowerCase().replace(/^\[|\]$/g, '').replace(/%.*$/, '');
  // Embedded IPv4 (::ffff:192.0.2.1)
  const v4 = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) {
    const n = parseIPv4(v4[1]);
    s = s.slice(0, -v4[1].length) + `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const halves = s.split('::');
  if (halves.length > 2) throw new Error('An IPv6 address can contain "::" only once.');
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? head.length !== 8 : missing < 1) throw new Error('An IPv6 address has 8 groups of hex digits.');
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail];
  let value = 0n;
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(g)) throw new Error(`"${g}" is not a valid IPv6 group.`);
    value = (value << 16n) | BigInt(parseInt(g, 16));
  }
  return value;
}

function groups6(value: bigint): string[] {
  return Array.from({ length: 8 }, (_, i) => ((value >> BigInt(16 * (7 - i))) & 0xffffn).toString(16));
}

/** RFC 5952 canonical text form. */
export function formatIPv6(value: bigint): string {
  const g = groups6(value);
  let bestStart = -1;
  let bestLen = 0;
  for (let i = 0; i < 8;) {
    if (g[i] !== '0') { i++; continue; }
    let j = i;
    while (j < 8 && g[j] === '0') j++;
    if (j - i > bestLen && j - i >= 2) { bestStart = i; bestLen = j - i; }
    i = j;
  }
  if (bestStart < 0) return g.join(':');
  return `${g.slice(0, bestStart).join(':')}::${g.slice(bestStart + bestLen).join(':')}`;
}

export function expandIPv6(value: bigint): string {
  return groups6(value).map((x) => x.padStart(4, '0')).join(':');
}

const IPV6_SCOPES: [string, number, string][] = [
  ['::', 128, 'Unspecified'],
  ['::1', 128, 'Loopback'],
  ['::ffff:0:0', 96, 'IPv4-mapped'],
  ['64:ff9b::', 96, 'IPv4/IPv6 translation'],
  ['2001:db8::', 32, 'Documentation'],
  ['2000::', 3, 'Global unicast'],
  ['fc00::', 7, 'Unique local (private)'],
  ['fe80::', 10, 'Link-local'],
  ['ff00::', 8, 'Multicast'],
];

const mask6 = (prefix: number) => (prefix === 0 ? 0n : ((1n << 128n) - 1n) ^ ((1n << BigInt(128 - prefix)) - 1n));

export interface IPv6Info {
  address: string;
  expanded: string;
  prefix: number;
  network: string;
  lastAddress: string;
  totalAddresses: bigint;
  scope: string;
}

export function ipv6Info(address: bigint, prefix: number): IPv6Info {
  const mask = mask6(prefix);
  const network = address & mask;
  const last = network | (((1n << 128n) - 1n) ^ mask);
  let scope = 'Reserved';
  let bestPrefix = -1;
  for (const [net, p, label] of IPV6_SCOPES) {
    if ((address & mask6(p)) === parseIPv6(net) && p > bestPrefix) { scope = label; bestPrefix = p; }
  }
  return {
    address: formatIPv6(address),
    expanded: expandIPv6(address),
    prefix,
    network: formatIPv6(network),
    lastAddress: formatIPv6(last),
    totalAddresses: 1n << BigInt(128 - prefix),
    scope,
  };
}

// ── Input parsing ──────────────────────────────────────────────────────

export type ParsedInput =
  | { version: 4; address: number; prefix: number }
  | { version: 6; address: bigint; prefix: number };

/** Accepts "10.0.0.1/24", "10.0.0.1 255.255.255.0", "10.0.0.1", "2001:db8::/48". */
export function parseAddressInput(text: string): ParsedInput {
  const s = text.trim();
  if (!s) throw new Error('Enter an IP address or CIDR block.');
  const [addr, rest] = s.includes('/') ? s.split('/') : s.split(/\s+/);
  if (addr.includes(':')) {
    const prefix = rest === undefined ? 128 : Number(rest);
    if (!/^\d+$/.test(rest ?? '128') || prefix > 128) throw new Error('IPv6 prefix length must be 0–128.');
    return { version: 6, address: parseIPv6(addr), prefix };
  }
  const address = parseIPv4(addr);
  if (rest === undefined) return { version: 4, address, prefix: 32 };
  if (rest.includes('.')) return { version: 4, address, prefix: maskToPrefix(parseIPv4(rest)) };
  if (!/^\d+$/.test(rest) || Number(rest) > 32) throw new Error('IPv4 prefix length must be 0–32.');
  return { version: 4, address, prefix: Number(rest) };
}
