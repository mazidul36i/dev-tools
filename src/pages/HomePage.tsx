import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, Star, X } from 'lucide-react';
import { tools, toolCategories, toolPath, type ToolCategory, type ToolDefinition } from '../tools';
import { filterTools } from '@lib/tool-search';
import { useToolPrefs } from '@hooks/useToolPrefs';

const bySlug = new Map(tools.map((t) => [t.slug, t]));
const MAX_RECENT = 6;

/** Search-first launcher: favourites, recents and every tool by category. */
export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [category, setCategory] = useState<ToolCategory | 'All'>(() => {
    const c = searchParams.get('category');
    return toolCategories.includes(c as ToolCategory) ? (c as ToolCategory) : 'All';
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { favorites, recent } = useToolPrefs();

  const searching = query.trim().length > 0;
  const results = useMemo(() => filterTools(tools, query, category), [query, category]);
  const counts = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const t of filterTools(tools, query, 'All')) byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + 1);
    return byCategory;
  }, [query]);
  const favTools = favorites.map((s) => bySlug.get(s)).filter(Boolean) as ToolDefinition[];
  const recentTools = recent.slice(0, MAX_RECENT).map((s) => bySlug.get(s)).filter(Boolean) as ToolDefinition[];

  // Keep the filters in the URL so results can be shared and survive "back".
  useEffect(() => {
    const next = new URLSearchParams();
    if (query) next.set('q', query);
    if (category !== 'All') next.set('category', category);
    setSearchParams(next, { replace: true });
  }, [query, category, setSearchParams]);

  // The breadcrumb links here with ?category=…; follow later changes too.
  useEffect(() => {
    const c = searchParams.get('category');
    if (toolCategories.includes(c as ToolCategory) && c !== category) setCategory(c as ToolCategory);
    // Only react to URL changes coming from elsewhere.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Search-first on desktop; don't pop the on-screen keyboard on touch devices.
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) searchRef.current?.focus({ preventScroll: true });
  }, []);

  const visibleCategories = category === 'All' ? toolCategories : [category];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-12">
      <Helmet>
        <title>DevTools: free in-browser developer utilities</title>
        <meta
          name="description"
          content="JSON formatter, JWT decoder, regex tester, diff, Base64, hashes, cron, CIDR and more: free developer tools that run in your browser."
        />
      </Helmet>

      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          All tools <span className="ml-1 text-base font-normal text-text-muted">{tools.length}</span>
        </h1>
        <p className="mt-0.5 text-sm text-text-muted">Free developer utilities that run in your browser. No sign-up.</p>
      </header>

      <div className="relative">
        <Search size={18} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          ref={searchRef}
          data-page-search
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setQuery('');
            if (e.key === 'Enter' && searching && results[0]) navigate(toolPath(results[0]));
          }}
          placeholder={`Search ${tools.length} tools…`}
          aria-label="Search tools"
          aria-describedby="tool-results-status"
          aria-keyshortcuts="/"
          className="w-full h-12 pl-11 pr-12 rounded-lg bg-surface border border-border-strong text-base text-text placeholder:text-text-muted
            focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/25 [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => { setQuery(''); searchRef.current?.focus(); }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:text-text hover:bg-surface-hover focus-ring"
          >
            <X size={16} aria-hidden="true" />
          </button>
        ) : (
          <kbd aria-hidden="true" className="hidden md:block absolute right-3.5 top-1/2 -translate-y-1/2 px-1.5 rounded border border-border text-xs leading-5 text-text-muted">/</kbd>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3 mb-6" role="group" aria-label="Filter by category">
        {(['All', ...toolCategories] as const).map((c) => {
          const count = c === 'All' ? [...counts.values()].reduce((a, b) => a + b, 0) : counts.get(c) ?? 0;
          if (c !== 'All' && count === 0 && category !== c) return null;
          const active = category === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium border transition-colors focus-ring ${
                active
                  ? 'bg-text text-bg border-transparent'
                  : 'bg-surface text-text-secondary border-border hover:border-border-strong hover:text-text'
              }`}
            >
              {c} <span className={active ? 'opacity-75' : 'text-text-muted'}>{count}</span>
            </button>
          );
        })}
      </div>

      <p id="tool-results-status" role="status" className="sr-only">
        {searching || category !== 'All' ? `${results.length} ${results.length === 1 ? 'tool' : 'tools'} found` : ''}
      </p>

      {searching ? (
        results.length ? (
          <ToolGrid tools={results} />
        ) : (
          <div className="py-16 text-center">
            <p className="font-medium text-text">No tools match “{query}”{category !== 'All' ? ` in ${category}` : ''}.</p>
            <p className="mt-1 text-sm text-text-muted">Try a format or task instead, like “base64”, “jwt” or “diff”.</p>
            <button
              type="button"
              onClick={() => { setQuery(''); setCategory('All'); searchRef.current?.focus(); }}
              className="mt-3 h-8 px-3 rounded-md text-sm font-medium text-primary hover:bg-primary-subtle focus-ring"
            >
              Clear filters
            </button>
          </div>
        )
      ) : (
        <>
          {category === 'All' && favTools.length > 0 && (
            <Section title="Favorites">
              <ToolGrid tools={favTools} />
            </Section>
          )}
          {category === 'All' && recentTools.length > 0 && (
            <Section title="Recently used">
              <ul className="flex flex-wrap gap-2">
                {recentTools.map((t) => (
                  <li key={t.slug}>
                    <Link
                      to={toolPath(t)}
                      className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-secondary hover:text-text hover:border-border-strong hover:bg-surface-hover transition-colors focus-ring"
                    >
                      <t.icon size={15} aria-hidden="true" className={t.color} />
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {visibleCategories.map((c) => (
            <Section key={c} title={c} count={tools.filter((t) => t.category === c).length}>
              <ToolGrid tools={tools.filter((t) => t.category === c)} />
            </Section>
          ))}
        </>
      )}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  const id = `section-${title.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <section aria-labelledby={id} className="mb-8">
      <h2 id={id} className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
        {title}
        {count !== undefined && <span className="ml-1.5 font-normal">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

function ToolGrid({ tools: list }: { tools: ToolDefinition[] }) {
  const { isFavorite, toggleFavorite } = useToolPrefs();
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {list.map((t) => {
        const fav = isFavorite(t.slug);
        return (
          <li key={t.slug} className="relative">
            <Link
              to={toolPath(t)}
              className="flex h-full gap-3 p-3.5 pr-10 rounded-lg border border-border bg-surface hover:border-border-strong hover:bg-surface-hover transition-colors focus-ring"
            >
              <span className={`grid place-items-center w-8 h-8 rounded-md shrink-0 ${t.bg}`}>
                <t.icon size={16} aria-hidden="true" className={t.color} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium leading-snug text-text">{t.title}</span>
                <span className="block mt-0.5 text-xs leading-relaxed text-text-muted line-clamp-2">{t.desc}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => toggleFavorite(t.slug)}
              aria-pressed={fav}
              aria-label={fav ? `Remove ${t.title} from favorites` : `Add ${t.title} to favorites`}
              title={fav ? 'Remove from favorites' : 'Add to favorites'}
              className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors focus-ring"
            >
              <Star size={14} aria-hidden="true" className={fav ? 'fill-amber-400 text-amber-500' : ''} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
