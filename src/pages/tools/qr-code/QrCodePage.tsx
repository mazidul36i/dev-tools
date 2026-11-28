import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { toast } from 'sonner';
import { Camera, CameraOff, Download, ExternalLink, QrCode } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Badge from '@components/ui/Badge';
import Checkbox from '@components/ui/Checkbox';
import CodeBlock from '@components/ui/CodeBlock';
import FileDropZone from '@components/ui/FileDropZone';
import SegmentedControl from '@components/ui/SegmentedControl';
import Button from '@components/ui/Button';
import { Field, SelectInput, TextInput } from '@components/ui/Input';
import { TextAreaInput } from '@components/ui/TextArea';
import { EmptyState, ErrorNotice, Panel, Toolbar } from '@components/workspace';
import { opt, type OptionValues } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import { useShareInput } from '@hooks/useShareInput';
import {
  describePayload, emailPayload, phonePayload, smsPayload, vcardPayload, wifiPayload, type WifiOptions,
} from '@lib/qr-utils';

// ── Generator ──────────────────────────────────────────────────────────

type Kind = 'text' | 'wifi' | 'email' | 'phone' | 'sms' | 'contact';

const kindOptions: { id: Kind; label: string }[] = [
  { id: 'text', label: 'Text / URL' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'sms', label: 'SMS' },
  { id: 'contact', label: 'Contact' },
];

const KINDS = ['text', 'wifi', 'email', 'phone', 'sms', 'contact'] as const;

// Only appearance and the kind of code go in the URL. Wi-Fi passwords and
// contact details stay in memory; plain text can be shared on request.
const schema = {
  tab: opt.oneOf(['generate', 'read'] as const, 'generate'),
  kind: opt.oneOf(KINDS, 'text'),
  ecc: opt.oneOf(['L', 'M', 'Q', 'H'] as const, 'M'),
  size: opt.num(320, { min: 128, max: 1024 }),
  margin: opt.num(2, { min: 0, max: 10 }),
  fg: opt.str('111827', 8),
  bg: opt.str('ffffff', 8),
  clear: opt.bool(false),
};
type Opts = OptionValues<typeof schema>;
type SetOpts = (patch: Partial<Opts>) => void;
const hexColor = (v: string, fallback: string) => (/^[0-9a-f]{6}$/i.test(v) ? `#${v}` : fallback);

const eccOptions = [
  { id: 'L', label: 'L 7%' },
  { id: 'M', label: 'M 15%' },
  { id: 'Q', label: 'Q 25%' },
  { id: 'H', label: 'H 30%' },
];

function GeneratorPanel({ o, setO }: { o: Opts; setO: SetOpts }) {
  const kind = o.kind as Kind;
  const ecc = o.ecc;
  const size = o.size;
  const margin = o.margin;
  const dark = hexColor(o.fg, '#111827');
  const light = hexColor(o.bg, '#ffffff');
  const transparent = o.clear;
  const [text, setText] = useState('https://example.com');
  const [wifi, setWifi] = useState<WifiOptions>({ ssid: '', password: '', security: 'WPA', hidden: false });
  const [email, setEmail] = useState({ to: '', subject: '', body: '' });
  const [phone, setPhone] = useState('');
  const [sms, setSms] = useState({ number: '', message: '' });
  const [contact, setContact] = useState({ firstName: '', lastName: '', organization: '', title: '', phone: '', email: '', url: '' });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState('');

  const payload = useMemo(() => {
    switch (kind) {
      case 'text': return text;
      case 'wifi': return wifi.ssid ? wifiPayload(wifi) : '';
      case 'email': return email.to ? emailPayload(email.to, email.subject, email.body) : '';
      case 'phone': return phone ? phonePayload(phone) : '';
      case 'sms': return sms.number ? smsPayload(sms.number, sms.message) : '';
      case 'contact': return contact.firstName ? vcardPayload(contact) : '';
    }
  }, [kind, text, wifi, email, phone, sms, contact]);

  useShareInput({ text }, (d) => {
    if (d.text !== undefined) {
      setText(d.text);
      setO({ kind: 'text' });
    }
  }, { enabled: kind === 'text' && text.length > 0 });

  const color = useMemo(() => ({ dark, light: transparent ? '#0000' : light }), [dark, light, transparent]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!payload) {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      setSvg('');
      setError(null);
      return;
    }
    const opts = { errorCorrectionLevel: ecc, width: size, margin, color };
    QRCode.toCanvas(canvas, payload, opts)
      .then(() => QRCode.toString(payload, { ...opts, type: 'svg' }))
      .then((s) => { setSvg(s); setError(null); })
      .catch((e: Error) => {
        setSvg('');
        setError(/too big|amount of data/i.test(e.message) ? 'Too much data for a QR code at this error-correction level. Shorten the content or choose a lower level.' : e.message);
      });
  }, [payload, ecc, size, margin, color]);

  const downloadPng = () => {
    const url = canvasRef.current?.toDataURL('image/png');
    if (!url || !payload) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qr-code.png';
    a.click();
  };
  const downloadSvg = () => {
    if (!svg) return;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qr-code.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const input = (label: string, value: string, onChange: (v: string) => void, props: Record<string, string> = {}) => (
    <Field label={label} htmlFor={`qr-${label}`}>
      <TextInput id={`qr-${label}`} value={value} onChange={(e) => onChange(e.target.value)} {...props} />
    </Field>
  );

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem] gap-4 items-start">
      <Panel title="Content" bodyClassName="p-4 space-y-5 min-w-0">
        <SegmentedControl ariaLabel="Content type" options={kindOptions} value={kind} onChange={(v) => setO({ kind: v as Kind })} />

        {kind === 'text' && (
          <TextAreaInput value={text} onChange={(e) => setText(e.target.value)} placeholder="Text or URL to encode" aria-label="Content" className="min-h-32!" />
        )}
        {kind === 'wifi' && (
          <div className="grid sm:grid-cols-2 gap-4">
            {input('Network name (SSID)', wifi.ssid, (v) => setWifi((w) => ({ ...w, ssid: v })))}
            <Field label="Security" htmlFor="qr-security">
              <SelectInput
                id="qr-security"
                value={wifi.security}
                onChange={(e) => setWifi((w) => ({ ...w, security: e.target.value as WifiOptions['security'] }))}
                options={[{ value: 'WPA', label: 'WPA / WPA2 / WPA3' }, { value: 'WEP', label: 'WEP' }, { value: 'nopass', label: 'None (open)' }]}
              />
            </Field>
            {wifi.security !== 'nopass' && input('Password', wifi.password ?? '', (v) => setWifi((w) => ({ ...w, password: v })), { type: 'password', autoComplete: 'off' })}
            <Checkbox checked={!!wifi.hidden} onChange={(v) => setWifi((w) => ({ ...w, hidden: v }))} label="Hidden network" className="self-end pb-2" />
          </div>
        )}
        {kind === 'email' && (
          <div className="grid gap-4">
            {input('To', email.to, (v) => setEmail((m) => ({ ...m, to: v })), { type: 'email', placeholder: 'name@example.com' })}
            {input('Subject', email.subject, (v) => setEmail((m) => ({ ...m, subject: v })))}
            {input('Message', email.body, (v) => setEmail((m) => ({ ...m, body: v })))}
          </div>
        )}
        {kind === 'phone' && input('Phone number', phone, setPhone, { type: 'tel', placeholder: '+1 555 010 9999' })}
        {kind === 'sms' && (
          <div className="grid gap-4">
            {input('Phone number', sms.number, (v) => setSms((m) => ({ ...m, number: v })), { type: 'tel' })}
            {input('Message', sms.message, (v) => setSms((m) => ({ ...m, message: v })))}
          </div>
        )}
        {kind === 'contact' && (
          <div className="grid sm:grid-cols-2 gap-4">
            {input('First name', contact.firstName, (v) => setContact((c) => ({ ...c, firstName: v })))}
            {input('Last name', contact.lastName, (v) => setContact((c) => ({ ...c, lastName: v })))}
            {input('Organisation', contact.organization, (v) => setContact((c) => ({ ...c, organization: v })))}
            {input('Job title', contact.title, (v) => setContact((c) => ({ ...c, title: v })))}
            {input('Phone', contact.phone, (v) => setContact((c) => ({ ...c, phone: v })), { type: 'tel' })}
            {input('Email', contact.email, (v) => setContact((c) => ({ ...c, email: v })), { type: 'email' })}
            {input('Website', contact.url, (v) => setContact((c) => ({ ...c, url: v })), { type: 'url' })}
          </div>
        )}

        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-text-secondary">Error correction</span>
            <SegmentedControl ariaLabel="Error correction" options={eccOptions} value={ecc} onChange={(v) => setO({ ecc: v as typeof ecc })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={`Size: ${size}px`} htmlFor="qr-size">
              <input id="qr-size" type="range" min={128} max={1024} step={16} value={size} onChange={(e) => setO({ size: Number(e.target.value) })} className="w-full accent-primary" />
            </Field>
            <Field label={`Quiet zone: ${margin} modules`} htmlFor="qr-margin">
              <input id="qr-margin" type="range" min={0} max={10} value={margin} onChange={(e) => setO({ margin: Number(e.target.value) })} className="w-full accent-primary" />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input type="color" value={dark} onChange={(e) => setO({ fg: e.target.value.slice(1) })} className="w-9 h-9 rounded-md border border-border-strong p-0.5 cursor-pointer" /> Foreground
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input type="color" value={light} disabled={transparent} onChange={(e) => setO({ bg: e.target.value.slice(1) })} className="w-9 h-9 rounded-md border border-border-strong p-0.5 cursor-pointer disabled:opacity-40" /> Background
            </label>
            <Checkbox checked={transparent} onChange={(v) => setO({ clear: v })} label="Transparent background" />
          </div>
        </div>

        {kind !== 'text' && payload && <CodeBlock title="Encoded content" code={payload} preClassName="max-h-40 text-xs!" />}
      </Panel>

      <Panel
        title="QR code"
        bodyClassName="p-4 space-y-3"
        footer={<span>{payload.length} characters · test with a phone before printing</span>}
      >
        <div className="rounded-md border border-border bg-surface-alt p-4 flex items-center justify-center aspect-square">
          {error ? (
            <ErrorNotice title="Can’t make this QR code">{error}</ErrorNotice>
          ) : !payload ? (
            <EmptyState icon={QrCode} title="Fill in the form to generate a QR code" />
          ) : null}
          <canvas ref={canvasRef} role="img" aria-label="Generated QR code" className={`max-w-full h-auto ${error || !payload ? 'hidden' : ''}`} style={{ imageRendering: 'pixelated' }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={downloadPng} disabled={!payload || !!error}><Download size={15} aria-hidden="true" /> PNG</Button>
          <Button variant="secondary" onClick={downloadSvg} disabled={!svg}><Download size={15} aria-hidden="true" /> SVG</Button>
        </div>
      </Panel>
    </div>
  );
}

// ── Reader ─────────────────────────────────────────────────────────────

function decodeFromSource(source: CanvasImageSource, width: number, height: number): string | null {
  const canvas = document.createElement('canvas');
  // Large photos are downscaled for speed; QR codes survive this well.
  const scale = Math.min(1, 1600 / Math.max(width, height));
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(data.data, data.width, data.height, { inversionAttempts: 'attemptBoth' })?.data ?? null;
}

function ReaderPanel() {
  const [result, setResult] = useState<{ text: string; preview?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const decodeFile = useCallback(async (file: File) => {
    setError(null);
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const text = decodeFromSource(img, img.naturalWidth, img.naturalHeight);
      if (text === null) {
        setResult(null);
        setError('No QR code found in this image. Try a sharper or tighter crop.');
      } else {
        setResult({ text, preview: url });
        return;
      }
    } catch {
      setError('Could not read this image.');
    }
    URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
      if (file) decodeFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [decodeFile]);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setScanning(true);
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      const tick = () => {
        if (!streamRef.current) return;
        if (video.readyState >= 2) {
          const text = decodeFromSource(video, video.videoWidth, video.videoHeight);
          if (text !== null) {
            setResult({ text });
            stopCamera();
            toast.success('QR code found');
            return;
          }
        }
        setTimeout(() => requestAnimationFrame(tick), 150);
      };
      tick();
    } catch (e) {
      stopCamera();
      setError(e instanceof Error && e.name === 'NotAllowedError' ? 'Camera permission was denied.' : 'No camera is available.');
    }
  };

  const isUrl = result && /^https?:\/\//i.test(result.text);

  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <Panel title="Image or camera" bodyClassName="p-4 space-y-4">
        <FileDropZone accept="image/*" onFiles={(f) => decodeFile(f[0])} title="Drop a QR code image, click to browse, or paste" hint="Screenshots and photos work. Decoding happens on your device." />
        <div className="flex items-center gap-3">
          {scanning ? (
            <Button variant="secondary" onClick={stopCamera}><CameraOff size={15} aria-hidden="true" /> Stop camera</Button>
          ) : (
            <Button variant="secondary" onClick={startCamera}><Camera size={15} aria-hidden="true" /> Scan with camera</Button>
          )}
        </div>
        <video ref={videoRef} muted playsInline aria-label="Camera preview" className={`w-full rounded-md border border-border bg-black ${scanning ? '' : 'hidden'}`} />
      </Panel>
      <Panel title="Decoded" bodyClassName="p-4 space-y-4">
        {error && <ErrorNotice>{error}</ErrorNotice>}
        {result ? (
          <>
            <div className="flex items-center gap-3">
              {result.preview && <img src={result.preview} alt="" className="w-16 h-16 object-contain rounded-md border border-border bg-white" />}
              <Badge tone="success">{describePayload(result.text)}</Badge>
              {isUrl && (
                <a href={result.text} target="_blank" rel="noopener noreferrer nofollow" className="ml-auto inline-flex items-center gap-1 rounded text-sm text-primary hover:underline focus-ring">
                  Open link <ExternalLink size={13} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </div>
            <CodeBlock title="Decoded content" code={result.text} preClassName="max-h-80 break-all!" />
            {isUrl && <p className="text-xs text-text-muted">Check the address before opening links from QR codes you don’t trust.</p>}
          </>
        ) : !error && (
          <EmptyState icon={QrCode} title="The decoded content appears here" />
        )}
      </Panel>
    </div>
  );
}

export default function QrCodePage() {
  const [o, setO] = useUrlOptions(schema);
  return (
    <ToolLayout
      seoTitle="QR Code Generator & Scanner – Wi-Fi, URL, vCard (PNG & SVG)"
      tagline="Create QR codes for links, Wi-Fi, contacts and more, or decode one from an image or your camera"
      metaDescription="Free QR code generator for URLs, text, Wi-Fi, email, phone, SMS and vCard contacts with colours, error correction, PNG and SVG download. Also reads QR codes from images or your camera, privately in your browser."
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">Error correction.</strong> Higher levels survive damage or a logo over the middle (use H for that) at the cost of a denser code. M is a good default.</li>
          <li><strong className="text-text">Contrast &amp; quiet zone.</strong> Keep a dark foreground on a light background and leave at least 2 modules of margin so phones can find the code.</li>
          <li><strong className="text-text">Wi-Fi codes</strong> let phone cameras join a network directly, handy for guests. Passwords and contact details are never put in links.</li>
        </ul>
      }
    >
      <Toolbar>
        <SegmentedControl ariaLabel="Mode" options={[{ id: 'generate', label: 'Generate' }, { id: 'read', label: 'Read / scan' }]} value={o.tab} onChange={(v) => setO({ tab: v as Opts['tab'] })} />
      </Toolbar>
      {o.tab === 'generate' ? <GeneratorPanel o={o} setO={setO} /> : <ReaderPanel />}
    </ToolLayout>
  );
}
