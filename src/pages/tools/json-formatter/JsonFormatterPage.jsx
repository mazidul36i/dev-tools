import { useState } from 'react';
import { toast } from 'sonner';
import { Eraser } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import Tabs from '@components/ui/Tabs';
import CopyButton from '@components/ui/CopyButton';
import JsonTreeView from './JsonTreeView';
import { formatJSON, minifyJSON, stringifyJSON, parseStringifiedJSON, parseDtoString } from '@lib/json-utils';

const tabs = [
  { id: 'format', label: 'Format JSON' },
  { id: 'minify', label: 'Minify JSON' },
  { id: 'convert', label: 'JSON Stringify/Parse' },
  { id: 'dto', label: 'Java DTO to JSON' },
];

export default function JsonFormatterPage() {
  const [activeTab, setActiveTab] = useState('format');

  // Format tab
  const [formatInput, setFormatInput] = useState('');
  const [formatResult, setFormatResult] = useState('');
  const [parsedJson, setParsedJson] = useState(null);
  const [indent, setIndent] = useState('2');
  const [view, setView] = useState('text');

  // Minify tab
  const [minifyInput, setMinifyInput] = useState('');
  const [minifyResult, setMinifyResult] = useState('');

  // Convert tab
  const [convertInput, setConvertInput] = useState('');
  const [convertResult, setConvertResult] = useState('');
  const [convertMode, setConvertMode] = useState('normalToString');

  // DTO tab
  const [dtoInput, setDtoInput] = useState('');
  const [dtoResult, setDtoResult] = useState('');
  const [stripClass, setStripClass] = useState(true);
  const [autoDetect, setAutoDetect] = useState(true);

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

  const btnPrimary = 'px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-all hover:-translate-y-0.5 shadow-sm';
  const btnSecondary = 'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition';

  return (
    <ToolLayout
      title="JSON Formatter Tool"
      tagline="Easily format, validate and beautify JSON data"
      metaDescription="Format, validate and prettify JSON data. Easily format minified JSON and validate syntax."
    >
      <Card>
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="p-6">
          {/* FORMAT TAB */}
          {activeTab === 'format' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Enter JSON to format:</label>
                <textarea
                  value={formatInput}
                  onChange={(e) => setFormatInput(e.target.value)}
                  placeholder='{"example":{"property":"value","numbers":[1,2,3]}}'
                  className="w-full p-3.5 border border-slate-200 rounded-lg font-mono text-sm min-h-[160px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleFormat} className={btnPrimary}>Format JSON</button>
                <CopyButton text={formatResult} label="Copy Result" />
                <button onClick={() => { setFormatInput(''); setFormatResult(''); setParsedJson(null); }} className={btnSecondary}><Eraser size={15} /> Clear</button>
              </div>

              {/* Options row */}
              <div className="flex flex-wrap items-center gap-4 bg-slate-50 rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-slate-600">Indent:</label>
                  <select value={indent} onChange={(e) => setIndent(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="2">2 spaces</option>
                    <option value="4">4 spaces</option>
                    <option value="tab">Tab</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <label className="text-sm font-semibold text-slate-600">View:</label>
                  <div className="flex rounded-lg overflow-hidden border border-slate-200">
                    <button onClick={() => setView('text')} className={`px-4 py-1.5 text-sm font-medium transition ${view === 'text' ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Text</button>
                    <button onClick={() => setView('tree')} className={`px-4 py-1.5 text-sm font-medium transition ${view === 'tree' ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Tree</button>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Formatted JSON:</label>
                {view === 'text' ? (
                  <textarea
                    value={formatResult}
                    readOnly
                    className="w-full p-3.5 border border-slate-200 rounded-lg font-mono text-sm min-h-[200px] resize-y bg-slate-50 cursor-default"
                  />
                ) : (
                  <JsonTreeView data={parsedJson} />
                )}
              </div>
            </div>
          )}

          {/* MINIFY TAB */}
          {activeTab === 'minify' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Enter JSON to minify:</label>
                <textarea
                  value={minifyInput}
                  onChange={(e) => setMinifyInput(e.target.value)}
                  placeholder='Paste formatted JSON here...'
                  className="w-full p-3.5 border border-slate-200 rounded-lg font-mono text-sm min-h-[160px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleMinify} className={btnPrimary}>Minify JSON</button>
                <CopyButton text={minifyResult} label="Copy Result" />
                <button onClick={() => { setMinifyInput(''); setMinifyResult(''); }} className={btnSecondary}><Eraser size={15} /> Clear</button>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Minified JSON:</label>
                <textarea value={minifyResult} readOnly className="w-full p-3.5 border border-slate-200 rounded-lg font-mono text-sm min-h-[140px] resize-y bg-slate-50 cursor-default" />
              </div>
            </div>
          )}

          {/* CONVERT TAB */}
          {activeTab === 'convert' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <label className="text-sm font-semibold text-slate-600">Conversion:</label>
                <div className="flex rounded-lg overflow-hidden border border-slate-200">
                  <button onClick={() => setConvertMode('normalToString')} className={`px-4 py-1.5 text-sm font-medium transition ${convertMode === 'normalToString' ? 'bg-primary text-white' : 'bg-white text-slate-600'}`}>Normal → Stringified</button>
                  <button onClick={() => setConvertMode('stringToNormal')} className={`px-4 py-1.5 text-sm font-medium transition ${convertMode === 'stringToNormal' ? 'bg-primary text-white' : 'bg-white text-slate-600'}`}>Stringified → Normal</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Enter JSON to convert:</label>
                <textarea
                  value={convertInput}
                  onChange={(e) => setConvertInput(e.target.value)}
                  placeholder={convertMode === 'normalToString' ? '{\n  "example": "value"\n}' : '"{\\"example\\": \\"value\\"}"'}
                  className="w-full p-3.5 border border-slate-200 rounded-lg font-mono text-sm min-h-[160px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleConvert} className={btnPrimary}>Convert JSON</button>
                <CopyButton text={convertResult} label="Copy Result" />
                <button onClick={() => { setConvertInput(''); setConvertResult(''); }} className={btnSecondary}><Eraser size={15} /> Clear</button>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Converted JSON:</label>
                <textarea value={convertResult} readOnly className="w-full p-3.5 border border-slate-200 rounded-lg font-mono text-sm min-h-[140px] resize-y bg-slate-50 cursor-default" />
              </div>
            </div>
          )}

          {/* DTO TAB */}
          {activeTab === 'dto' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Enter Java DTO / Logger output:</label>
                <textarea
                  value={dtoInput}
                  onChange={(e) => setDtoInput(e.target.value)}
                  placeholder="ClassName(uuid=abc, flowId=123, status=null)"
                  className="w-full p-3.5 border border-slate-200 rounded-lg font-mono text-sm min-h-[160px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
              <div className="flex flex-wrap gap-5 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={stripClass} onChange={(e) => setStripClass(e.target.checked)} className="accent-primary w-4 h-4" /> Strip class name
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={autoDetect} onChange={(e) => setAutoDetect(e.target.checked)} className="accent-primary w-4 h-4" /> Auto-detect types
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleDto} className={btnPrimary}>Convert to JSON</button>
                <CopyButton text={dtoResult} label="Copy Result" />
                <button onClick={() => { setDtoInput(''); setDtoResult(''); }} className={btnSecondary}><Eraser size={15} /> Clear</button>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">JSON Output:</label>
                <textarea value={dtoResult} readOnly className="w-full p-3.5 border border-slate-200 rounded-lg font-mono text-sm min-h-[140px] resize-y bg-slate-50 cursor-default" />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card hover={false} className="bg-slate-50 border-slate-200">
        <div className="p-7">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-3 mb-5">About JSON Formatting</h2>
          <p className="text-slate-500 leading-relaxed mb-4">
            JSON (JavaScript Object Notation) is a lightweight data interchange format that is easy for humans to read and write and easy for machines to parse and generate.
          </p>
          <p className="text-slate-500 mb-4">This tool helps you:</p>
          <ul className="space-y-2 text-sm text-slate-500 mb-6">
            <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> <strong>Format JSON</strong> — Convert minified JSON into readable, indented format</li>
            <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> <strong>Validate JSON</strong> — Check if your JSON is valid</li>
            <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> <strong>Minify JSON</strong> — Remove whitespace for compact transmission</li>
            <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> <strong>Stringify/Parse</strong> — Convert between normal and stringified JSON</li>
            <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> <strong>Java DTO to JSON</strong> — Convert Lombok toString output into valid JSON</li>
          </ul>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100">
              <h4 className="font-semibold text-slate-700 mb-3">Formatted JSON</h4>
              <pre className="bg-slate-50 p-3 rounded text-xs font-mono text-slate-600 overflow-auto">{`{
  "name": "John Doe",
  "age": 30,
  "isActive": true,
  "hobbies": [
    "reading",
    "coding"
  ]
}`}</pre>
            </div>
            <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100">
              <h4 className="font-semibold text-slate-700 mb-3">Minified JSON</h4>
              <pre className="bg-slate-50 p-3 rounded text-xs font-mono text-slate-600 overflow-auto break-all">{`{"name":"John Doe","age":30,"isActive":true,"hobbies":["reading","coding"]}`}</pre>
            </div>
          </div>
        </div>
      </Card>
    </ToolLayout>
  );
}

