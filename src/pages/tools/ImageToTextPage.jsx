import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Upload, Copy, Download, Eraser } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolLayout from '../../components/layout/ToolLayout';
import Card from '../../components/ui/Card';
import CopyButton from '../../components/ui/CopyButton';

function processParagraphs(text) {
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
  const [preview, setPreview] = useState(null);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    // Preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // OCR
    setProcessing(true);
    setStatus('Initializing OCR...');
    setProgress(0);
    try {
      const Tesseract = await import('tesseract.js');
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
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

  // Paste handler
  useEffect(() => {
    const onPaste = (e) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith('image/')) { handleFile(item.getAsFile()); break; }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleFile]);

  const handleDownload = () => {
    if (!output) { toast.error('No text to download'); return; }
    const blob = new Blob([output], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'extracted-text.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Downloaded!');
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
            onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
              ${dragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-slate-300 bg-slate-50 hover:border-primary hover:bg-primary/5'}`}
          >
            <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${dragging ? 'text-primary' : 'text-slate-400'}`} />
            <p className="text-base font-semibold text-slate-600">Drop image here, click to upload, or paste (Ctrl+V)</p>
            <p className="text-sm text-slate-400 mt-2">Supports PNG, JPG, JPEG, GIF, and WebP formats</p>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
          </div>

          {/* Preview */}
          <AnimatePresence>
            {preview && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 bg-slate-50 rounded-lg p-5 text-center">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Image Preview</h3>
                <img src={preview} alt="Preview" className="max-w-full max-h-96 rounded-lg shadow-md mx-auto" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress */}
          {processing && (
            <div className="mt-5">
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.3 }} />
              </div>
            </div>
          )}
          {status && <p className="text-center text-slate-600 font-medium mt-3">{status}</p>}
        </div>
      </Card>

      {/* Result */}
      <AnimatePresence>
        {output && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Extracted Text</h2>
                <textarea
                  value={output}
                  readOnly
                  className="w-full p-3.5 border border-slate-200 rounded-lg font-mono text-sm min-h-[200px] resize-y bg-slate-50"
                />
                <div className="flex flex-wrap gap-3 mt-4">
                  <CopyButton text={output} label="Copy Text" />
                  <button onClick={handleDownload} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition">
                    <Download size={15} /> Download as .txt
                  </button>
                  <button onClick={handleClear} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition">
                    <Eraser size={15} /> Clear
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <Card hover={false} className="bg-slate-50 border-slate-200">
        <div className="p-7">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-3 mb-5">About OCR Technology</h2>
          <p className="text-slate-500 leading-relaxed mb-5">
            This tool uses Optical Character Recognition (OCR) technology to extract text from images. Simply upload an image, paste a screenshot, or drag and drop a file.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-700 mb-3">Key Features</h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> Multiple input methods: upload, drag & drop, or paste</li>
                <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> Fast processing with Tesseract.js OCR engine</li>
                <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> Privacy focused — all processing in your browser</li>
                <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> Copy text or download as .txt file</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-700 mb-3">💡 Tips for Best Results</h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>• Use high-quality images with clear text</li>
                <li>• Ensure good contrast between text and background</li>
                <li>• Avoid blurry or distorted images</li>
                <li>• For screenshots, use Ctrl+V to paste directly</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </ToolLayout>
  );
}

