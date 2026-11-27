import { describe, expect, it } from 'vitest';
import { decodeJwt, getTokenStatus, secretBytes, signHmacJwt, verifyHmacJwt, verifyJwt } from './jwt-utils';
import { formatDuration, formatRelative } from './time-utils';

const secret = secretBytes('top-secret', false);

describe('decodeJwt', () => {
  it('decodes header and payload, including unicode and a Bearer prefix', async () => {
    const token = await signHmacJwt({ sub: '42', name: 'Zoë ✓' }, secret);
    const decoded = decodeJwt(`Bearer ${token}`);
    expect(decoded.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(decoded.payload).toEqual({ sub: '42', name: 'Zoë ✓' });
    expect(decoded.parts).toHaveLength(3);
  });

  it('explains malformed tokens', () => {
    expect(() => decodeJwt('')).toThrow(/Paste/);
    expect(() => decodeJwt('a.b')).toThrow(/3 dot-separated parts/);
    expect(() => decodeJwt('a.b.c.d.e')).toThrow(/JWE/);
    expect(() => decodeJwt('!!!.e30.x')).toThrow(/header is not valid/);
    expect(() => decodeJwt('e30.WzFd.x')).toThrow(/payload must be a JSON object/);
  });
});

describe('verifyHmacJwt', () => {
  it.each(['HS256', 'HS384', 'HS512'] as const)('verifies %s', async (alg) => {
    const token = await signHmacJwt({ a: 1 }, secret, alg);
    expect(await verifyHmacJwt(token, secret, alg)).toBe(true);
    expect(await verifyHmacJwt(token, secretBytes('wrong', false), alg)).toBe(false);
  });

  it('accepts base64 secrets', async () => {
    const raw = secretBytes('c2VjcmV0', true);
    expect(new TextDecoder().decode(raw)).toBe('secret');
  });
});

describe('getTokenStatus', () => {
  const now = 1_700_000_000_000;
  it('detects expired, not-yet-valid and valid tokens', () => {
    expect(getTokenStatus({ exp: now / 1000 - 1 }, now).state).toBe('expired');
    expect(getTokenStatus({ nbf: now / 1000 + 60 }, now).state).toBe('not-yet-valid');
    expect(getTokenStatus({ exp: now / 1000 + 60 }, now)).toEqual({ state: 'valid', expiresAt: new Date(now + 60_000) });
    expect(getTokenStatus({}, now)).toEqual({ state: 'valid', expiresAt: undefined });
  });
});

describe('time-utils', () => {
  it('formats relative times and durations', () => {
    expect(formatRelative(3 * 3600_000, 0)).toBe('in 3 hours');
    expect(formatRelative(0, 5 * 60_000)).toBe('5 minutes ago');
    expect(formatDuration(90_061_000)).toBe('1d 1h 1m');
    expect(formatDuration(5_000)).toBe('5s');
  });
});

describe('verifyJwt with public keys', () => {
  const cases = [
    ['RS256', { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, 'RSASSA-PKCS1-v1_5'],
    ['PS256', { name: 'RSA-PSS', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, { name: 'RSA-PSS', saltLength: 32 }],
    ['ES256', { name: 'ECDSA', namedCurve: 'P-256' }, { name: 'ECDSA', hash: 'SHA-256' }],
  ] as const;

  it.each(cases)('verifies %s with PEM and JWK keys', async (alg, genParams, signParams) => {
    const pair = (await crypto.subtle.generateKey(genParams, true, ['sign', 'verify'])) as CryptoKeyPair;
    const enc = new TextEncoder();
    const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const signingInput = `${b64url(JSON.stringify({ alg, typ: 'JWT' }))}.${b64url(JSON.stringify({ sub: 'x' }))}`;
    const sig = new Uint8Array(await crypto.subtle.sign(signParams, pair.privateKey, enc.encode(signingInput)));
    const token = `${signingInput}.${b64url(String.fromCharCode(...sig))}`;

    const spki = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey));
    const pem = `-----BEGIN PUBLIC KEY-----\n${btoa(String.fromCharCode(...spki))}\n-----END PUBLIC KEY-----`;
    const jwk = JSON.stringify(await crypto.subtle.exportKey('jwk', pair.publicKey));

    expect(await verifyJwt(token, pem)).toBe(true);
    expect(await verifyJwt(token, jwk)).toBe(true);
    const tampered = token.replace(/\.[^.]+\./, `.${b64url(JSON.stringify({ sub: 'y' }))}.`);
    expect(await verifyJwt(tampered, pem)).toBe(false);
  });

  it('rejects unsigned tokens and unsupported keys', async () => {
    const none = `${btoa('{"alg":"none"}')}.${btoa('{}')}.`;
    await expect(verifyJwt(none, 'x')).rejects.toThrow(/unsigned/);
    const rs = `${btoa('{"alg":"RS256"}')}.${btoa('{}')}.abc`;
    await expect(verifyJwt(rs, '-----BEGIN RSA PUBLIC KEY-----\nAA==\n-----END RSA PUBLIC KEY-----')).rejects.toThrow(/PKCS#1/);
  });
});
