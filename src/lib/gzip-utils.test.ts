import { describe, expect, it } from 'vitest';
import { compressGzip, decompressGzip } from './gzip-utils';

describe('gzip-utils', () => {
  it('round-trips unicode text', () => {
    const text = 'Hello, wörld 👋\n'.repeat(20);
    const compressed = compressGzip(text);
    expect(compressed.startsWith('H4sI')).toBe(true);
    expect(decompressGzip(compressed)).toBe(text);
  });
});
