import { describe, expect, it } from 'vitest';
import { buildMarkdownDocument, extractToc, renderMarkdown } from './markdown-utils';

describe('renderMarkdown', () => {
  it('renders GFM with heading ids', () => {
    const html = renderMarkdown('# Hello *World*\n\n- [x] done\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n~~old~~');
    expect(html).toContain('<h1 id="hello-world">Hello <em>World</em></h1>');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('<table>');
    expect(html).toContain('<del>old</del>');
  });

  it('deduplicates heading ids and honours options', () => {
    expect(renderMarkdown('## A\n## A')).toContain('<h2 id="a-1">');
    expect(renderMarkdown('# A', { headingIds: false })).toBe('<h1>A</h1>\n');
    expect(renderMarkdown('a\nb', { breaks: true })).toContain('<br>');
  });
});

describe('extractToc', () => {
  it('lists headings outside code fences', () => {
    expect(extractToc('# One\n```\n# not a heading\n```\n## Two [link](x)\n## One')).toEqual([
      { depth: 1, text: 'One', id: 'one' },
      { depth: 2, text: 'Two link', id: 'two-link' },
      { depth: 2, text: 'One', id: 'one-1' },
    ]);
  });
});

describe('buildMarkdownDocument', () => {
  it('wraps HTML in a themed, escaped document', () => {
    const doc = buildMarkdownDocument('<p>x</p>', { theme: 'dark', title: 'a<b' });
    expect(doc).toContain('data-theme="dark"');
    expect(doc).toContain('<title>a&lt;b</title>');
    expect(doc).toContain('<p>x</p>');
  });
});
