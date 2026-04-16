import { useState } from 'react';
import { toast } from 'sonner';
import { Eraser } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import Tabs from '@components/ui/Tabs';
import CopyButton from '@components/ui/CopyButton';

const tabs = [
  { id: 'encode', label: 'Encode URL' },
  { id: 'decode', label: 'Decode URL' },
];

export default function UrlParserPage() {
  const [activeTab, setActiveTab] = useState('encode');

  // Encode state
  const [encodeInput, setEncodeInput] = useState('');
  const [encodedResult, setEncodedResult] = useState('');

  // Decode state
  const [decodeInput, setDecodeInput] = useState('');
  const [decodedResult, setDecodedResult] = useState('');

  const handleEncode = () => {
    if (!encodeInput.trim()) { toast.error('Please enter a URL to encode'); return; }
    try {
      setEncodedResult(encodeURIComponent(encodeInput.trim()));
      toast.success('URL encoded!');
    } catch (e) { toast.error('Error encoding: ' + e.message); }
  };

  const handleDecode = () => {
    if (!decodeInput.trim()) { toast.error('Please enter a URL to decode'); return; }
    try {
      setDecodedResult(decodeURIComponent(decodeInput.trim()));
      toast.success('URL decoded!');
    } catch (e) { toast.error('Error decoding: ' + e.message); }
  };

  return (
    <ToolLayout
      title="URL Parser Tool"
      tagline="Easily encode and decode URLs with this modern tool"
      metaDescription="A modern tool to encode and decode URLs. Safely convert special characters and spaces in URLs for web use."
    >
      <Card>
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="p-6">
          {activeTab === 'encode' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Enter URL to encode:</label>
                <textarea
                  value={encodeInput}
                  onChange={(e) => setEncodeInput(e.target.value)}
                  placeholder="https://example.com/path?param=value with spaces"
                  className="w-full p-3.5 border border-slate-200 rounded-lg font-mono text-sm min-h-[140px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleEncode} className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-all hover:-translate-y-0.5 shadow-sm">Encode URL</button>
                <CopyButton text={encodedResult} label="Copy Result" />
                <button onClick={() => { setEncodeInput(''); setEncodedResult(''); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition">
                  <Eraser size={15} /> Clear
                </button>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Encoded URL:</label>
                <textarea
                  value={encodedResult}
                  readOnly
                  className="w-full p-3.5 border border-slate-200 rounded-lg font-mono text-sm min-h-[140px] resize-y bg-slate-50 cursor-default"
                />
              </div>
            </div>
          )}

          {activeTab === 'decode' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Enter encoded URL to decode:</label>
                <textarea
                  value={decodeInput}
                  onChange={(e) => setDecodeInput(e.target.value)}
                  placeholder="https%3A%2F%2Fexample.com%2Fpath%3Fparam%3Dvalue%20with%20spaces"
                  className="w-full p-3.5 border border-slate-200 rounded-lg font-mono text-sm min-h-[140px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleDecode} className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-all hover:-translate-y-0.5 shadow-sm">Decode URL</button>
                <CopyButton text={decodedResult} label="Copy Result" />
                <button onClick={() => { setDecodeInput(''); setDecodedResult(''); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition">
                  <Eraser size={15} /> Clear
                </button>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Decoded URL:</label>
                <textarea
                  value={decodedResult}
                  readOnly
                  className="w-full p-3.5 border border-slate-200 rounded-lg font-mono text-sm min-h-[140px] resize-y bg-slate-50 cursor-default"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card hover={false} className="bg-slate-50 border-slate-200">
        <div className="p-7">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-3 mb-5">About URL Encoding/Decoding</h2>
          <p className="text-slate-500 leading-relaxed mb-4">
            URL encoding converts characters that are not allowed in a URL into character-entity equivalents. For example, spaces are converted to <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs border border-primary/20">%20</code>.
          </p>
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Common URL Encodings:</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead><tr className="bg-slate-100"><th className="py-3 px-4 text-left font-semibold text-slate-600">Character</th><th className="py-3 px-4 text-left font-semibold text-slate-600">Encoded</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {[['Space','%20'],['!','%21'],['#','%23'],['$','%24'],['&','%26'],['+','%2B'],['=','%3D']].map(([ch,enc])=>(
                  <tr key={ch} className="hover:bg-slate-50"><td className="py-2.5 px-4">{ch}</td><td className="py-2.5 px-4"><code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">{enc}</code></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </ToolLayout>
  );
}

