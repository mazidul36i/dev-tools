import { describe, expect, it } from 'vitest';
import { MIME_TYPES, STATUS_CODES, searchMimeTypes, searchStatusCodes } from './http-reference-data';

describe('http reference', () => {
  it('has unique, sorted status codes', () => {
    const codes = STATUS_CODES.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect([...codes].sort((a, b) => a - b)).toEqual(codes);
  });

  it('searches status codes by number, class, name and description', () => {
    expect(searchStatusCodes('404').map((s) => s.code)).toEqual([404]);
    expect(searchStatusCodes('5xx').every((s) => s.code >= 500)).toBe(true);
    expect(searchStatusCodes('4').every((s) => s.code >= 400 && s.code < 500)).toBe(true);
    expect(searchStatusCodes('rate limit').map((s) => s.code)).toEqual([429]);
    expect(searchStatusCodes('teapot')[0].code).toBe(418);
  });

  it('searches MIME types by extension and type', () => {
    expect(searchMimeTypes('.svg')[0].type).toBe('image/svg+xml');
    expect(searchMimeTypes('jpg')[0].type).toBe('image/jpeg');
    expect(searchMimeTypes('application/json').map((m) => m.type)).toContain('application/json');
    expect(searchMimeTypes('').length).toBe(MIME_TYPES.length);
  });
});
