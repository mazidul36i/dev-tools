import { describe, expect, it } from 'vitest';
import { formatBytes, parseImageDataUri, renameWithExtension, targetSize } from './image-utils';

const PNG_1PX = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

describe('image utils', () => {
  it('computes target sizes without upscaling', () => {
    expect(targetSize(4000, 3000, { maxWidth: 1920, maxHeight: 0 })).toEqual({ width: 1920, height: 1440 });
    expect(targetSize(4000, 3000, { maxWidth: 1920, maxHeight: 1000 })).toEqual({ width: 1333, height: 1000 });
    expect(targetSize(800, 600, { maxWidth: 1920, maxHeight: 1080 })).toEqual({ width: 800, height: 600 });
    expect(targetSize(800, 600, { maxWidth: 0, maxHeight: 0, scalePercent: 50 })).toEqual({ width: 400, height: 300 });
  });

  it('formats bytes and renames files', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(3 * 1024 ** 2)).toBe('3.00 MB');
    expect(renameWithExtension('photo.final.PNG', 'webp')).toBe('photo.final.webp');
    expect(renameWithExtension('noext', 'jpg')).toBe('noext.jpg');
  });

  it('parses data URIs and bare base64', () => {
    expect(parseImageDataUri(`data:image/png;base64,${PNG_1PX}`)).toMatchObject({ mime: 'image/png', bytes: 68 });
    expect(parseImageDataUri(PNG_1PX).mime).toBe('image/png');
    expect(parseImageDataUri('data:image/svg+xml,%3Csvg%3E%3C/svg%3E').mime).toBe('image/svg+xml');
    expect(() => parseImageDataUri('not base64!')).toThrow();
    expect(() => parseImageDataUri('AAAAAAAAAAAAAAAA')).toThrow(/detect/);
  });
});
