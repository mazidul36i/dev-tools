import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CornerDownLeft, Home, Keyboard, Link as LinkIcon, Monitor, Moon, Search, Share2, Star, StarOff, Sun } from 'lucide-react';
import Dialog from '@components/ui/Dialog';
import { tools, toolPath } from '../../tools';
import { filterTools } from '@lib/tool-search';
import { useToolPrefs } from '@hooks/useToolPrefs';
import { useTheme } from '@hooks/useTheme';
import { useCurrentToolSlug } from './useCurrentToolSlug';
import { useShareRegistry } from '@hooks/useShareInput';

interface PaletteItem {
  id: string;
  group: 'Recent' | 'Tools' | 'Actions';
  label: string;
  hint?: string;
  icon: ReactNode;
  keywords?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onShowShortcuts: () => void;
}

const bySlug = new Map(tools.map((t) => [t.slug, t]));
const nextThemeLabel = { light: 'Dark', dark: 'System', system: 'Light' } as const;

/** ⌘K: jump to any tool or run an app action. */
export default function CommandPalette({ open, onClose, onShowShortcuts }: CommandPaletteProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      ariaLabel="Command palette"
      className="w-[min(640px,calc(100vw-2rem))] max-h-[min(560px,calc(100dvh-6rem))] mt-[10vh] mx-auto"
    >
      <PaletteBody onClose={onClose} onShowShortcuts={onShowShortcuts} />
    </Dialog>
  );
}

function PaletteBody({ onClose, onShowShortcuts }: Omit<CommandPaletteProps, 'open'>) {
  const navigate = useNavigate();
  const { recent, isFavorite, toggleFavorite } = useToolPrefs();
  const { theme, toggleTheme } = useTheme();
  const currentSlug = useCurrentToolSlug();
  const current = currentSlug ? bySlug.get(currentSlug) : undefined;
  const share = useShareRegistry();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const items = useMemo<PaletteItem[]>(() => {
    const go = (path: string) => () => navigate(path);
    const toolItem = (group: PaletteItem['group']) => (t: (typeof tools)[number]): PaletteItem => ({
      id: `${group}-${t.slug}`,
      group,
      label: t.title,
      hint: t.category,
      icon: <t.icon size={16} aria-hidden="true" className={t.color} />,
      run: go(toolPath(t)),
    });

    const actions: PaletteItem[] = [
      { id: 'home', group: 'Actions', label: 'Go to all tools', icon: <Home size={16} aria-hidden="true" />, keywords: 'home launcher', run: go('/') },
      {
        id: 'theme',
        group: 'Actions',
        label: `Switch to ${nextThemeLabel[theme]} theme`,
        icon: theme === 'light' ? <Moon size={16} aria-hidden="true" /> : theme === 'dark' ? <Monitor size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />,
        keywords: 'theme dark light mode appearance',
        run: toggleTheme,
      },
    ];
    if (current) {
      const fav = isFavorite(current.slug);
      actions.push(
        {
          id: 'fav',
          group: 'Actions',
          label: fav ? `Remove ${current.title} from favorites` : `Add ${current.title} to favorites`,
          icon: fav ? <StarOff size={16} aria-hidden="true" /> : <Star size={16} aria-hidden="true" />,
          keywords: 'favorite pin star',
          run: () => toggleFavorite(current.slug),
        },
        {
          id: 'link',
          group: 'Actions',
          label: 'Copy link to this tool',
          icon: <LinkIcon size={16} aria-hidden="true" />,
          keywords: 'url copy link',
          run: () => {
            navigator.clipboard.writeText(window.location.href).then(
              () => toast.success('Link copied'),
              () => toast.error('Could not copy the link'),
            );
          },
        },
      );
      if (share) {
        actions.push({
          id: 'share',
          group: 'Actions',
          label: 'Copy share link (includes your input)',
          icon: <Share2 size={16} aria-hidden="true" />,
          keywords: 'share link input',
          run: share,
        });
      }
    }
    actions.push({ id: 'keys', group: 'Actions', label: 'Keyboard shortcuts', icon: <Keyboard size={16} aria-hidden="true" />, keywords: 'help keys hotkeys', run: onShowShortcuts });

    const q = query.trim().toLowerCase();
    if (!q) {
      const recentItems = recent.slice(0, 5).map((s) => bySlug.get(s)).filter(Boolean).map((t) => toolItem('Recent')(t!));
      const recentSet = new Set(recent.slice(0, 5));
      return [...recentItems, ...actions, ...tools.filter((t) => !recentSet.has(t.slug)).map(toolItem('Tools'))];
    }
    const matchedActions = actions.filter((a) => q.split(/\s+/).every((w) => `${a.label} ${a.keywords ?? ''}`.toLowerCase().includes(w)));
    return [...filterTools(tools, q, 'All').map(toolItem('Tools')), ...matchedActions];
  }, [query, recent, theme, current, share, isFavorite, toggleFavorite, toggleTheme, navigate, onShowShortcuts]);

  // Keep the highlighted row valid and visible.
  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const runItem = (item: PaletteItem | undefined) => {
    if (!item) return;
    onClose();
    // Run after the dialog has closed so focus/navigation aren't fought over.
    requestAnimationFrame(() => item.run());
  };

  const groups = (['Recent', 'Tools', 'Actions'] as const)
    .map((g) => ({ g, rows: items.map((it, index) => ({ it, index })).filter((r) => r.it.group === g) }))
    .filter((x) => x.rows.length);
  // Display order puts Actions after Recent when the query is empty.
  const ordered = query.trim() ? groups : [...groups.filter((x) => x.g === 'Recent'), ...groups.filter((x) => x.g === 'Actions'), ...groups.filter((x) => x.g === 'Tools')];
  const visualOrder = ordered.flatMap((x) => x.rows.map((r) => r.index));
  const activeIndex = visualOrder[Math.min(active, visualOrder.length - 1)];
  const optionId = (i: number) => `${listId}-opt-${i}`;

  return (
    <div className="flex flex-col w-full min-h-0 rounded-xl border border-border-strong bg-surface shadow-float overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 h-13 border-b border-border shrink-0">
        <Search size={18} aria-hidden="true" className="text-text-muted shrink-0" />
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex !== undefined ? optionId(activeIndex) : undefined}
          aria-label="Search tools and actions"
          placeholder="Search tools and actions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            const n = visualOrder.length;
            if (!n) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % n); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + n) % n); }
            else if (e.key === 'Home' && e.ctrlKey) { e.preventDefault(); setActive(0); }
            else if (e.key === 'End' && e.ctrlKey) { e.preventDefault(); setActive(n - 1); }
            else if (e.key === 'Enter') { e.preventDefault(); runItem(items[activeIndex]); }
          }}
          className="flex-1 min-w-0 h-full bg-transparent text-[15px] text-text placeholder:text-text-muted focus:outline-none"
        />
        <kbd className="hidden sm:inline px-1.5 rounded border border-border text-[11px] leading-5 text-text-muted">Esc</kbd>
      </div>

      <div ref={listRef} id={listId} role="listbox" aria-label="Results" className="flex-1 min-h-0 overflow-y-auto p-2">
        {ordered.map(({ g, rows }) => (
          <div key={g} role="group" aria-labelledby={`${listId}-${g}`}>
            <div id={`${listId}-${g}`} className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              {g}
            </div>
            {rows.map(({ it, index }) => {
              const selected = index === activeIndex;
              return (
                <div
                  key={it.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={selected}
                  onMouseMove={() => setActive(visualOrder.indexOf(index))}
                  onClick={() => runItem(it)}
                  className={`flex items-center gap-3 h-10 px-2 rounded-md cursor-pointer ${selected ? 'bg-primary-subtle text-text' : 'text-text-secondary'}`}
                >
                  <span className="grid place-items-center w-6 shrink-0 text-text-secondary">{it.icon}</span>
                  <span className="flex-1 truncate">{it.label}</span>
                  {it.hint && <span className="text-xs text-text-muted truncate">{it.hint}</span>}
                  {selected && <CornerDownLeft size={14} aria-hidden="true" className="text-text-muted shrink-0" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {!visualOrder.length && (
        <p role="status" className="px-3 pb-8 -mt-2 text-center text-sm text-text-muted">
          No tools or actions match “{query}”.
        </p>
      )}

      <div className="hidden sm:flex items-center gap-4 px-4 h-9 border-t border-border text-xs text-text-muted shrink-0" aria-hidden="true">
        <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> navigate</span>
        <span><Kbd>↵</Kbd> open</span>
        <span><Kbd>Esc</Kbd> close</span>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="inline-block min-w-5 px-1 rounded border border-border text-center text-[11px] leading-4">{children}</kbd>;
}
