import { describe, expect, it } from 'vitest';
import { tools, toolCategories } from '../tools';

describe('tool registry', () => {
  it('has unique, URL-safe slugs', () => {
    const slugs = tools.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('does not shadow other top-level routes', () => {
    // Tools live at /<slug>, next to these app routes.
    const reserved = ['tools', 'index.html', 'icon.png', 'icon.svg', 'assets'];
    for (const t of tools) expect(reserved).not.toContain(t.slug);
  });

  it('uses only known categories', () => {
    for (const t of tools) expect(toolCategories).toContain(t.category);
  });
});
