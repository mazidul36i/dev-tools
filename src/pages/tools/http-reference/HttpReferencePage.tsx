import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import Tabs from '@components/ui/Tabs';
import CopyButton from '@components/ui/CopyButton';
import { TextInput } from '@components/ui/Input';
import { STATUS_CLASSES, searchMimeTypes, searchStatusCodes } from '@lib/http-reference-data';

const CLASS_TONE: Record<number, string> = {
  1: 'text-sky-600 dark:text-sky-400 bg-sky-500/10',
  2: 'text-green-600 dark:text-green-400 bg-green-500/10',
  3: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
  4: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  5: 'text-red-600 dark:text-red-400 bg-red-500/10',
};

export default function HttpReferencePage() {
  const [tab, setTab] = useState(() => (new URLSearchParams(window.location.search).get('tab') === 'mime' ? 'mime' : 'status'));
  const [query, setQuery] = useState('');

  const codes = useMemo(() => searchStatusCodes(query), [query]);
  const mimes = useMemo(() => searchMimeTypes(query), [query]);
  const grouped = useMemo(() => {
    const map = new Map<number, typeof codes>();
    for (const c of codes) {
      const k = Math.floor(c.code / 100);
      map.set(k, [...(map.get(k) ?? []), c]);
    }
    return [...map.entries()];
  }, [codes]);

  return (
    <ToolLayout
      title="HTTP Status Codes & MIME Types"
      seoTitle="HTTP Status Codes & MIME Types Reference"
      tagline="Searchable reference of HTTP response status codes and common Content-Type values"
      metaDescription="Look up every HTTP status code (1xx–5xx) with a plain-English explanation, and common MIME types / Content-Type values by file extension."
    >
      <Card hover={false}>
        <Tabs
          tabs={[{ id: 'status', label: 'Status codes' }, { id: 'mime', label: 'MIME types' }]}
          activeTab={tab}
          onTabChange={(t) => { setTab(t); setQuery(''); }}
        />
        <div className="p-6 space-y-5">
          <div className="relative">
            <Search size={16} className="absolute z-10 left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === 'status' ? 'Search: 404, 5xx, redirect, rate limit…' : 'Search: .svg, json, video, font…'}
              aria-label="Search"
              className="pl-9! py-2.5!"
              autoFocus
            />
          </div>

          {tab === 'status' ? (
            grouped.length === 0 ? <p className="text-sm text-text-muted">No status codes match.</p> : (
              <div className="space-y-6">
                {grouped.map(([cls, list]) => (
                  <section key={cls}>
                    <h2 className="text-sm font-semibold text-text mb-1">
                      {cls}xx · {STATUS_CLASSES[cls].label}
                      <span className="font-normal text-text-muted"> — {STATUS_CLASSES[cls].desc}</span>
                    </h2>
                    <div className="divide-y divide-border">
                      {list.map((s) => (
                        <div key={s.code} className="flex items-start gap-4 py-2.5">
                          <span className={`w-14 shrink-0 text-center font-mono font-semibold rounded-md py-0.5 ${CLASS_TONE[cls]}`}>{s.code}</span>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-text">{s.name}</div>
                            <div className="text-sm text-text-muted">{s.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )
          ) : mimes.length === 0 ? <p className="text-sm text-text-muted">No MIME types match.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-muted border-b border-border">
                    <th className="py-2 pr-4 font-medium">Extension</th>
                    <th className="py-2 pr-4 font-medium">MIME type</th>
                    <th className="py-2 font-medium hidden md:table-cell">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {mimes.map((m) => (
                    <tr key={m.type} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4 font-mono text-text-secondary whitespace-nowrap">{m.ext}</td>
                      <td className="py-2 pr-4">
                        <span className="inline-flex items-center gap-2">
                          <code className="font-mono text-primary break-all">{m.type}</code>
                          <CopyButton text={m.type} label="" size="sm" className="px-1.5! py-1! border-0!" />
                        </span>
                      </td>
                      <td className="py-2 text-text-muted hidden md:table-cell">{m.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </ToolLayout>
  );
}
