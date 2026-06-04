import pako from 'pako';

/**
 * Compress a string using gzip and return base64-encoded result.
 */
export function compressGzip(text: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const compressed = pako.gzip(data);
  return uint8ToBase64(compressed);
}

/**
 * Decompress a base64-encoded gzip string back to text.
 * Supports partial recovery on corrupted data.
 */
export function decompressGzip(base64Input: string): string {
  const cleaned = base64Input.trim().replace(/\0/g, '');
  const compressed = base64ToUint8(cleaned);

  try {
    const decompressed = pako.ungzip(compressed);
    return new TextDecoder().decode(decompressed);
  } catch {
    // Attempt partial recovery using raw inflate
    try {
      // Skip the 10-byte gzip header and attempt raw inflate
      const rawData = compressed.slice(10);
      const decompressed = pako.inflateRaw(rawData);
      return new TextDecoder().decode(decompressed);
    } catch (e) {
      throw new Error(
        'Decompression failed: Data may be corrupted or not valid gzip. ' +
        (e instanceof Error ? e.message : String(e))
      );
    }
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  // Ensure proper padding
  let padded = base64;
  if (padded.length % 4 !== 0) {
    padded += '='.repeat(4 - (padded.length % 4));
  }
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

