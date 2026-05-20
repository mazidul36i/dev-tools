import { useState, useCallback, useMemo, useRef, useEffect, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';
import { Eraser, ChevronDown, FileJson2, Search, X, ChevronUp, ChevronsUpDown, Download, CornerDownLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import CopyButton from '@components/ui/CopyButton';
import Button, { SecondaryButton } from '@components/ui/Button';
import JsonTreeView from './JsonTreeView';
import HighlightedOutput from './HighlightedOutput';
import { formatJSON, minifyJSON, stringifyJSON, parseStringifiedJSON, parseDtoString } from '@lib/json-utils';
import { downloadFile } from '@lib/download-utils';
import Checkbox from '@components/ui/Checkbox';
import SegmentedControl from '@components/ui/SegmentedControl';
import ResizablePanels from '@components/ui/ResizablePanels';
import useLocalStorage from '@hooks/useLocalStorage';

type ActionType = 'format' | 'minify' | 'stringify' | 'parse' | 'dto';

const actionLabels: Record<ActionType, string> = {
  format: 'Format',
  minify: 'Minify',
  stringify: 'Stringify',
  parse: 'Parse',
  dto: 'DTO → JSON',
};

const inputClass = "w-full h-full flex-1 p-4 bg-white/30 dark:bg-gray-900/30 border border-white/50 dark:border-gray-700/50 rounded-xl font-mono text-sm text-gray-900 dark:text-gray-100 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15 dark:focus:ring-white/15 focus:border-transparent transition-all";
const outputClass = "w-full h-full flex-1 p-4 bg-white/20 dark:bg-gray-900/20 border border-white/50 dark:border-gray-700/50 rounded-xl font-mono text-sm text-gray-700 dark:text-gray-300 resize-none cursor-default";

// Count search matches across all keys and values in JSON data (mirrors tree render order)
function countJsonMatches(data: unknown, search: string, parentKey: string | number | null = null): number {
  if (!search) return 0;
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');
  let count = 0;
  const dataIsObject = data !== null && typeof data === 'object';

  // Count matches in the key (rendered via HighlightText)
  if (parentKey !== null) {
    let keyStr: string;
    if (!dataIsObject) {
      // Leaf nodes always render key quoted: "${key}"
      keyStr = `"${parentKey}"`;
    } else {
      // Object/array nodes: numbers shown as-is, strings quoted
      keyStr = typeof parentKey === 'number' ? String(parentKey) : `"${parentKey}"`;
    }
    count += (keyStr.match(regex) || []).length;
  }
  if (data === null) {
    // null is rendered as plain <span>, not through HighlightText — skip
    return count;
  }
  if (!dataIsObject) {
    // Leaf value - rendered via HighlightText as "str", number, or boolean
    const valStr = typeof data === 'string' ? `"${data}"` : String(data);
    count += (valStr.match(regex) || []).length;
  } else {
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      const childKey = Array.isArray(data) ? Number(k) : k;
      count += countJsonMatches(v, search, childKey);
    }
  }
  return count;
}

// --- Search bar component ---
interface OutputSearchBarProps {
  text: string;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  matchIndex: number;
  setMatchIndex: Dispatch<SetStateAction<number>>;
  matchCountOverride?: number;
}

function OutputSearchBar({ text, search, setSearch, matchIndex, setMatchIndex, matchCountOverride }: OutputSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const matchCount = useMemo(() => {
    if (matchCountOverride !== undefined) return matchCountOverride;
    if (!search || !text) return 0;
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return (text.match(new RegExp(escaped, 'gi')) || []).length;
  }, [text, search, matchCountOverride]);

  const goNext = useCallback(() => setMatchIndex(i => matchCount > 0 ? (i + 1) % matchCount : 0), [matchCount]);
  const goPrev = useCallback(() => setMatchIndex(i => matchCount > 0 ? (i - 1 + matchCount) % matchCount : 0), [matchCount]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.shiftKey ? goPrev() : goNext(); e.preventDefault(); }
    if (e.key === 'Escape') { setSearch(''); setMatchIndex(0); }
  }, [goNext, goPrev]);

  // Ctrl+F to focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1 border border-white/60 dark:border-gray-700/60 rounded-lg bg-white/50 dark:bg-gray-800/50 px-2 py-1">
        <Search size={13} className="text-gray-400" />
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setMatchIndex(0); }}
          onKeyDown={handleKeyDown}
          placeholder="Search…"
          className="bg-transparent outline-none text-xs w-24 sm:w-32 text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
        />
        {search && (
          <>
            <span className="text-[10px] text-gray-400 tabular-nums whitespace-nowrap">
              {matchCount > 0 ? `${matchIndex + 1}/${matchCount}` : '0/0'}
            </span>
            <button onClick={goPrev} className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Previous (Shift+Enter)"><ChevronUp size={12} /></button>
            <button onClick={goNext} className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Next (Enter)"><ChevronDown size={12} /></button>
            <button onClick={() => { setSearch(''); setMatchIndex(0); }} className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><X size={12} /></button>
          </>
        )}
      </div>
    </div>
  );
}

// Placeholder text per action
const placeholders: Record<ActionType, string> = {
  format: '{"example":{"property":"value","numbers":[1,2,3]}}',
  minify: '{\n  "example": "value",\n  "numbers": [1, 2, 3]\n}',
  stringify: '{\n  "example": "value"\n}',
  parse: '"{\\"example\\": \\"value\\"}"',
  dto: 'ClassName(uuid=abc, flowId=123, status=null)',
};

export default function JsonFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [parsedJson, setParsedJson] = useState<unknown>(null);
  const [lastAction, setLastAction] = useState<ActionType>('format');

  // Format options
  const [indent, setIndent] = useState<number | string>(2);
  const [view, setView] = useLocalStorage<string>('json-formatter-view', 'text');

  // DTO options
  const [stripClass, setStripClass] = useState(true);
  const [autoDetect, setAutoDetect] = useState(true);

  const [showInfo, setShowInfo] = useState(false);

  // Search state
  const [search, setSearch] = useState('');
  const [matchIdx, setMatchIdx] = useState(0);

  // Tree collapse signal
  const [collapseSignal, setCollapseSignal] = useState<string | null>(null);
  const [signalCounter, setSignalCounter] = useState(0);
  const triggerSignal = useCallback((type: string) => {
    setCollapseSignal(type);
    setSignalCounter(c => c + 1);
  }, []);
  const treeSignalValue = collapseSignal !== null ? `${collapseSignal}-${signalCounter}` : null;

  // Whether tree view is applicable (only for actions producing structured JSON)
  const showTreeToggle = lastAction === 'format' || lastAction === 'parse' || lastAction === 'dto';

  // Effective view: force text for actions that don't support tree
  const effectiveView = showTreeToggle ? view : 'text';

  const runAction = useCallback((action: ActionType) => {
    if (!input.trim()) { toast.error('Please enter input'); return; }
    setLastAction(action);
    setSearch('');
    setMatchIdx(0);
    try {
      switch (action) {
        case 'format': {
          const obj = JSON.parse(input.trim());
          const result = formatJSON(obj, indent);
          setOutput(result);
          setParsedJson(obj);
          toast.success('JSON formatted!');
          break;
        }
        case 'minify': {
          setOutput(minifyJSON(input.trim()));
          setParsedJson(null);
          toast.success('JSON minified!');
          break;
        }
        case 'stringify': {
          setOutput(stringifyJSON(input.trim()));
          setParsedJson(null);
          toast.success('JSON stringified!');
          break;
        }
        case 'parse': {
          const result = parseStringifiedJSON(input.trim());
          const obj = JSON.parse(result);
          setOutput(result);
          setParsedJson(obj);
          toast.success('JSON parsed!');
          break;
        }
        case 'dto': {
          const obj = parseDtoString(input.trim(), autoDetect, stripClass);
          const result = JSON.stringify(obj, null, 2);
          setOutput(result);
          setParsedJson(obj);
          toast.success('DTO converted!');
          break;
        }
      }
    } catch (e) {
      toast.error('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, [input, indent, autoDetect, stripClass]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setParsedJson(null);
    setSearch('');
    setMatchIdx(0);
  }, []);

  const handleDownload = useCallback(() => {
    if (!output) { toast.error('Nothing to download'); return; }
    downloadFile(output, 'output.json', 'application/json');
  }, [output]);

  const handleUseAsInput = useCallback(() => {
    if (!output) { toast.error('No output to use'); return; }
    setInput(output);
    setOutput('');
    setParsedJson(null);
    setSearch('');
    toast.success('Output moved to input');
  }, [output]);

  // Keyboard shortcut: Ctrl+Enter to run last action
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runAction(lastAction);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [runAction, lastAction]);

  return (
    <ToolLayout
      title="JSON Formatter"
      tagline="Format, validate, minify and convert JSON data"
      metaDescription="Format, validate and prettify JSON data. Easily format minified JSON and validate syntax."
    >
      <Card hover={false} className="h-[calc(100vh-210px)] min-h-152 flex flex-col">
        {/* Toolbar */}
        <div className="shrink-0 px-4 pt-3 pb-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Action buttons */}
            {(Object.keys(actionLabels) as ActionType[]).map((action) => (
              <Button
                key={action}
                variant={lastAction === action ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => runAction(action)}
                title={action === lastAction ? `${actionLabels[action]} (Ctrl+Enter)` : actionLabels[action]}
              >
                {actionLabels[action]}
              </Button>
            ))}

            <div className="hidden sm:block w-px h-6 bg-gray-300/50 dark:bg-gray-600/50 mx-0.5" />

            {/* Contextual options */}
            {lastAction === 'format' && (
              <select value={indent} onChange={(e) => setIndent(parseInt(e.target.value))} className="border border-white/60 dark:border-gray-700/60 rounded-lg px-2.5 py-1.5 text-xs bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 focus:outline-none">
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="tab">Tab</option>
              </select>
            )}
            {lastAction === 'dto' && (
              <>
                <Checkbox checked={stripClass} onChange={setStripClass} label="Strip class" className="text-xs text-gray-500 dark:text-gray-400 gap-1.5" />
                <Checkbox checked={autoDetect} onChange={setAutoDetect} label="Auto-detect types" className="text-xs text-gray-500 dark:text-gray-400 gap-1.5" />
              </>
            )}

            <div className="hidden sm:block w-px h-6 bg-gray-300/50 dark:bg-gray-600/50 mx-0.5" />

            {/* Utility buttons */}
            <CopyButton text={output} label="Copy" />
            <SecondaryButton onClick={handleDownload} title="Download"><Download size={14} /></SecondaryButton>
            <SecondaryButton onClick={handleUseAsInput} title="Use output as input"><CornerDownLeft size={14} /></SecondaryButton>
            <SecondaryButton onClick={handleClear}><Eraser size={14} /></SecondaryButton>

            {/* Right-aligned: search + tree toggle */}
            <div className="flex items-center gap-2 ml-auto">
              <OutputSearchBar
                text={output}
                search={search}
                setSearch={setSearch}
                matchIndex={matchIdx}
                setMatchIndex={setMatchIdx}
                matchCountOverride={effectiveView === 'tree' && parsedJson ? countJsonMatches(parsedJson, search) : undefined}
              />
              {showTreeToggle && effectiveView === 'tree' && (
                <>
                  <div className="hidden sm:block w-px h-6 bg-gray-300/50 dark:bg-gray-600/50" />
                  <SecondaryButton onClick={() => triggerSignal('expand')} title="Expand All"><ChevronsUpDown size={14} className="rotate-0" /> <span className="text-xs hidden sm:inline">Expand</span></SecondaryButton>
                  <SecondaryButton onClick={() => triggerSignal('collapse')} title="Collapse All"><ChevronsUpDown size={14} className="rotate-90" /> <span className="text-xs hidden sm:inline">Collapse</span></SecondaryButton>
                </>
              )}
              {showTreeToggle && (
                <SegmentedControl
                  options={[{ id: 'text', label: 'Text' }, { id: 'tree', label: 'Tree' }]}
                  value={effectiveView}
                  onChange={setView}
                  variant="glass"
                />
              )}
            </div>
          </div>
        </div>

        {/* Editor panels */}
        <div className="p-4 flex-1 min-h-0 flex flex-col">
          <ResizablePanels
            left={
              <div className="flex flex-col min-h-0 h-full">
                <label className="shrink-0 block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Input</label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={placeholders[lastAction]}
                  className={inputClass}
                />
              </div>
            }
            right={
              <div className="flex flex-col min-h-0 h-full">
                <label className="shrink-0 block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Output</label>
                {showTreeToggle && effectiveView === 'tree' && parsedJson ? (
                  <div className="flex-1 min-h-0 overflow-auto bg-white/20 dark:bg-gray-900/20 border border-white/50 dark:border-gray-700/50 rounded-xl p-4">
                    <JsonTreeView data={parsedJson} collapseSignal={treeSignalValue} search={search} activeMatchIndex={matchIdx} />
                  </div>
                ) : search ? (
                  <HighlightedOutput
                    text={output}
                    search={search}
                    activeIndex={matchIdx}
                    className={outputClass + ' flex-1 overflow-auto'}
                  />
                ) : (
                  <textarea value={output} readOnly className={outputClass} />
                )}
              </div>
            }
          />
        </div>
      </Card>

      {/* Collapsible info */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-2 ml-1"
      >
        <FileJson2 size={14} />
        About this tool
        <ChevronDown size={14} className={`transition-transform duration-200 ${showInfo ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card hover={false}>
              <div className="p-5">
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div>
                    <p className="mb-3 leading-relaxed">
                      JSON (JavaScript Object Notation) is a lightweight data interchange format. This tool supports formatting, minifying, stringify/parse conversion, and Java DTO to JSON conversion — all from a single input.
                    </p>
                    <ul className="space-y-1.5">
                      {['Format & beautify JSON', 'Validate syntax', 'Minify for compact transfer', 'Stringify ↔ Parse conversion', 'Java DTO / Lombok → JSON', 'Search output with navigation', 'Tree view with JSON path copy', 'Use output as input for chaining', 'Download as .json file'].map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="text-green-500 text-xs">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/30 dark:bg-gray-900/30 rounded-lg p-3 border border-white/50 dark:border-gray-700/50">
                      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Formatted</h4>
                      <pre className="text-[10px] font-mono text-gray-500 dark:text-gray-400 leading-relaxed">{`{
  "name": "John",
  "age": 30
}`}</pre>
                    </div>
                    <div className="bg-white/30 dark:bg-gray-900/30 rounded-lg p-3 border border-white/50 dark:border-gray-700/50">
                      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Minified</h4>
                      <pre className="text-[10px] font-mono text-gray-500 dark:text-gray-400 break-all leading-relaxed">{`{"name":"John","age":30}`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolLayout>
  );
}
