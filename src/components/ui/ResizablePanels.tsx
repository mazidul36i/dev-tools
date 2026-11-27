import { useState, useCallback, useRef, type ReactNode, type KeyboardEvent, type PointerEvent } from 'react';

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

const KEY_STEP = 2;
const KEY_STEP_LARGE = 10;

/**
 * Two panels side by side (stacked below `lg`) with a draggable divider.
 * The divider works with mouse, touch and pen (pointer capture keeps the drag
 * alive over iframes), and with the keyboard: arrows, Shift+arrows, Home/End,
 * Enter to reset. Double-click also resets.
 */
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

  const clamp = useCallback(
    (pct: number) => Math.max(minLeftPercent, Math.min(maxLeftPercent, pct)),
    [minLeftPercent, maxLeftPercent],
  );

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId) || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setLeftPercent(clamp(((e.clientX - rect.left) / rect.width) * 100));
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    let next: number;
    switch (e.key) {
      case 'ArrowLeft': next = leftPercent - step; break;
      case 'ArrowRight': next = leftPercent + step; break;
      case 'Home': next = minLeftPercent; break;
      case 'End': next = maxLeftPercent; break;
      case 'Enter': next = defaultLeftPercent; break;
      default: return;
    }
    e.preventDefault();
    setLeftPercent(clamp(next));
  };

  return (
    <div ref={containerRef} className={`flex flex-col lg:flex-row flex-1 min-h-0 h-full ${className}`}>
      {/* Left panel */}
      <div className="flex flex-col min-h-0 lg:min-w-0" style={{ flex: `0 0 ${leftPercent}%` }}>
        {left}
      </div>

      {/* Drag handle – visible only on lg+ */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        aria-valuenow={Math.round(leftPercent)}
        aria-valuemin={minLeftPercent}
        aria-valuemax={maxLeftPercent}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        onDoubleClick={() => setLeftPercent(clamp(defaultLeftPercent))}
        className="hidden lg:flex items-center justify-center w-3 shrink-0 cursor-col-resize touch-none group rounded focus-ring"
        title="Drag to resize · double-click to reset"
      >
        <div className="w-0.5 h-8 rounded-full bg-border-strong group-hover:bg-text-muted group-active:bg-primary group-focus-visible:bg-primary transition-colors" />
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
