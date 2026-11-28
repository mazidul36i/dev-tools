import { useDeferredValue, useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Checkbox from '@components/ui/Checkbox';
import SegmentedControl from '@components/ui/SegmentedControl';
import Button from '@components/ui/Button';
import { EditorPanel, OutputPanel, SplitPane, Toolbar, ToolbarDivider, ToolbarSpacer } from '@components/workspace';
import * as enc from '@lib/encoder-utils';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import { useShareInput } from '@hooks/useShareInput';

const MODES = ['base64', 'url', 'html', 'hex'] as const;
type Mode = (typeof MODES)[number];

const schema = {
  mode: opt.oneOf(MODES, 'base64'),
  dir: opt.oneOf(['encode', 'decode'] as const, 'encode'),
  urlSafe: opt.bool(false),
  noPad: opt.bool(false),
  component: opt.bool(true),
  upper: opt.bool(false),
  prefix: opt.bool(false),
};

const modeLabels: Record<Mode, string> = { base64: 'Base64', url: 'URL', html: 'HTML entities', hex: 'Hex' };
const extensions: Record<Mode, string> = { base64: 'b64', url: 'txt', html: 'html', hex: 'hex' };

export default function EncoderDecoderPage() {
  const [input, setInput] = useState('');
  const [o, setO] = useUrlOptions(schema);
  const deferred = useDeferredValue(input);

  const { output, error } = useMemo(() => {
    if (!deferred) return { output: '', error: null };
    try {
      const encode = o.dir === 'encode';
      let out: string;
      switch (o.mode) {
        case 'base64': out = encode ? enc.encodeBase64(deferred, o.urlSafe, o.noPad) : enc.decodeBase64(deferred, o.urlSafe, o.noPad); break;
        case 'url': out = encode ? enc.encodeURL(deferred, o.component) : enc.decodeURL(deferred, o.component); break;
        case 'html': out = encode ? enc.encodeHTML(deferred) : enc.decodeHTML(deferred); break;
        case 'hex': out = encode ? enc.encodeHex(deferred, o.upper, o.prefix) : enc.decodeHex(deferred); break;
      }
      return { output: out, error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [deferred, o]);

  useShareInput({ input }, (d) => d.input !== undefined && setInput(d.input), { enabled: input.length > 0 });

  const swap = () => {
    setInput(output);
    setO({ dir: o.dir === 'encode' ? 'decode' : 'encode' });
  };

  const encoding = o.dir === 'encode';

  return (
    <ToolLayout
      seoTitle="Base64, URL, HTML & Hex Encoder / Decoder"
      tagline="Encode or decode Base64, URL percent-encoding, HTML entities and hex. Results update as you type."
      metaDescription="Encode and decode Base64 (standard and URL-safe), URL percent-encoding, HTML entities and hex in your browser. UTF-8 aware."
      variant="workspace"
      about={
        <ul className="grid gap-3 md:grid-cols-2">
          <li><strong className="text-text">Base64</strong> turns bytes into text for e-mail, data URIs and JSON. URL-safe Base64 swaps <code>+/</code> for <code>-_</code>; decoding accepts either.</li>
          <li><strong className="text-text">URL</strong> percent-encodes characters that aren’t allowed in URLs. “Component” also encodes <code>/ ? &amp; =</code>, which you want for a single query value.</li>
          <li><strong className="text-text">HTML entities</strong> escape <code>&lt; &gt; &amp; " '</code> so text renders literally. Decoding never runs markup from the input.</li>
          <li><strong className="text-text">Hex</strong> shows each UTF-8 byte as two digits. Decoding ignores spaces, colons and <code>0x</code> prefixes.</li>
        </ul>
      }
    >
      <Toolbar>
        <SegmentedControl ariaLabel="Encoding" options={MODES.map((m) => ({ id: m, label: modeLabels[m] }))} value={o.mode} onChange={(v) => setO({ mode: v as Mode })} />
        <SegmentedControl ariaLabel="Direction" options={[{ id: 'encode', label: 'Encode' }, { id: 'decode', label: 'Decode' }]} value={o.dir} onChange={(v) => setO({ dir: v as 'encode' | 'decode' })} />
        {(o.mode === 'base64' || o.mode === 'url' || (o.mode === 'hex' && encoding)) && <ToolbarDivider />}
        {o.mode === 'base64' && encoding && (
          <>
            <Checkbox checked={o.urlSafe} onChange={(v) => setO({ urlSafe: v })} label="URL-safe (-_)" className="text-xs" />
            <Checkbox checked={o.noPad} onChange={(v) => setO({ noPad: v })} label="No padding" className="text-xs" />
          </>
        )}
        {o.mode === 'base64' && !encoding && <span className="text-xs text-text-muted">Accepts standard and URL-safe input, with or without padding</span>}
        {o.mode === 'url' && <Checkbox checked={o.component} onChange={(v) => setO({ component: v })} label="Component (encode / ? & = too)" className="text-xs" />}
        {o.mode === 'hex' && encoding && (
          <>
            <Checkbox checked={o.upper} onChange={(v) => setO({ upper: v })} label="Uppercase" className="text-xs" />
            <Checkbox checked={o.prefix} onChange={(v) => setO({ prefix: v })} label="0x prefix" className="text-xs" />
          </>
        )}
        <ToolbarSpacer />
        <Button variant="secondary" size="sm" onClick={swap} disabled={!output} title="Use the output as input and flip the direction">
          <ArrowLeftRight size={14} aria-hidden="true" /> Swap
        </Button>
      </Toolbar>
      <SplitPane
        storageKey="encoder-decoder"
        left={
          <EditorPanel
            label={encoding ? 'Text' : `${modeLabels[o.mode]} input`}
            value={input}
            onChange={setInput}
            placeholder={encoding ? 'Type or paste text to encode' : `Paste ${modeLabels[o.mode]} to decode`}
            fileAccept="text/*,.txt,.b64,.hex,.html"
            className="flex-1"
          />
        }
        right={
          <OutputPanel
            label={encoding ? `${modeLabels[o.mode]}` : 'Decoded text'}
            value={output}
            error={error}
            errorTitle={`Could not ${o.dir} this input`}
            placeholder="Result appears here"
            downloadName={`${encoding ? 'encoded' : 'decoded'}.${encoding ? extensions[o.mode] : 'txt'}`}
            onUseAsInput={() => setInput(output)}
            className="flex-1"
          />
        }
      />
    </ToolLayout>
  );
}
