import { Link } from 'react-router-dom';
import { ChevronRight, Menu, PanelLeftOpen, Search } from 'lucide-react';
import ThemeToggleButton from '@components/ui/ThemeToggleButton';
import { modKeyLabel } from '@hooks/useHotkeys';
import { tools } from '../../tools';
import { useShell } from './ShellContext';
import { useCurrentToolSlug } from './useCurrentToolSlug';

const bySlug = new Map(tools.map((t) => [t.slug, t]));
const iconButton =
  'inline-flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:text-text hover:bg-surface-hover transition-colors focus-ring';

export default function Topbar() {
  const { openPalette, openNav, sidebarCollapsed, toggleSidebar } = useShell();
  const slug = useCurrentToolSlug();
  const tool = slug ? bySlug.get(slug) : undefined;

  return (
    <header className="flex items-center gap-2 h-topbar px-3 sm:px-4 border-b border-border bg-bg shrink-0">
      <button type="button" onClick={openNav} aria-label="Open navigation" className={`${iconButton} lg:hidden`}>
        <Menu size={18} aria-hidden="true" />
      </button>
      {sidebarCollapsed && (
        <button type="button" onClick={toggleSidebar} aria-label="Expand sidebar" title="Expand sidebar" className={`${iconButton} hidden lg:inline-flex`}>
          <PanelLeftOpen size={16} aria-hidden="true" />
        </button>
      )}

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1 text-sm min-w-0">
          <li className="shrink-0">
            <Link to="/" className="px-1 rounded text-text-muted hover:text-text focus-ring">DevTools</Link>
          </li>
          {tool && (
            <>
              <li aria-hidden="true" className="text-text-muted"><ChevronRight size={14} /></li>
              <li className="hidden sm:block shrink-0">
                <Link to={`/?category=${encodeURIComponent(tool.category)}`} className="px-1 rounded text-text-muted hover:text-text focus-ring">
                  {tool.category}
                </Link>
              </li>
              <li aria-hidden="true" className="hidden sm:block text-text-muted"><ChevronRight size={14} /></li>
              <li className="min-w-0">
                <span aria-current="page" className="block px-1 truncate font-medium text-text">{tool.title}</span>
              </li>
            </>
          )}
        </ol>
      </nav>

      <button
        type="button"
        onClick={openPalette}
        aria-label="Search tools"
        aria-keyshortcuts="Control+K Meta+K"
        className="inline-flex items-center gap-2 h-8 sm:w-64 px-2 sm:px-2.5 rounded-md border border-border bg-surface text-sm text-text-muted hover:border-border-strong hover:text-text transition-colors focus-ring"
      >
        <Search size={15} aria-hidden="true" />
        <span className="hidden sm:inline flex-1 text-left">Search tools…</span>
        <kbd aria-hidden="true" className="hidden sm:inline px-1.5 rounded border border-border text-[11px] leading-5">{modKeyLabel} K</kbd>
      </button>
      <ThemeToggleButton />
    </header>
  );
}
