import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { type ReactNode } from 'react';
import BackgroundBlobs from '@components/ui/BackgroundBlobs';
import ThemeToggleButton from '@components/ui/ThemeToggleButton';
import Footer from '@components/layout/Footer';
import SkipLink from '@components/layout/SkipLink';

interface ToolLayoutProps {
  title: string;
  /** Optional longer, keyword-rich title for the browser tab / OG tags. Defaults to `title`. */
  seoTitle?: string;
  tagline?: string;
  metaDescription?: string;
  children: ReactNode;
}

export default function ToolLayout({ title, seoTitle, tagline, metaDescription, children }: ToolLayoutProps) {
  const pageTitle = `${seoTitle || title} | DevTools`;
  return (
    <div className="flex flex-col h-dvh relative overflow-hidden bg-[#f5f0ed] dark:bg-gray-950">
      <SkipLink />
      <BackgroundBlobs />

      <Helmet>
        <title>{pageTitle}</title>
        {metaDescription && <meta name="description" content={metaDescription} />}
        <meta property="og:title" content={pageTitle} />
        {metaDescription && <meta property="og:description" content={metaDescription} />}
      </Helmet>

      {/* Floating glassmorphic header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-2 left-3 right-3 md:left-5 md:right-5 z-50 bg-white/60 dark:bg-gray-900/80 backdrop-blur-2xl rounded-xl border border-white/40 dark:border-gray-700/60 shadow-sm"
      >
        <div className="max-w-384 mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              aria-label="Back to all tools"
              className="inline-flex items-center gap-1.5 min-h-10 min-w-10 justify-center sm:justify-start -ml-2 px-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-900/5 dark:hover:bg-white/10 transition-colors text-sm font-medium focus-ring"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">|</span>
            <Link to="/" className="font-bold text-lg text-gray-900 dark:text-white rounded focus-ring">
              DevTools
            </Link>
          </div>

          {/* Breadcrumb-style context only; the page's <h1> is in <main>. */}
          {title && (
            <p aria-hidden="true" className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate max-w-xs md:max-w-md hidden md:block">
              {title}
            </p>
          )}

          <ThemeToggleButton />
        </div>
      </motion.header>

      {/* Scrollable main content */}
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        id="main-content"
        tabIndex={-1}
        className="flex-1 relative z-10 pt-20 pb-2 overflow-y-auto scroll-pt-20 outline-none"
      >
        <div className="max-w-384 mx-auto px-3 md:px-5 h-full">
          <div className="mb-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 dark:text-white">{title}</h1>
            {tagline && <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-xs md:text-sm">{tagline}</p>}
          </div>
          {children}
        </div>
      </motion.main>

      <Footer />
    </div>
  );
}
