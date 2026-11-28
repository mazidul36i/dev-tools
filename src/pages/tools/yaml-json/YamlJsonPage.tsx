import { useDeferredValue, useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import SegmentedControl from '@components/ui/SegmentedControl';
import Checkbox from '@components/ui/Checkbox';
import Button from '@components/ui/Button';
import { EditorPanel, OutputPanel, SplitPane, Toolbar, ToolbarDivider, ToolbarSelect, ToolbarSpacer } from '@components/workspace';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import { useShareInput } from '@hooks/useShareInput';
import { jsonToYaml, yamlToJson } from '@lib/yaml-utils';

const SAMPLE_YAML = `# docker-compose style example
version: "3.9"
x-defaults: &defaults
  restart: unless-stopped
  environment:
    TZ: UTC
services:
  web:
    <<: *defaults
    image: nginx:1.27
    ports: ["8080:80"]
  db:
    <<: *defaults
    image: postgres:16
    volumes:
      - db-data:/var/lib/postgresql/data
volumes:
  db-data: {}
`;

const SAMPLE_JSON = JSON.stringify({
  name: 'dev-tools',
  private: true,
  scripts: { dev: 'vite', build: 'vite build' },
  keywords: ['json', 'yaml'],
}, null, 2);

const schema = {
  mode: opt.oneOf(['yaml2json', 'json2yaml'] as const, 'yaml2json'),
  indent: opt.oneOf(['2', '4'] as const, '2'),
  sort: opt.bool(false),
  split: opt.bool(false),
};

export default function YamlJsonPage() {
  const [o, setO] = useUrlOptions(schema);
  const [input, setInput] = useState(SAMPLE_YAML);
  const deferred = useDeferredValue(input);
  const isYamlIn = o.mode === 'yaml2json';

  const { output, error } = useMemo(() => {
    if (!deferred.trim()) return { output: '', error: null };
    try {
      const out = isYamlIn
        ? yamlToJson(deferred, Number(o.indent))
        : jsonToYaml(deferred, { indent: Number(o.indent), sortKeys: o.sort, splitArray: o.split });
      return { output: out, error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [deferred, isYamlIn, o.indent, o.sort, o.split]);

  useShareInput({ input }, (d) => d.input !== undefined && setInput(d.input), { enabled: input.length > 0 });

  const swap = () => {
    if (error) return;
    setO({ mode: isYamlIn ? 'json2yaml' : 'yaml2json' });
    setInput(output);
  };

  return (
    <ToolLayout
      seoTitle="YAML to JSON & JSON to YAML Converter Online"
      tagline="Convert YAML to JSON and back, with anchors, merge keys and multi-document support"
      metaDescription="Convert YAML to JSON and JSON to YAML online. Supports anchors, aliases, merge keys (<<), multi-document streams, key sorting and precise error locations. Runs in your browser."
      variant="workspace"
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">Anchors &amp; merge keys.</strong> Anchors (&amp;name), aliases (*name) and merge keys (&lt;&lt;: *name) are expanded, so the JSON shows final values, handy for checking Compose and CI files.</li>
          <li><strong className="text-text">Multiple documents.</strong> A YAML stream with several documents separated by <code>---</code> becomes a JSON array. A top-level JSON array can be split back into documents.</li>
          <li><strong className="text-text">What changes.</strong> Comments and anchors can’t be represented in JSON and are dropped. YAML 1.2 rules apply: yes/no/on/off stay strings.</li>
        </ul>
      }
    >
      <Toolbar>
        <SegmentedControl ariaLabel="Direction" options={[{ id: 'yaml2json', label: 'YAML → JSON' }, { id: 'json2yaml', label: 'JSON → YAML' }]} value={o.mode} onChange={(v) => setO({ mode: v as typeof o.mode })} />
        <ToolbarDivider />
        <ToolbarSelect label="Indent" value={o.indent} onChange={(v) => setO({ indent: v as '2' | '4' })} options={[{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }]} />
        {!isYamlIn && (
          <>
            <Checkbox checked={o.sort} onChange={(v) => setO({ sort: v })} label="Sort keys" className="text-xs" />
            <Checkbox checked={o.split} onChange={(v) => setO({ split: v })} label="Top-level array → documents" className="text-xs" />
          </>
        )}
        <ToolbarSpacer />
        <Button variant="secondary" size="sm" onClick={swap} disabled={!output}>
          <ArrowLeftRight size={14} aria-hidden="true" /> Swap
        </Button>
      </Toolbar>
      <SplitPane
        storageKey="yaml-json"
        left={
          <EditorPanel
            label={isYamlIn ? 'YAML' : 'JSON'}
            value={input}
            onChange={setInput}
            placeholder={isYamlIn ? 'Paste YAML here…' : 'Paste JSON here…'}
            sample={isYamlIn ? SAMPLE_YAML : SAMPLE_JSON}
            fileAccept={isYamlIn ? '.yaml,.yml,text/yaml,text/plain' : '.json,application/json,text/plain'}
            className="flex-1"
          />
        }
        right={
          <OutputPanel
            label={isYamlIn ? 'JSON' : 'YAML'}
            value={output}
            error={error}
            errorTitle={isYamlIn ? 'Invalid YAML' : 'Invalid JSON'}
            downloadName={isYamlIn ? 'converted.json' : 'converted.yaml'}
            downloadMime={isYamlIn ? 'application/json' : 'application/yaml'}
            className="flex-1"
          />
        }
      />
    </ToolLayout>
  );
}
