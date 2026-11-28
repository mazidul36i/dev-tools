import { describe, expect, it } from 'vitest';
import { effectivePort, parseUrl, withParams } from './url-parse-utils';

describe('parseUrl', () => {
  it('splits a full URL and decodes params', () => {
    const { url, params, assumedScheme } = parseUrl('https://user:pw@api.example.com:8443/v1/items?q=hello%20world&tag=a&tag=b#top');
    expect(assumedScheme).toBe(false);
    expect(url.hostname).toBe('api.example.com');
    expect(url.port).toBe('8443');
    expect(url.pathname).toBe('/v1/items');
    expect(url.hash).toBe('#top');
    expect(params).toEqual([['q', 'hello world'], ['tag', 'a'], ['tag', 'b']]);
  });

  it('assumes https when the scheme is missing', () => {
    const r = parseUrl('example.com/a?b=1');
    expect(r.assumedScheme).toBe(true);
    expect(r.url.href).toBe('https://example.com/a?b=1');
    expect(parseUrl('//cdn.example.com/x.js').url.href).toBe('https://cdn.example.com/x.js');
  });

  it('rejects garbage', () => {
    expect(() => parseUrl('')).toThrow();
    expect(() => parseUrl('http://exa mple.com')).toThrow(/Not a valid URL/);
  });
});

describe('helpers', () => {
  it('reports default ports', () => {
    expect(effectivePort(new URL('https://a.com'))).toEqual({ port: '443', isDefault: true });
    expect(effectivePort(new URL('http://a.com:8080'))).toEqual({ port: '8080', isDefault: false });
  });

  it('rebuilds the query string, encoding values and dropping empty keys', () => {
    const url = new URL('https://a.com/p?x=1#h');
    expect(withParams(url, [['q', 'a b&c'], ['', 'ignored'], ['empty', '']])).toBe('https://a.com/p?q=a+b%26c&empty=#h');
    expect(withParams(url, [])).toBe('https://a.com/p#h');
  });
});
