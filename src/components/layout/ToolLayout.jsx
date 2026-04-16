import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@hooks/useTheme';

const themeIcons = { light: Sun, dark: Moon, system: Monitor };

export default function ToolLayout({ title, tagline, metaDescription, children }) {
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = themeIcons[theme];

  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-[#f5f0ed] dark:bg-gray-950">
      {/* Light mode background gradient blobs */}
      <div className="absolute inset-0 pointer-events-none dark:hidden">
        <div className="absolute -top-32 -left-32 w-175 h-175 rounded-full bg-[#fcd5c8]/60 blur-[120px]" />
        <div className="absolute top-0 right-0 w-150 h-150 rounded-full bg-[#c9d6f5]/50 blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-125 h-125 rounded-full bg-[#e8d5f0]/40 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-150 h-125 rounded-full bg-[#f0e0d0]/50 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-125 h-100 rounded-full bg-[#d5dff5]/40 blur-[100px]" />
      </div>
      {/* Dark mode background */}
      <div className="absolute inset-0 pointer-events-none hidden dark:block">
        <div className="absolute -top-32 -left-32 w-125 h-125 rounded-full bg-indigo-950/30 blur-[120px]" />
        <div className="absolute top-0 right-0 w-100 h-100 rounded-full bg-purple-950/20 blur-[120px]" />
      </div>

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

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            aria-label={`Theme: ${theme}`}
          >
            <ThemeIcon size={16} />
          </button>
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

      {/* Footer pinned at bottom */}
      <footer className="relative z-10 shrink-0 border-t border-white/40 dark:border-gray-800 py-2">
        <div className="max-w-384 mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} DevTools
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Link to="/" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Home</Link>
            <span>|</span>
            <a href="https://github.com/mazidul36i/dev-tools" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
