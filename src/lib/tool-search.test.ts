import { describe, expect, it } from 'vitest';
import { filterTools, scoreTool } from './tool-search';
import { tools } from '../tools';

const titles = (q: string, c: Parameters<typeof filterTools>[2] = 'All') => filterTools(tools, q, c).map((t) => t.title);

describe('tool search', () => {
  it('returns everything for an empty query', () => {
    expect(titles('')).toHaveLength(tools.length);
  });

  it('finds tools by title, keyword and description', () => {
    expect(titles('jwt')[0]).toBe('JWT Decoder');
    expect(titles('sha256')).toContain('Hash Generator');
    expect(titles('epoch')[0]).toBe('Unix Timestamp Converter');
    expect(titles('yaml')[0]).toBe('YAML ↔ JSON');
  });

  it('requires every word to match and ranks title matches first', () => {
    expect(titles('json yaml')).toEqual(['YAML ↔ JSON']);
    expect(titles('json')[0]).toMatch(/^JSON/);
    expect(scoreTool({ title: 'A', desc: 'b', category: 'Text' }, 'zzz')).toBe(0);
  });

  it('filters by category', () => {
    expect(filterTools(tools, '', 'Text').every((t) => t.category === 'Text')).toBe(true);
  });
});
