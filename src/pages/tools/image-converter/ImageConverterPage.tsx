import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, Download, Loader2, Trash2 } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import Tabs from '@components/ui/Tabs';
import FileDropZone from '@components/ui/FileDropZone';
import CodeBlock from '@components/ui/CodeBlock';
import Badge from '@components/ui/Badge';
import { PrimaryButton, SecondaryButton, SmallButton } from '@components/ui/Button';
import { Field, SelectInput, TextInput } from '@components/ui/Input';
import { TextAreaInput } from '@components/ui/TextArea';
import {
  FORMAT_LABELS, formatBytes, parseImageDataUri, renameWithExtension, targetSize, type OutputFormat,
} from '@lib/image-utils';

const MAX_FILE_BYTES = 50 * 1024 * 1024;

interface Job {
  id: number;
  file: File;
  srcUrl: string;
  status: 'pending' | 'done' | 'error';
  result?: { blob: Blob; url: string; width: number; height: number; srcWidth: number; srcHeight: number };
  error?: string;
}

let jobId = 0;

/** Which formats this browser's canvas can encode. */
function useEncodableFormats() {
  const [formats, setFormats] = useState<OutputFormat[]>(['image/jpeg', 'image/png']);
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const supported = (Object.keys(FORMAT_LABELS) as OutputFormat[]).filter((f) => canvas.toDataURL(f).startsWith(`data:${f}`));
    setFormats(supported);
  }, []);
  return formats;
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file);
  } catch {
    // Some formats (e.g. SVG) need an <img> element.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

interface ConvertOptions {
  format: OutputFormat | 'same';
  quality: number;
  maxWidth: number;
  maxHeight: number;
  background: string;
}

async function convert(file: File, o: ConvertOptions, encodable: OutputFormat[]) {
  const image = await loadBitmap(file);
  const srcWidth = 'naturalWidth' in image ? image.naturalWidth : image.width;
  const srcHeight = 'naturalHeight' in image ? image.naturalHeight : image.height;
  const { width, height } = targetSize(srcWidth, srcHeight, { maxWidth: o.maxWidth, maxHeight: o.maxHeight });
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const type: OutputFormat = o.format === 'same'
    ? (encodable.includes(file.type as OutputFormat) ? (file.type as OutputFormat) : 'image/png')
    : o.format;
  if (type === 'image/jpeg') {
    // JPEG has no transparency; fill it instead of letting it turn black.
    ctx.fillStyle = o.background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, width, height);
  if ('close' in image) image.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, o.quality / 100));
  if (!blob) throw new Error(`This browser cannot encode ${FORMAT_LABELS[type].label}.`);
  return { blob, url: URL.createObjectURL(blob), width, height, srcWidth, srcHeight };
}

function triggerDownload(url: string, name: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
}

function ConverterPanel() {
  const encodable = useEncodableFormats();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [opts, setOpts] = useState<ConvertOptions>({ format: 'image/webp', quality: 80, maxWidth: 1920, maxHeight: 0, background: '#ffffff' });
  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;

  useEffect(() => () => {
    for (const j of jobsRef.current) {
      URL.revokeObjectURL(j.srcUrl);
      if (j.result) URL.revokeObjectURL(j.result.url);
    }
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length < files.length) toast.error('Some files were skipped because they are not images');
    const tooBig = images.filter((f) => f.size > MAX_FILE_BYTES);
    if (tooBig.length) toast.error(`${tooBig.length} image(s) larger than 50 MB were skipped`);
    setJobs((js) => [
      ...js,
      ...images.filter((f) => f.size <= MAX_FILE_BYTES).map((file) => ({ id: ++jobId, file, srcUrl: URL.createObjectURL(file), status: 'pending' as const })),
    ]);
  }, []);

  // Paste images from the clipboard.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) addFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles]);

  // A single serial queue converts every image whose last conversion used
  // different options; it re-reads the latest options on each step.
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const encodableRef = useRef(encodable);
  encodableRef.current = encodable;
  const convertedWith = useRef(new Map<number, string>());
  const running = useRef(false);

  const processQueue = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      for (;;) {
        const key = JSON.stringify(optsRef.current) + encodableRef.current.join();
        const job = jobsRef.current.find((j) => convertedWith.current.get(j.id) !== key);
        if (!job) break;
        convertedWith.current.set(job.id, key);
        try {
          const result = await convert(job.file, optsRef.current, encodableRef.current);
          if (!jobsRef.current.some((j) => j.id === job.id)) {
            URL.revokeObjectURL(result.url);
            continue;
          }
          setJobs((js) => js.map((j) => {
            if (j.id !== job.id) return j;
            if (j.result) URL.revokeObjectURL(j.result.url);
            return { ...j, status: 'done', result, error: undefined };
          }));
        } catch (e) {
          setJobs((js) => js.map((j) => (j.id === job.id ? { ...j, status: 'error', error: e instanceof Error ? e.message : 'Could not read this image' } : j)));
        }
      }
    } finally {
      running.current = false;
    }
  }, []);

  const optsKey = JSON.stringify(opts);
  useEffect(() => {
    const timer = setTimeout(processQueue, 200);
    return () => clearTimeout(timer);
  }, [optsKey, jobs.length, encodable, processQueue]);

  const remove = (id: number) => setJobs((js) => js.filter((j) => {
    if (j.id === id) {
      URL.revokeObjectURL(j.srcUrl);
      if (j.result) URL.revokeObjectURL(j.result.url);
    }
    return j.id !== id;
  }));

  const outName = (j: Job) => renameWithExtension(j.file.name, FORMAT_LABELS[(j.result?.blob.type as OutputFormat) ?? 'image/png']?.ext ?? 'png');
  const totals = useMemo(() => {
    const done = jobs.filter((j) => j.result);
    const before = done.reduce((n, j) => n + j.file.size, 0);
    const after = done.reduce((n, j) => n + j.result!.blob.size, 0);
    return { before, after, count: done.length };
  }, [jobs]);

  const lossy = opts.format === 'same' || FORMAT_LABELS[opts.format].lossy;

  return (
    <div className="p-6 space-y-5">
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <Field label="Output format" htmlFor="img-format">
          <SelectInput
            id="img-format"
            value={opts.format}
            onChange={(e) => setOpts((o) => ({ ...o, format: e.target.value as ConvertOptions['format'] }))}
            options={[{ value: 'same', label: 'Keep original' }, ...encodable.map((f) => ({ value: f, label: FORMAT_LABELS[f].label }))]}
          />
        </Field>
        <Field label={`Quality: ${lossy ? `${opts.quality}%` : 'lossless'}`} htmlFor="img-quality">
          <input
            id="img-quality"
            type="range"
            min={10}
            max={100}
            value={opts.quality}
            disabled={!lossy}
            onChange={(e) => setOpts((o) => ({ ...o, quality: Number(e.target.value) }))}
            className="w-full accent-primary h-9 disabled:opacity-40"
          />
        </Field>
        <Field label="Max width (px)" htmlFor="img-maxw" hint="0 = no limit">
          <TextInput id="img-maxw" type="number" min={0} value={opts.maxWidth} onChange={(e) => setOpts((o) => ({ ...o, maxWidth: Math.max(0, Number(e.target.value) || 0) }))} />
        </Field>
        <Field label="Max height (px)" htmlFor="img-maxh" hint="0 = no limit">
          <TextInput id="img-maxh" type="number" min={0} value={opts.maxHeight} onChange={(e) => setOpts((o) => ({ ...o, maxHeight: Math.max(0, Number(e.target.value) || 0) }))} />
        </Field>
        <Field label="JPEG background" htmlFor="img-bg" hint="Fills transparent areas">
          <input
            id="img-bg"
            type="color"
            value={opts.background}
            onChange={(e) => setOpts((o) => ({ ...o, background: e.target.value }))}
            className="w-full h-9 rounded-lg border border-border bg-transparent cursor-pointer p-0.5"
          />
        </Field>
      </div>

      <FileDropZone
        multiple
        accept="image/*"
        onFiles={addFiles}
        compact={jobs.length > 0}
        title="Drop images here, click to browse, or paste"
        hint="PNG, JPEG, WebP, GIF, SVG, AVIF… — processed locally, never uploaded"
      />

      {jobs.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {totals.count > 0 && (
              <Badge tone={totals.after <= totals.before ? 'success' : 'warning'}>
                {formatBytes(totals.before)} → {formatBytes(totals.after)}
                {totals.before > 0 && ` (${totals.after <= totals.before ? '−' : '+'}${Math.abs(Math.round((1 - totals.after / totals.before) * 100))}%)`}
              </Badge>
            )}
            <span className="flex-1" />
            <SecondaryButton onClick={() => jobs.forEach((j) => j.result && triggerDownload(j.result.url, outName(j)))} disabled={!totals.count}>
              <Download size={15} /> Download all
            </SecondaryButton>
            <SmallButton onClick={() => { jobs.forEach((j) => remove(j.id)); }}><Trash2 size={12} /> Clear</SmallButton>
          </div>
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {jobs.map((j) => {
              const saved = j.result ? 1 - j.result.blob.size / j.file.size : 0;
              return (
                <div key={j.id} className="flex items-center gap-4 p-3 bg-surface/50">
                  <img src={j.result?.url ?? j.srcUrl} alt="" className="w-14 h-14 object-cover rounded-md border border-border bg-surface-alt shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text truncate">{j.file.name}</div>
                    {j.status === 'error' ? (
                      <div className="text-xs text-error flex items-center gap-1"><AlertCircle size={12} /> {j.error}</div>
                    ) : j.result ? (
                      <div className="text-xs text-text-muted">
                        {j.result.srcWidth}×{j.result.srcHeight} → {j.result.width}×{j.result.height} ·{' '}
                        {formatBytes(j.file.size)} → <span className="text-text-secondary">{formatBytes(j.result.blob.size)}</span>{' '}
                        <span className={saved >= 0 ? 'text-success' : 'text-warning'}>({saved >= 0 ? '−' : '+'}{Math.abs(Math.round(saved * 100))}%)</span>
                      </div>
                    ) : (
                      <div className="text-xs text-text-muted flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Converting…</div>
                    )}
                  </div>
                  {j.result && (
                    <SmallButton onClick={() => triggerDownload(j.result!.url, outName(j))}><Download size={12} /> {FORMAT_LABELS[j.result.blob.type as OutputFormat]?.label}</SmallButton>
                  )}
                  <button onClick={() => remove(j.id)} aria-label="Remove" className="text-text-muted hover:text-error"><Trash2 size={15} /></button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Base64Panel() {
  const [dataUri, setDataUri] = useState('');
  const [name, setName] = useState('');
  const [pasted, setPasted] = useState('');

  const fromFile = async (files: File[]) => {
    const f = files[0];
    if (!f.type.startsWith('image/')) {
      toast.error('Please choose an image');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('Images over 10 MB make impractically large data URIs');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDataUri(String(reader.result));
      setName(f.name);
    };
    reader.readAsDataURL(f);
  };

  const decoded = useMemo(() => {
    if (!pasted.trim()) return null;
    try {
      const p = parseImageDataUri(pasted);
      return { ...p, src: `data:${p.mime};base64,${p.base64}` };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [pasted]);

  return (
    <div className="p-6 grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h2 className="font-semibold text-text">Image → Base64</h2>
        <FileDropZone accept="image/*" onFiles={fromFile} compact title="Choose or drop an image" />
        {dataUri && (
          <>
            <div className="flex items-center gap-3">
              <img src={dataUri} alt="" className="w-16 h-16 object-contain rounded-md border border-border bg-surface-alt" />
              <div className="text-sm">
                <div className="text-text font-medium truncate">{name}</div>
                <div className="text-text-muted text-xs">Data URI length: {dataUri.length.toLocaleString()} characters</div>
              </div>
            </div>
            <CodeBlock title="Data URI" code={dataUri} preClassName="max-h-32 break-all! text-xs!" />
            <CodeBlock title="HTML" code={`<img src="${dataUri}" alt="" />`} preClassName="max-h-24 break-all! text-xs!" />
            <CodeBlock title="CSS" code={`background-image: url("${dataUri}");`} preClassName="max-h-24 break-all! text-xs!" />
          </>
        )}
      </div>
      <div className="space-y-4">
        <h2 className="font-semibold text-text">Base64 → Image</h2>
        <TextAreaInput value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="Paste a data URI (data:image/png;base64,...) or raw Base64" aria-label="Base64 image data" className="min-h-32!" />
        {decoded && ('error' in decoded ? (
          <p className="text-sm text-error">{decoded.error}</p>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-surface-alt p-4 flex items-center justify-center min-h-40">
              <img src={decoded.src} alt="Decoded" className="max-w-full max-h-72 object-contain" />
            </div>
            <div className="flex items-center gap-3">
              <Badge>{decoded.mime}</Badge>
              <Badge>{formatBytes(decoded.bytes)}</Badge>
              <PrimaryButton
                className="ml-auto"
                onClick={() => triggerDownload(decoded.src, `image.${decoded.mime.split('/')[1].replace('svg+xml', 'svg').replace('jpeg', 'jpg')}`)}
              >
                <Download size={15} /> Download
              </PrimaryButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ImageConverterPage() {
  const [tab, setTab] = useState(() => (new URLSearchParams(window.location.search).get('tab') === 'base64' ? 'base64' : 'convert'));
  return (
    <ToolLayout
      title="Image Compressor & Converter"
      seoTitle="Image Compressor & Converter – JPEG, PNG, WebP, AVIF (Private)"
      tagline="Compress, resize and convert images, or turn them into Base64 data URIs — all in your browser"
      metaDescription="Compress and resize images and convert between JPEG, PNG, WebP and AVIF in your browser, in bulk. Also converts images to Base64 data URIs and back. Images are never uploaded."
    >
      <Card hover={false}>
        <Tabs tabs={[{ id: 'convert', label: 'Compress & convert' }, { id: 'base64', label: 'Image ↔ Base64' }]} activeTab={tab} onTabChange={setTab} />
        {tab === 'convert' ? <ConverterPanel /> : <Base64Panel />}
      </Card>

      <InfoCard title="Choosing a Format">
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { t: 'WebP', d: 'Usually 25–35% smaller than JPEG at similar quality, with transparency. Supported by all modern browsers — a good default for the web.' },
            { t: 'AVIF', d: 'Even smaller than WebP for photos, but slower to encode. Only offered if your browser can encode it.' },
            { t: 'JPEG', d: 'Best compatibility for photos. No transparency — transparent areas are filled with the background colour.' },
            { t: 'PNG', d: 'Lossless; best for screenshots, logos and images with sharp edges or text. Large for photos.' },
          ].map(({ t, d }) => (
            <div key={t} className="bg-surface-alt rounded-lg p-4 border border-border">
              <h3 className="font-medium text-text-secondary mb-1">{t}</h3>
              <p className="text-xs text-text-muted">{d}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-4">Re-encoding removes EXIF metadata such as camera details and GPS location.</p>
      </InfoCard>
    </ToolLayout>
  );
}
