/*
 * Tool options <-> URL query string, and compressed "share" payloads for the
 * URL hash. Options are small and safe to show in a URL; user input only goes
 * into the hash, and only when the user asks for a share link (the hash is
 * never sent to a server).
 */

export interface StringSpec { type: 'string'; default: string; maxLength?: number }
export interface NumberSpec { type: 'number'; default: number; min?: number; max?: number; integer?: boolean }
export interface BooleanSpec { type: 'boolean'; default: boolean }
export interface EnumSpec<T extends string = string> { type: 'enum'; default: T; values: readonly T[] }
export type FieldSpec = StringSpec | NumberSpec | BooleanSpec | EnumSpec;
export type OptionSchema = Record<string, FieldSpec>;

export type SpecValue<F> = F extends EnumSpec<infer T> ? T
  : F extends NumberSpec ? number
  : F extends BooleanSpec ? boolean
  : string;
export type OptionValues<S extends OptionSchema> = { [K in keyof S]: SpecValue<S[K]> };

/** Builders that keep literal enum types. */
export const opt = {
  str: (def = '', maxLength = 500): StringSpec => ({ type: 'string', default: def, maxLength }),
  num: (def: number, range: { min?: number; max?: number; integer?: boolean } = {}): NumberSpec => ({ type: 'number', default: def, integer: true, ...range }),
  bool: (def = false): BooleanSpec => ({ type: 'boolean', default: def }),
  oneOf: <const T extends string>(values: readonly T[], def: T): EnumSpec<T> => ({ type: 'enum', values, default: def }),
};

export function defaults<S extends OptionSchema>(schema: S): OptionValues<S> {
  const out: Record<string, unknown> = {};
  for (const [k, f] of Object.entries(schema)) out[k] = f.default;
  return out as OptionValues<S>;
}

/** Validates one raw string against its spec; undefined when invalid. */
export function parseField(spec: FieldSpec, raw: string): unknown {
  switch (spec.type) {
    case 'string':
      return raw.length <= (spec.maxLength ?? 500) ? raw : undefined;
    case 'boolean':
      if (raw === '1' || raw === 'true') return true;
      if (raw === '0' || raw === 'false') return false;
      return undefined;
    case 'enum':
      return (spec.values as readonly string[]).includes(raw) ? raw : undefined;
    case 'number': {
      if (raw.trim() === '') return undefined;
      const n = Number(raw);
      if (!Number.isFinite(n)) return undefined;
      if (spec.integer && !Number.isInteger(n)) return undefined;
      if (spec.min !== undefined && n < spec.min) return undefined;
      if (spec.max !== undefined && n > spec.max) return undefined;
      return n;
    }
  }
}

/** Valid values from `params`, else from `fallback`, else the defaults. */
export function parseOptions<S extends OptionSchema>(
  schema: S,
  params: URLSearchParams,
  fallback: Partial<Record<keyof S, unknown>> = {},
): OptionValues<S> {
  const out: Record<string, unknown> = {};
  for (const [k, spec] of Object.entries(schema)) {
    const raw = params.get(k);
    const fromUrl = raw === null ? undefined : parseField(spec, raw);
    const fb = fallback[k as keyof S];
    const fromFallback = fb === undefined ? undefined : parseField(spec, String(fb));
    out[k] = fromUrl ?? fromFallback ?? spec.default;
  }
  return out as OptionValues<S>;
}

/** Writes non-default values into a copy of `base`; other params are kept. */
export function serializeOptions<S extends OptionSchema>(schema: S, values: OptionValues<S>, base = new URLSearchParams()): URLSearchParams {
  const next = new URLSearchParams(base);
  for (const [k, spec] of Object.entries(schema)) {
    const v = values[k as keyof S] as unknown;
    if (v === spec.default || v === undefined) next.delete(k);
    else next.set(k, spec.type === 'boolean' ? (v ? '1' : '0') : String(v));
  }
  return next;
}

/* ---------- share payloads ---------- */

/** Longest encoded payload we put in a link (keeps URLs pasteable in chat/issue trackers). */
export const MAX_SHARE_LENGTH = 32_000;
const SHARE_VERSION = '1';

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// pako is only needed when a share link is created or opened, so it loads on demand
// instead of sitting in the main bundle.
const loadPako = () => import('pako');

/** Compresses string fields into a URL-safe token ("1.<base64url>"). */
export async function encodeShare(data: Record<string, string>): Promise<string> {
  const { deflate } = await loadPako();
  const json = JSON.stringify(data);
  return `${SHARE_VERSION}.${toBase64Url(deflate(new TextEncoder().encode(json)))}`;
}

/** Inverse of encodeShare; null for anything malformed. Only string fields survive. */
export async function decodeShare(token: string): Promise<Record<string, string> | null> {
  try {
    const [version, body] = token.split('.', 2);
    if (version !== SHARE_VERSION || !body) return null;
    const { inflate } = await loadPako();
    const json = new TextDecoder().decode(inflate(fromBase64Url(body)));
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) if (typeof v === 'string') out[k] = v;
    return out;
  } catch {
    return null;
  }
}

/** Reads the share token from a location hash such as "#s=1.abc". */
export function shareTokenFromHash(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return params.get('s');
}
