import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Upload, Download, Eraser } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import CopyButton from '@components/ui/CopyButton';
import { SecondaryButton } from '@components/ui/Button';
import { TextAreaOutput } from '@components/ui/TextArea';
import { downloadFile } from '@lib/download-utils';

function processParagraphs(text: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  const processedLines = [];
  let currentParagraph = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    if (line === '') {
      if (currentParagraph) { processedLines.push(currentParagraph); currentParagraph = ''; processedLines.push(''); }
      continue;
    }
    const endsWithPunctuation = /[.!?:;]$/.test(line);
    const nextLineStartsNew = nextLine && /^[A-Z]/.test(nextLine);
    const isLikelyHeader = line.length < 50 && /^[A-Z\d]/.test(line) && !endsWithPunctuation;
    const nextLineIsEmpty = nextLine === '';
    if (isLikelyHeader || (endsWithPunctuation && (nextLineStartsNew || nextLineIsEmpty))) {
      processedLines.push(currentParagraph ? currentParagraph + ' ' + line : line);
      currentParagraph = '';
    } else {
      currentParagraph = currentParagraph ? currentParagraph + ' ' + line : line;
    }
  }
  if (currentParagraph) processedLines.push(currentParagraph);
  return processedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export default function ImageToTextPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setProcessing(true);
    setStatus('Initializing OCR...');
    setProgress(0);
    try {
      const Tesseract = await import('tesseract.js');
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress(m.progress);
            setStatus(`Processing: ${(m.progress * 100).toFixed(1)}%`);
          }
        },
      });
      setOutput(processParagraphs(text));
      setStatus('✅ Text extraction complete!');
      toast.success('Text extracted successfully!');
    } catch (err) {
      console.error(err);
      setStatus('❌ Error reading image');
      toast.error('Failed to extract text');
    } finally {
      setProcessing(false);
    }
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) handleFile(file).then(() => {});
          break;
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleFile]);

  const handleDownload = () => {
    if (!output) { toast.error('No text to download'); return; }
    downloadFile(output, 'extracted-text.txt');
  };

  const handleClear = () => {
    setPreview(null); setOutput(''); setStatus(''); setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <ToolLayout
      title="Image to Text Converter"
      tagline="Extract text from images using advanced OCR technology"
      metaDescription="Convert images to text using OCR technology. Extract text from images, screenshots, and documents easily."
    >
      <Card>
        <div className="p-6">
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]).then(() => {}); }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            aria-label="Upload an image for text extraction"
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300
              ${dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border bg-surface-alt hover:border-primary/40 hover:bg-primary/5'}`}
          >
            <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${dragging ? 'text-primary' : 'text-text-muted'}`} />
            <p className="text-sm font-medium text-text-secondary">Drop image here, click to upload, or paste (Ctrl+V)</p>
            <p className="text-xs text-text-muted mt-1.5">Supports PNG, JPG, JPEG, GIF, and WebP</p>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {/* Preview */}
          <AnimatePresence>
            {preview && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 bg-surface-alt rounded-lg p-5 text-center">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Image Preview</h3>
                <img src={preview} alt="Preview" className="max-w-full max-h-96 rounded-lg shadow-card mx-auto" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress */}
          {processing && (
            <div className="mt-5">
              <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.3 }} />
              </div>
            </div>
          )}
          {status && <p className="text-center text-text-secondary text-sm font-medium mt-3">{status}</p>}
        </div>
      </Card>

      {/* Result */}
      <AnimatePresence>
        {output && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-text mb-4">Extracted Text</h2>
                <TextAreaOutput value={output} className="min-h-50" />
                <div className="flex flex-wrap gap-3 mt-4">
                  <CopyButton text={output} label="Copy Text" />
                  <SecondaryButton onClick={handleDownload}><Download size={15} /> Download as .txt</SecondaryButton>
                  <SecondaryButton onClick={handleClear}><Eraser size={15} /> Clear</SecondaryButton>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <InfoCard title="About OCR Technology">
          <p className="text-text-muted leading-relaxed mb-5">
            This tool uses Optical Character Recognition (OCR) technology to extract text from images. Simply upload an image, paste a screenshot, or drag and drop a file.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-surface-alt rounded-lg p-5 border border-border">
              <h3 className="font-medium text-text-secondary mb-3">Key Features</h3>
              <ul className="space-y-2 text-sm text-text-muted">
                <li className="flex gap-2"><span className="text-success font-bold">✓</span> Multiple input methods: upload, drag & drop, or paste</li>
                <li className="flex gap-2"><span className="text-success font-bold">✓</span> Fast processing with Tesseract.js OCR engine</li>
                <li className="flex gap-2"><span className="text-success font-bold">✓</span> Privacy focused — all processing in your browser</li>
                <li className="flex gap-2"><span className="text-success font-bold">✓</span> Copy text or download as .txt file</li>
              </ul>
            </div>
            <div className="bg-surface-alt rounded-lg p-5 border border-border">
              <h3 className="font-medium text-text-secondary mb-3">💡 Tips for Best Results</h3>
              <ul className="space-y-2 text-sm text-text-muted">
                <li>• Use high-quality images with clear text</li>
                <li>• Ensure good contrast between text and background</li>
                <li>• Avoid blurry or distorted images</li>
                <li>• For screenshots, use Ctrl+V to paste directly</li>
              </ul>
            </div>
          </div>
      </InfoCard>
    </ToolLayout>
  );
}
