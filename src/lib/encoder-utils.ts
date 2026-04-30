// Base64
export function encodeBase64(text: string, urlSafe: boolean = false, noPadding: boolean = false): string {
  const bytes = new TextEncoder().encode(text);
  let encoded = btoa(String.fromCharCode(...bytes));
  if (urlSafe) encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_');
  if (noPadding) encoded = encoded.replace(/=+$/, '');
  return encoded;
}

export function decodeBase64(text: string, urlSafe: boolean = false, noPadding: boolean = false): string {
  let prepared = text;
  if (urlSafe) prepared = prepared.replace(/-/g, '+').replace(/_/g, '/');
  if (noPadding && prepared.length % 4 !== 0) {
    prepared += '='.repeat(4 - (prepared.length % 4));
  }
  const bytes = Uint8Array.from(atob(prepared), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// URL
export function encodeURL(text: string, component: boolean = false): string {
  return component ? encodeURIComponent(text) : encodeURI(text);
}

export function decodeURL(text: string, component: boolean = false): string {
  return component ? decodeURIComponent(text) : decodeURI(text);
}

// HTML
export function encodeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function decodeHTML(text: string): string {
  const div = document.createElement('div');
  div.innerHTML = text;
  return div.textContent || '';
}

// Hex
export function encodeHex(text: string, uppercase: boolean = false, withPrefix: boolean = false): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const hex = text.charCodeAt(i).toString(16);
    result += uppercase ? hex.toUpperCase() : hex;
  }
  return withPrefix ? '0x' + result : result;
}

export function decodeHex(text: string): string {
  let hexString = text.startsWith('0x') ? text.slice(2) : text;
  hexString = hexString.toLowerCase();
  if (hexString.length % 2 !== 0) throw new Error('Invalid hex string: length must be even');
  let result = '';
  for (let i = 0; i < hexString.length; i += 2) {
    const hexChar = hexString.substring(i, i + 2);
    if (!/^[0-9a-f]{2}$/i.test(hexChar)) throw new Error('Invalid hex string');
    result += String.fromCharCode(parseInt(hexChar, 16));
  }
  return result;
}
