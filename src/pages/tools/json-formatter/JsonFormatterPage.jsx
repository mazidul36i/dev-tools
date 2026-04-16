import { useState } from 'react';
import { toast } from 'sonner';
import { Eraser, ChevronDown, FileJson2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import CopyButton from '@components/ui/CopyButton';
import { PrimaryButton, SecondaryButton } from '@components/ui/Button';
import JsonTreeView from './JsonTreeView';
import { formatJSON, minifyJSON, stringifyJSON, parseStringifiedJSON, parseDtoString } from '@lib/json-utils';

const tabs = [
  { id: 'format', label: 'Format' },
  { id: 'minify', label: 'Minify' },
  { id: 'convert', label: 'Stringify / Parse' },
  { id: 'dto', label: 'DTO → JSON' },
];

const inputClass = "w-full h-full p-4 bg-white/30 dark:bg-gray-900/30 border border-white/50 dark:border-gray-700/50 rounded-xl font-mono text-sm text-gray-900 dark:text-gray-100 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15 dark:focus:ring-white/15 focus:border-transparent transition-all";
const outputClass = "w-full h-full p-4 bg-white/20 dark:bg-gray-900/20 border border-white/50 dark:border-gray-700/50 rounded-xl font-mono text-sm text-gray-700 dark:text-gray-300 resize-none cursor-default";

export default function JsonFormatterPage() {
  const [activeTab, setActiveTab] = useState('format');
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

  return (
    <ToolLayout
      title="JSON Formatter"
      tagline="Format, validate, minify and convert JSON data"
      metaDescription="Format, validate and prettify JSON data. Easily format minified JSON and validate syntax."
    >
      <Card hover={false} className="h-[calc(100vh-210px)] min-h-152 flex flex-col">
        {/* Tab bar */}
        <div className="shrink-0 flex items-center gap-1 px-4 pt-3 pb-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap
                ${activeTab === tab.id
                  ? 'text-gray-900 dark:text-white bg-white/50 dark:bg-gray-800/50'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              {tab.label}
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
                <SecondaryButton onClick={() => { setFormatInput(''); setFormatResult(''); setParsedJson(null); }}><Eraser size={14} /></SecondaryButton>
                <div className="hidden sm:block w-px h-6 bg-gray-300/50 dark:bg-gray-600/50 mx-1" />
                <select value={indent} onChange={(e) => setIndent(e.target.value)} className="border border-white/60 dark:border-gray-700/60 rounded-lg px-2.5 py-1.5 text-xs bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 focus:outline-none">
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                  <option value="tab">Tab</option>
                </select>
                <div className="flex rounded-lg overflow-hidden border border-white/60 dark:border-gray-700/60 ml-auto">
                  <button onClick={() => setView('text')} className={`px-3 py-1.5 text-xs font-medium transition-all ${view === 'text' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400'}`}>Text</button>
                  <button onClick={() => setView('tree')} className={`px-3 py-1.5 text-xs font-medium transition-all ${view === 'tree' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400'}`}>Tree</button>
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
                    <textarea value={formatResult} readOnly className={outputClass} />
                  ) : (
                    <div className="flex-1 min-h-0 overflow-auto bg-white/20 dark:bg-gray-900/20 border border-white/50 dark:border-gray-700/50 rounded-xl p-4">
                      <JsonTreeView data={parsedJson} />
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
                <SecondaryButton onClick={() => { setMinifyInput(''); setMinifyResult(''); }}><Eraser size={14} /></SecondaryButton>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
                <div className="flex flex-col min-h-0">
                  <label className="shrink-0 block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Input</label>
                  <textarea value={minifyInput} onChange={(e) => setMinifyInput(e.target.value)} placeholder="Paste formatted JSON here..." className={inputClass} />
                </div>
                <div className="flex flex-col min-h-0">
                  <label className="shrink-0 block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Output</label>
                  <textarea value={minifyResult} readOnly className={outputClass} />
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

      {/* Collapsible info — minimal footprint */}
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
                      {['Format & beautify JSON', 'Validate syntax', 'Minify for compact transfer', 'Stringify ↔ Parse conversion', 'Java DTO / Lombok → JSON'].map((item) => (
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
