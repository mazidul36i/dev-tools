export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' | 'CRC32';
export const HASH_ALGORITHMS: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512', 'CRC32'];

/** Algorithms considered broken for security purposes (fine for checksums). */
export const INSECURE_ALGORITHMS = new Set<HashAlgorithm>(['MD5', 'SHA-1', 'CRC32']);

export type OutputEncoding = 'hex' | 'HEX' | 'base64';

// ── MD5 (RFC 1321) — not available in Web Crypto ──────────────────────────

const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);

export function md5(bytes: Uint8Array): Uint8Array {
  const len = bytes.length;
  const paddedLen = (((len + 8) >> 6) + 1) << 6;
  const buf = new Uint8Array(paddedLen);
  buf.set(bytes);
  buf[len] = 0x80;
  const view = new DataView(buf.buffer);
  const bitLen = len * 8;
  view.setUint32(paddedLen - 8, bitLen >>> 0, true);
  view.setUint32(paddedLen - 4, Math.floor(bitLen / 2 ** 32), true);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  const M = new Uint32Array(16);
  for (let off = 0; off < paddedLen; off += 64) {
    for (let i = 0; i < 16; i++) M[i] = view.getUint32(off + i * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D; D = C; C = B;
      B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  const out = new Uint8Array(16);
  const ov = new DataView(out.buffer);
  ov.setUint32(0, a0, true); ov.setUint32(4, b0, true); ov.setUint32(8, c0, true); ov.setUint32(12, d0, true);
  return out;
}

// ── CRC32 (IEEE 802.3) ────────────────────────────────────────────────────

let crcTable: Uint32Array | null = null;
export function crc32(bytes: Uint8Array): Uint8Array {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const b of bytes) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  crc = (crc ^ 0xffffffff) >>> 0;
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, crc, false);
  return out;
}

function hmacMd5(key: Uint8Array, msg: Uint8Array): Uint8Array {
  const block = 64;
  let k = key.length > block ? md5(key) : key;
  const padded = new Uint8Array(block);
  padded.set(k);
  k = padded;
  const inner = new Uint8Array(block + msg.length);
  const outer = new Uint8Array(block + 16);
  for (let i = 0; i < block; i++) {
    inner[i] = k[i] ^ 0x36;
    outer[i] = k[i] ^ 0x5c;
  }
  inner.set(msg, block);
  outer.set(md5(inner), block);
  return md5(outer);
}

/** Hashes `data`; with `hmacKey`, computes the HMAC instead (not available for CRC32). */
export async function computeHash(alg: HashAlgorithm, data: Uint8Array, hmacKey?: Uint8Array): Promise<Uint8Array> {
  if (alg === 'CRC32') {
    if (hmacKey) throw new Error('HMAC is not defined for CRC32');
    return crc32(data);
  }
  if (alg === 'MD5') return hmacKey ? hmacMd5(hmacKey, data) : md5(data);
  if (hmacKey) {
    const key = await crypto.subtle.importKey('raw', hmacKey as BufferSource, { name: 'HMAC', hash: alg }, false, ['sign']);
    return new Uint8Array(await crypto.subtle.sign('HMAC', key, data as BufferSource));
  }
  return new Uint8Array(await crypto.subtle.digest(alg, data as BufferSource));
}

export function encodeBytes(bytes: Uint8Array, encoding: OutputEncoding): string {
  if (encoding === 'base64') {
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return encoding === 'HEX' ? hex.toUpperCase() : hex;
}

/** Normalises a pasted hash for comparison (case, whitespace, "0x"). */
export function normalizeHash(value: string): string {
  return value.trim().replace(/^0x/i, '').replace(/\s+/g, '');
}
