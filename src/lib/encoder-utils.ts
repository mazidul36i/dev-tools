// Text is always treated as UTF-8 bytes where an encoding works on bytes.

function bytesToBinary(bytes: Uint8Array): string {
  // Chunked: spreading a large array into fromCharCode overflows the stack.
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return bin;
}

// Base64
export function encodeBase64(text: string, urlSafe: boolean = false, noPadding: boolean = false): string {
  let encoded = btoa(bytesToBinary(new TextEncoder().encode(text)));
  if (urlSafe) encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_');
  if (noPadding) encoded = encoded.replace(/=+$/, '');
  return encoded;
}

export function decodeBase64(text: string, urlSafe: boolean = false, noPadding: boolean = false): string {
  let prepared = text.replace(/\s+/g, '');
  // Accept either alphabet when decoding; the option only matters for encoding.
  if (urlSafe || /[-_]/.test(prepared)) prepared = prepared.replace(/-/g, '+').replace(/_/g, '/');
  if (noPadding || prepared.length % 4 !== 0) prepared += '='.repeat((4 - (prepared.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(prepared);
  } catch {
    throw new Error('Not valid Base64: only A–Z, a–z, 0–9, + / (or - _) and = padding are allowed');
  }
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// URL
export function encodeURL(text: string, component: boolean = false): string {
  return component ? encodeURIComponent(text) : encodeURI(text);
}

export function decodeURL(text: string, component: boolean = false): string {
  try {
    return component ? decodeURIComponent(text) : decodeURI(text);
  } catch {
    throw new Error('Malformed percent-encoding: every % must be followed by two hex digits forming valid UTF-8');
  }
}

// HTML
const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function encodeHTML(text: string): string {
  return text.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/**
 * Decodes entities. Uses DOMParser, which builds an inert document: unlike
 * assigning innerHTML on a live element, it never loads images or runs
 * event handlers from the input.
 */
export function decodeHTML(text: string): string {
  const doc = new DOMParser().parseFromString(`<!doctype html><body><textarea>${text.replace(/<\/textarea/gi, '&lt;/textarea')}</textarea>`, 'text/html');
  return doc.querySelector('textarea')?.value ?? '';
}

// Hex (UTF-8 bytes, two digits each)
export function encodeHex(text: string, uppercase: boolean = false, withPrefix: boolean = false): string {
  let result = '';
  for (const b of new TextEncoder().encode(text)) result += b.toString(16).padStart(2, '0');
  if (uppercase) result = result.toUpperCase();
  return withPrefix ? '0x' + result : result;
}

export function decodeHex(text: string): string {
  const hexString = text.trim().replace(/^0x/i, '').replace(/[\s:,-]|0x/gi, '');
  if (hexString.length % 2 !== 0) throw new Error('Invalid hex: needs an even number of digits');
  if (!/^[0-9a-f]*$/i.test(hexString)) throw new Error('Invalid hex: only 0–9 and a–f are allowed');
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hexString.slice(i * 2, i * 2 + 2), 16);
  return new TextDecoder().decode(bytes);
}
