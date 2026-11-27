import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { Clipboard, Download, Eraser, ListTree, Sparkles } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import Checkbox from '@components/ui/Checkbox';
import CopyButton from '@components/ui/CopyButton';
import SegmentedControl from '@components/ui/SegmentedControl';
import { SmallButton } from '@components/ui/Button';
import PreviewFrame from '@pages/tools/html-preview/PreviewFrame';
import { useTheme } from '@hooks/useTheme';
import useLocalStorage from '@hooks/useLocalStorage';
import { downloadFile } from '@lib/download-utils';
import { buildMarkdownDocument, extractToc, renderMarkdown } from '@lib/markdown-utils';

const SAMPLE = `# Project Title

A short description of **what this project does** and _why_ it exists.

## Features

- [x] GitHub-flavoured markdown
- [x] Tables, task lists and ~~strikethrough~~
- [ ] World domination

## Usage

\`\`\`bash
npm install
npm run dev
\`\`\`

Inline \`code\`, [links](https://example.com) and images work too.

| Option    | Type      | Default |
|-----------|-----------|---------|
| \`port\`    | number    | \`5173\`  |
| \`open\`    | boolean   | \`false\` |

> **Note**
> Everything is rendered in your browser — nothing is uploaded.

---

Made with ❤️
`;

const viewOptions = [
  { id: 'split', label: 'Split' },
  { id: 'editor', label: 'Editor' },
  { id: 'preview', label: 'Preview' },
];
const themeOptions = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export default function MarkdownPreviewPage() {
  const { isDark } = useTheme();
  const [markdown, setMarkdown] = useLocalStorage('markdown-preview:doc', SAMPLE);
  const [view, setView] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 1024 ? 'editor' : 'split'));
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>(isDark ? 'dark' : 'light');
  const [gfm, setGfm] = useState(true);
  const [breaks, setBreaks] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const html = useMemo(
    () => DOMPurify.sanitize(renderMarkdown(markdown, { gfm, breaks }), { ADD_ATTR: ['target'] }),
    [markdown, gfm, breaks],
  );
  const srcDoc = useMemo(() => buildMarkdownDocument(html, { theme: previewTheme }), [html, previewTheme]);
  const words = useMemo(() => markdown.match(/[\p{L}\p{N}]+/gu)?.length ?? 0, [markdown]);

  const paste = useCallback(async () => {
    try {
      setMarkdown(await navigator.clipboard.readText());
    } catch {
      toast.error('Unable to paste');
    }
  }, [setMarkdown]);

  const copyToc = useCallback(async () => {
    const toc = extractToc(markdown);
    if (!toc.length) {
      toast.error('No headings found');
      return;
    }
    const min = Math.min(...toc.map((t) => t.depth));
    const text = toc.map((t) => `${'  '.repeat(t.depth - min)}- [${t.text}](#${t.id})`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Table of contents copied');
    } catch {
      toast.error('Failed to copy');
    }
  }, [markdown]);

  const title = extractToc(markdown)[0]?.text ?? 'Document';

  return (
    <ToolLayout
      title="Markdown Preview"
      seoTitle="Markdown Editor & Live Preview – GitHub Flavoured Markdown"
      tagline="Write GitHub-flavoured markdown with a live preview, then export HTML"
      metaDescription="Online markdown editor with live preview: GitHub-flavoured markdown tables, task lists and code blocks, light/dark preview, table of contents and HTML export. Sanitised and rendered locally."
    >
      <Card hover={false}>
        <div className="p-4 md:p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl options={viewOptions} value={view} onChange={setView} />
            <SegmentedControl options={themeOptions} value={previewTheme} onChange={(v) => setPreviewTheme(v as 'light' | 'dark')} variant="glass" />
            <Checkbox checked={gfm} onChange={setGfm} label="GFM" />
            <Checkbox checked={breaks} onChange={setBreaks} label="Line breaks" />
            <span className="text-xs text-text-muted ml-auto">{words.toLocaleString()} words</span>
          </div>

          <div className={`grid gap-4 ${view === 'split' ? 'lg:grid-cols-2' : ''}`}>
            {view !== 'preview' && (
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                aria-label="Markdown"
                spellCheck={false}
                className="w-full h-[65vh] min-h-80 p-4 bg-surface border border-border rounded-xl font-mono text-sm text-text resize-none
                  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 [tab-size:4]"
              />
            )}
            {view !== 'editor' && (
              <div className="flex flex-col h-[65vh] min-h-80">
                <PreviewFrame
                  iframeRef={iframeRef}
                  srcDoc={srcDoc}
                  allowScripts={false}
                  width={null}
                  background={previewTheme === 'dark' ? 'dark' : 'white'}
                  reloadKey={0}
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <SmallButton onClick={() => setMarkdown('')}><Eraser size={12} /> Clear</SmallButton>
            <SmallButton onClick={paste}><Clipboard size={12} /> Paste</SmallButton>
            <SmallButton onClick={() => setMarkdown(SAMPLE)}><Sparkles size={12} /> Sample</SmallButton>
            <SmallButton onClick={copyToc}><ListTree size={12} /> Copy TOC</SmallButton>
            <span className="flex-1" />
            <CopyButton text={markdown} label="Copy Markdown" size="sm" />
            <CopyButton text={html} label="Copy HTML" size="sm" />
            <SmallButton onClick={() => downloadFile(markdown, 'document.md', 'text/markdown')}><Download size={12} /> .md</SmallButton>
            <SmallButton onClick={() => downloadFile(buildMarkdownDocument(html, { theme: previewTheme, title }), 'document.html', 'text/html')}>
              <Download size={12} /> .html
            </SmallButton>
          </div>
        </div>
      </Card>

      <InfoCard title="Markdown Quick Reference">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {[
            ['# Heading', 'Headings (# to ######)'],
            ['**bold** _italic_', 'Emphasis'],
            ['[text](url)', 'Link — ![alt](src) for images'],
            ['`code` / ```lang', 'Inline code / fenced block'],
            ['- item / 1. item', 'Bulleted / numbered list'],
            ['- [ ] task', 'Task list (GFM)'],
            ['| a | b |', 'Table — add |---|---| below header'],
            ['> quote', 'Blockquote'],
          ].map(([syntax, meaning]) => (
            <div key={syntax} className="bg-surface-alt rounded-lg p-3 border border-border">
              <code className="font-mono text-primary">{syntax}</code>
              <p className="text-xs text-text-muted mt-1">{meaning}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-4">
          Output is sanitised with DOMPurify and shown in a sandboxed frame without scripts. Your document is kept in this browser’s local storage.
        </p>
      </InfoCard>
    </ToolLayout>
  );
}
