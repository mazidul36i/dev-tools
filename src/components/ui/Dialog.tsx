import { useEffect, useRef, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** id of the element that names the dialog. */
  labelledBy?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * Modal built on the native <dialog>: focus is trapped, the page behind is
 * inert, Esc closes, and focus returns to the element that opened it.
 * Clicking the backdrop also closes it.
 */
export default function Dialog({ open, onClose, children, labelledBy, ariaLabel, className = '' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
      onClose={() => {
        onClose();
        returnFocus.current?.focus?.();
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onMouseDown={(e) => {
        // A press on the dialog element itself (not its content) is the backdrop.
        if (e.target === e.currentTarget) onClose();
      }}
      className={`bg-transparent p-0 text-text backdrop:bg-black/50 dark:backdrop:bg-black/70 open:flex ${className}`}
    >
      {open && children}
    </dialog>
  );
}
