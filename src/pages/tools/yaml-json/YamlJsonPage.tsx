import { useCallback, useMemo, useState } from 'react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import ToolIO from '@components/ui/ToolIO';
import SegmentedControl from '@components/ui/SegmentedControl';
import Checkbox from '@components/ui/Checkbox';
import { SecondaryButton } from '@components/ui/Button';
import { jsonToYaml, yamlToJson } from '@lib/yaml-utils';

type Mode = 'yaml2json' | 'json2yaml';

const modeOptions = [
  { id: 'yaml2json', label: 'YAML → JSON' },
  { id: 'json2yaml', label: 'JSON → YAML' },
];
const indentOptions = [
  { id: '2', label: '2 spaces' },
  { id: '4', label: '4 spaces' },
];

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

export default function YamlJsonPage() {
  const [mode, setMode] = useState<Mode>('yaml2json');
  const [input, setInput] = useState(SAMPLE_YAML);
  const [indent, setIndent] = useState('2');
  const [sortKeys, setSortKeys] = useState(false);
  const [splitArray, setSplitArray] = useState(false);

  const { output, error } = useMemo(() => {
    try {
      const out = mode === 'yaml2json'
        ? yamlToJson(input, Number(indent))
        : jsonToYaml(input, { indent: Number(indent), sortKeys, splitArray });
      return { output: out, error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [mode, input, indent, sortKeys, splitArray]);

  const handleSwap = useCallback(() => {
    if (error) return;
    setMode((m) => (m === 'yaml2json' ? 'json2yaml' : 'yaml2json'));
    setInput(output);
  }, [error, output]);

  const isYamlIn = mode === 'yaml2json';

  return (
    <ToolLayout
      title="YAML ↔ JSON Converter"
      seoTitle="YAML to JSON & JSON to YAML Converter Online"
      tagline="Convert YAML to JSON and back, with anchors, merge keys and multi-document support"
      metaDescription="Convert YAML to JSON and JSON to YAML online. Supports anchors, aliases, merge keys (<<), multi-document streams, key sorting and precise error locations. Runs in your browser."
    >
      <Card hover={false}>
        <div className="p-6">
          <ToolIO
            layout="side"
            input={input}
            onInputChange={setInput}
            output={output}
            error={error}
            onSwap={handleSwap}
            inputLabel={isYamlIn ? 'YAML:' : 'JSON:'}
            outputLabel={isYamlIn ? 'JSON:' : 'YAML:'}
            inputPlaceholder={isYamlIn ? 'Paste YAML here...' : 'Paste JSON here...'}
            downloadName={isYamlIn ? 'converted.json' : 'converted.yaml'}
            downloadMime={isYamlIn ? 'application/json' : 'application/yaml'}
            inputClassName="min-h-96!"
            outputClassName="min-h-96!"
            options={
              <div className="flex flex-wrap items-center gap-4">
                <SegmentedControl options={modeOptions} value={mode} onChange={(v) => setMode(v as Mode)} />
                <SegmentedControl options={indentOptions} value={indent} onChange={setIndent} variant="glass" />
                {!isYamlIn && (
                  <>
                    <Checkbox checked={sortKeys} onChange={setSortKeys} label="Sort keys" />
                    <Checkbox checked={splitArray} onChange={setSplitArray} label="Top-level array → documents" />
                  </>
                )}
              </div>
            }
            actions={
              <SecondaryButton onClick={() => setInput(isYamlIn ? SAMPLE_YAML : SAMPLE_JSON)}>Load sample</SecondaryButton>
            }
          />
        </div>
      </Card>

      <InfoCard title="About YAML and JSON">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { t: 'Anchors & merge keys', d: 'YAML anchors (&name), aliases (*name) and merge keys (<<: *name) are expanded, so the JSON shows the final values — handy for checking Compose and CI files.' },
            { t: 'Multiple documents', d: 'A YAML stream with several documents separated by --- becomes a JSON array. Going the other way, a top-level JSON array can be split back into documents.' },
            { t: 'Things that change', d: 'Comments and anchors cannot be represented in JSON and are dropped. YAML 1.2 rules are used: yes/no/on/off stay strings, not booleans.' },
          ].map(({ t, d }) => (
            <div key={t} className="bg-surface-alt rounded-lg p-5 border border-border">
              <h3 className="font-medium text-text-secondary mb-2">{t}</h3>
              <p className="text-sm text-text-muted">{d}</p>
            </div>
          ))}
        </div>
      </InfoCard>
    </ToolLayout>
  );
}
