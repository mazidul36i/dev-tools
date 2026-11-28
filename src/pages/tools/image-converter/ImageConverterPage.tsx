import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, Download, ImageIcon, Loader2, Trash2 } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import FileDropZone from '@components/ui/FileDropZone';
import CodeBlock from '@components/ui/CodeBlock';
import Badge from '@components/ui/Badge';
import Button from '@components/ui/Button';
import SegmentedControl from '@components/ui/SegmentedControl';
import { EmptyState, ErrorNotice, Panel, Toolbar } from '@components/workspace';
import { opt, type OptionValues } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
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

const FORMAT_IDS = { same: 'same', webp: 'image/webp', avif: 'image/avif', jpeg: 'image/jpeg', png: 'image/png' } as const;
type FormatId = keyof typeof FORMAT_IDS;

const schema = {
  tab: opt.oneOf(['convert', 'base64'] as const, 'convert'),
  fmt: opt.oneOf(Object.keys(FORMAT_IDS) as [FormatId, ...FormatId[]], 'webp'),
  q: opt.num(80, { min: 10, max: 100 }),
  w: opt.num(1920, { min: 0, max: 20000 }),
  h: opt.num(0, { min: 0, max: 20000 }),
  bg: opt.str('ffffff', 8),
};
type Opts = OptionValues<typeof schema>;

const fieldClass =
  'w-full h-8 px-2.5 rounded-md bg-surface-alt border border-border-strong text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25';

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

function ConverterPanel({ o, setO }: { o: Opts; setO: (patch: Partial<Opts>) => void }) {
  const encodable = useEncodableFormats();
  const [jobs, setJobs] = useState<Job[]>([]);
  const opts: ConvertOptions = useMemo(() => ({
    format: FORMAT_IDS[o.fmt] as ConvertOptions['format'],
    quality: o.q,
    maxWidth: o.w,
    maxHeight: o.h,
    background: /^[0-9a-f]{6}$/i.test(o.bg) ? `#${o.bg}` : '#ffffff',
  }), [o.fmt, o.q, o.w, o.h, o.bg]);
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

  const idOf = (f: OutputFormat) => (Object.keys(FORMAT_IDS) as FormatId[]).find((k) => FORMAT_IDS[k] === f)!;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] items-start">
      <Panel title="Output" bodyClassName="p-4 space-y-4">
        <div>
          <label htmlFor="img-format" className="block mb-1.5 text-xs font-medium text-text-secondary">Format</label>
          <select id="img-format" value={o.fmt} onChange={(e) => setO({ fmt: e.target.value as FormatId })} className={`${fieldClass} pr-8`}>
            <option value="same">Keep original</option>
            {encodable.map((f) => <option key={f} value={idOf(f)}>{FORMAT_LABELS[f].label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="img-quality" className="flex justify-between mb-1.5 text-xs font-medium text-text-secondary">
            Quality <span className="font-mono text-text">{lossy ? `${opts.quality}%` : 'lossless'}</span>
          </label>
          <input id="img-quality" type="range" min={10} max={100} value={opts.quality} disabled={!lossy} onChange={(e) => setO({ q: Number(e.target.value) })} className="w-full accent-primary disabled:opacity-40" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="img-maxw" className="block mb-1.5 text-xs font-medium text-text-secondary">Max width</label>
            <input id="img-maxw" type="number" min={0} value={opts.maxWidth} onChange={(e) => setO({ w: Math.max(0, Number(e.target.value) || 0) })} className={fieldClass} aria-describedby="img-limit-hint" />
          </div>
          <div>
            <label htmlFor="img-maxh" className="block mb-1.5 text-xs font-medium text-text-secondary">Max height</label>
            <input id="img-maxh" type="number" min={0} value={opts.maxHeight} onChange={(e) => setO({ h: Math.max(0, Number(e.target.value) || 0) })} className={fieldClass} aria-describedby="img-limit-hint" />
          </div>
          <p id="img-limit-hint" className="col-span-2 -mt-1 text-xs text-text-muted">Pixels; 0 means no limit. Images are never enlarged.</p>
        </div>
        <div className="flex items-center gap-2">
          <input id="img-bg" type="color" value={opts.background} onChange={(e) => setO({ bg: e.target.value.slice(1) })} className="w-9 h-9 rounded-md border border-border-strong bg-transparent cursor-pointer p-0.5" />
          <label htmlFor="img-bg" className="text-sm text-text-secondary">JPEG background <span className="block text-xs text-text-muted">Fills transparent areas</span></label>
        </div>
      </Panel>

      <Panel
        title={`Images · ${jobs.length}`}
        bodyClassName="p-4 space-y-3"
        actions={
          jobs.length > 0 ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => jobs.forEach((j) => j.result && triggerDownload(j.result.url, outName(j)))} disabled={!totals.count}>
                <Download size={13} aria-hidden="true" /> Download all
              </Button>
              <Button variant="ghost" size="sm" onClick={() => jobs.forEach((j) => remove(j.id))}><Trash2 size={13} aria-hidden="true" /> Clear</Button>
            </>
          ) : undefined
        }
        footer={
          totals.count > 0 ? (
            <span role="status">
              {formatBytes(totals.before)} → {formatBytes(totals.after)}
              {totals.before > 0 && ` (${totals.after <= totals.before ? '−' : '+'}${Math.abs(Math.round((1 - totals.after / totals.before) * 100))}%)`}
            </span>
          ) : undefined
        }
      >
        <FileDropZone
          multiple
          accept="image/*"
          onFiles={addFiles}
          compact={jobs.length > 0}
          title="Drop images here, click to browse, or paste"
          hint="PNG, JPEG, WebP, GIF, SVG, AVIF… Processed locally, never uploaded."
        />
        {jobs.length > 0 && (
          <ul className="divide-y divide-border rounded-md border border-border overflow-hidden">
            {jobs.map((j) => {
              const saved = j.result ? 1 - j.result.blob.size / j.file.size : 0;
              return (
                <li key={j.id} className="flex items-center gap-3 p-2.5">
                  <img src={j.result?.url ?? j.srcUrl} alt="" className="w-12 h-12 object-cover rounded border border-border bg-surface-alt shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text truncate">{j.file.name}</div>
                    {j.status === 'error' ? (
                      <div className="text-xs text-error flex items-center gap-1"><AlertCircle size={12} aria-hidden="true" /> {j.error}</div>
                    ) : j.result ? (
                      <div className="text-xs text-text-muted">
                        {j.result.srcWidth}×{j.result.srcHeight} → {j.result.width}×{j.result.height} ·{' '}
                        {formatBytes(j.file.size)} → <span className="text-text">{formatBytes(j.result.blob.size)}</span>{' '}
                        <span className={saved >= 0 ? 'text-success' : 'text-warning'}>({saved >= 0 ? '−' : '+'}{Math.abs(Math.round(saved * 100))}%)</span>
                      </div>
                    ) : (
                      <div className="text-xs text-text-muted flex items-center gap-1"><Loader2 size={12} aria-hidden="true" className="animate-spin" /> Converting…</div>
                    )}
                  </div>
                  {j.result && (
                    <Button variant="secondary" size="sm" onClick={() => triggerDownload(j.result!.url, outName(j))}>
                      <Download size={13} aria-hidden="true" /> {FORMAT_LABELS[j.result.blob.type as OutputFormat]?.label}
                    </Button>
                  )}
                  <button type="button" onClick={() => remove(j.id)} aria-label={`Remove ${j.file.name}`} className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:text-error hover:bg-error/10 focus-ring">
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
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
    <div className="grid gap-4 lg:grid-cols-2 items-start">
      <Panel title="Image → Base64" bodyClassName="p-4 space-y-3">
        <FileDropZone accept="image/*" onFiles={fromFile} compact title="Choose or drop an image" />
        {dataUri && (
          <>
            <div className="flex items-center gap-3">
              <img src={dataUri} alt="" className="w-16 h-16 object-contain rounded-md border border-border bg-surface-alt" />
              <div className="text-sm min-w-0">
                <div className="text-text font-medium truncate">{name}</div>
                <div className="text-text-muted text-xs">Data URI length: {dataUri.length.toLocaleString()} characters</div>
              </div>
            </div>
            <CodeBlock title="Data URI" code={dataUri} preClassName="max-h-32 break-all! text-xs!" />
            <CodeBlock title="HTML" code={`<img src="${dataUri}" alt="" />`} preClassName="max-h-24 break-all! text-xs!" />
            <CodeBlock title="CSS" code={`background-image: url("${dataUri}");`} preClassName="max-h-24 break-all! text-xs!" />
          </>
        )}
      </Panel>
      <Panel title={<label htmlFor="b64-input">Base64 → Image</label>} bodyClassName="p-4 space-y-3">
        <textarea
          id="b64-input"
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="Paste a data URI (data:image/png;base64,…) or raw Base64"
          spellCheck={false}
          className="w-full min-h-32 p-2.5 rounded-md bg-surface-alt border border-border-strong font-mono text-xs text-text break-all resize-y placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
        {!decoded && <EmptyState icon={ImageIcon} title="The decoded image appears here" />}
        {decoded && ('error' in decoded ? (
          <ErrorNotice title="Not an image">{decoded.error}</ErrorNotice>
        ) : (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-surface-alt p-4 flex items-center justify-center min-h-40">
              <img src={decoded.src} alt="Decoded image" className="max-w-full max-h-72 object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <Badge>{decoded.mime}</Badge>
              <Badge>{formatBytes(decoded.bytes)}</Badge>
              <Button
                size="sm"
                className="ml-auto"
                onClick={() => triggerDownload(decoded.src, `image.${decoded.mime.split('/')[1].replace('svg+xml', 'svg').replace('jpeg', 'jpg')}`)}
              >
                <Download size={13} aria-hidden="true" /> Download
              </Button>
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
}

export default function ImageConverterPage() {
  const [o, setO] = useUrlOptions(schema);
  return (
    <ToolLayout
      seoTitle="Image Compressor & Converter – JPEG, PNG, WebP, AVIF (Private)"
      tagline="Compress, resize and convert images in bulk, or turn them into Base64 data URIs, in your browser"
      metaDescription="Compress and resize images and convert between JPEG, PNG, WebP and AVIF in your browser, in bulk. Also converts images to Base64 data URIs and back. Images are never uploaded."
      about={
        <>
          <ul className="grid gap-3 md:grid-cols-4">
            <li><strong className="text-text">WebP</strong> is usually 25–35% smaller than JPEG at similar quality, with transparency. A good default for the web.</li>
            <li><strong className="text-text">AVIF</strong> is smaller still for photos but slower to encode. Offered only if your browser can encode it.</li>
            <li><strong className="text-text">JPEG</strong> has the best compatibility for photos. No transparency: transparent areas get the background colour.</li>
            <li><strong className="text-text">PNG</strong> is lossless; best for screenshots, logos and sharp edges or text. Large for photos.</li>
          </ul>
          <p className="mt-3 text-xs text-text-muted">Re-encoding removes EXIF metadata such as camera details and GPS location.</p>
        </>
      }
    >
      <Toolbar>
        <SegmentedControl ariaLabel="Mode" options={[{ id: 'convert', label: 'Compress & convert' }, { id: 'base64', label: 'Image ↔ Base64' }]} value={o.tab} onChange={(v) => setO({ tab: v as Opts['tab'] })} />
      </Toolbar>
      {o.tab === 'convert' ? <ConverterPanel o={o} setO={setO} /> : <Base64Panel />}
    </ToolLayout>
  );
}
