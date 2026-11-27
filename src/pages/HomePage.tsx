import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowDown, Code2, ExternalLink, LockKeyhole, Search, Wrench, X } from 'lucide-react';
import heroGearImg from '@assets/img/hero-gear.webp';
import BackgroundBlobs from '@components/ui/BackgroundBlobs';
import ThemeToggleButton from '@components/ui/ThemeToggleButton';
import Footer from '@components/layout/Footer';
import SkipLink from '@components/layout/SkipLink';
import { tools, toolCategories, toolPath, type ToolCategory } from '../tools';
import { filterTools } from '@lib/tool-search';

const REPO_URL = 'https://github.com/mazidul36i/dev-tools';

// Stagger only the first rows: with ~30 cards an uncapped 70ms step left the
// last card invisible for over two seconds.
const MAX_STAGGERED = 8;
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 + Math.min(i, MAX_STAGGERED) * 0.04, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const facts = [
  { icon: Wrench, value: `${tools.length} tools`, label: 'and counting' },
  { icon: LockKeyhole, value: 'In-browser', label: 'No sign-up' },
  { icon: Code2, value: 'Open source', label: 'MIT licensed' },
];

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [category, setCategory] = useState<ToolCategory | 'All'>(() => {
    const c = searchParams.get('category');
    return toolCategories.includes(c as ToolCategory) ? (c as ToolCategory) : 'All';
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const visibleTools = useMemo(() => filterTools(tools, query, category), [query, category]);
  const counts = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const t of filterTools(tools, query, 'All')) byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + 1);
    return byCategory;
  }, [query]);

  // Keep the filters in the URL so results can be shared and survive "back".
  useEffect(() => {
    const next = new URLSearchParams();
    if (query) next.set('q', query);
    if (category !== 'All') next.set('category', category);
    setSearchParams(next, { replace: true });
  }, [query, category, setSearchParams]);

  // "/" focuses the search box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key !== '/' || target.closest('input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);


  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-[#f5f0ed] dark:bg-gray-950">
      <SkipLink />
      <BackgroundBlobs />

      <Helmet>
        <title>DevTools - Developer Utilities</title>
        <meta name="description" content="A collection of free, browser-based web development tools" />
      </Helmet>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 bg-white/60 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl border border-white/40 dark:border-gray-700/60 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg text-gray-900 dark:text-white rounded focus-ring">
            DevTools
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
            <a
              href="#tools-section"
              className="hidden sm:inline-flex items-center min-h-10 px-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-900/5 dark:hover:bg-white/10 transition-colors focus-ring"
            >
              Tools
            </a>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 min-h-10 px-3 sm:px-4 rounded-full border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-900/5 dark:hover:bg-white/10 transition-colors focus-ring"
            >
              <span>GitHub</span>
              <ExternalLink size={14} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <ThemeToggleButton />
          </nav>
        </div>
      </motion.header>

      <main id="main-content" tabIndex={-1} className="flex-1 relative z-10 pt-24 outline-none">
        {/* Hero Section */}
        <section className="relative pt-6 pb-10 md:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] text-gray-900 dark:text-white">
                  DEVTOOLS
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg mt-4 md:mt-6 max-w-md leading-relaxed">
                  Your essential toolkit for web development tasks, combining modern aesthetics with professional utility.
                </p>
                <a
                  href="#tools-section"
                  className="mt-6 md:mt-8 inline-flex items-center gap-2.5 min-h-11 px-7 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-lg focus-ring"
                >
                  Explore tools
                  <ArrowDown size={16} aria-hidden="true" />
                </a>

                {/* Facts that are true of the product (no unverifiable ratings). */}
                <ul className="mt-8 md:mt-10 grid grid-cols-3 gap-2 sm:gap-3 max-w-xl">
                  {facts.map(({ icon: Icon, value, label }) => (
                    <li
                      key={value}
                      className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 px-3 sm:px-4 py-3 rounded-2xl bg-white/70 dark:bg-gray-800/70 border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
                    >
                      <Icon size={18} aria-hidden="true" className="shrink-0 text-indigo-600 dark:text-indigo-400" />
                      <span className="flex flex-col leading-tight">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Right - Decorative Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="hidden lg:flex justify-center items-center"
              >
                <div className="relative w-full max-w-md">
                  <img
                    src={heroGearImg}
                    alt=""
                    width={619}
                    height={815}
                    decoding="async"
                    className="w-full h-auto drop-shadow-2xl"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section id="tools-section" className="pb-20 md:pb-32 scroll-mt-28">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Available Tools <span className="text-base font-medium text-gray-600 dark:text-gray-400">({tools.length})</span>
              </h2>
              <div className="relative w-full md:w-80">
                <Search size={16} className="absolute z-10 left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setQuery('');
                    if (e.key === 'Enter' && visibleTools.length === 1) navigate(toolPath(visibleTools[0]));
                  }}
                  placeholder="Search tools…"
                  aria-label="Search tools"
                  aria-describedby="tool-results-status"
                  aria-keyshortcuts="/"
                  className="w-full pl-10 pr-16 py-2.5 rounded-xl text-sm bg-white/70 dark:bg-gray-800/70 border border-white/60 dark:border-gray-700/60
                             text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 backdrop-blur-sm
                             focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary [&::-webkit-search-cancel-button]:hidden"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => { setQuery(''); searchRef.current?.focus(); }}
                    aria-label="Clear search"
                    className="absolute z-10 right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus-ring"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                ) : (
                  <kbd aria-hidden="true" className="hidden md:block absolute z-10 right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-xs leading-none text-gray-500 dark:text-gray-400 font-mono">/</kbd>
                )}
              </div>
            </motion.div>

            <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter by category">
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
                    className={`inline-flex items-center gap-1.5 min-h-8 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors focus-ring ${
                      active
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent'
                        : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-white/60 dark:border-gray-700/60 hover:bg-white/80 dark:hover:bg-gray-700/60'}`}
                  >
                    {c} <span className={active ? 'opacity-75' : 'text-gray-500 dark:text-gray-400'}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Announces result counts to screen readers as the filters change. */}
            <p id="tool-results-status" role="status" className="sr-only">
              {query || category !== 'All'
                ? `${visibleTools.length} ${visibleTools.length === 1 ? 'tool' : 'tools'} found`
                : ''}
            </p>

            {visibleTools.length === 0 && (
              <div className="py-16 text-center text-gray-600 dark:text-gray-400">
                <p className="font-medium">No tools match “{query}”{category !== 'All' ? ` in ${category}` : ''}.</p>
                <p className="mt-1 text-sm">Try a format or task instead, like “base64”, “jwt” or “diff”.</p>
                <button
                  type="button"
                  onClick={() => { setQuery(''); setCategory('All'); searchRef.current?.focus(); }}
                  className="mt-3 px-2 py-1 rounded text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline focus-ring"
                >
                  Clear filters
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {visibleTools.map((tool, i) => (
                <motion.div
                  key={tool.slug}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                >
                  <Link
                    to={toolPath(tool)}
                    className="group flex flex-col p-5 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/60 dark:border-gray-700/60
                               hover:border-white/80 dark:hover:border-gray-600 hover:shadow-lg hover:bg-white/70 dark:hover:bg-gray-800/70
                               transition-[background-color,border-color,box-shadow] duration-300 h-full focus-ring"
                  >
                    <div className={`w-10 h-10 rounded-xl ${tool.bg} flex items-center justify-center mb-4`}>
                      <tool.icon size={20} aria-hidden="true" className={tool.color} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">
                      {tool.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-2 leading-relaxed">{tool.desc}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer variant="full" maxWidth="max-w-7xl" />
    </div>
  );
}
