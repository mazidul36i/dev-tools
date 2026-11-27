import { Marked, type Tokens } from 'marked';

export interface MarkdownOptions {
  /** GitHub-flavoured markdown: tables, task lists, strikethrough, autolinks. */
  gfm?: boolean;
  /** Treat single newlines as <br>. */
  breaks?: boolean;
  /** Add GitHub-style id attributes to headings. */
  headingIds?: boolean;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s/g, '-');
}

/** Renders markdown to (unsanitised) HTML. Sanitise before inserting into a page. */
export function renderMarkdown(md: string, { gfm = true, breaks = false, headingIds = true }: MarkdownOptions = {}): string {
  const marked = new Marked({ gfm, breaks, async: false });
  if (headingIds) {
    const seen = new Map<string, number>();
    marked.use({
      renderer: {
        heading(this: { parser: { parseInline: (t: Tokens.Heading['tokens']) => string } }, { tokens, depth, text }: Tokens.Heading) {
          const base = slugifyHeading(text) || 'section';
          const n = seen.get(base) ?? 0;
          seen.set(base, n + 1);
          const id = n ? `${base}-${n}` : base;
          return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
        },
      },
    });
  }
  return marked.parse(md) as string;
}

export interface TocEntry {
  depth: number;
  text: string;
  id: string;
}

/** Table of contents from ATX headings (ignores fenced code blocks). */
export function extractToc(md: string): TocEntry[] {
  const toc: TocEntry[] = [];
  const seen = new Map<string, number>();
  let inFence = false;
  for (const line of md.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const text = m[2].replace(/[*_`]/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
    const base = slugifyHeading(text) || 'section';
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    toc.push({ depth: m[1].length, text, id: n ? `${base}-${n}` : base });
  }
  return toc;
}

const PREVIEW_CSS = `
:root { color-scheme: light; --fg:#1f2328; --muted:#59636e; --border:#d1d9e0; --code-bg:#f6f8fa; --link:#0969da; --bg:#ffffff; }
:root[data-theme="dark"] { color-scheme: dark; --fg:#e6edf3; --muted:#9198a1; --border:#3d444d; --code-bg:#151b23; --link:#4493f8; --bg:#0d1117; }
* { box-sizing: border-box; }
body { margin:0; padding:24px 32px; background:var(--bg); color:var(--fg); font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif; word-wrap:break-word; }
h1,h2,h3,h4,h5,h6 { margin:24px 0 16px; font-weight:600; line-height:1.25; }
h1 { font-size:2em; padding-bottom:.3em; border-bottom:1px solid var(--border); }
h2 { font-size:1.5em; padding-bottom:.3em; border-bottom:1px solid var(--border); }
h3 { font-size:1.25em; } h4 { font-size:1em; } h5 { font-size:.875em; } h6 { font-size:.85em; color:var(--muted); }
body > :first-child { margin-top:0; }
p, ul, ol, blockquote, pre, table, dl { margin:0 0 16px; }
a { color:var(--link); text-decoration:none; } a:hover { text-decoration:underline; }
ul, ol { padding-left:2em; } li + li { margin-top:.25em; }
li > input[type=checkbox] { margin:0 .4em .2em -1.4em; vertical-align:middle; }
ul:has(> li > input[type=checkbox]) { list-style:none; }
blockquote { padding:0 1em; color:var(--muted); border-left:.25em solid var(--border); }
code, pre { font-family:ui-monospace,SFMono-Regular,"JetBrains Mono",Menlo,Consolas,monospace; font-size:85%; }
code { padding:.2em .4em; background:var(--code-bg); border-radius:6px; }
pre { padding:16px; overflow:auto; line-height:1.45; background:var(--code-bg); border-radius:6px; }
pre code { padding:0; background:transparent; font-size:100%; }
table { border-collapse:collapse; display:block; width:max-content; max-width:100%; overflow:auto; }
th, td { padding:6px 13px; border:1px solid var(--border); }
th { font-weight:600; } tr:nth-child(2n) { background:var(--code-bg); }
hr { height:.25em; margin:24px 0; background:var(--border); border:0; }
img { max-width:100%; }
del { color:var(--muted); }
`;

/** Full HTML document for previewing or exporting rendered markdown. */
export function buildMarkdownDocument(bodyHtml: string, { theme = 'light', title = 'Document' }: { theme?: 'light' | 'dark'; title?: string } = {}): string {
  const safeTitle = title.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!);
  return `<!doctype html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<base target="_blank">
<style>${PREVIEW_CSS}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}
