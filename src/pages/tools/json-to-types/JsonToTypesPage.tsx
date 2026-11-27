import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, Clipboard, Download, Eraser, Sparkles } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import CodeBlock from '@components/ui/CodeBlock';
import Checkbox from '@components/ui/Checkbox';
import SegmentedControl from '@components/ui/SegmentedControl';
import { SmallButton } from '@components/ui/Button';
import { TextAreaInput } from '@components/ui/TextArea';
import { Field, TextInput } from '@components/ui/Input';
import { downloadFile } from '@lib/download-utils';
import { TARGET_LANGUAGES, generateTypes, type TargetLanguage } from '@lib/json-types-utils';
import useLocalStorage from '@hooks/useLocalStorage';

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

export default function JsonToTypesPage() {
  const [input, setInput] = useState(SAMPLE);
  const [lang, setLang] = useLocalStorage<TargetLanguage>('json-to-types:lang', 'typescript');
  const [rootName, setRootName] = useState('Root');
  const [tsTypeAlias, setTsTypeAlias] = useState(false);
  const [allOptional, setAllOptional] = useState(false);

  const { code, error } = useMemo(() => {
    if (!input.trim()) return { code: '', error: null };
    try {
      return { code: generateTypes(input, lang, { rootName, tsTypeAlias, allOptional }), error: null };
    } catch (e) {
      return { code: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, lang, rootName, tsTypeAlias, allOptional]);

  const handlePaste = useCallback(async () => {
    try {
      setInput(await navigator.clipboard.readText());
    } catch {
      toast.error('Unable to paste');
    }
  }, []);

  const ext = TARGET_LANGUAGES.find((l) => l.id === lang)!.ext;

  return (
    <ToolLayout
      title="JSON to Types"
      seoTitle="JSON to TypeScript, Go, Java, Kotlin, Python & Rust Types"
      tagline="Generate TypeScript interfaces, Go structs, Java/Kotlin classes, Python dataclasses or Rust structs from sample JSON"
      metaDescription="Paste JSON and instantly generate TypeScript interfaces, Go structs with json tags, Java classes, Kotlin data classes, Python dataclasses or Rust serde structs. Optional and nullable fields are detected."
    >
      <Card hover={false}>
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-end gap-4">
            <SegmentedControl
              options={TARGET_LANGUAGES.map((l) => ({ id: l.id, label: l.label }))}
              value={lang}
              onChange={(v) => setLang(v as TargetLanguage)}
            />
            <Field label="Root type name" htmlFor="root-name" className="w-40">
              <TextInput id="root-name" value={rootName} onChange={(e) => setRootName(e.target.value)} />
            </Field>
            <div className="flex flex-wrap gap-4 pb-2">
              <Checkbox checked={allOptional} onChange={setAllOptional} label="All fields optional" />
              {lang === 'typescript' && (
                <Checkbox checked={tsTypeAlias} onChange={setTsTypeAlias} label="Use type aliases" />
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <div className="min-w-0">
              <label htmlFor="json-input" className="block text-sm font-medium text-text-secondary mb-2">JSON sample:</label>
              <TextAreaInput
                id="json-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste a JSON object or array..."
                spellCheck={false}
                className="min-h-[28rem]!"
              />
              <div className="flex gap-2 mt-2">
                <SmallButton onClick={() => setInput('')}><Eraser size={12} /> Clear</SmallButton>
                <SmallButton onClick={handlePaste}><Clipboard size={12} /> Paste</SmallButton>
                <SmallButton onClick={() => setInput(SAMPLE)}><Sparkles size={12} /> Sample</SmallButton>
              </div>
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-medium text-text-secondary mb-2">Generated code:</span>
              {error ? (
                <div className="flex items-start gap-2 p-3.5 rounded-lg border border-error/30 bg-error/5 text-error text-sm">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
                </div>
              ) : (
                <CodeBlock
                  title={TARGET_LANGUAGES.find((l) => l.id === lang)!.label}
                  code={code}
                  placeholder="Types will appear here"
                  preClassName="min-h-[26rem] max-h-[40rem]"
                  actions={
                    <SmallButton onClick={() => (code ? downloadFile(code, `${rootName || 'types'}.${ext}`) : toast.error('Nothing to download'))}>
                      <Download size={12} /> .{ext}
                    </SmallButton>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </Card>

      <InfoCard title="How types are inferred">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { t: 'Arrays are merged', d: 'Every element of an array is combined into one type. A key missing from some elements becomes optional; a field that is sometimes null becomes nullable.' },
            { t: 'Numbers', d: 'Whole numbers map to integer types (int64, Long, i64). If any value in the same field has a fraction, the field becomes a floating-point type.' },
            { t: 'Naming', d: 'Nested types are named after their key (singular for arrays: orders → Order). Keys are converted to each language’s convention, with json tags or rename annotations keeping the original name.' },
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
