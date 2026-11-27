export type JsonObject = Record<string, unknown>;

export interface DecodedJwt {
  header: JsonObject;
  payload: JsonObject;
  /** Raw base64url signature segment. */
  signature: string;
  /** The three raw segments as they appear in the token. */
  parts: [string, string, string];
}

export type HmacAlgorithm = 'HS256' | 'HS384' | 'HS512';
export const HMAC_ALGORITHMS: HmacAlgorithm[] = ['HS256', 'HS384', 'HS512'];

const HASH_FOR: Record<HmacAlgorithm, string> = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' };

export function base64UrlToBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeSegment(segment: string, name: string): JsonObject {
  let text: string;
  try {
    text = new TextDecoder().decode(base64UrlToBytes(segment));
  } catch {
    throw new Error(`The ${name} is not valid base64url.`);
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(`The ${name} is not valid JSON.`);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`The ${name} must be a JSON object.`);
  }
  return value as JsonObject;
}

/** Decodes a JWS compact token (header.payload.signature) without verifying it. */
export function decodeJwt(token: string): DecodedJwt {
  const trimmed = token.trim().replace(/^Bearer\s+/i, '');
  if (!trimmed) throw new Error('Paste a JWT to decode.');
  const parts = trimmed.split('.');
  if (parts.length === 5) throw new Error('This looks like an encrypted JWE token (5 parts); only signed JWTs can be decoded.');
  if (parts.length !== 3) throw new Error(`A JWT has 3 dot-separated parts; this one has ${parts.length}.`);
  const [h, p, s] = parts;
  return {
    header: decodeSegment(h, 'header'),
    payload: decodeSegment(p, 'payload'),
    signature: s,
    parts: [h, p, s],
  };
}

export type TokenStatus =
  | { state: 'valid'; expiresAt?: Date }
  | { state: 'expired'; expiredAt: Date }
  | { state: 'not-yet-valid'; validFrom: Date };

/** Interprets a NumericDate claim (seconds since epoch). */
export function claimDate(value: unknown): Date | null {
  return typeof value === 'number' && Number.isFinite(value) ? new Date(value * 1000) : null;
}

export function getTokenStatus(payload: JsonObject, now: number = Date.now()): TokenStatus {
  const exp = claimDate(payload.exp);
  const nbf = claimDate(payload.nbf);
  if (exp && exp.getTime() <= now) return { state: 'expired', expiredAt: exp };
  if (nbf && nbf.getTime() > now) return { state: 'not-yet-valid', validFrom: nbf };
  return { state: 'valid', expiresAt: exp ?? undefined };
}

export const CLAIM_DESCRIPTIONS: Record<string, string> = {
  iss: 'Issuer — who created and signed the token',
  sub: 'Subject — who the token is about (usually a user id)',
  aud: 'Audience — who the token is intended for',
  exp: 'Expiration time — must not be accepted after this',
  nbf: 'Not before — must not be accepted before this',
  iat: 'Issued at — when the token was created',
  jti: 'JWT ID — unique identifier of the token',
  alg: 'Algorithm used to sign the token',
  typ: 'Media type of the token',
  kid: 'Key ID — hint for which key signed the token',
  cty: 'Content type of the payload',
  scope: 'Space-separated list of granted scopes',
  azp: 'Authorized party — the client the token was issued to',
  nonce: 'Value tying the token to a client session',
  auth_time: 'When the user authenticated',
};

async function hmacKey(secret: Uint8Array, alg: HmacAlgorithm, usage: KeyUsage) {
  return crypto.subtle.importKey('raw', secret as BufferSource, { name: 'HMAC', hash: HASH_FOR[alg] }, false, [usage]);
}

export function secretBytes(secret: string, isBase64: boolean): Uint8Array {
  if (!isBase64) return new TextEncoder().encode(secret);
  try {
    return base64UrlToBytes(secret.trim());
  } catch {
    throw new Error('The secret is not valid base64.');
  }
}

/** Verifies an HS256/384/512 signature. Returns false on mismatch. */
export async function verifyHmacJwt(token: string, secret: Uint8Array, alg: HmacAlgorithm): Promise<boolean> {
  const { parts } = decodeJwt(token);
  const key = await hmacKey(secret, alg, 'verify');
  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  let sig: Uint8Array;
  try {
    sig = base64UrlToBytes(parts[2]);
  } catch {
    return false;
  }
  return crypto.subtle.verify('HMAC', key, sig as BufferSource, data);
}

/** Creates an HMAC-signed JWT — used for the sample token and in tests. */
export async function signHmacJwt(payload: JsonObject, secret: Uint8Array, alg: HmacAlgorithm = 'HS256'): Promise<string> {
  const enc = new TextEncoder();
  const header = bytesToBase64Url(enc.encode(JSON.stringify({ alg, typ: 'JWT' })));
  const body = bytesToBase64Url(enc.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret, alg, 'sign');
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`)));
  return `${header}.${body}.${bytesToBase64Url(sig)}`;
}

// ── Asymmetric (public key) verification ──────────────────────────────────

type AsymSpec = {
  importParams: RsaHashedImportParams | EcKeyImportParams;
  verifyParams: AlgorithmIdentifier | RsaPssParams | EcdsaParams;
};

const ASYMMETRIC: Record<string, AsymSpec> = {
  RS256: { importParams: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, verifyParams: 'RSASSA-PKCS1-v1_5' },
  RS384: { importParams: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-384' }, verifyParams: 'RSASSA-PKCS1-v1_5' },
  RS512: { importParams: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512' }, verifyParams: 'RSASSA-PKCS1-v1_5' },
  PS256: { importParams: { name: 'RSA-PSS', hash: 'SHA-256' }, verifyParams: { name: 'RSA-PSS', saltLength: 32 } },
  PS384: { importParams: { name: 'RSA-PSS', hash: 'SHA-384' }, verifyParams: { name: 'RSA-PSS', saltLength: 48 } },
  PS512: { importParams: { name: 'RSA-PSS', hash: 'SHA-512' }, verifyParams: { name: 'RSA-PSS', saltLength: 64 } },
  ES256: { importParams: { name: 'ECDSA', namedCurve: 'P-256' }, verifyParams: { name: 'ECDSA', hash: 'SHA-256' } },
  ES384: { importParams: { name: 'ECDSA', namedCurve: 'P-384' }, verifyParams: { name: 'ECDSA', hash: 'SHA-384' } },
  ES512: { importParams: { name: 'ECDSA', namedCurve: 'P-521' }, verifyParams: { name: 'ECDSA', hash: 'SHA-512' } },
};

export const ASYMMETRIC_ALGORITHMS = Object.keys(ASYMMETRIC);

export function isHmacAlgorithm(alg: unknown): alg is HmacAlgorithm {
  return typeof alg === 'string' && (HMAC_ALGORITHMS as string[]).includes(alg);
}

export function isAsymmetricAlgorithm(alg: unknown): alg is string {
  return typeof alg === 'string' && alg in ASYMMETRIC;
}

/** Imports a public key given as an SPKI PEM ("BEGIN PUBLIC KEY") or a JWK JSON object. */
export async function importPublicKey(keyText: string, alg: string): Promise<CryptoKey> {
  const spec = ASYMMETRIC[alg];
  if (!spec) throw new Error(`Unsupported algorithm: ${alg}`);
  const text = keyText.trim();
  if (!text) throw new Error('Paste the public key (PEM or JWK).');
  if (text.startsWith('{')) {
    let jwk: JsonWebKey & { keys?: JsonWebKey[] };
    try {
      jwk = JSON.parse(text);
    } catch {
      throw new Error('The JWK is not valid JSON.');
    }
    if (jwk.keys) throw new Error('This is a JWK Set; paste a single key from its "keys" array.');
    return crypto.subtle.importKey('jwk', jwk, spec.importParams, false, ['verify']);
  }
  if (/BEGIN RSA PUBLIC KEY/.test(text)) {
    throw new Error('PKCS#1 "RSA PUBLIC KEY" PEMs are not supported; convert to SPKI ("BEGIN PUBLIC KEY").');
  }
  if (/BEGIN (CERTIFICATE|.*PRIVATE KEY)/.test(text)) {
    throw new Error('Paste the public key ("BEGIN PUBLIC KEY"), not a certificate or private key.');
  }
  const b64 = text.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, '').replace(/\s+/g, '');
  let der: Uint8Array;
  try {
    der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  } catch {
    throw new Error('The PEM body is not valid base64.');
  }
  try {
    return await crypto.subtle.importKey('spki', der as BufferSource, spec.importParams, false, ['verify']);
  } catch {
    throw new Error(`The key could not be imported for ${alg}. Check that the key type matches the algorithm.`);
  }
}

/**
 * Verifies a token's signature using the algorithm named in its header.
 * `key` is the shared secret for HS* or the public key (PEM/JWK) for RS*, PS* and ES*.
 */
export async function verifyJwt(token: string, key: string, secretIsBase64 = false): Promise<boolean> {
  const { header, parts } = decodeJwt(token);
  const alg = header.alg;
  if (alg === 'none') throw new Error('The token is unsigned (alg "none"); there is nothing to verify.');
  if (isHmacAlgorithm(alg)) return verifyHmacJwt(token, secretBytes(key, secretIsBase64), alg);
  if (!isAsymmetricAlgorithm(alg)) throw new Error(`Unsupported algorithm: ${String(alg)}`);
  const cryptoKey = await importPublicKey(key, alg);
  let sig: Uint8Array;
  try {
    sig = base64UrlToBytes(parts[2]);
  } catch {
    return false;
  }
  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  return crypto.subtle.verify(ASYMMETRIC[alg].verifyParams, cryptoKey, sig as BufferSource, data);
}
