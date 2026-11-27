import { useCallback, useDeferredValue, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { Download, ListTree } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Checkbox from '@components/ui/Checkbox';
import CopyButton from '@components/ui/CopyButton';
import SegmentedControl from '@components/ui/SegmentedControl';
import { EditorPanel, Panel, SplitPane, Toolbar, ToolbarDivider } from '@components/workspace';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import { useShareInput } from '@hooks/useShareInput';
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

const schema = {
  view: opt.oneOf(['split', 'editor', 'preview'] as const, 'split'),
  theme: opt.oneOf(['auto', 'light', 'dark'] as const, 'auto'),
  gfm: opt.bool(true),
  breaks: opt.bool(false),
};

const action =
  'inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs text-text-secondary hover:text-text hover:bg-surface-hover transition-colors focus-ring';

export default function MarkdownPreviewPage() {
  const { isDark } = useTheme();
  const [markdown, setMarkdown] = useLocalStorage('markdown-preview:doc', SAMPLE);
  const [o, setO] = useUrlOptions(schema);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewTheme = o.theme === 'auto' ? (isDark ? 'dark' : 'light') : o.theme;

  const deferred = useDeferredValue(markdown);
  const html = useMemo(
    () => DOMPurify.sanitize(renderMarkdown(deferred, { gfm: o.gfm, breaks: o.breaks }), { ADD_ATTR: ['target'] }),
    [deferred, o.gfm, o.breaks],
  );
  const srcDoc = useMemo(() => buildMarkdownDocument(html, { theme: previewTheme }), [html, previewTheme]);
  const words = useMemo(() => deferred.match(/[\p{L}\p{N}]+/gu)?.length ?? 0, [deferred]);

  useShareInput({ markdown }, (d) => d.markdown !== undefined && setMarkdown(d.markdown), { enabled: markdown.length > 0 });

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

  const editor = (
    <EditorPanel
      label="Markdown"
      value={markdown}
      onChange={setMarkdown}
      placeholder="# Write markdown here"
      sample={SAMPLE}
      fileAccept=".md,.markdown,text/markdown,text/plain"
      status={`${words.toLocaleString()} words`}
      className="flex-1"
      textareaClassName="[tab-size:4] font-mono"
      actions={
        <button type="button" onClick={copyToc} className={action}>
          <ListTree size={13} aria-hidden="true" /> Copy TOC
        </button>
      }
    />
  );

  const preview = (
    <Panel
      title="Preview"
      className="flex-1 min-h-96 lg:min-h-0"
      bodyClassName="flex flex-col"
      actions={
        <>
          <CopyButton text={html} label="HTML" size="sm" className="h-7! border-transparent! bg-transparent! hover:bg-surface-hover! text-text-secondary hover:text-text" />
          <button type="button" onClick={() => downloadFile(markdown, 'document.md', 'text/markdown')} className={action}>
            <Download size={13} aria-hidden="true" /> .md
          </button>
          <button type="button" onClick={() => downloadFile(buildMarkdownDocument(html, { theme: previewTheme, title }), 'document.html', 'text/html')} className={action}>
            <Download size={13} aria-hidden="true" /> .html
          </button>
        </>
      }
    >
      <PreviewFrame
        iframeRef={iframeRef}
        srcDoc={srcDoc}
        allowScripts={false}
        width={null}
        background={previewTheme === 'dark' ? 'dark' : 'white'}
        reloadKey={0}
        title="Markdown preview"
      />
    </Panel>
  );

  return (
    <ToolLayout
      seoTitle="Markdown Editor & Live Preview – GitHub Flavoured Markdown"
      tagline="Write GitHub-flavoured markdown with a live, sanitised preview, then export HTML"
      metaDescription="Online markdown editor with live preview: GitHub-flavoured markdown tables, task lists and code blocks, light/dark preview, table of contents and HTML export. Sanitised and rendered locally."
      variant="workspace"
      about={
        <>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['# Heading', 'Headings (# to ######)'],
              ['**bold** _italic_', 'Emphasis'],
              ['[text](url)', 'Link; ![alt](src) for images'],
              ['`code` / ```lang', 'Inline code / fenced block'],
              ['- item / 1. item', 'Bulleted / numbered list'],
              ['- [ ] task', 'Task list (GFM)'],
              ['| a | b |', 'Table; add |---|---| below the header'],
              ['> quote', 'Blockquote'],
            ].map(([syntax, meaning]) => (
              <div key={syntax} className="rounded-md border border-border bg-surface-alt p-2.5">
                <code className="text-[13px] text-text">{syntax}</code>
                <p className="mt-0.5 text-xs text-text-muted">{meaning}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Output is sanitised with DOMPurify and shown in a sandboxed frame without scripts. Your document is kept in this browser’s local storage.
          </p>
        </>
      }
    >
      <Toolbar>
        <SegmentedControl ariaLabel="Layout" options={[{ id: 'split', label: 'Split' }, { id: 'editor', label: 'Editor' }, { id: 'preview', label: 'Preview' }]} value={o.view} onChange={(v) => setO({ view: v as typeof o.view })} />
        <ToolbarDivider />
        <span className="text-xs text-text-muted">Preview theme</span>
        <SegmentedControl ariaLabel="Preview theme" options={[{ id: 'auto', label: 'Auto' }, { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }]} value={o.theme} onChange={(v) => setO({ theme: v as typeof o.theme })} />
        <Checkbox checked={o.gfm} onChange={(v) => setO({ gfm: v })} label="GFM" className="text-xs" />
        <Checkbox checked={o.breaks} onChange={(v) => setO({ breaks: v })} label="Line breaks" className="text-xs" />
      </Toolbar>
      {o.view === 'split' ? (
        <SplitPane storageKey="markdown-preview" left={editor} right={preview} />
      ) : (
        <div className="flex flex-col flex-1 min-h-0">{o.view === 'editor' ? editor : preview}</div>
      )}
    </ToolLayout>
  );
}
