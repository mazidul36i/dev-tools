import { forwardRef, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ChevronRight, Clock, Keyboard, PanelLeftClose, Search, SquareTerminal, Star, X } from 'lucide-react';
import { tools, toolCategories, toolPath, type ToolDefinition } from '../../tools';
import { filterTools } from '@lib/tool-search';
import { useToolPrefs } from '@hooks/useToolPrefs';
import useLocalStorage from '@hooks/useLocalStorage';
import { useShell } from './ShellContext';

const MAX_RECENT_SHOWN = 5;
const bySlug = new Map(tools.map((t) => [t.slug, t]));

interface SidebarNavProps {
  /** Called after a link is followed (closes the mobile drawer). */
  onNavigate?: () => void;
  /** Close button shown in the mobile drawer instead of "collapse". */
  onClose?: () => void;
}

/** Tool navigation: filter, favourites, recents and every category. */
const SidebarNav = forwardRef<HTMLInputElement, SidebarNavProps>(function SidebarNav({ onNavigate, onClose }, filterRef) {
  const { favorites, recent } = useToolPrefs();
  const { toggleSidebar, openShortcuts } = useShell();
  const [filter, setFilter] = useState('');
  const [closed, setClosed] = useLocalStorage<string[]>('devtools:sidebar-closed', []);

  const results = useMemo(() => (filter.trim() ? filterTools(tools, filter, 'All') : null), [filter]);
  const favTools = favorites.map((s) => bySlug.get(s)).filter(Boolean) as ToolDefinition[];
  const recentTools = recent
    .filter((s) => !favorites.includes(s))
    .slice(0, MAX_RECENT_SHOWN)
    .map((s) => bySlug.get(s))
    .filter(Boolean) as ToolDefinition[];

  const toggleCategory = (c: string) =>
    setClosed((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Brand */}
      <div className="flex items-center justify-between gap-2 h-12 px-3 shrink-0">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2 rounded-md px-1 -mx-1 font-semibold text-text focus-ring">
          <span className="grid place-items-center w-7 h-7 rounded-md bg-primary text-on-primary">
            <SquareTerminal size={16} aria-hidden="true" />
          </span>
          DevTools
        </Link>
        {onClose ? (
          <button type="button" onClick={onClose} aria-label="Close navigation" className={iconButton}>
            <X size={16} aria-hidden="true" />
          </button>
        ) : (
          <button type="button" onClick={toggleSidebar} aria-label="Collapse sidebar" title="Collapse sidebar" className={iconButton}>
            <PanelLeftClose size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="px-3 pb-2 shrink-0">
        <div className="relative">
          <Search size={14} aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            ref={filterRef}
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setFilter('');
            }}
            placeholder="Filter tools"
            aria-label="Filter tools"
            className="w-full h-8 pl-8 pr-7 rounded-md bg-surface-alt border border-border text-sm text-text placeholder:text-text-muted
              focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 [&::-webkit-search-cancel-button]:hidden"
          />
          {!filter && (
            <kbd aria-hidden="true" className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 rounded border border-border text-[11px] leading-4 text-text-muted">
              /
            </kbd>
          )}
        </div>
      </div>

      <nav aria-label="Tools" className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 text-sm">
        {results ? (
          results.length ? (
            <NavList tools={results} onNavigate={onNavigate} />
          ) : (
            <p className="px-2 py-3 text-text-muted">No tools match “{filter}”.</p>
          )
        ) : (
          <>
            {favTools.length > 0 && (
              <Section title="Favorites" icon={<Star size={12} aria-hidden="true" />}>
                <NavList tools={favTools} onNavigate={onNavigate} />
              </Section>
            )}
            {recentTools.length > 0 && (
              <Section title="Recent" icon={<Clock size={12} aria-hidden="true" />}>
                <NavList tools={recentTools} onNavigate={onNavigate} />
              </Section>
            )}
            {toolCategories.map((c) => {
              const open = !closed.includes(c);
              const id = `nav-cat-${c.replace(/\W+/g, '-').toLowerCase()}`;
              return (
                <div key={c} className="mt-3 first:mt-1">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={id}
                    onClick={() => toggleCategory(c)}
                    className="flex w-full items-center gap-1 h-7 px-2 rounded-md text-[11px] font-semibold uppercase tracking-wider text-text-muted hover:text-text focus-ring"
                  >
                    <ChevronRight size={12} aria-hidden="true" className={`transition-transform ${open ? 'rotate-90' : ''}`} />
                    {c}
                  </button>
                  {open && (
                    <div id={id}>
                      <NavList tools={tools.filter((t) => t.category === c)} onNavigate={onNavigate} />
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </nav>

      <div className="flex items-center justify-between gap-2 px-3 h-11 border-t border-border shrink-0 text-xs text-text-muted">
        <button type="button" onClick={openShortcuts} className="inline-flex items-center gap-1.5 h-7 px-1.5 -mx-1.5 rounded-md hover:text-text focus-ring">
          <Keyboard size={14} aria-hidden="true" /> Shortcuts
        </button>
        <a
          href="https://github.com/mazidul36i/dev-tools"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center h-7 px-1.5 -mx-1.5 rounded-md hover:text-text focus-ring"
        >
          GitHub<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
});

export default SidebarNav;

const iconButton =
  'inline-flex items-center justify-center w-7 h-7 rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors focus-ring';

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-1 mb-3">
      <h2 className="flex items-center gap-1.5 h-7 px-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}

function NavList({ tools: list, onNavigate }: { tools: ToolDefinition[]; onNavigate?: () => void }) {
  return (
    <ul className="space-y-px">
      {list.map((t) => (
        <li key={t.slug}>
          <NavLink
            to={toolPath(t)}
            onClick={onNavigate}
            className={({ isActive }) =>
              `relative flex items-center gap-2.5 h-8 px-2 rounded-md transition-colors focus-ring ${
                isActive
                  ? 'bg-primary-subtle text-text font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-primary'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text'
              }`
            }
          >
            <t.icon size={15} aria-hidden="true" className={`shrink-0 ${t.color}`} />
            <span className="truncate">{t.title}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
