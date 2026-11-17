export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error';

export interface ConsoleEntry {
  id: number;
  level: ConsoleLevel;
  text: string;
}

export interface PreviewMessage {
  source: 'html-preview';
  level: ConsoleLevel;
  args: string[];
}

export interface Viewport {
  id: string;
  label: string;
  width: number | null; // null = fit to pane
}

export const VIEWPORTS: Viewport[] = [
  { id: 'fit', label: 'Fit', width: null },
  { id: 'mobile', label: 'Mobile', width: 375 },
  { id: 'tablet', label: 'Tablet', width: 768 },
  { id: 'desktop', label: 'Desktop', width: 1280 },
];

const CSS_RESET = `<style data-html-preview-reset>*,*::before,*::after{box-sizing:border-box}body{margin:0}img,picture,video,canvas,svg{display:block;max-width:100%}input,button,textarea,select{font:inherit}</style>`;

/**
 * Script injected into the preview iframe. Forwards console output and
 * runtime errors to the parent window via postMessage.
 */
const CONSOLE_BRIDGE = `<script data-html-preview-bridge>(function(){
  function fmt(v){
    if (typeof v === 'string') return v;
    if (v instanceof Error) return v.name + ': ' + v.message;
    if (typeof v === 'function') return v.toString();
    if (v === undefined) return 'undefined';
    try { return JSON.stringify(v, null, 2); } catch (e) { return String(v); }
  }
  function send(level, args){
    try {
      parent.postMessage({ source: 'html-preview', level: level, args: Array.prototype.map.call(args, fmt) }, '*');
    } catch (e) {}
  }
  ['log','info','warn','error','debug'].forEach(function(m){
    var orig = console[m];
    console[m] = function(){
      send(m === 'debug' ? 'log' : m, arguments);
      if (orig) orig.apply(console, arguments);
    };
  });
  window.addEventListener('error', function(e){
    send('error', [e.message + (e.lineno ? ' (line ' + e.lineno + ')' : '')]);
  });
  window.addEventListener('unhandledrejection', function(e){
    send('error', ['Unhandled promise rejection: ' + fmt(e.reason)]);
  });
})();<\/script>`.replace(/\n\s*/g, '');  // single line so error line numbers match user code

export interface BuildOptions {
  cssReset: boolean;
  console: boolean;
}

/**
 * Builds the srcdoc for the preview iframe. Wraps HTML fragments in a minimal
 * document and injects the console bridge / CSS reset at the start of <head>.
 */
export function buildSrcDoc(code: string, opts: BuildOptions): string {
  const inject = (opts.console ? CONSOLE_BRIDGE : '') + (opts.cssReset ? CSS_RESET : '');
  if (!inject) return code;

  if (/<head[^>]*>/i.test(code)) {
    return code.replace(/<head[^>]*>/i, (m) => m + inject);
  }
  if (/<html[^>]*>/i.test(code)) {
    return code.replace(/<html[^>]*>/i, (m) => `${m}<head>${inject}</head>`);
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${inject}</head><body>${code}</body></html>`;
}

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr',
]);
const RAW_TAGS = new Set(['script', 'style', 'pre', 'textarea']);

/**
 * Lightweight HTML formatter: puts each tag on its own line and indents by
 * nesting depth. Contents of <script>, <style>, <pre> and <textarea> are kept as-is.
 */
export function formatHtml(html: string, indent = '  '): string {
  const tokens = html.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g);
  if (!tokens) return html;

  const lines: string[] = [];
  let depth = 0;
  let rawTag: string | null = null;
  let rawBuffer = '';

  for (const token of tokens) {
    if (rawTag) {
      if (new RegExp(`^</${rawTag}\\s*>$`, 'i').test(token)) {
        const body = rawBuffer.replace(/^\n+|\s+$/g, '');
        if (body) {
          if (rawTag === 'pre' || rawTag === 'textarea') {
            lines[lines.length - 1] += body + token;
          } else {
            lines.push(...reindentBlock(body, indent.repeat(depth)));
            lines.push(indent.repeat(depth - 1) + token);
          }
        } else {
          lines[lines.length - 1] += token;
        }
        depth--;
        rawTag = null;
        rawBuffer = '';
      } else {
        rawBuffer += token;
      }
      continue;
    }

    const text = token.trim();
    if (!text) continue;

    if (text.startsWith('</')) {
      depth = Math.max(0, depth - 1);
      lines.push(indent.repeat(depth) + text);
      continue;
    }

    if (text.startsWith('<') && !text.startsWith('<!')) {
      const name = (text.match(/^<([a-zA-Z0-9-]+)/)?.[1] || '').toLowerCase();
      lines.push(indent.repeat(depth) + text);
      if (RAW_TAGS.has(name)) {
        rawTag = name;
        depth++;
      } else if (!VOID_TAGS.has(name) && !text.endsWith('/>')) {
        depth++;
      }
      continue;
    }

    // Comments, doctype, text
    lines.push(indent.repeat(depth) + text.replace(/\s+/g, ' '));
  }

  if (rawTag && rawBuffer) lines.push(rawBuffer);

  return collapseShortElements(lines).join('\n') + '\n';
}

/** Re-indents a code block, keeping its relative indentation. */
function reindentBlock(block: string, prefix: string): string[] {
  const lines = block.split('\n');
  const minIndent = Math.min(
    ...lines.filter((l) => l.trim()).map((l) => l.match(/^\s*/)?.[0].length ?? 0),
  );
  return lines.map((l) => (l.trim() ? prefix + l.slice(minIndent) : ''));
}

/** Joins `<tag>`, `text`, `</tag>` triples back onto one line when short. */
function collapseShortElements(lines: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i];
    const text = lines[i + 1];
    const close = lines[i + 2];
    if (
      text !== undefined &&
      close !== undefined &&
      /^\s*<[a-zA-Z][^>]*>$/.test(open) &&
      !/^\s*</.test(text) &&
      /^\s*<\/[a-zA-Z][^>]*>$/.test(close) &&
      open.trim().length + text.trim().length + close.trim().length < 100
    ) {
      out.push(open + text.trim() + close.trim());
      i += 2;
    } else {
      out.push(open);
    }
  }
  return out;
}

export interface Template {
  id: string;
  label: string;
  code: string;
}

export const TEMPLATES: Template[] = [
  {
    id: 'boilerplate',
    label: 'HTML5 Boilerplate',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello World</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: grid;
      place-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #fdf2f8, #eef2ff);
      color: #1f2937;
    }
    h1 { margin: 0 0 .5rem; }
  </style>
</head>
<body>
  <main>
    <h1>Hello, World!</h1>
    <p>Edit the HTML on the left to see it rendered here.</p>
  </main>
  <script>
    console.log('Page loaded at', new Date().toLocaleTimeString());
  </script>
</body>
</html>
`,
  },
  {
    id: 'cards',
    label: 'Flexbox Cards',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #f8fafc; }
    .grid { display: flex; flex-wrap: wrap; gap: 1rem; }
    .card {
      flex: 1 1 220px;
      background: #fff;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgb(0 0 0 / .08);
    }
    .card h3 { margin: 0 0 .5rem; }
    .card p { margin: 0; color: #64748b; }
  </style>
</head>
<body>
  <div class="grid">
    <div class="card"><h3>Fast</h3><p>Renders instantly in your browser.</p></div>
    <div class="card"><h3>Responsive</h3><p>Resize the viewport to test layouts.</p></div>
    <div class="card"><h3>Private</h3><p>Nothing leaves your machine.</p></div>
  </div>
</body>
</html>
`,
  },
  {
    id: 'form',
    label: 'Form',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 420px; margin: auto; }
    label { display: block; margin-top: 1rem; font-weight: 600; }
    input, textarea { width: 100%; padding: .5rem; margin-top: .25rem; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; }
    button { margin-top: 1rem; padding: .6rem 1.2rem; border: 0; border-radius: 6px; background: #4f46e5; color: #fff; cursor: pointer; }
  </style>
</head>
<body>
  <form id="contact">
    <label>Name <input name="name" required></label>
    <label>Email <input name="email" type="email" required></label>
    <label>Message <textarea name="message" rows="4"></textarea></label>
    <button type="submit">Send</button>
  </form>
  <script>
    document.getElementById('contact').addEventListener('submit', (e) => {
      e.preventDefault();
      console.log(Object.fromEntries(new FormData(e.target)));
    });
  </script>
</body>
</html>
`,
  },
  {
    id: 'counter',
    label: 'JS Counter',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; }
    .count { font-size: 4rem; font-weight: 800; text-align: center; }
    button { font-size: 1.25rem; width: 3rem; height: 3rem; border-radius: 50%; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; }
    .row { display: flex; gap: 1rem; justify-content: center; }
  </style>
</head>
<body>
  <div>
    <div class="count" id="count">0</div>
    <div class="row">
      <button id="dec">−</button>
      <button id="inc">+</button>
    </div>
  </div>
  <script>
    let n = 0;
    const el = document.getElementById('count');
    const update = (d) => { n += d; el.textContent = n; console.log('count =', n); };
    document.getElementById('inc').onclick = () => update(1);
    document.getElementById('dec').onclick = () => update(-1);
  </script>
</body>
</html>
`,
  },
];
