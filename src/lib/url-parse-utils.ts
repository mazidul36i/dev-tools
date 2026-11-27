/** URL parsing helpers built on the WHATWG URL parser. */

export interface ParsedUrl {
  url: URL;
  /** True when "https://" was added because the input had no scheme. */
  assumedScheme: boolean;
  params: [string, string][];
}

const DEFAULT_PORTS: Record<string, string> = { 'http:': '80', 'https:': '443', 'ws:': '80', 'wss:': '443', 'ftp:': '21' };

export function parseUrl(input: string): ParsedUrl {
  const text = input.trim();
  if (!text) throw new Error('Enter a URL');
  let assumedScheme = false;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    // "example.com/path" and "//cdn.example.com/x" are common; assume https.
    // Input that already names a scheme is simply invalid.
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) throw new Error('Not a valid URL. Check for spaces or a missing host.');
    try {
      url = new URL(text.startsWith('//') ? `https:${text}` : `https://${text}`);
      assumedScheme = true;
    } catch {
      throw new Error('Not a valid URL. Check for spaces or a missing host.');
    }
  }
  return { url, assumedScheme, params: [...url.searchParams.entries()] };
}

/** Port in use, noting when it's the scheme's default. */
export function effectivePort(url: URL): { port: string; isDefault: boolean } {
  if (url.port) return { port: url.port, isDefault: false };
  return { port: DEFAULT_PORTS[url.protocol] ?? '', isDefault: true };
}

/** `url` with its query string replaced by `params` (empty keys dropped). */
export function withParams(url: URL, params: [string, string][]): string {
  const next = new URL(url.href);
  const search = new URLSearchParams();
  for (const [k, v] of params) if (k) search.append(k, v);
  next.search = search.toString();
  return next.href;
}
