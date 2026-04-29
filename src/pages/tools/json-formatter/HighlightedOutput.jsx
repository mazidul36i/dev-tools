import { useRef, useEffect, useMemo } from 'react';

/**
 * Renders text output with search matches highlighted.
 * Active match has a distinct background and auto-scrolls into view.
 */
export default function HighlightedOutput({ text, search, activeIndex, className = '' }) {
  const containerRef = useRef(null);

  const parts = useMemo(() => {
    if (!search || !text) return [{ text: text ?? '', highlight: false }];
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const segments = [];
    let last = 0;
    let match;
    let i = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match[0].length === 0) { regex.lastIndex++; continue; }
      if (match.index > last) segments.push({ text: text.slice(last, match.index), highlight: false });
      segments.push({ text: match[0], highlight: true, matchIndex: i++ });
      last = regex.lastIndex;
    }
    if (last < text.length) segments.push({ text: text.slice(last), highlight: false });
    return segments;
  }, [text, search]);

  useEffect(() => {
    if (containerRef.current && activeIndex >= 0) {
      const el = containerRef.current.querySelector(`[data-match="${activeIndex}"]`);
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [activeIndex, search]);

  const markBase = 'text-gray-900 rounded-sm px-px';

  return (
    <pre
      ref={containerRef}
      className={`whitespace-pre-wrap wrap-break-word overflow-auto ${className}`}
    >
      {parts.map((p, i) =>
        p.highlight ? (
          <mark
            key={i}
            data-match={p.matchIndex}
            className={p.matchIndex === activeIndex
              ? `bg-amber-400 dark:bg-amber-500 ${markBase}`
              : `bg-yellow-200 dark:bg-yellow-700/60 dark:text-gray-100 ${markBase}`}
          >
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </pre>
  );
}

