import { useState, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function JsonTreeNode({ nodeKey, value, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(depth > 2);
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const entries = isObject ? Object.entries(value) : [];

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  if (!isObject) {
    return (
      <div className="flex items-baseline py-0.5" style={{ paddingLeft: depth * 20 }}>
        {nodeKey !== null && (
          <>
            <span className="text-primary font-semibold">"{nodeKey}"</span>
            <span className="mx-1 text-slate-500">:</span>
          </>
        )}
        <ValueSpan value={value} />
      </div>
    );
  }

  const bracket = isArray ? ['[', ']'] : ['{', '}'];

  return (
    <div style={{ paddingLeft: depth * 20 }}>
      <div className="flex items-center py-0.5 cursor-pointer select-none group" onClick={toggle}>
        {entries.length > 0 && (
          <motion.span
            animate={{ rotate: collapsed ? 0 : 90 }}
            transition={{ duration: 0.15 }}
            className="inline-flex mr-1 text-slate-500"
          >
            <ChevronRight size={14} />
          </motion.span>
        )}
        {nodeKey !== null && (
          <>
            <span className="text-primary font-semibold">
              {typeof nodeKey === 'number' ? nodeKey : `"${nodeKey}"`}
            </span>
            <span className="mx-1 text-slate-500">:</span>
          </>
        )}
        <span className="text-slate-500">{bracket[0]}</span>
        {collapsed && entries.length > 0 && (
          <span className="text-slate-400 italic ml-1">...{bracket[1]}</span>
        )}
        {entries.length === 0 && <span className="text-slate-500">{bracket[1]}</span>}
      </div>
      <AnimatePresence initial={false}>
        {!collapsed && entries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            {entries.map(([k, v]) => (
              <JsonTreeNode
                key={k}
                nodeKey={isArray ? Number(k) : k}
                value={v}
                depth={depth + 1}
              />
            ))}
            <div style={{ paddingLeft: (depth + 1) * 20 }}>
              <span className="text-slate-500 py-0.5">{bracket[1]}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ValueSpan({ value }) {
  if (typeof value === 'string')
    return <span className="text-green-600">"{value}"</span>;
  if (typeof value === 'number')
    return <span className="text-purple-600">{value}</span>;
  if (typeof value === 'boolean')
    return <span className="text-orange-600">{String(value)}</span>;
  if (value === null)
    return <span className="text-slate-400 italic">null</span>;
  return <span>{String(value)}</span>;
}

export default function JsonTreeView({ data }) {
  if (data === undefined || data === null) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-sm min-h-[180px] max-h-[600px] overflow-auto">
      <JsonTreeNode nodeKey={null} value={data} depth={0} />
    </div>
  );
}

