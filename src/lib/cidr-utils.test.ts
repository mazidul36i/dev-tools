import { describe, expect, it } from 'vitest';
import {
  expandIPv6, formatIPv6, ipv4Info, ipv6Info, maskToPrefix, parseAddressInput, parseIPv4, parseIPv6, rangeToCidrs, splitSubnets,
} from './cidr-utils';

describe('IPv4', () => {
  it('parses and validates addresses', () => {
    expect(parseIPv4('192.168.1.10')).toBe(0xc0a8010a);
    expect(() => parseIPv4('256.0.0.1')).toThrow();
    expect(() => parseIPv4('1.2.3')).toThrow();
    expect(maskToPrefix(parseIPv4('255.255.240.0'))).toBe(20);
    expect(() => maskToPrefix(parseIPv4('255.0.255.0'))).toThrow(/contiguous/);
  });

  it('computes subnet details', () => {
    const info = ipv4Info(parseIPv4('192.168.1.130'), 26);
    expect(info).toMatchObject({
      network: '192.168.1.128', broadcast: '192.168.1.191', netmask: '255.255.255.192', wildcard: '0.0.0.63',
      firstHost: '192.168.1.129', lastHost: '192.168.1.190', totalAddresses: 64, usableHosts: 62,
      ipClass: 'C', scope: 'Private (RFC 1918)', reverse: '130.1.168.192.in-addr.arpa',
    });
    expect(ipv4Info(parseIPv4('10.0.0.0'), 31)).toMatchObject({ usableHosts: 2, firstHost: '10.0.0.0', lastHost: '10.0.0.1' });
    expect(ipv4Info(parseIPv4('8.8.8.8'), 32)).toMatchObject({ usableHosts: 1, scope: 'Public' });
    expect(ipv4Info(parseIPv4('100.70.1.1'), 32).scope).toMatch(/Carrier-grade/);
    expect(ipv4Info(parseIPv4('0.0.0.0'), 0).totalAddresses).toBe(2 ** 32);
  });

  it('splits subnets and converts ranges', () => {
    expect(splitSubnets(parseIPv4('10.0.0.0'), 24, 26).cidrs).toEqual(['10.0.0.0/26', '10.0.0.64/26', '10.0.0.128/26', '10.0.0.192/26']);
    expect(rangeToCidrs(parseIPv4('10.0.0.5'), parseIPv4('10.0.0.20'))).toEqual(['10.0.0.5/32', '10.0.0.6/31', '10.0.0.8/29', '10.0.0.16/30', '10.0.0.20/32']);
    expect(rangeToCidrs(parseIPv4('0.0.0.0'), parseIPv4('255.255.255.255'))).toEqual(['0.0.0.0/0']);
  });
});

describe('IPv6', () => {
  it('parses and formats (RFC 5952)', () => {
    expect(formatIPv6(parseIPv6('2001:0DB8:0000:0000:0000:ff00:0042:8329'))).toBe('2001:db8::ff00:42:8329');
    expect(formatIPv6(parseIPv6('::1'))).toBe('::1');
    expect(formatIPv6(parseIPv6('::'))).toBe('::');
    expect(formatIPv6(parseIPv6('2001:db8:0:1:1:1:1:1'))).toBe('2001:db8:0:1:1:1:1:1');
    expect(formatIPv6(parseIPv6('::ffff:192.0.2.1'))).toBe('::ffff:c000:201');
    expect(expandIPv6(parseIPv6('fe80::1'))).toBe('fe80:0000:0000:0000:0000:0000:0000:0001');
    expect(() => parseIPv6('1::2::3')).toThrow();
    expect(() => parseIPv6('1:2:3')).toThrow();
  });

  it('computes prefix details', () => {
    const info = ipv6Info(parseIPv6('2001:db8:abcd:12::1'), 48);
    expect(info).toMatchObject({ network: '2001:db8:abcd::', lastAddress: '2001:db8:abcd:ffff:ffff:ffff:ffff:ffff', scope: 'Documentation' });
    expect(info.totalAddresses).toBe(2n ** 80n);
    expect(ipv6Info(parseIPv6('fe80::1'), 64).scope).toBe('Link-local');
  });
});

describe('parseAddressInput', () => {
  it('accepts several notations', () => {
    expect(parseAddressInput('10.1.2.3/8')).toEqual({ version: 4, address: parseIPv4('10.1.2.3'), prefix: 8 });
    expect(parseAddressInput('10.1.2.3 255.255.0.0')).toMatchObject({ prefix: 16 });
    expect(parseAddressInput('10.1.2.3')).toMatchObject({ prefix: 32 });
    expect(parseAddressInput('2001:db8::/32')).toMatchObject({ version: 6, prefix: 32 });
    expect(() => parseAddressInput('10.0.0.0/33')).toThrow();
  });
});
