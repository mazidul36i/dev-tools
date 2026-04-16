import { Link } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@hooks/useTheme';

const themeIcons = { light: Sun, dark: Moon, system: Monitor };

export default function Header({ title, backLink = false }) {
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = themeIcons[theme];

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 h-14 border-b border-border/50 bg-surface-alt/70 backdrop-blur-2xl"
    >
      <div className="max-w-7xl mx-auto px-5 h-full flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-3">
          {backLink && (
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-text-muted hover:text-text transition-colors text-sm font-medium mr-1"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </Link>
          )}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span className="font-semibold text-text text-sm">DevTools</span>
          </Link>
        </div>

        {/* Center — page title (shown on tool pages) */}
        {backLink && title && (
          <h1 className="text-sm font-medium text-text-muted truncate max-w-xs md:max-w-md hidden md:block">
            {title}
          </h1>
        )}

        {/* Right */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-all duration-200"
          aria-label={`Theme: ${theme}`}
          title={`Current: ${theme}. Click to switch.`}
        >
          <ThemeIcon size={16} />
        </button>
      </div>
    </motion.header>
  );
}
