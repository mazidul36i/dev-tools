import { useState, useCallback, useMemo, useRef, useEffect, useDeferredValue, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { Search, X, ChevronUp, ChevronDown, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Checkbox from '@components/ui/Checkbox';
import SegmentedControl from '@components/ui/SegmentedControl';
import { EditorPanel, OutputPanel, SplitPane, Toolbar, ToolbarDivider, ToolbarSelect, ToolbarSpacer } from '@components/workspace';
import JsonTreeView from './JsonTreeView';
import HighlightedOutput from './HighlightedOutput';
import { formatJSON, minifyJSON, stringifyJSON, parseStringifiedJSON, parseDtoString } from '@lib/json-utils';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import { useShareInput } from '@hooks/useShareInput';

const MODES = ['format', 'minify', 'stringify', 'parse', 'dto'] as const;
type Mode = (typeof MODES)[number];

const modeLabels: Record<Mode, string> = {
  format: 'Format',
  minify: 'Minify',
  stringify: 'Stringify',
  parse: 'Parse',
  dto: 'DTO → JSON',
};

const placeholders: Record<Mode, string> = {
  format: '{"example":{"property":"value","numbers":[1,2,3]}}',
  minify: '{\n  "example": "value",\n  "numbers": [1, 2, 3]\n}',
  stringify: '{\n  "example": "value"\n}',
  parse: '"{\\"example\\": \\"value\\"}"',
  dto: 'ClassName(uuid=abc, flowId=123, status=null)',
};

const SAMPLE = '{"id":42,"name":"DevTools","active":true,"tags":["json","format"],"owner":{"login":"octo","plan":null},"stats":{"stars":1280,"ratio":0.97}}';

const schema = {
  mode: opt.oneOf(MODES, 'format'),
  indent: opt.oneOf(['2', '4', 'tab'] as const, '2'),
  view: opt.oneOf(['text', 'tree'] as const, 'text'),
  strip: opt.bool(true),
  detect: opt.bool(true),
};

interface Result {
  output: string;
  parsed: unknown;
  error: string | null;
}

function run(mode: Mode, input: string, o: { indent: string; strip: boolean; detect: boolean }): Result {
  const text = input.trim();
  if (!text) return { output: '', parsed: null, error: null };
  try {
    switch (mode) {
      case 'format': {
        const obj = JSON.parse(text);
        return { output: formatJSON(obj, o.indent), parsed: obj, error: null };
      }
      case 'minify':
        return { output: minifyJSON(text), parsed: null, error: null };
      case 'stringify':
        return { output: stringifyJSON(text), parsed: null, error: null };
      case 'parse': {
        const out = parseStringifiedJSON(text);
        return { output: out, parsed: JSON.parse(out), error: null };
      }
      case 'dto': {
        const obj = parseDtoString(text, o.detect, o.strip);
        return { output: JSON.stringify(obj, null, 2), parsed: obj, error: null };
      }
    }
  } catch (e) {
    return { output: '', parsed: null, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Count search matches across all keys and values in JSON data (mirrors tree render order). */
function countJsonMatches(data: unknown, search: string, parentKey: string | number | null = null): number {
  if (!search) return 0;
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');
  let count = 0;
  const dataIsObject = data !== null && typeof data === 'object';
  if (parentKey !== null) {
    const keyStr = !dataIsObject ? `"${parentKey}"` : typeof parentKey === 'number' ? String(parentKey) : `"${parentKey}"`;
    count += (keyStr.match(regex) || []).length;
  }
  if (data === null) return count;
  if (!dataIsObject) {
    const valStr = typeof data === 'string' ? `"${data}"` : String(data);
    count += (valStr.match(regex) || []).length;
  } else {
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      count += countJsonMatches(v, search, Array.isArray(data) ? Number(k) : k);
    }
  }
  return count;
}

function describe(value: unknown): string {
  if (Array.isArray(value)) return `array · ${value.length} ${value.length === 1 ? 'item' : 'items'}`;
  if (value && typeof value === 'object') {
    const n = Object.keys(value).length;
    return `object · ${n} ${n === 1 ? 'key' : 'keys'}`;
  }
  return typeof value;
}

interface SearchBarProps {
  text: string;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  matchIndex: number;
  setMatchIndex: Dispatch<SetStateAction<number>>;
  matchCountOverride?: number;
  /** Ctrl/⌘+F focuses the search only while focus is inside this element. */
  scopeRef: RefObject<HTMLElement | null>;
}

function OutputSearchBar({ text, search, setSearch, matchIndex, setMatchIndex, matchCountOverride, scopeRef }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const matchCount = useMemo(() => {
    if (matchCountOverride !== undefined) return matchCountOverride;
    if (!search || !text) return 0;
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return (text.match(new RegExp(escaped, 'gi')) || []).length;
  }, [text, search, matchCountOverride]);

  const goNext = useCallback(() => setMatchIndex((i) => (matchCount > 0 ? (i + 1) % matchCount : 0)), [matchCount, setMatchIndex]);
  const goPrev = useCallback(() => setMatchIndex((i) => (matchCount > 0 ? (i - 1 + matchCount) % matchCount : 0)), [matchCount, setMatchIndex]);
  const clear = () => { setSearch(''); setMatchIndex(0); };

  // Only take over Ctrl/⌘+F while working in the tool; the browser's find works elsewhere.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && scopeRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [scopeRef]);

  const iconBtn = 'inline-flex items-center justify-center w-6 h-6 rounded text-text-muted hover:text-text hover:bg-surface-hover focus-ring';
  return (
    <div className="flex items-center gap-1 h-7 pl-2 pr-1 rounded-md border border-border-strong bg-surface-alt focus-within:border-primary">
      <Search size={13} aria-hidden="true" className="text-text-muted shrink-0" />
      <input
        ref={inputRef}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setMatchIndex(0); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); if (e.shiftKey) goPrev(); else goNext(); }
          if (e.key === 'Escape') clear();
        }}
        placeholder="Find in output"
        aria-label="Find in output"
        aria-keyshortcuts="Control+F Meta+F"
        className="w-24 sm:w-32 bg-transparent text-xs text-text placeholder:text-text-muted focus:outline-none"
      />
      {search && (
        <>
          <span className="text-[11px] text-text-muted tabular-nums whitespace-nowrap" aria-live="polite">
            {matchCount > 0 ? `${matchIndex + 1}/${matchCount}` : '0/0'}
          </span>
          <button type="button" onClick={goPrev} className={iconBtn} aria-label="Previous match" title="Previous (Shift+Enter)"><ChevronUp size={13} aria-hidden="true" /></button>
          <button type="button" onClick={goNext} className={iconBtn} aria-label="Next match" title="Next (Enter)"><ChevronDown size={13} aria-hidden="true" /></button>
          <button type="button" onClick={clear} className={iconBtn} aria-label="Clear search"><X size={13} aria-hidden="true" /></button>
        </>
      )}
    </div>
  );
}

export default function JsonFormatterPage() {
  const [input, setInput] = useState('');
  const [o, setO] = useUrlOptions(schema, { persist: { view: 'json-formatter-view' } });
  const [search, setSearch] = useState('');
  const [matchIdx, setMatchIdx] = useState(0);
  const [signal, setSignal] = useState<string | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Typing stays responsive on large documents; the result catches up.
  const deferredInput = useDeferredValue(input);
  const result = useMemo(() => run(o.mode, deferredInput, o), [o, deferredInput]);

  const treeCapable = o.mode === 'format' || o.mode === 'parse' || o.mode === 'dto';
  const showTree = treeCapable && o.view === 'tree' && result.parsed !== null;

  useShareInput({ input, mode: o.mode }, (d) => {
    if (d.input !== undefined) setInput(d.input);
    if (MODES.includes(d.mode as Mode)) setO({ mode: d.mode as Mode });
  }, { enabled: input.length > 0 });

  // A new result resets the find position.
  useEffect(() => setMatchIdx(0), [result.output]);

  const status = result.error
    ? null
    : result.output
      ? result.parsed !== null ? `Valid JSON · ${describe(result.parsed)}` : 'Valid JSON'
      : null;

  return (
    <ToolLayout
      seoTitle="JSON Formatter & Validator"
      tagline="Format, validate, minify and convert JSON. Results update as you type."
      metaDescription="Format, validate and prettify JSON data. Minify, stringify/parse escaped JSON, convert Java DTO toString() output, and browse it as a tree."
      variant="workspace"
      about={
        <div className="space-y-3">
          <p>
            Paste JSON on the left; the result updates as you type. <strong>Format</strong> pretty-prints with your chosen indent,{' '}
            <strong>Minify</strong> removes whitespace, <strong>Stringify</strong> escapes JSON into a string literal and <strong>Parse</strong>{' '}
            reverses it. <strong>DTO → JSON</strong> converts Java/Lombok <code>toString()</code> output such as{' '}
            <code>User(id=1, name=Ann)</code>.
          </p>
          <p>
            Switch the output to <strong>Tree</strong> to fold nodes and copy a value’s JSON path. Use <kbd>Ctrl/⌘ F</kbd> while in the tool
            to find in the output, and <strong>Use as input</strong> to chain operations. Nothing leaves your browser.
          </p>
        </div>
      }
    >
      <div ref={workspaceRef} className="flex flex-col flex-1 min-h-0">
        <Toolbar>
          <SegmentedControl
            ariaLabel="Operation"
            options={MODES.map((m) => ({ id: m, label: modeLabels[m] }))}
            value={o.mode}
            onChange={(id) => setO({ mode: id as Mode })}
          />
          {(o.mode === 'format' || o.mode === 'dto') && <ToolbarDivider />}
          {o.mode === 'format' && (
            <ToolbarSelect
              label="Indent"
              value={o.indent}
              onChange={(v) => setO({ indent: v as typeof o.indent })}
              options={[{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: 'tab', label: 'Tab' }]}
            />
          )}
          {o.mode === 'dto' && (
            <>
              <Checkbox checked={o.strip} onChange={(v) => setO({ strip: v })} label="Strip class name" className="text-xs" />
              <Checkbox checked={o.detect} onChange={(v) => setO({ detect: v })} label="Detect types" className="text-xs" />
            </>
          )}
          {/* Output view controls sit at the end of the toolbar so the output header stays one row. */}
          {result.output && (
            <>
              <ToolbarSpacer />
              <OutputSearchBar
                text={result.output}
                search={search}
                setSearch={setSearch}
                matchIndex={matchIdx}
                setMatchIndex={setMatchIdx}
                matchCountOverride={showTree ? countJsonMatches(result.parsed, search) : undefined}
                scopeRef={workspaceRef}
              />
              {showTree && (
                <>
                  <button type="button" onClick={() => setSignal(`expand-${Date.now()}`)} className={treeBtn} title="Expand all" aria-label="Expand all">
                    <ChevronsUpDown size={14} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => setSignal(`collapse-${Date.now()}`)} className={treeBtn} title="Collapse all" aria-label="Collapse all">
                    <ChevronsDownUp size={14} aria-hidden="true" />
                  </button>
                </>
              )}
              {treeCapable && result.parsed !== null && (
                <SegmentedControl
                  ariaLabel="Output view"
                  options={[{ id: 'text', label: 'Text' }, { id: 'tree', label: 'Tree' }]}
                  value={o.view}
                  onChange={(id) => setO({ view: id as 'text' | 'tree' })}
                />
              )}
            </>
          )}
        </Toolbar>

        <SplitPane
          storageKey="json-formatter"
          left={
            <EditorPanel
              label="Input"
              value={input}
              onChange={setInput}
              placeholder={placeholders[o.mode]}
              sample={o.mode === 'format' || o.mode === 'minify' ? SAMPLE : undefined}
              fileAccept=".json,application/json,text/plain"
              className="flex-1"
            />
          }
          right={
            <OutputPanel
              value={result.output}
              error={result.error}
              errorTitle="Invalid input"
              placeholder="Formatted JSON appears here"
              status={status}
              downloadName={o.mode === 'stringify' ? 'output.txt' : 'output.json'}
              downloadMime="application/json"
              onUseAsInput={() => { setInput(result.output); setSearch(''); }}
              className="flex-1"
            >
              {showTree ? (
                <div className="p-3 font-mono text-[13px]">
                  <JsonTreeView data={result.parsed} collapseSignal={signal} search={search} activeMatchIndex={matchIdx} />
                </div>
              ) : search && result.output ? (
                <HighlightedOutput
                  text={result.output}
                  search={search}
                  activeIndex={matchIdx}
                  className="h-full p-3 font-mono text-[13px] leading-relaxed text-text"
                />
              ) : undefined}
            </OutputPanel>
          }
        />
      </div>
    </ToolLayout>
  );
}

const treeBtn = 'inline-flex items-center justify-center w-7 h-7 rounded-md text-text-secondary hover:text-text hover:bg-surface-hover focus-ring';
