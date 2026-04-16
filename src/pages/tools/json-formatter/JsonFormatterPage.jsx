import { useState } from 'react';
import { toast } from 'sonner';
import { Eraser } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import Tabs from '@components/ui/Tabs';
import CopyButton from '@components/ui/CopyButton';
import { PrimaryButton, SecondaryButton } from '@components/ui/Button';
import { TextAreaInput, TextAreaOutput } from '@components/ui/TextArea';
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
                <label htmlFor="format-input" className="block text-sm font-medium text-text-secondary mb-2">Enter JSON to format:</label>
                <TextAreaInput
                  id="format-input"
                  value={formatInput}
                  onChange={(e) => setFormatInput(e.target.value)}
                  placeholder='{"example":{"property":"value","numbers":[1,2,3]}}'
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <PrimaryButton onClick={handleFormat}>Format JSON</PrimaryButton>
                <CopyButton text={formatResult} label="Copy Result" />
                <SecondaryButton onClick={() => { setFormatInput(''); setFormatResult(''); setParsedJson(null); }}><Eraser size={15} /> Clear</SecondaryButton>
              </div>

              {/* Options */}
              <div className="flex flex-wrap items-center gap-4 bg-surface-alt rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="indent-select" className="text-sm font-medium text-text-secondary">Indent:</label>
                  <select id="indent-select" value={indent} onChange={(e) => setIndent(e.target.value)} className="border border-border rounded-lg px-3 py-1.5 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="2">2 spaces</option>
                    <option value="4">4 spaces</option>
                    <option value="tab">Tab</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <label className="text-sm font-medium text-text-secondary">View:</label>
                  <div className="flex rounded-lg overflow-hidden border border-border">
                    <button onClick={() => setView('text')} className={`px-4 py-1.5 text-sm font-medium transition-all duration-200 ${view === 'text' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-surface-hover'}`}>Text</button>
                    <button onClick={() => setView('tree')} className={`px-4 py-1.5 text-sm font-medium transition-all duration-200 ${view === 'tree' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-surface-hover'}`}>Tree</button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Formatted JSON:</label>
                {view === 'text' ? (
                  <TextAreaOutput value={formatResult} className="min-h-50" />
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
                <label htmlFor="minify-input" className="block text-sm font-medium text-text-secondary mb-2">Enter JSON to minify:</label>
                <TextAreaInput id="minify-input" value={minifyInput} onChange={(e) => setMinifyInput(e.target.value)} placeholder='Paste formatted JSON here...' />
              </div>
              <div className="flex flex-wrap gap-3">
                <PrimaryButton onClick={handleMinify}>Minify JSON</PrimaryButton>
                <CopyButton text={minifyResult} label="Copy Result" />
                <SecondaryButton onClick={() => { setMinifyInput(''); setMinifyResult(''); }}><Eraser size={15} /> Clear</SecondaryButton>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Minified JSON:</label>
                <TextAreaOutput value={minifyResult} />
              </div>
            </div>
          )}

          {/* CONVERT TAB */}
          {activeTab === 'convert' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 bg-surface-alt border border-border rounded-lg p-3">
                <label className="text-sm font-medium text-text-secondary">Conversion:</label>
                <div className="flex rounded-lg overflow-hidden border border-border">
                  <button onClick={() => setConvertMode('normalToString')} className={`px-4 py-1.5 text-sm font-medium transition-all duration-200 ${convertMode === 'normalToString' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-surface-hover'}`}>Normal → Stringified</button>
                  <button onClick={() => setConvertMode('stringToNormal')} className={`px-4 py-1.5 text-sm font-medium transition-all duration-200 ${convertMode === 'stringToNormal' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-surface-hover'}`}>Stringified → Normal</button>
                </div>
              </div>
              <div>
                <label htmlFor="convert-input" className="block text-sm font-medium text-text-secondary mb-2">Enter JSON to convert:</label>
                <TextAreaInput id="convert-input" value={convertInput} onChange={(e) => setConvertInput(e.target.value)} placeholder={convertMode === 'normalToString' ? '{\n  "example": "value"\n}' : '"{\\"example\\": \\"value\\"}"'} />
              </div>
              <div className="flex flex-wrap gap-3">
                <PrimaryButton onClick={handleConvert}>Convert JSON</PrimaryButton>
                <CopyButton text={convertResult} label="Copy Result" />
                <SecondaryButton onClick={() => { setConvertInput(''); setConvertResult(''); }}><Eraser size={15} /> Clear</SecondaryButton>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Converted JSON:</label>
                <TextAreaOutput value={convertResult} />
              </div>
            </div>
          )}

          {/* DTO TAB */}
          {activeTab === 'dto' && (
            <div className="space-y-5">
              <div>
                <label htmlFor="dto-input" className="block text-sm font-medium text-text-secondary mb-2">Enter Java DTO / Logger output:</label>
                <TextAreaInput id="dto-input" value={dtoInput} onChange={(e) => setDtoInput(e.target.value)} placeholder="ClassName(uuid=abc, flowId=123, status=null)" />
              </div>
              <div className="flex flex-wrap gap-5 bg-surface-alt border border-border rounded-lg p-3">
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input type="checkbox" checked={stripClass} onChange={(e) => setStripClass(e.target.checked)} className="accent-primary w-4 h-4" /> Strip class name
                </label>
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input type="checkbox" checked={autoDetect} onChange={(e) => setAutoDetect(e.target.checked)} className="accent-primary w-4 h-4" /> Auto-detect types
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                <PrimaryButton onClick={handleDto}>Convert to JSON</PrimaryButton>
                <CopyButton text={dtoResult} label="Copy Result" />
                <SecondaryButton onClick={() => { setDtoInput(''); setDtoResult(''); }}><Eraser size={15} /> Clear</SecondaryButton>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">JSON Output:</label>
                <TextAreaOutput value={dtoResult} />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card hover={false}>
        <div className="p-7">
          <h2 className="text-lg font-semibold text-text border-b border-border pb-3 mb-5">About JSON Formatting</h2>
          <p className="text-text-muted leading-relaxed mb-4">
            JSON (JavaScript Object Notation) is a lightweight data interchange format that is easy for humans to read and write and easy for machines to parse and generate.
          </p>
          <p className="text-text-muted mb-4">This tool helps you:</p>
          <ul className="space-y-2 text-sm text-text-muted mb-6">
            <li className="flex gap-2"><span className="text-success font-bold">✓</span> <strong className="text-text-secondary">Format JSON</strong> — Convert minified JSON into readable, indented format</li>
            <li className="flex gap-2"><span className="text-success font-bold">✓</span> <strong className="text-text-secondary">Validate JSON</strong> — Check if your JSON is valid</li>
            <li className="flex gap-2"><span className="text-success font-bold">✓</span> <strong className="text-text-secondary">Minify JSON</strong> — Remove whitespace for compact transmission</li>
            <li className="flex gap-2"><span className="text-success font-bold">✓</span> <strong className="text-text-secondary">Stringify/Parse</strong> — Convert between normal and stringified JSON</li>
            <li className="flex gap-2"><span className="text-success font-bold">✓</span> <strong className="text-text-secondary">Java DTO to JSON</strong> — Convert Lombok toString output into valid JSON</li>
          </ul>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-surface-alt rounded-lg p-5 border border-border">
              <h4 className="font-medium text-text-secondary mb-3">Formatted JSON</h4>
              <pre className="bg-surface rounded p-3 text-xs font-mono text-text-muted overflow-auto border border-border">{`{
  "name": "John Doe",
  "age": 30,
  "isActive": true,
  "hobbies": [
    "reading",
    "coding"
  ]
}`}</pre>
            </div>
            <div className="bg-surface-alt rounded-lg p-5 border border-border">
              <h4 className="font-medium text-text-secondary mb-3">Minified JSON</h4>
              <pre className="bg-surface rounded p-3 text-xs font-mono text-text-muted overflow-auto break-all border border-border">{`{"name":"John Doe","age":30,"isActive":true,"hobbies":["reading","coding"]}`}</pre>
            </div>
          </div>
        </div>
      </Card>
    </ToolLayout>
  );
}
