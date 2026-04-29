import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eraser, ChevronDown, ChevronUp, FileJson2, Search, X, ChevronsUpDown, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import CopyButton from '@components/ui/CopyButton';
import { PrimaryButton, SecondaryButton } from '@components/ui/Button';
import JsonTreeView from './JsonTreeView';
import HighlightedOutput from './HighlightedOutput';
import { formatJSON, minifyJSON, stringifyJSON, parseStringifiedJSON, parseDtoString } from '@lib/json-utils';
import { downloadFile } from '@lib/download-utils';

const tabs = [
  { id: 'format', label: 'Format' },
  { id: 'minify', label: 'Minify' },
  { id: 'convert', label: 'Stringify / Parse' },
  { id: 'dto', label: 'DTO → JSON' },
];

const validTabs = new Set(tabs.map(t => t.id));

const inputClass = "w-full h-full p-4 bg-white/30 dark:bg-gray-900/30 border border-white/50 dark:border-gray-700/50 rounded-xl font-mono text-sm text-gray-900 dark:text-gray-100 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15 dark:focus:ring-white/15 focus:border-transparent transition-all";
const outputClass = "w-full h-full p-4 bg-white/20 dark:bg-gray-900/20 border border-white/50 dark:border-gray-700/50 rounded-xl font-mono text-sm text-gray-700 dark:text-gray-300 resize-none cursor-default";

// Count search matches across all keys and values in JSON data (mirrors tree render order)
function countJsonMatches(data, search, parentKey = null) {
  if (!search) return 0;
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');
  let count = 0;
  const dataIsObject = data !== null && typeof data === 'object';

  // Count matches in the key (rendered via HighlightText)
  if (parentKey !== null) {
    let keyStr;
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
    for (const [k, v] of Object.entries(data)) {
      const childKey = Array.isArray(data) ? Number(k) : k;
      count += countJsonMatches(v, search, childKey);
    }
  }
  return count;
}

// --- Search bar component ---
function OutputSearchBar({ text, search, setSearch, matchIndex, setMatchIndex, matchCountOverride }) {
  const inputRef = useRef(null);
  const matchCount = useMemo(() => {
    if (matchCountOverride !== undefined) return matchCountOverride;
    if (!search || !text) return 0;
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return (text.match(new RegExp(escaped, 'gi')) || []).length;
  }, [text, search, matchCountOverride]);

  const goNext = useCallback(() => setMatchIndex(i => matchCount > 0 ? (i + 1) % matchCount : 0), [matchCount]);
  const goPrev = useCallback(() => setMatchIndex(i => matchCount > 0 ? (i - 1 + matchCount) % matchCount : 0), [matchCount]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') { e.shiftKey ? goPrev() : goNext(); e.preventDefault(); }
    if (e.key === 'Escape') { setSearch(''); setMatchIndex(0); }
  }, [goNext, goPrev]);

  // Ctrl+F to focus
  useEffect(() => {
    const handler = (e) => {
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

export default function JsonFormatterPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = validTabs.has(tab) ? tab : 'format';

  const setActiveTab = useCallback((id) => {
    navigate(`/tools/json-formatter/${id}`, { replace: true });
  }, [navigate]);

  // Redirect bare /tools/json-formatter to /tools/json-formatter/format
  useEffect(() => {
    if (!tab || !validTabs.has(tab)) {
      navigate('/tools/json-formatter/format', { replace: true });
    }
  }, [tab]);

  const [formatInput, setFormatInput] = useState('');
  const [formatResult, setFormatResult] = useState('');
  const [parsedJson, setParsedJson] = useState(null);
  const [indent, setIndent] = useState('2');
  const [view, setView] = useState('text');
  const [minifyInput, setMinifyInput] = useState('');
  const [minifyResult, setMinifyResult] = useState('');
  const [convertInput, setConvertInput] = useState('');
  const [convertResult, setConvertResult] = useState('');
  const [convertMode, setConvertMode] = useState('normalToString');
  const [dtoInput, setDtoInput] = useState('');
  const [dtoResult, setDtoResult] = useState('');
  const [stripClass, setStripClass] = useState(true);
  const [autoDetect, setAutoDetect] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  // Search state
  const [formatSearch, setFormatSearch] = useState('');
  const [formatMatchIdx, setFormatMatchIdx] = useState(0);
  const [minifySearch, setMinifySearch] = useState('');
  const [minifyMatchIdx, setMinifyMatchIdx] = useState(0);

  // Tree collapse signal: null = no signal, 'expand' | 'collapse', incremented to retrigger
  const [collapseSignal, setCollapseSignal] = useState(null);
  const [signalCounter, setSignalCounter] = useState(0);
  const triggerSignal = useCallback((type) => {
    setCollapseSignal(type);
    setSignalCounter(c => c + 1);
  }, []);
  // Combine signal + counter so effect retriggers
  const treeSignalValue = collapseSignal !== null ? `${collapseSignal}-${signalCounter}` : null;

  const handleFormat = () => {
    if (!formatInput.trim()) { toast.error('Please enter JSON to format'); return; }
    try {
      const obj = JSON.parse(formatInput.trim());
      setFormatResult(formatJSON(obj, indent));
      setParsedJson(obj);
      toast.success('JSON formatted!');
    } catch (e) { toast.error('Error: ' + e.message); }
  };

  const handleMinify = () => {
    if (!minifyInput.trim()) { toast.error('Please enter JSON to minify'); return; }
    try {
      setMinifyResult(minifyJSON(minifyInput.trim()));
      toast.success('JSON minified!');
    } catch (e) { toast.error('Error: ' + e.message); }
  };

  const handleConvert = () => {
    if (!convertInput.trim()) { toast.error('Please enter JSON to convert'); return; }
    try {
      setConvertResult(convertMode === 'normalToString' ? stringifyJSON(convertInput.trim()) : parseStringifiedJSON(convertInput.trim()));
      toast.success('JSON converted!');
    } catch (e) { toast.error('Error: ' + e.message); }
  };

  const handleDto = () => {
    if (!dtoInput.trim()) { toast.error('Please enter DTO string'); return; }
    try {
      const obj = parseDtoString(dtoInput.trim(), autoDetect, stripClass);
      setDtoResult(JSON.stringify(obj, null, 2));
      toast.success('DTO converted!');
    } catch (e) { toast.error('Error: ' + e.message); }
  };

  // Current output for download
  const currentOutput = activeTab === 'format' ? formatResult : activeTab === 'minify' ? minifyResult : activeTab === 'convert' ? convertResult : dtoResult;

  const handleDownload = () => {
    if (!currentOutput) { toast.error('Nothing to download'); return; }
    downloadFile(currentOutput, 'output.json', 'application/json');
  };

  return (
    <ToolLayout
      title="JSON Formatter"
      tagline="Format, validate, minify and convert JSON data"
      metaDescription="Format, validate and prettify JSON data. Easily format minified JSON and validate syntax."
    >
      <Card hover={false} className="h-[calc(100vh-210px)] min-h-152 flex flex-col">
        {/* Tab bar */}
        <div className="shrink-0 flex items-center gap-1 px-4 pt-3 pb-0 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`relative px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap
                ${activeTab === t.id
                  ? 'text-gray-900 dark:text-white bg-white/50 dark:bg-gray-800/50'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 flex-1 min-h-0">
          {/* FORMAT TAB */}
          {activeTab === 'format' && (
            <div className="flex flex-col gap-3 h-full">
              {/* Compact toolbar */}
              <div className="shrink-0 flex flex-wrap items-center gap-2">
                <PrimaryButton onClick={handleFormat}>Format</PrimaryButton>
                <CopyButton text={formatResult} label="Copy" />
                <SecondaryButton onClick={handleDownload} title="Download"><Download size={14} /></SecondaryButton>
                <SecondaryButton onClick={() => { setFormatInput(''); setFormatResult(''); setParsedJson(null); setFormatSearch(''); }}><Eraser size={14} /></SecondaryButton>
                <div className="hidden sm:block w-px h-6 bg-gray-300/50 dark:bg-gray-600/50 mx-1" />
                <select value={indent} onChange={(e) => setIndent(e.target.value)} className="border border-white/60 dark:border-gray-700/60 rounded-lg px-2.5 py-1.5 text-xs bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 focus:outline-none">
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                  <option value="tab">Tab</option>
                </select>
                <div className="flex items-center gap-2 ml-auto">
                  <OutputSearchBar text={formatResult} search={formatSearch} setSearch={setFormatSearch} matchIndex={formatMatchIdx} setMatchIndex={setFormatMatchIdx} matchCountOverride={view === 'tree' && parsedJson ? countJsonMatches(parsedJson, formatSearch) : undefined} />
                  {view === 'tree' && (
                    <>
                      <div className="hidden sm:block w-px h-6 bg-gray-300/50 dark:bg-gray-600/50" />
                      <SecondaryButton onClick={() => triggerSignal('expand')} title="Expand All"><ChevronsUpDown size={14} className="rotate-0" /> <span className="text-xs hidden sm:inline">Expand</span></SecondaryButton>
                      <SecondaryButton onClick={() => triggerSignal('collapse')} title="Collapse All"><ChevronsUpDown size={14} className="rotate-90" /> <span className="text-xs hidden sm:inline">Collapse</span></SecondaryButton>
                    </>
                  )}
                  <div className="flex rounded-lg overflow-hidden border border-white/60 dark:border-gray-700/60">
                    <button onClick={() => setView('text')} className={`px-3 py-1.5 text-xs font-medium transition-all ${view === 'text' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400'}`}>Text</button>
                    <button onClick={() => setView('tree')} className={`px-3 py-1.5 text-xs font-medium transition-all ${view === 'tree' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400'}`}>Tree</button>
                  </div>
                </div>
              </div>
              {/* Side-by-side panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
                <div className="flex flex-col min-h-0">
                  <label className="shrink-0 block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Input</label>
                  <textarea
                    value={formatInput}
                    onChange={(e) => setFormatInput(e.target.value)}
                    placeholder='{"example":{"property":"value","numbers":[1,2,3]}}'
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col min-h-0">
                  <label className="shrink-0 block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Output</label>
                  {view === 'text' ? (
                    formatSearch ? (
                      <HighlightedOutput
                        text={formatResult}
                        search={formatSearch}
                        activeIndex={formatMatchIdx}
                        className={outputClass + ' flex-1 overflow-auto'}
                      />
                    ) : (
                      <textarea value={formatResult} readOnly className={outputClass} />
                    )
                  ) : (
                    <div className="flex-1 min-h-0 overflow-auto bg-white/20 dark:bg-gray-900/20 border border-white/50 dark:border-gray-700/50 rounded-xl p-4">
                      <JsonTreeView data={parsedJson} collapseSignal={treeSignalValue} search={formatSearch} activeMatchIndex={formatMatchIdx} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MINIFY TAB */}
          {activeTab === 'minify' && (
            <div className="flex flex-col gap-3 h-full">
              <div className="shrink-0 flex flex-wrap items-center gap-2">
                <PrimaryButton onClick={handleMinify}>Minify</PrimaryButton>
                <CopyButton text={minifyResult} label="Copy" />
                <SecondaryButton onClick={handleDownload} title="Download"><Download size={14} /></SecondaryButton>
                <SecondaryButton onClick={() => { setMinifyInput(''); setMinifyResult(''); setMinifySearch(''); }}><Eraser size={14} /></SecondaryButton>
                <OutputSearchBar text={minifyResult} search={minifySearch} setSearch={setMinifySearch} matchIndex={minifyMatchIdx} setMatchIndex={setMinifyMatchIdx} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
                <div className="flex flex-col min-h-0">
                  <label className="shrink-0 block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Input</label>
                  <textarea value={minifyInput} onChange={(e) => setMinifyInput(e.target.value)} placeholder="Paste formatted JSON here..." className={inputClass} />
                </div>
                <div className="flex flex-col min-h-0">
                  <label className="shrink-0 block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Output</label>
                  {minifySearch ? (
                    <HighlightedOutput
                      text={minifyResult}
                      search={minifySearch}
                      activeIndex={minifyMatchIdx}
                      className={outputClass + ' flex-1 overflow-auto'}
                    />
                  ) : (
                    <textarea value={minifyResult} readOnly className={outputClass} />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CONVERT TAB */}
          {activeTab === 'convert' && (
            <div className="flex flex-col gap-3 h-full">
              <div className="shrink-0 flex flex-wrap items-center gap-2">
                <PrimaryButton onClick={handleConvert}>Convert</PrimaryButton>
                <CopyButton text={convertResult} label="Copy" />
                <SecondaryButton onClick={handleDownload} title="Download"><Download size={14} /></SecondaryButton>
                <SecondaryButton onClick={() => { setConvertInput(''); setConvertResult(''); }}><Eraser size={14} /></SecondaryButton>
                <div className="hidden sm:block w-px h-6 bg-gray-300/50 dark:bg-gray-600/50 mx-1" />
                <div className="flex rounded-lg overflow-hidden border border-white/60 dark:border-gray-700/60">
                  <button onClick={() => setConvertMode('normalToString')} className={`px-3 py-1.5 text-xs font-medium transition-all ${convertMode === 'normalToString' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400'}`}>Normal → Stringified</button>
                  <button onClick={() => setConvertMode('stringToNormal')} className={`px-3 py-1.5 text-xs font-medium transition-all ${convertMode === 'stringToNormal' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400'}`}>Stringified → Normal</button>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
                <div className="flex flex-col min-h-0">
                  <label className="shrink-0 block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Input</label>
                  <textarea value={convertInput} onChange={(e) => setConvertInput(e.target.value)} placeholder={convertMode === 'normalToString' ? '{\n  "example": "value"\n}' : '"{\\"example\\": \\"value\\"}"'} className={inputClass} />
                </div>
                <div className="flex flex-col min-h-0">
                  <label className="shrink-0 block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Output</label>
                  <textarea value={convertResult} readOnly className={outputClass} />
                </div>
              </div>
            </div>
          )}

          {/* DTO TAB */}
          {activeTab === 'dto' && (
            <div className="flex flex-col gap-3 h-full">
              <div className="shrink-0 flex flex-wrap items-center gap-2">
                <PrimaryButton onClick={handleDto}>Convert</PrimaryButton>
                <CopyButton text={dtoResult} label="Copy" />
                <SecondaryButton onClick={handleDownload} title="Download"><Download size={14} /></SecondaryButton>
                <SecondaryButton onClick={() => { setDtoInput(''); setDtoResult(''); }}><Eraser size={14} /></SecondaryButton>
                <div className="hidden sm:block w-px h-6 bg-gray-300/50 dark:bg-gray-600/50 mx-1" />
                <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={stripClass} onChange={(e) => setStripClass(e.target.checked)} className="accent-gray-900 dark:accent-white w-3.5 h-3.5" /> Strip class
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={autoDetect} onChange={(e) => setAutoDetect(e.target.checked)} className="accent-gray-900 dark:accent-white w-3.5 h-3.5" /> Auto-detect types
                </label>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
                <div className="flex flex-col min-h-0">
                  <label className="shrink-0 block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Input</label>
                  <textarea value={dtoInput} onChange={(e) => setDtoInput(e.target.value)} placeholder="ClassName(uuid=abc, flowId=123, status=null)" className={inputClass} />
                </div>
                <div className="flex flex-col min-h-0">
                  <label className="shrink-0 block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Output</label>
                  <textarea value={dtoResult} readOnly className={outputClass} />
                </div>
              </div>
            </div>
          )}
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
                      JSON (JavaScript Object Notation) is a lightweight data interchange format. This tool supports formatting, minifying, stringify/parse conversion, and Java DTO to JSON conversion.
                    </p>
                    <ul className="space-y-1.5">
                      {['Format & beautify JSON', 'Validate syntax', 'Minify for compact transfer', 'Stringify ↔ Parse conversion', 'Java DTO / Lombok → JSON', 'Search output with navigation', 'Tree view with JSON path copy', 'Download as .json file'].map((item) => (
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
