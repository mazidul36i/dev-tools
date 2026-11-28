import { describe, expect, it } from 'vitest';
import {
  decodeShare, defaults, encodeShare, MAX_SHARE_LENGTH, opt, parseOptions, serializeOptions, shareTokenFromHash,
} from './url-state';

const schema = {
  mode: opt.oneOf(['format', 'minify'] as const, 'format'),
  indent: opt.num(2, { min: 0, max: 8 }),
  sort: opt.bool(false),
  name: opt.str('Root', 20),
};

describe('option schemas', () => {
  it('uses defaults when the URL is empty', () => {
    expect(parseOptions(schema, new URLSearchParams())).toEqual(defaults(schema));
  });

  it('parses valid values', () => {
    const v = parseOptions(schema, new URLSearchParams('mode=minify&indent=4&sort=1&name=User'));
    expect(v).toEqual({ mode: 'minify', indent: 4, sort: true, name: 'User' });
  });

  it('rejects invalid values field by field', () => {
    const v = parseOptions(schema, new URLSearchParams('mode=evil&indent=99&sort=maybe&name=' + 'x'.repeat(21)));
    expect(v).toEqual(defaults(schema));
    expect(parseOptions(schema, new URLSearchParams('indent=2.5')).indent).toBe(2);
  });

  it('falls back to stored values, but the URL wins', () => {
    expect(parseOptions(schema, new URLSearchParams(), { indent: 4 }).indent).toBe(4);
    expect(parseOptions(schema, new URLSearchParams('indent=8'), { indent: 4 }).indent).toBe(8);
    expect(parseOptions(schema, new URLSearchParams(), { indent: 'junk' }).indent).toBe(2);
  });

  it('omits defaults and keeps unrelated params when serialising', () => {
    const base = new URLSearchParams('tab=x&indent=4');
    const out = serializeOptions(schema, { ...defaults(schema), sort: true }, base);
    expect(out.toString()).toBe('tab=x&sort=1');
  });

  it('round-trips', () => {
    const values = { mode: 'minify' as const, indent: 0, sort: true, name: 'A b&c' };
    expect(parseOptions(schema, serializeOptions(schema, values))).toEqual(values);
  });
});

describe('share payloads', () => {
  it('round-trips unicode and multiple fields', async () => {
    const data = { input: '{"emoji":"🚀","text":"naïve — ✓"}\n\tindent', other: '' };
    const token = await encodeShare(data);
    expect(token).toMatch(/^1\.[A-Za-z0-9_-]+$/);
    expect(await decodeShare(token)).toEqual(data);
  });

  it('compresses repetitive input well below the cap', async () => {
    const token = await encodeShare({ input: JSON.stringify(Array.from({ length: 500 }, (_, i) => ({ id: i, name: 'item' }))) });
    expect(token.length).toBeLessThan(MAX_SHARE_LENGTH);
  });

  it('rejects malformed tokens', async () => {
    expect(await decodeShare('')).toBeNull();
    expect(await decodeShare('2.abc')).toBeNull();
    expect(await decodeShare('1.!!!')).toBeNull();
    expect(await decodeShare('1.' + (await encodeShare({ a: 'b' })).slice(2, 6))).toBeNull();
  });

  it('drops non-string fields', async () => {
    // A hand-crafted payload with a number must not reach a text input as a number.
    const { deflate } = await import('pako');
    const body = Buffer.from(deflate(new TextEncoder().encode('{"a":"ok","n":3,"o":{"x":1}}'))).toString('base64url');
    expect(await decodeShare(`1.${body}`)).toEqual({ a: 'ok' });
  });

  it('reads the token from a hash', () => {
    expect(shareTokenFromHash('#s=1.abc')).toBe('1.abc');
    expect(shareTokenFromHash('#other')).toBeNull();
    expect(shareTokenFromHash('')).toBeNull();
  });
});
