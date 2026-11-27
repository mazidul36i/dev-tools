import { motion } from 'framer-motion';
import { useId, useRef, type KeyboardEvent } from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  /** Accessible name for the tab list. */
  ariaLabel?: string;
}

/**
 * WAI-ARIA tabs: one tab stop for the group, Arrow/Home/End move between
 * tabs and activate them (automatic activation).
 */
export default function Tabs({ tabs, activeTab, onTabChange, ariaLabel }: TabsProps) {
  // Unique per instance so two tab bars on one page don't share an indicator.
  const indicatorId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = tabs.findIndex((t) => t.id === activeTab);
    let next: number;
    switch (e.key) {
      case 'ArrowRight': next = (current + 1) % tabs.length; break;
      case 'ArrowLeft': next = (current - 1 + tabs.length) % tabs.length; break;
      case 'Home': next = 0; break;
      case 'End': next = tabs.length - 1; break;
      default: return;
    }
    e.preventDefault();
    onTabChange(tabs[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown} className="flex p-1.5 bg-surface-alt/80 border-b border-border">
      {tabs.map((tab, i) => {
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex-1 py-2.5 px-4 text-sm font-medium cursor-pointer transition-colors duration-200 rounded-lg focus-ring
              ${selected ? 'text-text' : 'text-text-muted hover:text-text-secondary'}`}
          >
            {selected && (
              <motion.div
                layoutId={indicatorId}
                className="absolute inset-0 bg-surface rounded-lg shadow-soft border border-border"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
