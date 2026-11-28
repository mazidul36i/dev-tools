import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from '@components/ErrorBoundary';
import Spinner from '@components/ui/Spinner';
import Dialog from '@components/ui/Dialog';
import useHotkeys from '@hooks/useHotkeys';
import useLocalStorage from '@hooks/useLocalStorage';
import { ShareProvider } from '@hooks/useShareInput';
import { ShellContext, type ShellApi } from './ShellContext';
import SidebarNav from './SidebarNav';
import Topbar from './Topbar';
import CommandPalette from './CommandPalette';
import ShortcutsDialog from './ShortcutsDialog';

/**
 * Persistent frame around every page: sidebar (drawer below lg), top bar,
 * the scrolling <main>, the ⌘K palette and the shortcuts dialog.
 */
export default function AppShell() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('devtools:sidebar-collapsed', false);

  // New page: start at the top and close the mobile drawer.
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
    setNavOpen(false);
  }, [pathname]);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((c) => !c), [setSidebarCollapsed]);
  const api = useMemo<ShellApi>(
    () => ({
      openPalette: () => setPaletteOpen(true),
      openShortcuts: () => setShortcutsOpen(true),
      openNav: () => setNavOpen(true),
      sidebarCollapsed,
      toggleSidebar,
    }),
    [sidebarCollapsed, toggleSidebar],
  );

  const focusSearch = () => {
    // A page can offer its own primary search (the home launcher does).
    const pageSearch = document.querySelector<HTMLInputElement>('[data-page-search]');
    if (pageSearch) {
      pageSearch.focus();
      pageSearch.select();
      return;
    }
    const filter = filterRef.current;
    if (filter && filter.offsetParent !== null) {
      filter.focus();
      filter.select();
    } else {
      setPaletteOpen(true);
    }
  };

  useHotkeys([
    { key: 'k', mod: true, allowInInputs: true, handler: () => setPaletteOpen((o) => !o) },
    { key: '/', handler: focusSearch },
    { key: '?', handler: () => setShortcutsOpen(true) },
  ]);

  return (
    <ShellContext.Provider value={api}>
      <ShareProvider>
        <div className="flex h-dvh bg-bg text-text">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100 focus:px-4 focus:py-2 focus:rounded-md
              focus:bg-primary focus:text-on-primary focus:text-sm focus:font-medium focus-ring"
          >
            Skip to main content
          </a>

          {!sidebarCollapsed && (
            <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-bg">
              <SidebarNav ref={filterRef} />
            </aside>
          )}

          <div className="flex flex-col flex-1 min-w-0">
            <Topbar />
            <main ref={mainRef} id="main-content" tabIndex={-1} className="flex flex-col flex-1 min-h-0 overflow-y-auto outline-none">
              <ErrorBoundary key={pathname}>
                <Suspense fallback={<Spinner />}>
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            </main>
          </div>

          {/* Mobile navigation drawer. */}
          <Dialog
            open={navOpen}
            onClose={() => setNavOpen(false)}
            ariaLabel="Navigation"
            className="m-0 mr-auto h-dvh max-h-none w-[min(300px,85vw)] lg:hidden"
          >
            <div className="flex flex-col w-full h-full bg-bg border-r border-border">
              <SidebarNav onNavigate={() => setNavOpen(false)} onClose={() => setNavOpen(false)} />
            </div>
          </Dialog>

          <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onShowShortcuts={() => setShortcutsOpen(true)} />
          <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
        </div>
      </ShareProvider>
    </ShellContext.Provider>
  );
}
