import { useState, useCallback, memo } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const JsonTreeNode = memo(function JsonTreeNode({ nodeKey, value, depth = 0 }) {
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
						<span className="text-primary font-medium">"{nodeKey}"</span>
						<span className="mx-1 text-text-muted">:</span>
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
						className="inline-flex mr-1 text-text-muted"
					>
						<ChevronRight size={14} />
					</motion.span>
				)}
				{nodeKey !== null && (
					<>
						<span className="text-primary font-medium">
							{typeof nodeKey === 'number' ? nodeKey : `"${nodeKey}"`}
						</span>
						<span className="mx-1 text-text-muted">:</span>
					</>
				)}
				<span className="text-text-muted">{bracket[0]}</span>
				{collapsed && entries.length > 0 && (
					<span className="text-text-muted italic ml-1">...{bracket[1]}</span>
				)}
				{entries.length === 0 && <span className="text-text-muted">{bracket[1]}</span>}
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
							<JsonTreeNode key={k} nodeKey={isArray ? Number(k) : k} value={v} depth={depth + 1} />
						))}
						<div style={{ paddingLeft: (depth + 1) * 20 }}>
							<span className="text-text-muted py-0.5">{bracket[1]}</span>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
});

const ValueSpan = memo(function ValueSpan({ value }) {
	if (typeof value === 'string') return <span className="text-success">"{value}"</span>;
	if (typeof value === 'number') return <span className="text-accent">{value}</span>;
	if (typeof value === 'boolean') return <span className="text-warning">{String(value)}</span>;
	if (value === null) return <span className="text-text-muted italic">null</span>;
	return <span>{String(value)}</span>;
});

export default function JsonTreeView({ data }) {
	if (data === undefined || data === null) return null;

	return (
		<div className="bg-surface-alt border border-border rounded-lg p-4 font-mono text-sm min-h-45 max-h-150 overflow-auto">
			<JsonTreeNode nodeKey={null} value={data} depth={0} />
		</div>
	);
}
