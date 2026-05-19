import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';

interface ResizablePanelsProps {
  left: ReactNode;
  right: ReactNode;
  /** Default left panel width as a percentage (0–100). Defaults to 50. */
  defaultLeftPercent?: number;
  /** Minimum left panel width as a percentage. Defaults to 20. */
  minLeftPercent?: number;
  /** Maximum left panel width as a percentage. Defaults to 80. */
  maxLeftPercent?: number;
  className?: string;
}

export default function ResizablePanels({
  left,
  right,
  defaultLeftPercent = 50,
  minLeftPercent = 20,
  maxLeftPercent = 80,
  className = '',
}: ResizablePanelsProps) {
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let pct = ((e.clientX - rect.left) / rect.width) * 100;
      pct = Math.max(minLeftPercent, Math.min(maxLeftPercent, pct));
      setLeftPercent(pct);
    };
    const onMouseUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [minLeftPercent, maxLeftPercent]);

  return (
    <div ref={containerRef} className={`flex flex-col lg:flex-row flex-1 min-h-0 ${className}`}>
      {/* Left panel */}
      <div className="flex flex-col min-h-0 lg:min-w-0" style={{ flex: `0 0 ${leftPercent}%` }}>
        {left}
      </div>

      {/* Drag handle – visible only on lg+ */}
      <div
        onMouseDown={onMouseDown}
        className="hidden lg:flex items-center justify-center w-3 shrink-0 cursor-col-resize group"
        title="Drag to resize"
      >
        <div className="w-0.5 h-8 rounded-full bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-500 group-active:bg-blue-500 dark:group-active:bg-blue-400 transition-colors" />
      </div>

      {/* Gap for mobile (stacked view) */}
      <div className="h-3 lg:hidden" />

      {/* Right panel */}
      <div className="flex flex-col min-h-0 lg:min-w-0 flex-1">
        {right}
      </div>
    </div>
  );
}

