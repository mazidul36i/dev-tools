/** UUID generation (RFC 9562) and inspection, using crypto.getRandomValues. */

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function format(bytes: Uint8Array): string {
  const h = hex(bytes);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Random UUID (version 4). */
export function uuidV4(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return format(b);
}

/** Time-ordered UUID (version 7): 48-bit Unix ms timestamp, then random bits. Sorts by creation time. */
export function uuidV7(now = Date.now()): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  let t = now;
  for (let i = 5; i >= 0; i--) {
    b[i] = t % 256;
    t = Math.floor(t / 256);
  }
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  return format(b);
}

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export interface UuidFormat {
  uppercase?: boolean;
  dashes?: boolean;
  braces?: boolean;
}

export function formatUuid(uuid: string, { uppercase = false, dashes = true, braces = false }: UuidFormat = {}): string {
  let out = dashes ? uuid : uuid.replace(/-/g, '');
  if (uppercase) out = out.toUpperCase();
  return braces ? `{${out}}` : out;
}

export interface UuidInfo {
  version: number;
  variant: string;
  /** Embedded creation time for v7 (and v1/v6 are not decoded). */
  timestamp?: Date;
}

/** Reads version, variant and (for v7) the timestamp from a UUID string. */
export function inspectUuid(input: string): UuidInfo {
  const h = input.trim().replace(/^\{|\}$/g, '').replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(h)) throw new Error('Not a UUID: expected 32 hex digits, optionally with dashes or braces');
  const version = parseInt(h[12], 16);
  const v = parseInt(h[16], 16);
  const variant = v < 8 ? 'NCS (reserved)' : v < 12 ? 'RFC 9562' : v < 14 ? 'Microsoft (reserved)' : 'Future (reserved)';
  const info: UuidInfo = { version, variant };
  if (version === 7) info.timestamp = new Date(parseInt(h.slice(0, 12), 16));
  return info;
}
