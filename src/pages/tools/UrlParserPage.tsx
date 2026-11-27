import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import SegmentedControl from '@components/ui/SegmentedControl';
import Checkbox from '@components/ui/Checkbox';
import Button from '@components/ui/Button';
import CopyButton from '@components/ui/CopyButton';
import { EditorPanel, EmptyState, ErrorNotice, OutputPanel, Panel, ResultRows, SplitPane, Toolbar, ToolbarDivider } from '@components/workspace';
import { effectivePort, parseUrl, withParams } from '@lib/url-parse-utils';
import { decodeURL, encodeURL } from '@lib/encoder-utils';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import { useShareInput } from '@hooks/useShareInput';

const SAMPLE = 'https://user@api.example.com:8443/v1/search?q=hello%20world&tag=dev&tag=tools&page=2#results';

const schema = {
  mode: opt.oneOf(['parse', 'encode', 'decode'] as const, 'parse'),
  component: opt.bool(true),
};

const cellInput =
  'w-full h-8 px-2 rounded-md bg-surface-alt border border-border-strong font-mono text-[13px] text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25';

export default function UrlParserPage() {
  const [o, setO] = useUrlOptions(schema);
  const [input, setInput] = useState('');

  useShareInput({ input }, (d) => d.input !== undefined && setInput(d.input), { enabled: input.length > 0 });

  return (
    <ToolLayout
      seoTitle="URL Parser, Query String Editor & URL Encoder"
      tagline="Break a URL into its parts, edit query parameters, or percent-encode and decode text"
      metaDescription="Parse URLs into protocol, host, port, path, query and fragment; view and edit decoded query parameters; percent-encode or decode URL components. Runs in your browser."
      variant={o.mode === 'parse' ? 'page' : 'workspace'}
      about={
        <div className="space-y-2">
          <p>
            <strong className="text-text">Parse</strong> uses the browser’s standard URL parser, the same one <code>fetch</code> and links use, so what you see is
            how browsers read the URL. Query values are shown decoded; edit them and copy the rebuilt URL.
          </p>
          <p>
            <strong className="text-text">Encode / Decode</strong> percent-encodes text. “Component” encoding also escapes <code>/ ? &amp; = #</code>, which is
            what you want for a single query value or path segment.
          </p>
        </div>
      }
    >
      <Toolbar>
        <SegmentedControl ariaLabel="Mode" options={[{ id: 'parse', label: 'Parse' }, { id: 'encode', label: 'Encode' }, { id: 'decode', label: 'Decode' }]} value={o.mode} onChange={(v) => setO({ mode: v as typeof o.mode })} />
        {o.mode !== 'parse' && (
          <>
            <ToolbarDivider />
            <Checkbox checked={o.component} onChange={(v) => setO({ component: v })} label="Component (also / ? & = #)" className="text-xs" />
          </>
        )}
      </Toolbar>

      {o.mode === 'parse' ? <ParseView input={input} setInput={setInput} /> : <CodecView input={input} setInput={setInput} encode={o.mode === 'encode'} component={o.component} />}
    </ToolLayout>
  );
}

function ParseView({ input, setInput }: { input: string; setInput: (v: string) => void }) {
  const deferred = useDeferredValue(input);
  const parsed = useMemo(() => {
    if (!deferred.trim()) return null;
    try {
      return { ok: parseUrl(deferred) } as const;
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) } as const;
    }
  }, [deferred]);

  const [params, setParams] = useState<[string, string][]>([]);
  useEffect(() => {
    setParams(parsed && 'ok' in parsed && parsed.ok ? parsed.ok.params : []);
  }, [parsed]);

  const url = parsed && 'ok' in parsed ? parsed.ok?.url : undefined;
  const rebuilt = url ? withParams(url, params) : '';
  const changed = url ? rebuilt !== url.href : false;
  const port = url ? effectivePort(url) : null;

  return (
    <div className="space-y-4">
      <Panel
        title={<label htmlFor="url-input">URL</label>}
        bodyClassName="p-3"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE)}>Sample</Button>
            <Button variant="ghost" size="sm" onClick={() => setInput('')} disabled={!input}>Clear</Button>
          </>
        }
      >
        <textarea
          id="url-input"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://example.com/path?query=value#fragment"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="w-full p-2.5 rounded-md bg-surface-alt border border-border-strong font-mono text-[13px] text-text break-all resize-y
            placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
      </Panel>

      {!parsed && <EmptyState title="Paste a URL to see its parts" className="rounded-lg border border-dashed border-border" />}
      {parsed && 'error' in parsed && <ErrorNotice title="Could not parse this URL">{parsed.error}</ErrorNotice>}

      {url && port && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Parts">
            <ResultRows
              labelWidth="sm:w-28"
              rows={[
                { label: 'Protocol', value: url.protocol.replace(/:$/, ''), hint: parsed && 'ok' in parsed && parsed.ok?.assumedScheme ? 'Assumed: the input had no scheme' : undefined },
                { label: 'Host', value: url.hostname },
                { label: 'Port', value: port.port, hint: port.isDefault && port.port ? 'Default for this protocol' : undefined },
                { label: 'Path', value: decodeSafe(url.pathname) },
                { label: 'Query', value: url.search },
                { label: 'Fragment', value: url.hash.replace(/^#/, '') },
                { label: 'Origin', value: url.origin === 'null' ? '' : url.origin },
                ...(url.username ? [{ label: 'Username', value: decodeSafe(url.username) }] : []),
                ...(url.password ? [{ label: 'Password', value: '••••••', copy: false }] : []),
              ]}
            />
          </Panel>

          <Panel
            title={`Query parameters · ${params.length}`}
            actions={
              <Button variant="ghost" size="sm" onClick={() => setParams((p) => [...p, ['', '']])}>
                <Plus size={13} aria-hidden="true" /> Add
              </Button>
            }
            footer={
              <>
                <span className="min-w-0 truncate font-mono">{changed ? rebuilt : 'Edit a value to rebuild the URL'}</span>
                {changed && <CopyButton text={rebuilt} label="Copy URL" size="sm" className="ml-auto h-6!" />}
              </>
            }
          >
            {params.length === 0 ? (
              <p className="text-sm text-text-muted">No query parameters.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-text-muted">
                    <th scope="col" className="pb-2 font-medium w-2/5">Key</th>
                    <th scope="col" className="pb-2 pl-2 font-medium">Value (decoded)</th>
                    <th scope="col" className="pb-2 w-9"><span className="sr-only">Remove</span></th>
                  </tr>
                </thead>
                <tbody>
                  {params.map(([k, v], i) => (
                    <tr key={i}>
                      <td className="py-1">
                        <input aria-label={`Key ${i + 1}`} value={k} onChange={(e) => setParams((p) => p.map((row, j) => (j === i ? [e.target.value, row[1]] : row)))} className={cellInput} />
                      </td>
                      <td className="py-1 pl-2">
                        <input aria-label={`Value ${i + 1}`} value={v} onChange={(e) => setParams((p) => p.map((row, j) => (j === i ? [row[0], e.target.value] : row)))} className={cellInput} />
                      </td>
                      <td className="py-1 pl-1">
                        <button
                          type="button"
                          onClick={() => setParams((p) => p.filter((_, j) => j !== i))}
                          aria-label={`Remove ${k || `parameter ${i + 1}`}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:text-error hover:bg-error/10 focus-ring"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}

function decodeSafe(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function CodecView({ input, setInput, encode, component }: { input: string; setInput: (v: string) => void; encode: boolean; component: boolean }) {
  const deferred = useDeferredValue(input);
  const { output, error } = useMemo(() => {
    if (!deferred) return { output: '', error: null };
    try {
      return { output: encode ? encodeURL(deferred, component) : decodeURL(deferred, component), error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [deferred, encode, component]);

  return (
    <SplitPane
      storageKey="url-codec"
      left={<EditorPanel label={encode ? 'Text' : 'Encoded'} value={input} onChange={setInput} placeholder={encode ? 'Text to percent-encode' : 'Percent-encoded text, e.g. hello%20world'} className="flex-1" />}
      right={<OutputPanel label={encode ? 'Encoded' : 'Decoded'} value={output} error={error} errorTitle="Could not decode" onUseAsInput={() => setInput(output)} className="flex-1" />}
    />
  );
}
