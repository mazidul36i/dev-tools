import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowUpDown, Clipboard, Download, Eraser } from 'lucide-react';
import ToolLayout from '../../components/layout/ToolLayout';
import Card from '../../components/ui/Card';
import CopyButton from '../../components/ui/CopyButton';
import * as enc from '../../lib/encoder-utils';

const modes = [
  { id: 'base64', label: 'Base64' },
  { id: 'url', label: 'URL' },
  { id: 'html', label: 'HTML' },
  { id: 'hex', label: 'Hex' },
];

export default function EncoderDecoderPage() {
  const [mode, setMode] = useState('base64');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  // Options
  const [urlSafe, setUrlSafe] = useState(false);
  const [noPadding, setNoPadding] = useState(false);
  const [urlComponent, setUrlComponent] = useState(false);
  const [hexUpper, setHexUpper] = useState(false);
  const [hexPrefix, setHexPrefix] = useState(false);

  const handleEncode = () => {
    if (!input) { toast.error('Please enter text to encode'); return; }
    try {
      let result = '';
      switch (mode) {
        case 'base64': result = enc.encodeBase64(input, urlSafe, noPadding); break;
        case 'url': result = enc.encodeURL(input, urlComponent); break;
        case 'html': result = enc.encodeHTML(input); break;
        case 'hex': result = enc.encodeHex(input, hexUpper, hexPrefix); break;
      }
      setOutput(result);
      toast.success('Encoded!');
    } catch (e) { toast.error('Encode error: ' + e.message); }
  };

  const handleDecode = () => {
    if (!input) { toast.error('Please enter text to decode'); return; }
    try {
      let result = '';
      switch (mode) {
        case 'base64': result = enc.decodeBase64(input, urlSafe, noPadding); break;
        case 'url': result = enc.decodeURL(input, urlComponent); break;
        case 'html': result = enc.decodeHTML(input); break;
        case 'hex': result = enc.decodeHex(input); break;
      }
      setOutput(result);
      toast.success('Decoded!');
    } catch (e) { toast.error('Decode error: ' + e.message); }
  };

  const handleSwap = () => { setInput(output); setOutput(input); };

  const handlePaste = async () => {
    try { setInput(await navigator.clipboard.readText()); } catch { toast.error('Unable to paste'); }
  };

  const handleDownload = () => {
    if (!output) { toast.error('No content to download'); return; }
    const ext = { base64: '.b64', html: '.html', hex: '.hex', url: '.txt' }[mode] || '.txt';
    const blob = new Blob([output], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `encoded${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Downloaded!');
  };

  return (
    <ToolLayout
      title="Encoder/Decoder Tool"
      tagline="Convert data between various encoding formats"
      metaDescription="Encode and decode data in various formats including Base64, URL, HTML, and Hex."
    >
      <Card>
        <div className="p-6 space-y-6">
          {/* Mode Selector */}
          <div className="flex gap-2 flex-wrap">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === m.id
                    ? 'bg-primary text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Input:</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to encode or decode..."
              className="w-full p-3.5 border border-slate-200 rounded-lg font-mono text-sm min-h-[150px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
            <div className="flex gap-2 mt-2">
              <button onClick={() => setInput('')} className="text-xs px-3 py-1.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium inline-flex items-center gap-1"><Eraser size={12} /> Clear</button>
              <button onClick={handlePaste} className="text-xs px-3 py-1.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium inline-flex items-center gap-1"><Clipboard size={12} /> Paste</button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button onClick={handleEncode} className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-all hover:-translate-y-0.5 shadow-sm">Encode</button>
            <button onClick={handleDecode} className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-all hover:-translate-y-0.5 shadow-sm">Decode</button>
            <button onClick={handleSwap} className="px-4 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-lg font-semibold hover:bg-primary/20 transition inline-flex items-center gap-1.5" title="Swap input and output">
              <ArrowUpDown size={15} /> Swap
            </button>
          </div>

          {/* Output */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Output:</label>
            <textarea
              value={output}
              readOnly
              placeholder="Result will appear here..."
              className="w-full p-3.5 border border-slate-200 rounded-lg font-mono text-sm min-h-[150px] resize-y bg-slate-50 cursor-default"
            />
            <div className="flex gap-2 mt-2">
              <CopyButton text={output} label="Copy" className="!text-xs !px-3 !py-1.5" />
              <button onClick={handleDownload} className="text-xs px-3 py-1.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium inline-flex items-center gap-1"><Download size={12} /> Download</button>
            </div>
          </div>

          {/* Options */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            {mode === 'base64' && (
              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"><input type="checkbox" checked={urlSafe} onChange={e => setUrlSafe(e.target.checked)} className="accent-primary w-4 h-4" /> URL-safe Base64</label>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"><input type="checkbox" checked={noPadding} onChange={e => setNoPadding(e.target.checked)} className="accent-primary w-4 h-4" /> No padding (=)</label>
              </div>
            )}
            {mode === 'url' && (
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"><input type="checkbox" checked={urlComponent} onChange={e => setUrlComponent(e.target.checked)} className="accent-primary w-4 h-4" /> Encode/decode URI Component</label>
            )}
            {mode === 'hex' && (
              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"><input type="checkbox" checked={hexUpper} onChange={e => setHexUpper(e.target.checked)} className="accent-primary w-4 h-4" /> Uppercase hex</label>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"><input type="checkbox" checked={hexPrefix} onChange={e => setHexPrefix(e.target.checked)} className="accent-primary w-4 h-4" /> Add 0x prefix</label>
              </div>
            )}
            {mode === 'html' && <p className="text-sm text-slate-500">No additional options for HTML encoding.</p>}
          </div>
        </div>
      </Card>

      {/* Info */}
      <Card hover={false} className="bg-slate-50 border-slate-200">
        <div className="p-7">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-3 mb-5">About Encoding/Decoding</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { t: 'Base64 Encoding', d: 'Binary-to-text encoding scheme. Used for emails, embedding images in CSS, and data transmission.', ex: ['Hello World', 'SGVsbG8gV29ybGQ='] },
              { t: 'URL Encoding', d: 'Converts unsafe ASCII characters for use in URLs using percent-encoding.', ex: ['Hello World!', 'Hello%20World%21'] },
              { t: 'HTML Encoding', d: 'Converts characters to HTML entities to prevent XSS and ensure correct rendering.', ex: ['<script>', '&lt;script&gt;'] },
              { t: 'Hex Encoding', d: 'Represents data as hexadecimal digits. Used in color codes and binary protocols.', ex: ['Hello', '48656c6c6f'] },
            ].map(({ t, d, ex }) => (
              <div key={t} className="bg-white rounded-lg p-5 shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-700 mb-2">{t}</h3>
                <p className="text-sm text-slate-500 mb-3">{d}</p>
                <div className="bg-slate-50 rounded p-3 text-xs font-mono space-y-1">
                  <div><span className="text-slate-400">Original:</span> {ex[0]}</div>
                  <div><span className="text-slate-400">Encoded:</span> <span className="text-primary">{ex[1]}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </ToolLayout>
  );
}

