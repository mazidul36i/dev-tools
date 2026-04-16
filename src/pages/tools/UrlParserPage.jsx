import { useState } from 'react';
import { toast } from 'sonner';
import { Eraser } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import Tabs from '@components/ui/Tabs';
import CopyButton from '@components/ui/CopyButton';
import { PrimaryButton, SecondaryButton } from '@components/ui/Button';
import { TextAreaInput, TextAreaOutput } from '@components/ui/TextArea';

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
                <label htmlFor="url-encode-input" className="block text-sm font-semibold text-slate-600 mb-2">Enter URL to encode:</label>
                <TextAreaInput
                  id="url-encode-input"
                  value={encodeInput}
                  onChange={(e) => setEncodeInput(e.target.value)}
                  placeholder="https://example.com/path?param=value with spaces"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <PrimaryButton onClick={handleEncode}>Encode URL</PrimaryButton>
                <CopyButton text={encodedResult} label="Copy Result" />
                <SecondaryButton onClick={() => { setEncodeInput(''); setEncodedResult(''); }}>
                  <Eraser size={15} /> Clear
                </SecondaryButton>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Encoded URL:</label>
                <TextAreaOutput value={encodedResult} />
              </div>
            </div>
          )}

          {activeTab === 'decode' && (
            <div className="space-y-5">
              <div>
                <label htmlFor="url-decode-input" className="block text-sm font-semibold text-slate-600 mb-2">Enter encoded URL to decode:</label>
                <TextAreaInput
                  id="url-decode-input"
                  value={decodeInput}
                  onChange={(e) => setDecodeInput(e.target.value)}
                  placeholder="https%3A%2F%2Fexample.com%2Fpath%3Fparam%3Dvalue%20with%20spaces"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <PrimaryButton onClick={handleDecode}>Decode URL</PrimaryButton>
                <CopyButton text={decodedResult} label="Copy Result" />
                <SecondaryButton onClick={() => { setDecodeInput(''); setDecodedResult(''); }}>
                  <Eraser size={15} /> Clear
                </SecondaryButton>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Decoded URL:</label>
                <TextAreaOutput value={decodedResult} />
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

