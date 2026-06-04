import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { ArrowUpDown, Clipboard, Download, Eraser } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import CopyButton from '@components/ui/CopyButton';
import { PrimaryButton, SecondaryButton, SmallButton } from '@components/ui/Button';
import { TextAreaInput, TextAreaOutput } from '@components/ui/TextArea';
import { downloadFile } from '@lib/download-utils';
import { compressGzip, decompressGzip } from '@lib/gzip-utils';

export default function GzipConverterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const handleCompress = useCallback(() => {
    if (!input) { toast.error('Please enter text to compress'); return; }
    try {
      const result = compressGzip(input);
      setOutput(result);
      toast.success('Compressed successfully!');
    } catch (e) {
      toast.error('Compression error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, [input]);

  const handleDecompress = useCallback(() => {
    if (!input) { toast.error('Please enter base64-encoded gzip data to decompress'); return; }
    try {
      const result = decompressGzip(input);
      setOutput(result);
      toast.success('Decompressed successfully!');
    } catch (e) {
      toast.error('Decompression error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, [input]);

  const handleSwap = useCallback(() => { setInput(output); setOutput(input); }, [input, output]);
  const handlePaste = useCallback(async () => {
    try { setInput(await navigator.clipboard.readText()); } catch { toast.error('Unable to paste'); }
  }, []);
  const handleDownload = useCallback(() => {
    if (!output) { toast.error('No content to download'); return; }
    downloadFile(output, 'gzip-output.txt');
  }, [output]);

  return (
    <ToolLayout
      title="Gzip Converter"
      tagline="Compress and decompress data using Gzip (Base64 encoded)"
      metaDescription="Compress text to gzip (base64-encoded) or decompress base64-encoded gzip data back to text. Supports partial recovery for corrupted data."
    >
      <Card>
        <div className="p-6 space-y-6">
          {/* Input */}
          <div>
            <label htmlFor="gzip-input" className="block text-sm font-medium text-text-secondary mb-2">
              Input:
            </label>
            <TextAreaInput
              id="gzip-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter plain text to compress, or base64-encoded gzip data (H4sIA...) to decompress..."
            />
            <div className="flex gap-2 mt-2">
              <SmallButton onClick={() => setInput('')}><Eraser size={12} /> Clear</SmallButton>
              <SmallButton onClick={handlePaste}><Clipboard size={12} /> Paste</SmallButton>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={handleCompress}>Compress (Gzip)</PrimaryButton>
            <PrimaryButton onClick={handleDecompress}>Decompress (Gunzip)</PrimaryButton>
            <SecondaryButton onClick={handleSwap} title="Swap input and output"><ArrowUpDown size={15} /> Swap</SecondaryButton>
          </div>

          {/* Output */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Output:</label>
            <TextAreaOutput value={output} placeholder="Result will appear here..." />
            <div className="flex gap-2 mt-2">
              <CopyButton text={output} label="Copy" size="sm" />
              <SmallButton onClick={handleDownload}><Download size={12} /> Download</SmallButton>
            </div>
          </div>
        </div>
      </Card>

      <InfoCard title="About Gzip Compression">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-surface-alt rounded-lg p-5 border border-border">
            <h3 className="font-medium text-text-secondary mb-2">Compress (Text → Base64 Gzip)</h3>
            <p className="text-sm text-text-muted mb-3">
              Compresses plain text using the gzip algorithm and outputs the result as a base64-encoded string.
              Useful for transmitting compressed data over text-based protocols.
            </p>
            <div className="bg-surface rounded p-3 text-xs font-mono space-y-1 border border-border">
              <div><span className="text-text-muted">Input:</span> <span className="text-text-secondary">Hello World</span></div>
              <div><span className="text-text-muted">Output:</span> <span className="text-primary">H4sIAAAAAAAAA...</span></div>
            </div>
          </div>
          <div className="bg-surface-alt rounded-lg p-5 border border-border">
            <h3 className="font-medium text-text-secondary mb-2">Decompress (Base64 Gzip → Text)</h3>
            <p className="text-sm text-text-muted mb-3">
              Takes a base64-encoded gzip string (typically starting with H4sI) and decompresses it back to the original text.
              Includes partial recovery for corrupted or truncated data.
            </p>
            <div className="bg-surface rounded p-3 text-xs font-mono space-y-1 border border-border">
              <div><span className="text-text-muted">Input:</span> <span className="text-text-secondary">H4sIAAAAAAAAA...</span></div>
              <div><span className="text-text-muted">Output:</span> <span className="text-primary">Hello World</span></div>
            </div>
          </div>
        </div>
      </InfoCard>
    </ToolLayout>
  );
}

