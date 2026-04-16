// Base64
export function encodeBase64(text, urlSafe = false, noPadding = false) {
  let encoded = btoa(unescape(encodeURIComponent(text)));
  if (urlSafe) encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_');
  if (noPadding) encoded = encoded.replace(/=+$/, '');
  return encoded;
}

export function decodeBase64(text, urlSafe = false, noPadding = false) {
  let prepared = text;
  if (urlSafe) prepared = prepared.replace(/-/g, '+').replace(/_/g, '/');
  if (noPadding && prepared.length % 4 !== 0) {
    prepared += '='.repeat(4 - (prepared.length % 4));
  }
  return decodeURIComponent(escape(atob(prepared)));
}

// URL
export function encodeURL(text, component = false) {
  return component ? encodeURIComponent(text) : encodeURI(text);
}

export function decodeURL(text, component = false) {
  return component ? decodeURIComponent(text) : decodeURI(text);
}

// HTML
export function encodeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function decodeHTML(text) {
  const div = document.createElement('div');
  div.innerHTML = text;
  return div.textContent;
}

// Hex
export function encodeHex(text, uppercase = false, withPrefix = false) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const hex = text.charCodeAt(i).toString(16);
    result += uppercase ? hex.toUpperCase() : hex;
  }
  return withPrefix ? '0x' + result : result;
}

export function decodeHex(text) {
  let hexString = text.startsWith('0x') ? text.slice(2) : text;
  hexString = hexString.toLowerCase();
  if (hexString.length % 2 !== 0) throw new Error('Invalid hex string: length must be even');
  let result = '';
  for (let i = 0; i < hexString.length; i += 2) {
    const hexChar = hexString.substr(i, 2);
    if (!/^[0-9a-f]{2}$/i.test(hexChar)) throw new Error('Invalid hex string');
    result += String.fromCharCode(parseInt(hexChar, 16));
  }
  return result;
}

