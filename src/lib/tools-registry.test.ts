import { describe, expect, it } from 'vitest';
import { tools, toolCategories } from '../tools';

describe('tool registry', () => {
  it('has unique, URL-safe slugs', () => {
    const slugs = tools.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('uses only known categories', () => {
    for (const t of tools) expect(toolCategories).toContain(t.category);
  });
});
