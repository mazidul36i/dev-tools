import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Play,
  Download,
  Upload,
  Eraser,
  ExternalLink,
  Maximize2,
  X,
  WandSparkles,
  RotateCw,
} from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import Button, { SecondaryButton } from '@components/ui/Button';
import CopyButton from '@components/ui/CopyButton';
import Checkbox from '@components/ui/Checkbox';
import SegmentedControl from '@components/ui/SegmentedControl';
import ResizablePanels from '@components/ui/ResizablePanels';
import useLocalStorage from '@hooks/useLocalStorage';
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

const editorClass =
  'w-full h-full flex-1 p-4 bg-white/30 dark:bg-gray-900/30 border border-white/50 dark:border-gray-700/50 rounded-xl font-mono text-sm leading-relaxed text-gray-900 dark:text-gray-100 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15 dark:focus:ring-white/15 focus:border-transparent transition-all';
const selectClass =
  'border border-white/60 dark:border-gray-700/60 rounded-lg px-2.5 py-1.5 text-xs bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 focus-ring';
const labelClass = 'block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide';
const linkBtnClass =
  'inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded transition-colors focus-ring';
const divider = <div className="hidden sm:block w-px h-6 bg-gray-300/50 dark:bg-gray-600/50 mx-0.5" />;

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

export default function HtmlPreviewPage() {
  const [code, setCode] = useLocalStorage('html-preview:code', TEMPLATES[0].code);
  const [mode, setMode] = useLocalStorage<RenderMode>('html-preview:mode', 'live');
  const [layout, setLayout] = useLocalStorage<LayoutMode>('html-preview:layout', 'split');
  const [viewportId, setViewportId] = useLocalStorage('html-preview:viewport', 'fit');
  const [background, setBackground] = useLocalStorage<PreviewBackground>('html-preview:background', 'white');
  const [cssReset, setCssReset] = useLocalStorage('html-preview:css-reset', false);
  const [allowScripts, setAllowScripts] = useLocalStorage('html-preview:scripts', true);
  const [consoleOpen, setConsoleOpen] = useLocalStorage('html-preview:console-open', true);

  const [renderedCode, setRenderedCode] = useState(code);
  const [reloadKey, setReloadKey] = useState(0);
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Keyboard shortcuts: Ctrl/Cmd+Enter runs, Esc exits fullscreen.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        run();
      } else if (e.key === 'Escape' && fullscreen) {
        setFullscreen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [run, fullscreen]);

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

  const lineCount = code ? code.split('\n').length : 0;

  const editorPane = (
    <div className="flex flex-col min-h-0 h-full gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor="html-editor" className={labelClass}>
          HTML / CSS / JS
        </label>
        <div className="flex items-center gap-3">
          <button onClick={() => fileInputRef.current?.click()} className={linkBtnClass}>
            <Upload size={11} /> Upload
          </button>
          <button onClick={handleFormat} className={linkBtnClass}>
            <WandSparkles size={11} /> Format
          </button>
          <button onClick={handleClear} className={linkBtnClass}>
            <Eraser size={11} /> Clear
          </button>
        </div>
      </div>
      <div
        className={`flex-1 min-h-48 flex flex-col ${isDragOver ? 'ring-2 ring-blue-400 rounded-xl' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <textarea
          id="html-editor"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleEditorKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="Type or paste HTML here, or drop an .html file…"
          className={editorClass}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>
          {lineCount} lines · {code.length.toLocaleString()} chars
        </span>
        <span>Ctrl/⌘ + Enter to run · Tab to indent</span>
      </div>
    </div>
  );

  const previewPane = (
    <div className="flex flex-col min-h-0 h-full gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className={`${labelClass} inline-flex items-center gap-1.5`}>
          Preview
          {isDirty && (
            <span className="inline-flex items-center gap-1 normal-case tracking-normal text-amber-600 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> not rendered
            </span>
          )}
        </span>
        <div className="flex items-center gap-3">
          <button onClick={run} className={linkBtnClass} title="Reload preview">
            <RotateCw size={11} /> Reload
          </button>
          <button onClick={() => setFullscreen(true)} className={linkBtnClass} title="Fullscreen preview">
            <Maximize2 size={11} /> Fullscreen
          </button>
        </div>
      </div>
      {fullscreen ? (
        <div className="flex-1 min-h-48 grid place-items-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-xs text-gray-400">
          Showing in fullscreen
        </div>
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
        <ConsolePanel
          entries={logs}
          open={consoleOpen}
          onToggle={() => setConsoleOpen((v) => !v)}
          onClear={() => setLogs([])}
        />
      )}
    </div>
  );

  return (
    <ToolLayout
      title="HTML Preview"
      seoTitle="HTML Preview – Online HTML Editor & Viewer"
      tagline="Online HTML editor & viewer with live preview, device sizes and a console"
      metaDescription="Free online HTML editor with live preview. Write, run and test HTML, CSS and JavaScript in a sandboxed viewer with responsive device sizes and a built-in console."
    >
      <Card hover={false} className="lg:h-[calc(100vh-210px)] lg:min-h-152 flex flex-col">
        {/* Toolbar */}
        <div className="shrink-0 px-4 pt-3 pb-0 flex flex-wrap items-center gap-2">
          <SegmentedControl
            options={modeOptions}
            value={mode}
            onChange={(v) => setMode(v as RenderMode)}
            variant="glass"
          />
          <Button size="sm" onClick={run} title="Run (Ctrl/⌘ + Enter)" className="relative">
            <Play size={13} /> Run
            {isDirty && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-gray-800" />}
          </Button>

          {divider}

          <select
            value=""
            onChange={(e) => handleTemplate(e.target.value)}
            className={selectClass}
            aria-label="Load template"
          >
            <option value="" disabled>
              Templates…
            </option>
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <SegmentedControl
            options={VIEWPORTS.map((v) => ({ id: v.id, label: v.label }))}
            value={viewport.id}
            onChange={setViewportId}
            variant="glass"
          />
          <SegmentedControl
            options={layoutOptions}
            value={layout}
            onChange={(v) => setLayout(v as LayoutMode)}
            variant="glass"
            className="hidden md:flex"
          />
          <SegmentedControl
            options={backgroundOptions}
            value={background}
            onChange={(v) => setBackground(v as PreviewBackground)}
            variant="glass"
          />

          <Checkbox
            checked={allowScripts}
            onChange={setAllowScripts}
            label="JavaScript"
            className="text-xs text-gray-500 dark:text-gray-400 gap-1.5"
          />
          <Checkbox
            checked={cssReset}
            onChange={setCssReset}
            label="CSS reset"
            className="text-xs text-gray-500 dark:text-gray-400 gap-1.5"
          />

          {divider}

          <CopyButton text={code} label="Copy" size="sm" />
          <SecondaryButton onClick={handleDownload} title="Download .html">
            <Download size={14} />
          </SecondaryButton>
          <SecondaryButton onClick={handleOpenInTab} title="Open preview in new tab">
            <ExternalLink size={14} />
          </SecondaryButton>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.htm,.txt,.svg,text/html"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />

        {/* Panels */}
        <div className="p-4 flex-1 min-h-0 flex flex-col">
          {layout === 'split' ? (
            <ResizablePanels left={editorPane} right={previewPane} />
          ) : layout === 'stacked' ? (
            <div className="flex flex-col flex-1 min-h-0 gap-3">
              <div className="flex-1 min-h-0 flex flex-col">{editorPane}</div>
              <div className="flex-1 min-h-0 flex flex-col">{previewPane}</div>
            </div>
          ) : (
            previewPane
          )}
        </div>
      </Card>

      {/* Fullscreen preview overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-100 flex flex-col bg-gray-100 dark:bg-gray-950 p-3 gap-2">
          <div className="flex items-center justify-between">
            <span className={labelClass}>Preview · {viewport.label}</span>
            <SecondaryButton onClick={() => setFullscreen(false)} title="Exit fullscreen (Esc)">
              <X size={14} /> Close
            </SecondaryButton>
          </div>
          <PreviewFrame
            iframeRef={iframeRef}
            srcDoc={srcDoc}
            allowScripts={allowScripts}
            width={viewport.width}
            background={background}
            reloadKey={reloadKey}
          />
        </div>
      )}
    </ToolLayout>
  );
}
