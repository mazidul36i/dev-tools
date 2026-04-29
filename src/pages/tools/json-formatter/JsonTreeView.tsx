import { useState, useCallback, useEffect, useContext, createContext, useMemo, useRef, memo } from 'react';
import { ChevronRight, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Context to broadcast expand/collapse signals + search query
interface TreeControlContextValue {
  signal: string | null;
  search: string;
}

const TreeControlContext = createContext<TreeControlContextValue>({ signal: null, search: '' });

// Check if a string matches the search (case-insensitive)
function matchesSearch(text: string, search: string): boolean {
  if (!search || !text) return false;
  return String(text).toLowerCase().includes(search.toLowerCase());
}

// Recursively check if a node or any descendant matches the search
function subtreeMatches(value: unknown, nodeKey: string | number | null, search: string): boolean {
  if (!search) return false;
  if (nodeKey !== null && matchesSearch(String(nodeKey), search)) return true;
  if (value === null || typeof value !== 'object') {
    return matchesSearch(String(value), search);
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (subtreeMatches(v, k, search)) return true;
  }
  return false;
}

// Highlight matching portions in a string
interface HighlightTextProps {
  text: string | number;
  className?: string;
}

function HighlightText({ text, className = '' }: HighlightTextProps) {
	const { search } = useContext(TreeControlContext);
	const str = String(text);
	if (!search) return <span className={className}>{str}</span>;

	const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`(${escaped})`, 'gi');
	const parts = str.split(regex);

	if (parts.length === 1) return <span className={className}>{str}</span>;

	return (
		<span className={className}>
			{parts.map((part, i) =>
				i % 2 === 1 ? (
					<mark key={i} data-tree-match="" className="bg-amber-300/70 dark:bg-amber-500/40 text-inherit rounded-sm px-px">{part}</mark>
				) : (
					<span key={i}>{part}</span>
				)
			)}
		</span>
	);
}

interface JsonTreeNodeProps {
  nodeKey: string | number | null;
  value: unknown;
  depth?: number;
  path?: string;
}

const JsonTreeNode = memo(function JsonTreeNode({ nodeKey, value, depth = 0, path = '$' }: JsonTreeNodeProps) {
	const [collapsed, setCollapsed] = useState(depth > 2);
	const { signal, search } = useContext(TreeControlContext);
	const isObject = value !== null && typeof value === 'object';
	const isArray = Array.isArray(value);
	const entries = isObject ? Object.entries(value as Record<string, unknown>) : [];

	// Respond to expand/collapse all signals
	useEffect(() => {
		if (signal === null) return;
		setCollapsed(signal.startsWith('collapse'));
	}, [signal]);

	// Auto-expand when search matches a descendant
	useEffect(() => {
		if (search && isObject && entries.length > 0) {
			if (subtreeMatches(value, null, search)) {
				setCollapsed(false);
			}
		}
	}, [search]);

	const toggle = useCallback(() => setCollapsed((c) => !c), []);

	const currentPath = path;

	const copyPath = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		navigator.clipboard.writeText(currentPath).then(() => {});
		toast.success(`Copied: ${currentPath}`);
	}, [currentPath]);

	if (!isObject) {
		const nodeMatches = search && (matchesSearch(String(nodeKey), search) || matchesSearch(String(value), search));
		return (
			<div
				className={`flex items-baseline py-0.5 group/node ${nodeMatches ? 'bg-amber-100/50 dark:bg-amber-900/20 rounded' : ''}`}
				style={{ paddingLeft: depth * 20 }}
			>
				{nodeKey !== null && (
					<>
						<HighlightText text={`"${nodeKey}"`} className="text-primary font-medium" />
						<span className="mx-1 text-text-muted">:</span>
					</>
				)}
				<ValueSpan value={value} />
				<button
					onClick={copyPath}
					className="ml-2 opacity-0 group-hover/node:opacity-60 hover:opacity-100! transition-opacity"
					title={currentPath}
				>
					<Copy size={11} />
				</button>
			</div>
		);
	}

	const bracket = isArray ? ['[', ']'] : ['{', '}'];
	const keyMatches = search && nodeKey !== null && matchesSearch(String(nodeKey), search);

	return (
		<div style={{ paddingLeft: depth * 20 }}>
			<div
				className={`flex items-center py-0.5 cursor-pointer select-none group/node ${keyMatches ? 'bg-amber-100/50 dark:bg-amber-900/20 rounded' : ''}`}
				onClick={toggle}
			>
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
						<HighlightText
							text={typeof nodeKey === 'number' ? nodeKey : `"${nodeKey}"`}
							className="text-primary font-medium"
						/>
						<span className="mx-1 text-text-muted">:</span>
					</>
				)}
				<span className="text-text-muted">{bracket[0]}</span>
				{collapsed && entries.length > 0 && (
					<span className="text-text-muted italic ml-1">...{bracket[1]}</span>
				)}
				{entries.length === 0 && <span className="text-text-muted">{bracket[1]}</span>}
				<button
					onClick={copyPath}
					className="ml-2 opacity-0 group-hover/node:opacity-60 hover:opacity-100! transition-opacity"
					title={currentPath}
				>
					<Copy size={11} />
				</button>
			</div>
			<AnimatePresence initial={false}>
				{!collapsed && entries.length > 0 && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.15 }}
					>
						{entries.map(([k, v]) => {
							const childPath = isArray ? `${currentPath}[${k}]` : `${currentPath}.${k}`;
							return (
								<JsonTreeNode key={k} nodeKey={isArray ? Number(k) : k} value={v} depth={depth + 1} path={childPath} />
							);
						})}
						<div style={{ paddingLeft: (depth + 1) * 20 }}>
							<span className="text-text-muted py-0.5">{bracket[1]}</span>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
});

interface ValueSpanProps {
  value: unknown;
}

const ValueSpan = memo(function ValueSpan({ value }: ValueSpanProps) {
	if (typeof value === 'string') return <HighlightText text={`"${value}"`} className="text-success" />;
	if (typeof value === 'number') return <HighlightText text={String(value)} className="text-accent" />;
	if (typeof value === 'boolean') return <HighlightText text={String(value)} className="text-warning" />;
	if (value === null) return <span className="text-text-muted italic">null</span>;
	return <span>{String(value)}</span>;
});

interface JsonTreeViewProps {
  data: unknown;
  collapseSignal: string | null;
  search?: string;
  activeMatchIndex?: number;
}

export default function JsonTreeView({ data, collapseSignal, search = '', activeMatchIndex = -1 }: JsonTreeViewProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	if (data === undefined || data === null) return null;

	const ctx = useMemo(() => ({ signal: collapseSignal, search }), [collapseSignal, search]);

	// Scroll to active match and highlight it after render
	useEffect(() => {
		if (!containerRef.current || !search) return;
		// Small delay to let expand animations finish
		const timer = setTimeout(() => {
			const marks = containerRef.current?.querySelectorAll('[data-tree-match]');
			if (!marks) return;
			// Remove active styling from all marks
			marks.forEach(m => {
				(m as HTMLElement).style.backgroundColor = '';
				(m as HTMLElement).style.outline = '';
			});
			// Add active styling to the target match
			if (activeMatchIndex >= 0 && activeMatchIndex < marks.length) {
				const el = marks[activeMatchIndex] as HTMLElement;
				el.style.backgroundColor = '#fbbf24'; // amber-400
				el.style.outline = '2px solid #f59e0b'; // amber-500
				el.style.borderRadius = '2px';
				el.scrollIntoView({ block: 'center', behavior: 'smooth' });
			}
		}, 200);
		return () => clearTimeout(timer);
	}, [activeMatchIndex, search]);

	return (
		<TreeControlContext.Provider value={ctx}>
			<div ref={containerRef} className="bg-surface-alt border border-border rounded-lg p-4 font-mono text-sm min-h-45 max-h-150 overflow-auto">
				<JsonTreeNode nodeKey={null} value={data} depth={0} path="$" />
			</div>
		</TreeControlContext.Provider>
	);
}
