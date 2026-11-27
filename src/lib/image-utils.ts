export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';

export const FORMAT_LABELS: Record<OutputFormat, { label: string; ext: string; lossy: boolean }> = {
  'image/jpeg': { label: 'JPEG', ext: 'jpg', lossy: true },
  'image/png': { label: 'PNG', ext: 'png', lossy: false },
  'image/webp': { label: 'WebP', ext: 'webp', lossy: true },
  'image/avif': { label: 'AVIF', ext: 'avif', lossy: true },
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

export interface ResizeOptions {
  /** 0 = no limit */
  maxWidth: number;
  maxHeight: number;
  /** 1–100 percent; applied after max limits are satisfied. */
  scalePercent?: number;
}

/** Output size that fits within the limits, preserving aspect ratio and never upscaling. */
export function targetSize(width: number, height: number, { maxWidth, maxHeight, scalePercent = 100 }: ResizeOptions): { width: number; height: number } {
  let ratio = Math.min(1, scalePercent / 100);
  if (maxWidth > 0) ratio = Math.min(ratio, maxWidth / width);
  if (maxHeight > 0) ratio = Math.min(ratio, maxHeight / height);
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

/** Replaces the extension of `name` with `ext`. */
export function renameWithExtension(name: string, ext: string): string {
  const base = name.replace(/\.[^./\\]+$/, '') || 'image';
  return `${base}.${ext}`;
}

export interface ParsedDataUri {
  mime: string;
  base64: string;
  bytes: number;
}

/** Parses "data:image/png;base64,..." or bare base64 (assumed PNG/JPEG/GIF/WebP by magic bytes). */
export function parseImageDataUri(input: string): ParsedDataUri {
  const text = input.trim();
  const m = text.match(/^data:([\w/+.-]+)?(;[^,]*)?,(.*)$/s);
  let mime = m?.[1] ?? '';
  let b64 = (m ? m[3] : text).replace(/\s+/g, '');
  if (m && !/;base64/i.test(m[2] ?? '')) {
    // URL-encoded data URI (e.g. SVG)
    const decoded = decodeURIComponent(b64);
    b64 = btoa(unescape(encodeURIComponent(decoded)));
  }
  if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(b64) || !b64) throw new Error('Not valid Base64 image data.');
  const head = atob(b64.slice(0, 24).replace(/-/g, '+').replace(/_/g, '/'));
  if (!mime) {
    if (head.startsWith('\x89PNG')) mime = 'image/png';
    else if (head.startsWith('\xff\xd8\xff')) mime = 'image/jpeg';
    else if (head.startsWith('GIF8')) mime = 'image/gif';
    else if (head.startsWith('RIFF') && head.slice(8, 12) === 'WEBP') mime = 'image/webp';
    else if (head.trimStart().startsWith('<svg') || head.trimStart().startsWith('<?xml')) mime = 'image/svg+xml';
    else throw new Error('Could not detect the image type; add a data:image/...;base64, prefix.');
  }
  const padding = (b64.match(/=+$/)?.[0].length ?? 0);
  return { mime, base64: b64, bytes: Math.floor((b64.length * 3) / 4) - padding };
}
