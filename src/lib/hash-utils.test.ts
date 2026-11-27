import { describe, expect, it } from 'vitest';
import { computeHash, encodeBytes, type HashAlgorithm } from './hash-utils';

const enc = new TextEncoder();
const fox = enc.encode('The quick brown fox jumps over the lazy dog');
const hex = async (alg: HashAlgorithm, data: Uint8Array, key?: string) =>
  encodeBytes(await computeHash(alg, data, key === undefined ? undefined : enc.encode(key)), 'hex');

describe('computeHash', () => {
  it('matches MD5 test vectors', async () => {
    expect(await hex('MD5', enc.encode(''))).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(await hex('MD5', fox)).toBe('9e107d9d372bb6826bd81d3542a419d6');
    // Exercises the multi-block and padding-boundary paths.
    expect(await hex('MD5', enc.encode('a'.repeat(56)))).toBe('3b0c8ac703f828b04c6c197006d17218');
    expect(await hex('MD5', enc.encode('1234567890'.repeat(8)))).toBe('57edf4a22be3c955ac49da2e2107b67a');
  });

  it('matches SHA and CRC32 test vectors', async () => {
    expect(await hex('SHA-1', fox)).toBe('2fd4e1c67a2d28fced849ee1bb76e7391b93eb12');
    expect(await hex('SHA-256', enc.encode('abc'))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(await hex('CRC32', fox)).toBe('414fa339');
    expect(await hex('CRC32', enc.encode(''))).toBe('00000000');
  });

  it('computes HMACs', async () => {
    expect(await hex('MD5', fox, 'key')).toBe('80070713463e7749b90c2dc24911e275');
    expect(await hex('SHA-256', fox, 'key')).toBe('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8');
    await expect(computeHash('CRC32', fox, enc.encode('k'))).rejects.toThrow();
  });

  it('encodes output', () => {
    const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    expect(encodeBytes(bytes, 'HEX')).toBe('DEADBEEF');
    expect(encodeBytes(bytes, 'base64')).toBe('3q2+7w==');
  });
});
