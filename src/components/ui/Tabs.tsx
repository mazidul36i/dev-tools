import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex p-1.5 bg-surface-alt/80 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative flex-1 py-2.5 px-4 text-sm font-medium cursor-pointer transition-all duration-200 rounded-lg
            ${activeTab === tab.id
              ? 'text-text'
              : 'text-text-muted hover:text-text-secondary'}`}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute inset-0 bg-surface rounded-lg shadow-soft border border-border"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
