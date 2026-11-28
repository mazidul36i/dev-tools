import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight } from 'lucide-react';
import { tools, toolPath } from '../tools';
import { filterTools } from '@lib/tool-search';

/** Tools whose names or keywords share words with the missing path. */
function suggestionsFor(pathname: string) {
  const words = pathname.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1 && w !== 'tools');
  const score = new Map<string, number>();
  for (const w of words) {
    filterTools(tools, w, 'All').forEach((t, i) => score.set(t.slug, (score.get(t.slug) ?? 0) + 10 - Math.min(i, 9)));
  }
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([slug]) => tools.find((t) => t.slug === slug)!);
}

export default function NotFoundPage() {
  const { pathname } = useLocation();
  const suggestions = useMemo(() => suggestionsFor(pathname), [pathname]);

  return (
    <div className="w-full max-w-xl mx-auto px-6 py-16">
      <Helmet><title>Page not found | DevTools</title></Helmet>
      <p className="font-mono text-sm text-text-muted">404</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Nothing lives at <code className="px-1 py-0.5 rounded bg-surface-alt border border-border text-[13px] break-all">{pathname}</code>.
      </p>

      {suggestions.length > 0 && (
        <section aria-labelledby="suggestions" className="mt-8">
          <h2 id="suggestions" className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Did you mean</h2>
          <ul className="space-y-2">
            {suggestions.map((t) => (
              <li key={t.slug}>
                <Link
                  to={toolPath(t)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface hover:border-border-strong hover:bg-surface-hover transition-colors focus-ring"
                >
                  <span className={`grid place-items-center w-8 h-8 rounded-md shrink-0 ${t.bg}`}>
                    <t.icon size={16} aria-hidden="true" className={t.color} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-text">{t.title}</span>
                    <span className="block text-xs text-text-muted truncate">{t.desc}</span>
                  </span>
                  <ArrowRight size={16} aria-hidden="true" className="text-text-muted shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        to="/"
        className="inline-flex items-center gap-2 mt-8 h-9 px-4 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover transition-colors focus-ring"
      >
        Browse all tools
      </Link>
    </div>
  );
}
