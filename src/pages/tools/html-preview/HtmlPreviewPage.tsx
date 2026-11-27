import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Play, Download, ExternalLink, Maximize2, X, WandSparkles, RotateCw } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Button from '@components/ui/Button';
import CopyButton from '@components/ui/CopyButton';
import Checkbox from '@components/ui/Checkbox';
import SegmentedControl from '@components/ui/SegmentedControl';
import { EditorPanel, Panel, RunButton, SplitPane, Toolbar, ToolbarDivider, ToolbarSpacer, useRunShortcut } from '@components/workspace';
import useLocalStorage from '@hooks/useLocalStorage';
import useUrlOptions from '@hooks/useUrlOptions';
import { useShareInput } from '@hooks/useShareInput';
import { opt } from '@lib/url-state';
import { downloadFile } from '@lib/download-utils';
import {
  buildSrcDoc,
  formatHtml,
  TEMPLATES,
  VIEWPORTS,
  type ConsoleEntry,
  type PreviewMessage,
} from '@lib/html-preview-utils';
import PreviewFrame, { type PreviewBackground } from './PreviewFrame';
import ConsolePanel from './ConsolePanel';

type RenderMode = 'live' | 'manual';
type LayoutMode = 'split' | 'stacked' | 'preview';

const LIVE_DEBOUNCE_MS = 300;
const MAX_CONSOLE_ENTRIES = 500;

const modeOptions = [
  { id: 'live', label: 'Live' },
  { id: 'manual', label: 'On click' },
];
const layoutOptions = [
  { id: 'split', label: 'Split' },
  { id: 'stacked', label: 'Stacked' },
  { id: 'preview', label: 'Preview' },
];
const backgroundOptions = [
  { id: 'white', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'checker', label: 'Grid' },
];

const actionBtn =
  'inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs text-text-secondary hover:text-text hover:bg-surface-hover transition-colors focus-ring';

const schema = {
  mode: opt.oneOf(['live', 'manual'] as const, 'live'),
  layout: opt.oneOf(['split', 'stacked', 'preview'] as const, 'split'),
  vp: opt.oneOf(VIEWPORTS.map((v) => v.id) as [string, ...string[]], 'fit'),
  bg: opt.oneOf(['white', 'dark', 'checker'] as const, 'white'),
  reset: opt.bool(false),
  js: opt.bool(true),
};

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

export default function HtmlPreviewPage() {
  const [code, setCode] = useLocalStorage('html-preview:code', TEMPLATES[0].code);
  const [o, setO] = useUrlOptions(schema, {
    persist: {
      mode: 'html-preview:mode',
      layout: 'html-preview:layout',
      vp: 'html-preview:viewport',
      bg: 'html-preview:background',
      reset: 'html-preview:css-reset',
      js: 'html-preview:scripts',
    },
  });
  const mode = o.mode as RenderMode;
  const layout = o.layout as LayoutMode;
  const viewportId = o.vp;
  const background = o.bg as PreviewBackground;
  const cssReset = o.reset;
  const allowScripts = o.js;
  const [consoleOpen, setConsoleOpen] = useLocalStorage('html-preview:console-open', true);

  const [renderedCode, setRenderedCode] = useState(code);
  const [reloadKey, setReloadKey] = useState(0);
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);
  const [fullscreen, setFullscreen] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const logId = useRef(0);

  const viewport = VIEWPORTS.find((v) => v.id === viewportId) ?? VIEWPORTS[0];
  const isDirty = mode === 'manual' && code !== renderedCode;

  const srcDoc = useMemo(
    () => buildSrcDoc(renderedCode, { cssReset, console: allowScripts }),
    [renderedCode, cssReset, allowScripts],
  );

  // Live mode: render after the user pauses typing.
  useEffect(() => {
    if (mode !== 'live' || code === renderedCode) return;
    const t = setTimeout(() => setRenderedCode(code), LIVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [code, mode, renderedCode]);

  // Fresh console for every render.
  useEffect(() => {
    setLogs([]);
  }, [srcDoc, reloadKey]);

  // Receive console output from the preview iframe.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!iframeRef.current || e.source !== iframeRef.current.contentWindow) return;
      const data = e.data as PreviewMessage;
      if (data?.source !== 'html-preview' || !Array.isArray(data.args)) return;
      setLogs((prev) =>
        [...prev, { id: ++logId.current, level: data.level, text: data.args.join(' ') }].slice(-MAX_CONSOLE_ENTRIES),
      );
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const run = useCallback(() => {
    setRenderedCode(code);
    setReloadKey((k) => k + 1);
  }, [code]);

  useRunShortcut(run);

  // Esc leaves fullscreen.
  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && setFullscreen(false);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fullscreen]);

  // Shared code never runs on its own: it opens in "On click" mode with an empty preview.
  useShareInput({ code }, (d) => {
    if (d.code === undefined) return;
    setO({ mode: 'manual' });
    setCode(d.code);
    setRenderedCode('');
    toast.info('Shared code loaded. Review it, then press Run.');
  }, { enabled: code.trim().length > 0 });

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab' || e.shiftKey) return;
    e.preventDefault();
    // execCommand keeps the browser's undo history; fall back to setRangeText.
    if (!document.execCommand?.('insertText', false, '  ')) {
      const el = e.currentTarget;
      el.setRangeText('  ', el.selectionStart, el.selectionEnd, 'end');
      setCode(el.value);
    }
  };

  const handleTemplate = (id: string) => {
    const tpl = TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    const isUnchanged = !code.trim() || TEMPLATES.some((t) => t.code === code);
    if (!isUnchanged && !window.confirm('Replace your current code with this template?')) return;
    setCode(tpl.code);
    if (mode === 'manual') setRenderedCode(tpl.code);
    toast.success(`${tpl.label} loaded`);
  };

  const handleFormat = () => {
    if (!code.trim()) return toast.error('Nothing to format');
    setCode(formatHtml(code));
    toast.success('Formatted');
  };

  const handleClear = () => {
    setCode('');
    setRenderedCode('');
  };

  const handleDownload = () => {
    if (!code.trim()) return toast.error('Nothing to download');
    downloadFile(code, 'index.html', 'text/html');
  };

  // Opens the preview in a new tab, still sandboxed so it can't touch this app's storage.
  const handleOpenInTab = () => {
    if (!code.trim()) return toast.error('Nothing to open');
    const sandbox = ['allow-modals', 'allow-forms', 'allow-popups', allowScripts && 'allow-scripts'].filter(Boolean).join(' ');
    const doc = buildSrcDoc(code, { cssReset, console: false });
    const wrapper = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>HTML Preview</title><style>html,body{margin:0;height:100%}iframe{border:0;width:100%;height:100%;display:block}</style></head><body><iframe sandbox="${sandbox}" srcdoc="${escapeAttr(doc)}"></iframe></body></html>`;
    const url = URL.createObjectURL(new Blob([wrapper], { type: 'text/html' }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleFile = useCallback(
    (file: File) => {
      if (!/\.(html?|txt|svg)$/i.test(file.name)) return toast.error('Please upload an .html file');
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = String(e.target?.result ?? '');
        setCode(text);
        setRenderedCode(text);
        toast.success(`Loaded ${file.name}`);
      };
      reader.onerror = () => toast.error('Failed to read file');
      reader.readAsText(file);
    },
    [setCode],
  );

  const editorPane = (
    <EditorPanel
      label="HTML / CSS / JS"
      value={code}
      onChange={setCode}
      placeholder="Type or paste HTML here, or drop an .html file…"
      fileAccept=".html,.htm,.txt,.svg,text/html"
      onFile={handleFile}
      className="flex-1 min-h-64"
      status="Tab indents"
      textareaProps={{ onKeyDown: handleEditorKeyDown }}
      actions={
        <button type="button" onClick={handleFormat} className={actionBtn}>
          <WandSparkles size={13} aria-hidden="true" /> Format
        </button>
      }
    />
  );

  const previewPane = (
    <Panel
      title={
        <span className="inline-flex items-center gap-1.5">
          Preview
          {isDirty && (
            <span className="inline-flex items-center gap-1 normal-case tracking-normal font-normal text-warning">
              <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-warning" /> not rendered
            </span>
          )}
        </span>
      }
      className="flex-1 min-h-80"
      bodyClassName="flex flex-col"
      actions={
        <>
          <button type="button" onClick={run} className={actionBtn} title="Reload preview">
            <RotateCw size={13} aria-hidden="true" /> Reload
          </button>
          <button type="button" onClick={() => setFullscreen(true)} className={actionBtn} title="Fullscreen preview">
            <Maximize2 size={13} aria-hidden="true" /> Fullscreen
          </button>
          <button type="button" onClick={handleOpenInTab} className={actionBtn} title="Open the preview in a new tab">
            <ExternalLink size={13} aria-hidden="true" /> New tab
          </button>
        </>
      }
    >
      {fullscreen ? (
        <div className="flex-1 min-h-48 grid place-items-center text-xs text-text-muted">Showing in fullscreen</div>
      ) : (
        <PreviewFrame
          iframeRef={iframeRef}
          srcDoc={srcDoc}
          allowScripts={allowScripts}
          width={viewport.width}
          background={background}
          reloadKey={reloadKey}
          className="min-h-48"
        />
      )}
      {allowScripts && (
        <ConsolePanel entries={logs} open={consoleOpen} onToggle={() => setConsoleOpen((v) => !v)} onClear={() => setLogs([])} />
      )}
    </Panel>
  );

  return (
    <ToolLayout
      seoTitle="HTML Preview – Online HTML Editor & Viewer"
      tagline="Edit HTML, CSS and JavaScript with a sandboxed live preview, device sizes and a console"
      metaDescription="Free online HTML editor with live preview. Write, run and test HTML, CSS and JavaScript in a sandboxed viewer with responsive device sizes and a built-in console."
      variant="workspace"
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">Sandboxed.</strong> The preview runs in a sandboxed frame with a separate origin, so code can’t read this site’s storage or cookies.</li>
          <li><strong className="text-text">Live or on click.</strong> Live re-renders after you pause typing; On click waits for Run (Ctrl/⌘+Enter). Shared links always open in On click mode.</li>
          <li><strong className="text-text">Console.</strong> console.log, warnings, errors and uncaught exceptions from your scripts appear under the preview.</li>
        </ul>
      }
    >
      <Toolbar>
        <SegmentedControl ariaLabel="Render mode" options={modeOptions} value={mode} onChange={(v) => setO({ mode: v as RenderMode })} />
        <span className="relative">
          <RunButton onClick={run}><Play size={13} aria-hidden="true" /> Run</RunButton>
          {isDirty && <span aria-hidden="true" className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-warning ring-2 ring-bg" />}
        </span>
        <ToolbarDivider />
        <select value="" onChange={(e) => handleTemplate(e.target.value)} aria-label="Load template" className="h-7 pl-2 pr-7 rounded-md bg-surface-alt border border-border-strong text-xs text-text focus:outline-none focus:border-primary">
          <option value="" disabled>Templates…</option>
          {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <SegmentedControl ariaLabel="Viewport" options={VIEWPORTS.map((v) => ({ id: v.id, label: v.label }))} value={viewport.id} onChange={(v) => setO({ vp: v })} />
        <SegmentedControl ariaLabel="Layout" options={layoutOptions} value={layout} onChange={(v) => setO({ layout: v as LayoutMode })} className="hidden md:inline-flex" />
        <SegmentedControl ariaLabel="Preview background" options={backgroundOptions} value={background} onChange={(v) => setO({ bg: v as PreviewBackground })} />
        <Checkbox checked={allowScripts} onChange={(v) => setO({ js: v })} label="JavaScript" className="text-xs" />
        <Checkbox checked={cssReset} onChange={(v) => setO({ reset: v })} label="CSS reset" className="text-xs" />
        <ToolbarSpacer />
        <CopyButton text={code} label="Copy" size="sm" />
        <Button variant="secondary" size="sm" onClick={handleDownload}><Download size={13} aria-hidden="true" /> .html</Button>
      </Toolbar>

      {layout === 'split' ? (
        <SplitPane storageKey="html-preview" left={editorPane} right={previewPane} />
      ) : layout === 'stacked' ? (
        <div className="flex flex-col flex-1 min-h-0 gap-3">
          {editorPane}
          {previewPane}
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">{previewPane}</div>
      )}

      {fullscreen && (
        <div role="dialog" aria-modal="true" aria-label="Fullscreen preview" className="fixed inset-0 z-100 flex flex-col bg-bg p-3 gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Preview · {viewport.label}</span>
            <Button variant="secondary" size="sm" onClick={() => setFullscreen(false)} title="Exit fullscreen (Esc)" autoFocus>
              <X size={14} aria-hidden="true" /> Close
            </Button>
          </div>
          <PreviewFrame iframeRef={iframeRef} srcDoc={srcDoc} allowScripts={allowScripts} width={viewport.width} background={background} reloadKey={reloadKey} className="rounded-md border border-border" />
        </div>
      )}
    </ToolLayout>
  );
}
