import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';

export type PreviewBackground = 'white' | 'dark' | 'checker';

const backgroundStyle: Record<PreviewBackground, CSSProperties> = {
  white: { background: '#ffffff' },
  dark: { background: '#111827' },
  checker: {
    backgroundColor: '#ffffff',
    backgroundImage:
      'linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)',
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0,0 8px,8px -8px,-8px 0',
  },
};

interface PreviewFrameProps {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  srcDoc: string;
  allowScripts: boolean;
  /** Fixed viewport width in CSS px, or null to fill the pane. */
  width: number | null;
  background: PreviewBackground;
  reloadKey: number;
  className?: string;
  /** Accessible name of the frame. */
  title?: string;
}

export default function PreviewFrame({
  iframeRef,
  srcDoc,
  allowScripts,
  width,
  background,
  reloadKey,
  className = '',
  title = 'HTML preview',
}: PreviewFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scale fixed-width viewports down so they fit the pane.
  const scale = width && size.w > 0 ? Math.min(1, size.w / width) : 1;
  const frameWidth = width ?? size.w;
  const frameHeight = scale < 1 ? size.h / scale : size.h;

  const sandbox = ['allow-modals', 'allow-forms', 'allow-popups', allowScripts && 'allow-scripts']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 min-h-0 overflow-hidden bg-surface-alt ${className}`}
    >
      {size.w > 0 && (
        <iframe
          key={`${reloadKey}-${allowScripts}`}
          ref={iframeRef}
          title={title}
          srcDoc={srcDoc}
          sandbox={sandbox}
          className="absolute top-0 border-0 origin-top-left"
          style={{
            ...backgroundStyle[background],
            width: frameWidth,
            height: frameHeight,
            left: width && scale === 1 ? (size.w - width) / 2 : 0,
            transform: scale < 1 ? `scale(${scale})` : undefined,
          }}
        />
      )}
      {width && (
        <span className="absolute bottom-1.5 right-2 text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-white pointer-events-none">
          {width}px{scale < 1 ? ` · ${Math.round(scale * 100)}%` : ''}
        </span>
      )}
    </div>
  );
}
