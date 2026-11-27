interface SegmentedControlOption {
  id: string;
  label: string;
}

type SegmentedVariant = 'default' | 'glass';

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (id: string) => void;
  variant?: SegmentedVariant;
  className?: string;
  /** Accessible name for the group, e.g. "Encoding". */
  ariaLabel?: string;
}

const styles: Record<SegmentedVariant, { active: string; inactive: string; wrapper: string }> = {
  default: {
    active: 'bg-primary text-on-primary shadow-soft',
    inactive: 'bg-surface-alt text-text-secondary border border-border hover:bg-surface-hover',
    wrapper: 'flex gap-2 flex-wrap',
  },
  glass: {
    active: 'bg-gray-900 dark:bg-white text-white dark:text-gray-900',
    inactive: 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/60',
    // No overflow-hidden: it would clip the focus outline of the end buttons.
    wrapper: 'flex rounded-lg border border-white/60 dark:border-gray-700/60 [&>button:first-child]:rounded-l-[7px] [&>button:last-child]:rounded-r-[7px]',
  },
};

/** A row of mutually exclusive toggle buttons; the selected one has aria-pressed. */
export default function SegmentedControl({ options, value, onChange, variant = 'default', className = '', ariaLabel }: SegmentedControlProps) {
  const s = styles[variant];

  return (
    <div role="group" aria-label={ariaLabel} className={`${s.wrapper} ${className}`}>
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.id)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors duration-200 focus-ring focus-visible:relative focus-visible:z-10 ${
              variant === 'default' ? 'px-4 py-2 text-sm rounded-lg' : ''
            } ${selected ? s.active : s.inactive}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
