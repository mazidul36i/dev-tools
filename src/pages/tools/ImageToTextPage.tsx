import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Button from '@components/ui/Button';
import Checkbox from '@components/ui/Checkbox';
import FileDropZone from '@components/ui/FileDropZone';
import { OutputPanel, Panel } from '@components/workspace';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';

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

const schema = { join: opt.bool(true) };

export default function ImageToTextPage() {
  const [o, setO] = useUrlOptions(schema);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [raw, setRaw] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const output = useMemo(() => (o.join ? processParagraphs(raw) : raw.trim()), [raw, o.join]);

  const handleFile = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    setFileName(file.name || 'pasted image');
    setError(null);
    setRaw('');
    setProcessing(true);
    setStatus('Loading the OCR engine…');
    setProgress(0);
    try {
      const Tesseract = await import('tesseract.js');
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress(m.progress);
            setStatus(`Recognising text… ${Math.round(m.progress * 100)}%`);
          }
        },
      });
      setRaw(text);
      setStatus(text.trim() ? 'Done' : 'No text found in this image');
    } catch (err) {
      console.error(err);
      setStatus('');
      setError('Could not read text from this image. If you are offline, the OCR language data may not have loaded.');
    } finally {
      setProcessing(false);
    }
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
      if (file) handleFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleFile]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
    // Only on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null); setRaw(''); setStatus(''); setError(null); setProgress(0);
  };

  return (
    <ToolLayout
      seoTitle="Image to Text (OCR) – Extract Text from Images"
      tagline="Extract text from screenshots, photos and scans with OCR, in your browser"
      metaDescription="Convert images to text using OCR technology. Extract text from images, screenshots, and documents easily."
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">Private.</strong> Recognition runs in your browser with Tesseract.js. Your image is never uploaded; only the English language data is downloaded once.</li>
          <li><strong className="text-text">Best results</strong> come from sharp, high-contrast images with horizontal text. Crop to the text you need and paste screenshots straight in with Ctrl/⌘+V.</li>
          <li><strong className="text-text">Line breaks.</strong> “Join lines into paragraphs” merges wrapped lines; turn it off to keep the exact line layout (tables, code).</li>
        </ul>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Panel
          title="Image"
          bodyClassName="p-4 space-y-3"
          actions={preview ? <Button variant="ghost" size="sm" onClick={clear}><X size={13} aria-hidden="true" /> Remove</Button> : undefined}
          footer={processing || status ? <span role="status">{status}</span> : undefined}
        >
          {preview ? (
            <figure className="space-y-2">
              <img src={preview} alt={`Selected image: ${fileName}`} className="max-w-full max-h-96 mx-auto rounded-md border border-border" />
              <figcaption className="text-center text-xs text-text-muted truncate">{fileName}</figcaption>
            </figure>
          ) : null}
          <FileDropZone
            accept="image/*"
            onFiles={(f) => handleFile(f[0])}
            compact={!!preview}
            title={preview ? 'Use another image' : 'Drop an image, click to browse, or paste (Ctrl/⌘+V)'}
            hint={preview ? undefined : 'PNG, JPG, GIF or WebP. Screenshots work best.'}
          />
          {processing && (
            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden" role="progressbar" aria-label="Recognition progress" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-primary rounded-full transition-[width]" style={{ width: `${progress * 100}%` }} />
            </div>
          )}
        </Panel>

        <OutputPanel
          label="Extracted text"
          value={output}
          error={error}
          errorTitle="OCR failed"
          placeholder={processing ? 'Recognising…' : 'Text from the image appears here'}
          downloadName="extracted-text.txt"
          className="min-h-96"
          textareaClassName="min-h-80 font-sans! text-sm!"
          actions={<Checkbox checked={o.join} onChange={(v) => setO({ join: v })} label="Join lines into paragraphs" className="text-xs mr-2" />}
        />
      </div>
    </ToolLayout>
  );
}
