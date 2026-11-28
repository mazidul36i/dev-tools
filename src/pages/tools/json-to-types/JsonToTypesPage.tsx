import { useDeferredValue, useMemo, useState } from 'react';
import ToolLayout from '@components/layout/ToolLayout';
import Checkbox from '@components/ui/Checkbox';
import SegmentedControl from '@components/ui/SegmentedControl';
import { EditorPanel, OutputPanel, SplitPane, Toolbar, ToolbarDivider } from '@components/workspace';
import { TARGET_LANGUAGES, generateTypes, type TargetLanguage } from '@lib/json-types-utils';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import { useShareInput } from '@hooks/useShareInput';

const SAMPLE = JSON.stringify({
  id: 1042,
  username: 'jdoe',
  email: 'jane@example.com',
  is_verified: true,
  rating: 4.8,
  profile: { displayName: 'Jane Doe', avatarUrl: null, bio: 'Full-stack developer' },
  roles: ['admin', 'editor'],
  orders: [
    { orderId: 'A-1', total: 25, items: [{ sku: 'X1', qty: 2 }] },
    { orderId: 'A-2', total: 12.5, items: [], coupon: 'WELCOME10' },
  ],
  createdAt: '2024-05-01T10:00:00Z',
}, null, 2);

const LANG_IDS = TARGET_LANGUAGES.map((l) => l.id) as [TargetLanguage, ...TargetLanguage[]];

const schema = {
  lang: opt.oneOf(LANG_IDS, 'typescript'),
  root: opt.str('Root', 60),
  optional: opt.bool(false),
  alias: opt.bool(false),
};

export default function JsonToTypesPage() {
  const [input, setInput] = useState(SAMPLE);
  const [o, setO] = useUrlOptions(schema, { persist: { lang: 'json-to-types:lang' } });
  const deferred = useDeferredValue(input);

  const { code, error } = useMemo(() => {
    if (!deferred.trim()) return { code: '', error: null };
    try {
      return { code: generateTypes(deferred, o.lang, { rootName: o.root, tsTypeAlias: o.alias, allOptional: o.optional }), error: null };
    } catch (e) {
      return { code: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [deferred, o]);

  useShareInput({ input }, (d) => d.input !== undefined && setInput(d.input), { enabled: input.length > 0 });

  const language = TARGET_LANGUAGES.find((l) => l.id === o.lang)!;

  return (
    <ToolLayout
      seoTitle="JSON to TypeScript, Go, Java, Kotlin, Python & Rust Types"
      tagline="Generate TypeScript, Go, Java, Kotlin, Python or Rust types from sample JSON"
      metaDescription="Paste JSON and instantly generate TypeScript interfaces, Go structs with json tags, Java classes, Kotlin data classes, Python dataclasses or Rust serde structs. Optional and nullable fields are detected."
      variant="workspace"
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">Arrays are merged.</strong> Every element is combined into one type. A key missing from some elements becomes optional; a field that is sometimes null becomes nullable.</li>
          <li><strong className="text-text">Numbers.</strong> Whole numbers map to integer types (int64, Long, i64). If any value in a field has a fraction, it becomes floating-point.</li>
          <li><strong className="text-text">Naming.</strong> Nested types are named after their key (singular for arrays: orders → Order). Keys follow each language’s convention, with tags or rename annotations keeping the JSON name.</li>
        </ul>
      }
    >
      <Toolbar>
        <SegmentedControl ariaLabel="Language" options={TARGET_LANGUAGES.map((l) => ({ id: l.id, label: l.label }))} value={o.lang} onChange={(v) => setO({ lang: v as TargetLanguage })} />
        <ToolbarDivider />
        <label htmlFor="root-name" className="text-xs text-text-muted">Root type</label>
        <input
          id="root-name"
          value={o.root}
          onChange={(e) => setO({ root: e.target.value })}
          spellCheck={false}
          className="h-7 w-32 px-2 rounded-md bg-surface-alt border border-border-strong font-mono text-xs text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
        <Checkbox checked={o.optional} onChange={(v) => setO({ optional: v })} label="All fields optional" className="text-xs" />
        {o.lang === 'typescript' && <Checkbox checked={o.alias} onChange={(v) => setO({ alias: v })} label="Type aliases" className="text-xs" />}
      </Toolbar>
      <SplitPane
        storageKey="json-to-types"
        left={<EditorPanel label="JSON sample" value={input} onChange={setInput} placeholder="Paste a JSON object or array…" sample={SAMPLE} fileAccept=".json,application/json,text/plain" className="flex-1" />}
        right={
          <OutputPanel
            label={language.label}
            value={code}
            error={error}
            errorTitle="Invalid JSON"
            placeholder="Types appear here"
            downloadName={`${o.root || 'types'}.${language.ext}`}
            className="flex-1"
          />
        }
      />
    </ToolLayout>
  );
}
