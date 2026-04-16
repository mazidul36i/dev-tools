import { motion } from 'framer-motion';

export default function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex border-b border-slate-200 bg-slate-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative flex-1 py-4 px-4 text-sm md:text-base font-semibold cursor-pointer transition-colors
            ${activeTab === tab.id ? 'text-primary bg-white' : 'text-slate-500 hover:text-primary hover:bg-primary/5'}`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-t"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

