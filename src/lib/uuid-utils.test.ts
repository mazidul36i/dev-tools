import { describe, expect, it } from 'vitest';
import { formatUuid, inspectUuid, uuidV4, uuidV7 } from './uuid-utils';

const SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('uuid generation', () => {
  it('produces RFC 9562 v4 values', () => {
    for (let i = 0; i < 50; i++) {
      const u = uuidV4();
      expect(u).toMatch(SHAPE);
      expect(u[14]).toBe('4');
    }
  });

  it('produces v7 values that embed the time and sort by it', () => {
    const a = uuidV7(1_700_000_000_000);
    const b = uuidV7(1_700_000_000_001);
    expect(a).toMatch(SHAPE);
    expect(a[14]).toBe('7');
    expect(a < b).toBe(true);
    expect(inspectUuid(a).timestamp?.getTime()).toBe(1_700_000_000_000);
  });
});

describe('formatting and inspection', () => {
  it('formats', () => {
    const u = '3f8a1c2d-7e4b-4a91-b6f0-8c2d5e9a1b3f';
    expect(formatUuid(u, { uppercase: true, dashes: false })).toBe('3F8A1C2D7E4B4A91B6F08C2D5E9A1B3F');
    expect(formatUuid(u, { braces: true })).toBe('{3f8a1c2d-7e4b-4a91-b6f0-8c2d5e9a1b3f}');
  });

  it('inspects version and variant in any common form', () => {
    expect(inspectUuid('{3F8A1C2D7E4B4A91B6F08C2D5E9A1B3F}')).toEqual({ version: 4, variant: 'RFC 9562' });
    expect(() => inspectUuid('nope')).toThrow(/Not a UUID/);
  });
});
