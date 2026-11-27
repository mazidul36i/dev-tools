import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Eye, Search, Star, X } from 'lucide-react';
import heroGearImg from '@assets/img/hero-gear.png';
import BackgroundBlobs from '@components/ui/BackgroundBlobs';
import ThemeToggleButton from '@components/ui/ThemeToggleButton';
import Footer from '@components/layout/Footer';
import { tools, toolCategories, toolPath, type ToolCategory } from '../tools';
import { filterTools } from '@lib/tool-search';

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.07, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

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

  const scrollToTools = () => {
    document.getElementById('tools-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-[#f5f0ed] dark:bg-gray-950">
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
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg text-gray-900 dark:text-white">
            DevTools
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {['PACKAGES', 'TOOLS', 'BLOG', 'ABOUT'].map((item) => (
              <button
                key={item}
                onClick={item === 'TOOLS' ? scrollToTools : undefined}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggleButton />
            <button className="px-5 py-2 text-sm font-medium rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
              CONTACT US
            </button>
          </div>
        </div>
      </motion.header>

      <main className="flex-1 relative z-10 pt-24">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
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
                <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg mt-6 max-w-md leading-relaxed">
                  Your essential toolkit for web development tasks, combining modern aesthetics with professional utility.
                </p>
                <button
                  onClick={scrollToTools}
                  className="mt-8 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <Eye size={16} />
                  EXPLORE TOOLS
                </button>

                {/* Stats */}
                <div className="mt-10 flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/70 dark:bg-gray-800/70 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">10k+</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">Developers<br/>Supported</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xl font-bold text-gray-900 dark:text-white">4.7</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">from 4,500+ reviews</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Star size={14} className="text-green-600 fill-green-600" />
                      <span className="font-bold text-green-700 dark:text-green-400 text-sm">Trustpilot</span>
                    </div>
                    <div className="flex gap-0.5 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-5 h-5 bg-green-500 rounded-sm flex items-center justify-center">
                          <Star size={10} className="text-white fill-white" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
                    alt="DevTools Hub"
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
                Available Tools <span className="text-base font-medium text-gray-400 dark:text-gray-500">({tools.length})</span>
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
                  className="w-full pl-10 pr-16 py-2.5 rounded-xl text-sm bg-white/70 dark:bg-gray-800/70 border border-white/60 dark:border-gray-700/60
                             text-gray-900 dark:text-white placeholder:text-gray-400 backdrop-blur-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/30 [&::-webkit-search-cancel-button]:hidden"
                />
                {query ? (
                  <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute z-10 right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    <X size={16} />
                  </button>
                ) : (
                  <kbd className="hidden md:block absolute z-10 right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-[10px] text-gray-400 font-mono">/</kbd>
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
                    onClick={() => setCategory(c)}
                    aria-pressed={active}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent'
                        : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border-white/60 dark:border-gray-700/60 hover:bg-white/80 dark:hover:bg-gray-700/60'}`}
                  >
                    {c} <span className="opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>

            {visibleTools.length === 0 && (
              <div className="py-16 text-center text-gray-500 dark:text-gray-400">
                <p className="font-medium">No tools match “{query}”{category !== 'All' ? ` in ${category}` : ''}.</p>
                <button onClick={() => { setQuery(''); setCategory('All'); }} className="mt-3 text-sm text-indigo-500 hover:underline">
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
                               transition-all duration-300 h-full"
                  >
                    <div className={`w-10 h-10 rounded-xl ${tool.bg} flex items-center justify-center mb-4`}>
                      <tool.icon size={20} className={tool.color} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">
                      {tool.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 leading-relaxed">{tool.desc}</p>
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
