// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { decodeBase64, decodeHex, decodeHTML, decodeURL, encodeBase64, encodeHex, encodeHTML } from './encoder-utils';

describe('base64', () => {
  it('round-trips UTF-8', () => {
    expect(encodeBase64('héllo 🚀')).toBe('aMOpbGxvIPCfmoA=');
    expect(decodeBase64('aMOpbGxvIPCfmoA=')).toBe('héllo 🚀');
  });

  it('supports URL-safe and unpadded output, and decodes either form', () => {
    expect(encodeBase64('??>', true, true)).toBe('Pz8-');
    expect(decodeBase64('Pz8-')).toBe('??>');
    expect(decodeBase64('aGk')).toBe('hi');
  });

  it('handles large input without overflowing the stack', () => {
    const big = 'a'.repeat(300_000);
    expect(decodeBase64(encodeBase64(big))).toBe(big);
  });

  it('explains invalid input', () => {
    expect(() => decodeBase64('***')).toThrow(/Not valid Base64/);
  });
});

describe('hex', () => {
  it('pads every byte to two digits and uses UTF-8', () => {
    expect(encodeHex('\n')).toBe('0a');
    expect(encodeHex('é', true, true)).toBe('0xC3A9');
  });

  it('decodes with or without separators and prefix', () => {
    expect(decodeHex('0x48656c6c6f')).toBe('Hello');
    expect(decodeHex('48 65 6C 6C 6F')).toBe('Hello');
    expect(decodeHex('c3a9')).toBe('é');
  });

  it('rejects odd lengths and bad digits', () => {
    expect(() => decodeHex('abc')).toThrow(/even/);
    expect(() => decodeHex('zz')).toThrow(/only 0–9/);
  });
});

describe('html', () => {
  it('escapes the five special characters', () => {
    expect(encodeHTML(`<a href="x">Tom & 'Jerry'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;');
  });

  it('decodes named and numeric entities', () => {
    expect(decodeHTML('&lt;b&gt; &amp;amp; &#169; &#x1F680; &nbsp;')).toBe('<b> &amp; © 🚀  ');
  });

  it('never executes markup from the input', () => {
    let ran = false;
    (globalThis as Record<string, unknown>).__pwned = () => { ran = true; };
    const out = decodeHTML('<img src=x onerror="__pwned()"></textarea><script>__pwned()</script>');
    expect(ran).toBe(false);
    expect(out).toContain('<img src=x onerror="__pwned()">');
  });
});

describe('url', () => {
  it('reports malformed sequences clearly', () => {
    expect(() => decodeURL('%E0%A4%A', true)).toThrow(/Malformed percent-encoding/);
  });
});
