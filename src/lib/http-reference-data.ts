export interface StatusCode {
  code: number;
  name: string;
  desc: string;
}

export const STATUS_CLASSES: Record<number, { label: string; desc: string }> = {
  1: { label: 'Informational', desc: 'The request was received and processing continues.' },
  2: { label: 'Success', desc: 'The request was received, understood and accepted.' },
  3: { label: 'Redirection', desc: 'Further action is needed to complete the request.' },
  4: { label: 'Client error', desc: 'The request is wrong or cannot be fulfilled.' },
  5: { label: 'Server error', desc: 'The server failed to fulfil a valid request.' },
};

export const STATUS_CODES: StatusCode[] = [
  { code: 100, name: 'Continue', desc: 'The client should continue sending the request body (after Expect: 100-continue).' },
  { code: 101, name: 'Switching Protocols', desc: 'The server is switching protocols as requested, e.g. to WebSocket.' },
  { code: 102, name: 'Processing', desc: 'WebDAV: the request is being processed but no response is available yet.' },
  { code: 103, name: 'Early Hints', desc: 'Lets the browser preload resources (Link headers) before the final response.' },
  { code: 200, name: 'OK', desc: 'The request succeeded.' },
  { code: 201, name: 'Created', desc: 'A new resource was created; its URL is usually in the Location header.' },
  { code: 202, name: 'Accepted', desc: 'The request was accepted for processing, which has not finished.' },
  { code: 203, name: 'Non-Authoritative Information', desc: 'The returned metadata comes from a transforming proxy, not the origin.' },
  { code: 204, name: 'No Content', desc: 'Success with no response body — common for DELETE and PUT.' },
  { code: 205, name: 'Reset Content', desc: 'Success; the client should reset the document view (e.g. clear a form).' },
  { code: 206, name: 'Partial Content', desc: 'Only part of the resource is returned, in response to a Range header.' },
  { code: 207, name: 'Multi-Status', desc: 'WebDAV: the body holds status codes for multiple independent operations.' },
  { code: 208, name: 'Already Reported', desc: 'WebDAV: members already listed earlier in the response are not repeated.' },
  { code: 226, name: 'IM Used', desc: 'The response is the result of instance manipulations (delta encoding).' },
  { code: 300, name: 'Multiple Choices', desc: 'Several representations are available; the client should pick one.' },
  { code: 301, name: 'Moved Permanently', desc: 'The resource has a new permanent URL. Clients may change POST to GET.' },
  { code: 302, name: 'Found', desc: 'Temporary redirect. Clients may change POST to GET.' },
  { code: 303, name: 'See Other', desc: 'Get the result from another URL with GET — used after a form POST.' },
  { code: 304, name: 'Not Modified', desc: 'The cached version is still valid (conditional GET with ETag / If-Modified-Since).' },
  { code: 307, name: 'Temporary Redirect', desc: 'Temporary redirect that keeps the method and body.' },
  { code: 308, name: 'Permanent Redirect', desc: 'Permanent redirect that keeps the method and body.' },
  { code: 400, name: 'Bad Request', desc: 'The request is malformed — invalid syntax, framing or parameters.' },
  { code: 401, name: 'Unauthorized', desc: 'Authentication is required or failed. Sent with a WWW-Authenticate header.' },
  { code: 402, name: 'Payment Required', desc: 'Reserved; sometimes used for paywalls or exhausted quotas.' },
  { code: 403, name: 'Forbidden', desc: 'The client is authenticated (or not) but not allowed to access this resource.' },
  { code: 404, name: 'Not Found', desc: 'The resource does not exist, or the server will not reveal that it does.' },
  { code: 405, name: 'Method Not Allowed', desc: 'The method is not supported for this resource; see the Allow header.' },
  { code: 406, name: 'Not Acceptable', desc: 'No representation matches the Accept headers.' },
  { code: 407, name: 'Proxy Authentication Required', desc: 'The client must authenticate with the proxy.' },
  { code: 408, name: 'Request Timeout', desc: 'The server timed out waiting for the request.' },
  { code: 409, name: 'Conflict', desc: 'The request conflicts with the current state, e.g. an edit conflict or duplicate.' },
  { code: 410, name: 'Gone', desc: 'The resource was deliberately and permanently removed.' },
  { code: 411, name: 'Length Required', desc: 'A Content-Length header is required.' },
  { code: 412, name: 'Precondition Failed', desc: 'A condition such as If-Match was not met — used for optimistic locking.' },
  { code: 413, name: 'Content Too Large', desc: 'The request body is larger than the server allows.' },
  { code: 414, name: 'URI Too Long', desc: 'The URL is longer than the server will process.' },
  { code: 415, name: 'Unsupported Media Type', desc: 'The request body’s Content-Type is not supported.' },
  { code: 416, name: 'Range Not Satisfiable', desc: 'The requested Range lies outside the resource.' },
  { code: 417, name: 'Expectation Failed', desc: 'The Expect header could not be met.' },
  { code: 418, name: "I'm a teapot", desc: 'An April Fools’ joke from RFC 2324; occasionally used for refused requests.' },
  { code: 421, name: 'Misdirected Request', desc: 'The request reached a server that cannot answer for this host.' },
  { code: 422, name: 'Unprocessable Content', desc: 'Syntax is fine but the content is semantically invalid — common for validation errors.' },
  { code: 423, name: 'Locked', desc: 'WebDAV: the resource is locked.' },
  { code: 424, name: 'Failed Dependency', desc: 'WebDAV: failed because a previous request failed.' },
  { code: 425, name: 'Too Early', desc: 'The server will not process a request that might be replayed (TLS early data).' },
  { code: 426, name: 'Upgrade Required', desc: 'The client must switch protocols; see the Upgrade header.' },
  { code: 428, name: 'Precondition Required', desc: 'The request must be conditional (If-Match) to avoid lost updates.' },
  { code: 429, name: 'Too Many Requests', desc: 'Rate limit exceeded; a Retry-After header may say when to try again.' },
  { code: 431, name: 'Request Header Fields Too Large', desc: 'Headers (often cookies) are too large.' },
  { code: 451, name: 'Unavailable For Legal Reasons', desc: 'The resource is blocked for legal reasons, such as a court order.' },
  { code: 500, name: 'Internal Server Error', desc: 'A generic, unexpected server failure.' },
  { code: 501, name: 'Not Implemented', desc: 'The server does not support the functionality required.' },
  { code: 502, name: 'Bad Gateway', desc: 'A gateway or proxy got an invalid response from the upstream server.' },
  { code: 503, name: 'Service Unavailable', desc: 'The server is overloaded or down for maintenance; may include Retry-After.' },
  { code: 504, name: 'Gateway Timeout', desc: 'A gateway or proxy did not get a timely response from upstream.' },
  { code: 505, name: 'HTTP Version Not Supported', desc: 'The HTTP version in the request is not supported.' },
  { code: 506, name: 'Variant Also Negotiates', desc: 'Content negotiation is misconfigured on the server.' },
  { code: 507, name: 'Insufficient Storage', desc: 'WebDAV: the server cannot store the representation.' },
  { code: 508, name: 'Loop Detected', desc: 'WebDAV: an infinite loop was detected while processing.' },
  { code: 510, name: 'Not Extended', desc: 'Further extensions to the request are required.' },
  { code: 511, name: 'Network Authentication Required', desc: 'The client must authenticate to gain network access, e.g. a captive portal.' },
];

export interface MimeType {
  ext: string;
  type: string;
  desc: string;
}

export const MIME_TYPES: MimeType[] = [
  { ext: '.html .htm', type: 'text/html', desc: 'HTML document' },
  { ext: '.css', type: 'text/css', desc: 'Cascading Style Sheets' },
  { ext: '.js .mjs', type: 'text/javascript', desc: 'JavaScript' },
  { ext: '.json', type: 'application/json', desc: 'JSON data' },
  { ext: '.jsonld', type: 'application/ld+json', desc: 'JSON-LD linked data' },
  { ext: '.xml', type: 'application/xml', desc: 'XML document' },
  { ext: '.txt', type: 'text/plain', desc: 'Plain text' },
  { ext: '.csv', type: 'text/csv', desc: 'Comma-separated values' },
  { ext: '.md', type: 'text/markdown', desc: 'Markdown' },
  { ext: '.yaml .yml', type: 'application/yaml', desc: 'YAML' },
  { ext: '.ics', type: 'text/calendar', desc: 'iCalendar' },
  { ext: '.webmanifest', type: 'application/manifest+json', desc: 'Web app manifest' },
  { ext: '.wasm', type: 'application/wasm', desc: 'WebAssembly' },
  { ext: '.pdf', type: 'application/pdf', desc: 'PDF document' },
  { ext: '.zip', type: 'application/zip', desc: 'ZIP archive' },
  { ext: '.gz', type: 'application/gzip', desc: 'Gzip archive' },
  { ext: '.tar', type: 'application/x-tar', desc: 'Tape archive' },
  { ext: '.7z', type: 'application/x-7z-compressed', desc: '7-Zip archive' },
  { ext: '.rar', type: 'application/vnd.rar', desc: 'RAR archive' },
  { ext: '.bin', type: 'application/octet-stream', desc: 'Arbitrary binary data (download)' },
  { ext: '.doc', type: 'application/msword', desc: 'Microsoft Word (legacy)' },
  { ext: '.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', desc: 'Microsoft Word' },
  { ext: '.xls', type: 'application/vnd.ms-excel', desc: 'Microsoft Excel (legacy)' },
  { ext: '.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', desc: 'Microsoft Excel' },
  { ext: '.ppt', type: 'application/vnd.ms-powerpoint', desc: 'Microsoft PowerPoint (legacy)' },
  { ext: '.pptx', type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', desc: 'Microsoft PowerPoint' },
  { ext: '.odt', type: 'application/vnd.oasis.opendocument.text', desc: 'OpenDocument text' },
  { ext: '.epub', type: 'application/epub+zip', desc: 'EPUB e-book' },
  { ext: '.rtf', type: 'application/rtf', desc: 'Rich Text Format' },
  { ext: '.sql', type: 'application/sql', desc: 'SQL' },
  { ext: '.png', type: 'image/png', desc: 'PNG image' },
  { ext: '.jpg .jpeg', type: 'image/jpeg', desc: 'JPEG image' },
  { ext: '.gif', type: 'image/gif', desc: 'GIF image' },
  { ext: '.webp', type: 'image/webp', desc: 'WebP image' },
  { ext: '.avif', type: 'image/avif', desc: 'AVIF image' },
  { ext: '.svg', type: 'image/svg+xml', desc: 'SVG vector image' },
  { ext: '.ico', type: 'image/vnd.microsoft.icon', desc: 'Icon (favicon)' },
  { ext: '.bmp', type: 'image/bmp', desc: 'Bitmap image' },
  { ext: '.tif .tiff', type: 'image/tiff', desc: 'TIFF image' },
  { ext: '.heic', type: 'image/heic', desc: 'HEIC image (Apple)' },
  { ext: '.mp3', type: 'audio/mpeg', desc: 'MP3 audio' },
  { ext: '.wav', type: 'audio/wav', desc: 'Waveform audio' },
  { ext: '.ogg .oga', type: 'audio/ogg', desc: 'Ogg audio' },
  { ext: '.opus', type: 'audio/opus', desc: 'Opus audio' },
  { ext: '.aac', type: 'audio/aac', desc: 'AAC audio' },
  { ext: '.flac', type: 'audio/flac', desc: 'FLAC lossless audio' },
  { ext: '.weba', type: 'audio/webm', desc: 'WebM audio' },
  { ext: '.mid .midi', type: 'audio/midi', desc: 'MIDI' },
  { ext: '.mp4', type: 'video/mp4', desc: 'MP4 video' },
  { ext: '.webm', type: 'video/webm', desc: 'WebM video' },
  { ext: '.ogv', type: 'video/ogg', desc: 'Ogg video' },
  { ext: '.mov', type: 'video/quicktime', desc: 'QuickTime video' },
  { ext: '.avi', type: 'video/x-msvideo', desc: 'AVI video' },
  { ext: '.mpeg', type: 'video/mpeg', desc: 'MPEG video' },
  { ext: '.ts', type: 'video/mp2t', desc: 'MPEG transport stream' },
  { ext: '.m3u8', type: 'application/vnd.apple.mpegurl', desc: 'HLS playlist' },
  { ext: '.woff', type: 'font/woff', desc: 'Web Open Font Format' },
  { ext: '.woff2', type: 'font/woff2', desc: 'Web Open Font Format 2' },
  { ext: '.ttf', type: 'font/ttf', desc: 'TrueType font' },
  { ext: '.otf', type: 'font/otf', desc: 'OpenType font' },
  { ext: '(form)', type: 'application/x-www-form-urlencoded', desc: 'HTML form data (key=value&...)' },
  { ext: '(form)', type: 'multipart/form-data', desc: 'Form data with file uploads' },
  { ext: '(stream)', type: 'text/event-stream', desc: 'Server-sent events' },
  { ext: '(api)', type: 'application/problem+json', desc: 'RFC 9457 problem details for HTTP APIs' },
  { ext: '(api)', type: 'application/x-ndjson', desc: 'Newline-delimited JSON' },
  { ext: '(api)', type: 'application/graphql-response+json', desc: 'GraphQL over HTTP response' },
  { ext: '.jar', type: 'application/java-archive', desc: 'Java archive' },
  { ext: '.apk', type: 'application/vnd.android.package-archive', desc: 'Android package' },
  { ext: '.sh', type: 'application/x-sh', desc: 'Shell script' },
];

const norm = (s: string) => s.toLowerCase();

export function searchStatusCodes(query: string): StatusCode[] {
  const q = norm(query.trim());
  if (!q) return STATUS_CODES;
  // "4xx" / "5" style class filters.
  const cls = q.match(/^([1-5])(xx)?$/);
  if (cls && !/^\d{3}$/.test(q)) return STATUS_CODES.filter((s) => String(s.code)[0] === cls[1]);
  return STATUS_CODES.filter((s) => String(s.code).startsWith(q) || norm(s.name).includes(q) || norm(s.desc).includes(q));
}

export function searchMimeTypes(query: string): MimeType[] {
  const q = norm(query.trim()).replace(/^\*?\./, '.');
  if (!q) return MIME_TYPES;
  return MIME_TYPES.filter((m) => m.ext.split(' ').some((e) => e === q || e === `.${q}`)
    || norm(m.type).includes(q) || norm(m.desc).includes(q) || norm(m.ext).includes(q));
}
