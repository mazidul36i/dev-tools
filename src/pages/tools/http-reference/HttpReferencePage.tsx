import { useEffect, useMemo, useRef } from 'react';
import { Search } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import SegmentedControl from '@components/ui/SegmentedControl';
import CopyButton from '@components/ui/CopyButton';
import { EmptyState, Panel, Toolbar } from '@components/workspace';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import { STATUS_CLASSES, searchMimeTypes, searchStatusCodes } from '@lib/http-reference-data';

const CLASS_TONE: Record<number, string> = {
  1: 'text-sky-800 dark:text-sky-300 bg-sky-500/10',
  2: 'text-green-800 dark:text-green-300 bg-green-500/10',
  3: 'text-violet-700 dark:text-violet-300 bg-violet-500/10',
  4: 'text-amber-800 dark:text-amber-300 bg-amber-500/10',
  5: 'text-red-700 dark:text-red-300 bg-red-500/10',
};

const schema = {
  tab: opt.oneOf(['status', 'mime'] as const, 'status'),
  q: opt.str('', 100),
};

export default function HttpReferencePage() {
  const [o, setO] = useUrlOptions(schema);
  const query = o.q;
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) searchRef.current?.focus({ preventScroll: true });
  }, []);

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
  const count = o.tab === 'status' ? codes.length : mimes.length;

  return (
    <ToolLayout
      seoTitle="HTTP Status Codes & MIME Types Reference"
      tagline="Searchable reference of HTTP response status codes and common Content-Type values"
      metaDescription="Look up every HTTP status code (1xx–5xx) with a plain-English explanation, and common MIME types / Content-Type values by file extension."
    >
      <Toolbar>
        <SegmentedControl ariaLabel="Reference" options={[{ id: 'status', label: 'Status codes' }, { id: 'mime', label: 'MIME types' }]} value={o.tab} onChange={(t) => setO({ tab: t as 'status' | 'mime', q: '' })} />
        <div className="relative flex-1 min-w-56">
          <Search size={15} aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            ref={searchRef}
            data-page-search
            type="search"
            value={query}
            onChange={(e) => setO({ q: e.target.value })}
            onKeyDown={(e) => e.key === 'Escape' && setO({ q: '' })}
            placeholder={o.tab === 'status' ? 'Search: 404, 5xx, redirect, rate limit…' : 'Search: .svg, json, video, font…'}
            aria-label={o.tab === 'status' ? 'Search status codes' : 'Search MIME types'}
            aria-describedby="http-count"
            className="w-full h-8 pl-8 pr-3 rounded-md bg-surface border border-border-strong text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </div>
        <span id="http-count" role="status" className="text-xs text-text-muted">{count} result{count === 1 ? '' : 's'}</span>
      </Toolbar>

      {o.tab === 'status' ? (
        grouped.length === 0 ? <EmptyState title="No status codes match" className="rounded-lg border border-dashed border-border" /> : (
          <div className="space-y-4">
            {grouped.map(([cls, list]) => (
              <Panel key={cls} title={<>{cls}xx · {STATUS_CLASSES[cls].label} <span className="normal-case tracking-normal font-normal">· {STATUS_CLASSES[cls].desc}</span></>} bodyClassName="">
                <ul className="divide-y divide-border">
                  {list.map((st) => (
                    <li key={st.code} className="flex items-start gap-4 px-4 py-2.5">
                      <span className={`w-14 shrink-0 text-center font-mono font-semibold rounded-md py-0.5 ${CLASS_TONE[cls]}`}>{st.code}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text">{st.name}</div>
                        <div className="text-sm text-text-muted">{st.desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>
        )
      ) : mimes.length === 0 ? <EmptyState title="No MIME types match" className="rounded-lg border border-dashed border-border" /> : (
        <Panel title="MIME types" bodyClassName="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-border">
                <th scope="col" className="px-4 py-2 font-medium">Extension</th>
                <th scope="col" className="px-4 py-2 font-medium">MIME type</th>
                <th scope="col" className="px-4 py-2 font-medium hidden md:table-cell">Description</th>
              </tr>
            </thead>
            <tbody>
              {mimes.map((m) => (
                <tr key={m.type} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-mono text-[13px] text-text-secondary whitespace-nowrap">{m.ext}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-2">
                      <code className="text-[13px] text-text break-all">{m.type}</code>
                      <CopyButton text={m.type} label="" size="sm" className="px-1.5! h-6!" />
                    </span>
                  </td>
                  <td className="px-4 py-2 text-text-muted hidden md:table-cell">{m.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </ToolLayout>
  );
}
