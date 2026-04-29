import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { type ReactNode } from 'react';
import BackgroundBlobs from '@components/ui/BackgroundBlobs';
import ThemeToggleButton from '@components/ui/ThemeToggleButton';
import Footer from '@components/layout/Footer';

interface ToolLayoutProps {
  title: string;
  tagline?: string;
  metaDescription?: string;
  children: ReactNode;
}

export default function ToolLayout({ title, tagline, metaDescription, children }: ToolLayoutProps) {
  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-[#f5f0ed] dark:bg-gray-950">
      <BackgroundBlobs />

      <Helmet>
        <title>{title} | DevTools</title>
        {metaDescription && <meta name="description" content={metaDescription} />}
        <meta property="og:title" content={`${title} | DevTools`} />
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
              className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <Link to="/" className="font-bold text-lg text-gray-900 dark:text-white">
              DevTools
            </Link>
          </div>

          {title && (
            <h1 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate max-w-xs md:max-w-md hidden md:block">
              {title}
            </h1>
          )}

          <ThemeToggleButton />
        </div>
      </motion.header>

      {/* Scrollable main content */}
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="flex-1 relative z-10 pt-20 pb-2 overflow-y-auto"
      >
        <div className="max-w-384 mx-auto px-3 md:px-5 h-full">
          <div className="mb-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 dark:text-white">{title}</h1>
            {tagline && <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs md:text-sm">{tagline}</p>}
          </div>
          {children}
        </div>
      </motion.main>

      <Footer />
    </div>
  );
}
